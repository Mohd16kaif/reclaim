import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

@available(iOS 16.0, *)
@objc(FamilyControlsBridge)
class FamilyControlsBridge: NSObject {

    lazy var store = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.panic"))
    let center = AuthorizationCenter.shared
    let activityName = DeviceActivityName("reclaim.panic.session")

    @objc func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                try await center.requestAuthorization(for: .individual)
                resolve(["authorized": true])
            } catch {
                reject("AUTH_ERROR", "Family Controls authorization failed: \(error.localizedDescription)", error)
            }
        }
    }

    @objc func startPanicSession(_ durationMinutes: Int,
                                  resolver resolve: @escaping RCTPromiseResolveBlock,
                                  rejecter reject: @escaping RCTPromiseRejectBlock) {
        let monitor = DeviceActivityCenter()
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
        let monitor = DeviceActivityCenter()
        monitor.stopMonitoring([activityName])
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        resolve(["success": true])
    }

    @objc func getAuthorizationStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                                      rejecter reject: RCTPromiseRejectBlock) {
        let status = center.authorizationStatus
        switch status {
        case .approved:
            resolve(["status": "approved"])
        case .denied:
            resolve(["status": "denied"])
        case .notDetermined:
            resolve(["status": "notDetermined"])
        @unknown default:
            resolve(["status": "unknown"])
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
