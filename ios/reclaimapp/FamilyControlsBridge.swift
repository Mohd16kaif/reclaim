import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

@objc(FamilyControlsBridge)
class FamilyControlsBridge: NSObject {

    @objc func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            reject("UNAVAILABLE", "FamilyControls requires iOS 16+", nil)
            return
        }
        Task {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                resolve(["authorized": true])
            } catch {
                reject("AUTH_ERROR", "Family Controls authorization failed: \(error.localizedDescription)", error)
            }
        }
    }

    @objc func startPanicSession(_ durationMinutes: Int,
                                  resolver resolve: @escaping RCTPromiseResolveBlock,
                                  rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            reject("UNAVAILABLE", "FamilyControls requires iOS 16+", nil)
            return
        }
        let monitor = DeviceActivityCenter()
        let activityName = DeviceActivityName("reclaim.panic.session")
        let now = Date()
        let endDate = Calendar.current.date(byAdding: .minute, value: durationMinutes, to: now) ?? now
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(
                hour: Calendar.current.component(.hour, from: now),
                minute: Calendar.current.component(.minute, from: now)
            ),
            intervalEnd: DateComponents(
                hour: Calendar.current.component(.hour, from: endDate),
                minute: Calendar.current.component(.minute, from: endDate)
            ),
            repeats: false
        )
        do {
            try monitor.startMonitoring(activityName, during: schedule)
            resolve(["success": true, "durationMinutes": durationMinutes])
        } catch {
            reject("PANIC_START_ERROR", "Failed to start panic session: \(error.localizedDescription)", error)
        }
    }

    @objc func stopPanicSession(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            reject("UNAVAILABLE", "FamilyControls requires iOS 16+", nil)
            return
        }
        let monitor = DeviceActivityCenter()
        let activityName = DeviceActivityName("reclaim.panic.session")
        let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.panic"))
        monitor.stopMonitoring([activityName])
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        resolve(["success": true])
    }

    @objc func getAuthorizationStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                                      rejecter reject: RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            resolve(["status": "unavailable"])
            return
        }
        let status = AuthorizationCenter.shared.authorizationStatus
        switch status {
        case .approved: resolve(["status": "approved"])
        case .denied: resolve(["status": "denied"])
        case .notDetermined: resolve(["status": "notDetermined"])
        @unknown default: resolve(["status": "unknown"])
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
