import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import UIKit
import SwiftUI

@objc(FamilyControlsBridge)
class FamilyControlsBridge: NSObject {

  private var store: ManagedSettingsStore {
    if #available(iOS 16.0, *) {
      return ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.panic"))
    } else {
      return ManagedSettingsStore()
    }
  }
  private let activityCenter = DeviceActivityCenter()
  private let appGroupID = "group.com.reclaim.recovery"
  private let panicActivity = DeviceActivityName("reclaim.panic.session")
  private let panicTokensKey = "panic_blocked_apps"
  private let panicEndTimeKey = "panic_end_time"

  // MARK: - Authorization

  @objc func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.0, *) {
      Task {
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
          resolve(["authorized": true])
        } catch {
          reject("AUTH_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      AuthorizationCenter.shared.requestAuthorization { result in
        switch result {
        case .success:
          resolve(["authorized": true])
        case .failure(let error):
          reject("AUTH_ERROR", error.localizedDescription, error)
        }
      }
    }
  }

  // MARK: - Save app tokens selected via FamilyActivityPicker

  @objc func saveSelectedAppTokens(
    _ tokenData: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = Data(base64Encoded: tokenData) else {
      reject("INVALID_DATA", "Could not decode token data", nil)
      return
    }
    let defaults = UserDefaults(suiteName: appGroupID)
    defaults?.set(data, forKey: panicTokensKey)
    defaults?.synchronize()
    resolve(["success": true])
  }

  // MARK: - Check if apps have been selected

  @objc func hasSelectedApps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: appGroupID)
    let hasApps = defaults?.data(forKey: panicTokensKey) != nil
    resolve(["hasApps": hasApps])
  }

  // MARK: - Present FamilyActivityPicker

  @objc func presentAppPicker(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let rootVC = windowScene.windows.first?.rootViewController else {
        reject("NO_VC", "No root view controller", nil)
        return
      }

      if #available(iOS 16.0, *) {
        let pickerVC = FamilyPickerHostingController(
          onComplete: { [weak self] tokenData in
            if let data = tokenData {
              let base64 = data.base64EncodedString()
              let defaults = UserDefaults(suiteName: self?.appGroupID ?? "group.com.reclaim.recovery")
              defaults?.set(data, forKey: self?.panicTokensKey ?? "panic_blocked_apps")
              defaults?.synchronize()
              resolve(["success": true, "tokenData": base64])
            } else {
              resolve(["success": false, "cancelled": true])
            }
          }
        )
        rootVC.present(pickerVC, animated: true)
      } else {
        reject("IOS_VERSION", "Requires iOS 16+", nil)
      }
    }
  }

  // MARK: - Start Panic Session

  @objc func startPanicSession(
    _ durationSeconds: Int,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: appGroupID)

    // Apply shields immediately via ManagedSettings
    if let tokenData = defaults?.data(forKey: panicTokensKey),
       let tokens = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: tokenData) {
      store.shield.applications = tokens
    }

    // Save end time for reference
    let endTime = Date().addingTimeInterval(TimeInterval(durationSeconds))
    defaults?.set(endTime.timeIntervalSince1970, forKey: panicEndTimeKey)
    defaults?.synchronize()

    // Schedule DeviceActivity so the monitor extension auto-removes shields when timer ends
    let now = Date()
    let schedule = DeviceActivitySchedule(
      intervalStart: Calendar.current.dateComponents([.hour, .minute, .second], from: now),
      intervalEnd: Calendar.current.dateComponents([.hour, .minute, .second], from: endTime),
      repeats: false
    )

    do {
      try activityCenter.startMonitoring(panicActivity, during: schedule)
      resolve(["success": true])
    } catch {
      // Monitoring failed but shields are already applied — still resolve success
      resolve(["success": true, "monitoringError": error.localizedDescription])
    }
  }

  // MARK: - Stop Panic Session

  @objc func stopPanicSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // Stop DeviceActivity monitoring
    activityCenter.stopMonitoring([panicActivity])

    // Remove all shields
    store.shield.applications = nil
    store.shield.applicationCategories = nil

    // Clear end time
    let defaults = UserDefaults(suiteName: appGroupID)
    defaults?.removeObject(forKey: panicEndTimeKey)
    defaults?.synchronize()

    resolve(["success": true])
  }

  // MARK: - Content Filter (existing blocker shield)

  private var contentFilterStore: ManagedSettingsStore {
    if #available(iOS 16.0, *) {
      return ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.blocker"))
    } else {
      return ManagedSettingsStore()
    }
  }

  @objc func enableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    contentFilterStore.webContent.blockedByFilter = .auto([])
    resolve(["success": true])
  }

  @objc func disableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    contentFilterStore.webContent.blockedByFilter = nil
    resolve(["success": true])
  }

  @objc func getAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.0, *) {
      let status = AuthorizationCenter.shared.authorizationStatus
      switch status {
      case .approved:
        resolve(["status": "authorized"])
      case .denied:
        resolve(["status": "denied"])
      default:
        resolve(["status": "notDetermined"])
      }
    } else {
      resolve(["status": "unavailable"])
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
