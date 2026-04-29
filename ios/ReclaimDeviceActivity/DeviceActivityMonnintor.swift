import DeviceActivity
import ManagedSettings
import Foundation
import UserNotifications

class ReclaimDeviceActivityMonitor: DeviceActivityMonitor {

    let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.panic"))

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        NSLog("ReclaimDeviceActivity: Panic session started — \(activity.rawValue)")
        applyShields()
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        NSLog("ReclaimDeviceActivity: Panic session ended — removing shields")
        removeShields()
        sendSessionCompleteNotification()
    }

    private func applyShields() {
        let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")
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
        NSLog("ReclaimDeviceActivity: All shields removed")
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
}
