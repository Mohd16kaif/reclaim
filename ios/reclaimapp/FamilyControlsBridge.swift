import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import UIKit
import SwiftUI
import ActivityKit

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

    // Prevent Reclaim itself from being deleted during the panic session
    // (best-effort — user can still revoke Screen Time access from iOS Settings directly)
    if #available(iOS 16.0, *) {
        store.application.denyAppRemoval = true
    }

    // Save end time for reference
    let endTime = Date().addingTimeInterval(TimeInterval(durationSeconds))
    defaults?.set(endTime.timeIntervalSince1970, forKey: panicEndTimeKey)
    defaults?.synchronize()

    // Use a schedule that starts 1 minute in the past so iOS treats it as
    // already-started. intervalDidEnd fires at endTime reliably.
    // This is the recommended pattern for one-shot DeviceActivity timers.
    let startTime = Date().addingTimeInterval(-60)
    let schedule = DeviceActivitySchedule(
      intervalStart: Calendar.current.dateComponents(
        [.year, .month, .day, .hour, .minute, .second], from: startTime
      ),
      intervalEnd: Calendar.current.dateComponents(
        [.year, .month, .day, .hour, .minute, .second], from: endTime
      ),
      repeats: false
    )

    do {
      try activityCenter.startMonitoring(panicActivity, during: schedule)
      NSLog("FamilyControlsBridge: Panic schedule set — ends at \(endTime)")
      // Start Live Activity for Dynamic Island / Lock Screen countdown
      if #available(iOS 16.2, *) {
        let attributes = PanicTimerAttributes(sessionId: UUID().uuidString)
        let state = PanicTimerAttributes.ContentState(timerEnd: endTime)
        let content = ActivityContent(state: state, staleDate: endTime)
        do {
          let newActivity = try Activity<PanicTimerAttributes>.request(
            attributes: attributes,
            content: content,
            pushType: nil
          )
          // Persist the activity ID in the shared App Group so it can be
          // ended reliably by ID from either this process or the
          // DeviceActivity extension process, regardless of which one
          // is alive when the session actually ends.
          let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")
          sharedDefaults?.set(newActivity.id, forKey: "panic_activity_id")
          NSLog("FamilyControlsBridge: Live Activity started with id \(newActivity.id)")
        } catch {
          NSLog("FamilyControlsBridge: Live Activity failed to start: \(error.localizedDescription)")
        }
      }
      resolve(["success": true])
    } catch {
      NSLog("FamilyControlsBridge: Schedule failed — \(error.localizedDescription)")
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

    // Restore normal app removal behavior
    if #available(iOS 16.0, *) {
        store.application.denyAppRemoval = false
    }

    // Clear end time
    let defaults = UserDefaults(suiteName: appGroupID)
    defaults?.removeObject(forKey: panicEndTimeKey)
    defaults?.synchronize()

    // End the Live Activity for this session, by stored ID first (reliable
    // cross-process), then fall back to enumerating any others left behind.
    if #available(iOS 16.2, *) {
      Task {
        let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")
        let storedId = sharedDefaults?.string(forKey: "panic_activity_id")
        var endedById = false
        for activity in Activity<PanicTimerAttributes>.activities {
          if activity.id == storedId {
            await activity.end(nil, dismissalPolicy: .immediate)
            endedById = true
          }
        }
        // Safety net: end any remaining stray activities too
        for activity in Activity<PanicTimerAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
        sharedDefaults?.removeObject(forKey: "panic_activity_id")
        NSLog("FamilyControlsBridge: Live Activity ended (byId=\(endedById))")
      }
    }

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
    // Layer 1: Block adult content in Safari
    contentFilterStore.webContent.blockedByFilter = .auto()

    // Layer 2: Shield third-party browsers using tokens saved during setup
    let defaults = UserDefaults(suiteName: appGroupID)
    if let categoryData = defaults?.data(forKey: "blocker_browser_categories"),
       let tokens = try? JSONDecoder().decode(
         Set<ActivityCategoryToken>.self, from: categoryData
       ) {
      contentFilterStore.shield.applicationCategories = .specific(
        tokens, except: Set()
      )
    }

    resolve(["success": true])
  }

  @objc func disableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    contentFilterStore.webContent.blockedByFilter = nil
    contentFilterStore.shield.applicationCategories = nil
    resolve(["success": true])
  }

  @objc func saveBrowserCategoryTokens(
    _ tokenData: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = Data(base64Encoded: tokenData) else {
      reject("INVALID_DATA", "Could not decode category token data", nil)
      return
    }
    let defaults = UserDefaults(suiteName: appGroupID)
    defaults?.set(data, forKey: "blocker_browser_categories")
    defaults?.synchronize()
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

  // MARK: - Blocker with Duration

  @objc func enableBlockerWithDuration(_ days: NSNumber,
                                        resolver: @escaping RCTPromiseResolveBlock,
                                        rejecter: @escaping RCTPromiseRejectBlock) {
      guard #available(iOS 16.0, *) else {
          rejecter("UNSUPPORTED", "Requires iOS 16", nil)
          return
      }

      let daysInt = days.intValue
      let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.blocker"))
      let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")

      // Apply the filter immediately — do not wait for schedule
      store.webContent.blockedByFilter = .auto()
      NSLog("FamilyControlsBridge: Adult content filter enabled")

      // Handle permanent block (days == 0 means forever)
      if daysInt == 0 {
          sharedDefaults?.set(true, forKey: "blocker_is_permanent")
          sharedDefaults?.removeObject(forKey: "blocker_unblock_at")
          NSLog("FamilyControlsBridge: Permanent block set — no schedule needed")
          resolver(nil)
          return
      }

      // Save the target unblock date
      let unblockAt = Calendar.current.date(byAdding: .day, value: daysInt, to: Date())!
      sharedDefaults?.set(unblockAt, forKey: "blocker_unblock_at")
      sharedDefaults?.removeObject(forKey: "blocker_is_permanent")

      // Daily-repeating schedule (midnight to just-before-midnight, every day).
      // The extension checks each day whether unblockAt has passed and clears
      // the filter then — this avoids computing any multi-day interval directly,
      // which is what caused the previous schedule to collapse to a near-zero window.
      let startComponents = DateComponents(hour: 0, minute: 0, second: 0)
      let endComponents = DateComponents(hour: 23, minute: 59, second: 59)

      let schedule = DeviceActivitySchedule(
          intervalStart: startComponents,
          intervalEnd: endComponents,
          repeats: true
      )

      do {
          try DeviceActivityCenter().startMonitoring(
              DeviceActivityName("reclaim.blocker.session"),
              during: schedule
          )
          NSLog("FamilyControlsBridge: Blocker scheduled for \(daysInt) days, unblock at \(unblockAt)")
          resolver(nil)
      } catch {
          // Filter is already on even if scheduling fails — don't reject
          NSLog("FamilyControlsBridge: Schedule failed but filter is active: \(error.localizedDescription)")
          resolver(nil)
      }
  }

  @objc func disableBlocker(_ resolver: @escaping RCTPromiseResolveBlock,
                             rejecter: @escaping RCTPromiseRejectBlock) {
      guard #available(iOS 16.0, *) else {
          rejecter("UNSUPPORTED", "Requires iOS 16", nil)
          return
      }

      let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("reclaim.blocker"))
      store.webContent.blockedByFilter = nil

      DeviceActivityCenter().stopMonitoring([DeviceActivityName("reclaim.blocker.session")])

      let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")
      sharedDefaults?.removeObject(forKey: "blocker_unblock_at")
      sharedDefaults?.removeObject(forKey: "blocker_is_permanent")

      NSLog("FamilyControlsBridge: Blocker fully disabled")
      resolver(nil)
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
