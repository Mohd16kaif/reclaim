import DeviceActivity
import ManagedSettings
import Foundation
import UserNotifications
import ActivityKit

class ReclaimDeviceActivityMonitor: DeviceActivityMonitor {

    // Panic store — for app shields during panic sessions
    let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.panic"))

    // Blocker store — for adult content web filter
    let blockerStore = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.blocker"))

    let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")

    // MARK: - intervalDidStart

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        NSLog("ReclaimDeviceActivity: intervalDidStart — \(activity.rawValue)")

        if activity.rawValue == "reclaim.panic.session" {
            // Watchdog: if end time has already passed (e.g. app was force-quit
            // and schedule misfired), remove shields immediately instead of reapplying
            if let endTs = sharedDefaults?.double(forKey: "panic_end_time"),
               endTs > 0,
               Date().timeIntervalSince1970 >= endTs {
                removeShields()
                DeviceActivityCenter().stopMonitoring([DeviceActivityName("reclaim.panic.session")])
                NSLog("ReclaimDeviceActivity: Panic already expired on intervalDidStart — shields removed")
            } else {
                applyShields()
            }
        } else if activity.rawValue == "reclaim.blocker.session" {
            // Daily check: with a repeating midnight-to-midnight schedule,
            // intervalDidStart fires once per day. Check expiry here too,
            // not just at intervalDidEnd, so a missed end-of-day event
            // doesn't leave the filter on an extra full day.
            checkBlockerExpiry()
        }
    }

    // MARK: - intervalDidEnd

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        NSLog("ReclaimDeviceActivity: intervalDidEnd — \(activity.rawValue)")

        if activity.rawValue == "reclaim.panic.session" {
            removeShields()
            sendSessionCompleteNotification()

        } else if activity.rawValue == "reclaim.blocker.session" {
            checkBlockerExpiry()
        }
    }

    // MARK: - Panic Logic (unchanged)

    private func applyShields() {
        if let tokenData = sharedDefaults?.data(forKey: "panic_blocked_apps"),
           let tokens = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: tokenData) {
            store.shield.applications = tokens
            NSLog("ReclaimDeviceActivity: Shielded \(tokens.count) apps")
        } else {
            NSLog("ReclaimDeviceActivity: No apps to shield")
        }
    }

    private func removeShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        if #available(iOS 16.0, *) {
            store.application.denyAppRemoval = false
        }
        sharedDefaults?.removeObject(forKey: "panic_end_time")
        endLiveActivity()
        NSLog("ReclaimDeviceActivity: All panic shields removed")
    }

    private func endLiveActivity() {
        if #available(iOS 16.2, *) {
            Task {
                for activity in Activity<PanicTimerAttributes>.activities {
                    await activity.end(nil, dismissalPolicy: .immediate)
                }
                NSLog("ReclaimDeviceActivity: Live Activity ended from extension")
            }
        }
    }

    private func sendSessionCompleteNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Session Complete"
        content.body = "You stayed aligned."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "panic_complete_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                NSLog("ReclaimDeviceActivity: Notification error: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Blocker Duration Logic

    private func checkBlockerExpiry() {
        guard let unblockAt = sharedDefaults?.object(forKey: "blocker_unblock_at") as? Date else {
            // No unblock date saved at all — this only happens for a permanent
            // block (blocker_is_permanent), which has no schedule running in
            // the first place, so there's nothing to check here. Do nothing.
            return
        }

        if Date() >= unblockAt {
            // Duration has fully elapsed — turn off the filter and stop the
            // repeating schedule for good.
            blockerStore.webContent.blockedByFilter = nil
            sharedDefaults?.removeObject(forKey: "blocker_unblock_at")
            sharedDefaults?.removeObject(forKey: "blocker_is_permanent")
            DeviceActivityCenter().stopMonitoring([DeviceActivityName("reclaim.blocker.session")])
            NSLog("ReclaimDeviceActivity: Blocker duration elapsed — filter removed, monitoring stopped")
        } else {
            // Not yet expired — the repeating schedule will check again
            // tomorrow on its own. Nothing to do.
            NSLog("ReclaimDeviceActivity: Blocker still active — \(unblockAt) not yet reached")
        }
    }
}
