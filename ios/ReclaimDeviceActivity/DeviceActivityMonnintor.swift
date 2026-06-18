import DeviceActivity
import ManagedSettings
import Foundation
import UserNotifications

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
            applyShields()
        }
        // Blocker filter is applied immediately in the main app on toggle ON
        // Nothing to do here for reclaim.blocker.session
    }

    // MARK: - intervalDidEnd

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        NSLog("ReclaimDeviceActivity: intervalDidEnd — \(activity.rawValue)")

        if activity.rawValue == "reclaim.panic.session" {
            removeShields()
            sendSessionCompleteNotification()

        } else if activity.rawValue == "reclaim.blocker.session" {
            handleBlockerChunkEnd()
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
        NSLog("ReclaimDeviceActivity: All panic shields removed")
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

    private func handleBlockerChunkEnd() {
        guard let unblockAt = sharedDefaults?.object(forKey: "blocker_unblock_at") as? Date else {
            // No unblock date saved — safety fallback, remove filter
            NSLog("ReclaimDeviceActivity: No unblock date found — removing filter as safety fallback")
            blockerStore.webContent.blockedByFilter = nil
            return
        }

        if Date() >= unblockAt {
            // Duration has fully elapsed — turn off the filter
            blockerStore.webContent.blockedByFilter = nil
            sharedDefaults?.removeObject(forKey: "blocker_unblock_at")
            sharedDefaults?.removeObject(forKey: "blocker_is_permanent")
            NSLog("ReclaimDeviceActivity: Blocker duration elapsed — filter removed")
        } else {
            // Duration not yet elapsed — re-arm for another 7-day chunk
            NSLog("ReclaimDeviceActivity: Blocker still active — re-arming schedule")
            rearmBlockerSchedule()
        }
    }

    private func rearmBlockerSchedule() {
        guard let unblockAt = sharedDefaults?.object(forKey: "blocker_unblock_at") as? Date else {
            return
        }

        let now = Date()
        let remaining = unblockAt.timeIntervalSince(now)
        let chunkSeconds = min(remaining, 7 * 24 * 3600) // 7 days max per chunk
        let chunkEnd = now.addingTimeInterval(chunkSeconds)

        var startComponents = Calendar.current.dateComponents([.hour, .minute, .second], from: now)
        startComponents.second = 0

        var endComponents = Calendar.current.dateComponents([.hour, .minute, .second], from: chunkEnd)
        endComponents.second = 0

        let schedule = DeviceActivitySchedule(
            intervalStart: startComponents,
            intervalEnd: endComponents,
            repeats: false
        )

        do {
            try DeviceActivityCenter().startMonitoring(
                DeviceActivityName("reclaim.blocker.session"),
                during: schedule
            )
            NSLog("ReclaimDeviceActivity: Re-armed blocker schedule for \(chunkSeconds / 3600) hours")
        } catch {
            NSLog("ReclaimDeviceActivity: Failed to re-arm: \(error.localizedDescription)")
        }
    }
}
