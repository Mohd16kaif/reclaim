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

    // Prevent Reclaim itself from being deleted during the panic session
    // (best-effort — user can still revoke Screen Time access from iOS Settings directly)
    if #available(iOS 16.0, *) {
        store.application.denyAppRemoval = true
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

    // Restore normal app removal behavior
    if #available(iOS 16.0, *) {
        store.application.denyAppRemoval = false
    }

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
    // Layer 1: Block adult content in Safari
    contentFilterStore.webContent.blockedByFilter = .auto([])

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
      let blockedDomains: Set<WebDomain> = [
          WebDomain(domain: "xhamster.com"), WebDomain(domain: "xhamster.desi"),
          WebDomain(domain: "xvideos.com"), WebDomain(domain: "xvideos.red"),
          WebDomain(domain: "xnxx.com"), WebDomain(domain: "xnxx.net"),
          WebDomain(domain: "pornhub.com"), WebDomain(domain: "pornhub.org"),
          WebDomain(domain: "redtube.com"), WebDomain(domain: "youporn.com"),
          WebDomain(domain: "tube8.com"), WebDomain(domain: "spankbang.com"),
          WebDomain(domain: "eporner.com"), WebDomain(domain: "beeg.com"),
          WebDomain(domain: "tnaflix.com"), WebDomain(domain: "drtuber.com"),
          WebDomain(domain: "nuvid.com"), WebDomain(domain: "porntrex.com"),
          WebDomain(domain: "faphouse.com"), WebDomain(domain: "nhentai.net"),
          WebDomain(domain: "nhentai.to"), WebDomain(domain: "rule34.xxx"),
          WebDomain(domain: "gelbooru.com"), WebDomain(domain: "motherless.com"),
          WebDomain(domain: "thisvid.com"), WebDomain(domain: "porndig.com"),
          WebDomain(domain: "4tube.com"), WebDomain(domain: "fuq.com"),
          WebDomain(domain: "porngo.com"), WebDomain(domain: "hdporn.net"),
          WebDomain(domain: "cliphunter.com"), WebDomain(domain: "pornhd.com"),
          WebDomain(domain: "brazzers.com"), WebDomain(domain: "bangbros.com"),
          WebDomain(domain: "realitykings.com"), WebDomain(domain: "mofos.com"),
          WebDomain(domain: "naughtyamerica.com"), WebDomain(domain: "wankz.com"),
          WebDomain(domain: "hclips.com"), WebDomain(domain: "pornrabbit.com"),
          WebDomain(domain: "porndoe.com"), WebDomain(domain: "vporn.com"),
          WebDomain(domain: "pornoxo.com"), WebDomain(domain: "babes.com"),
          WebDomain(domain: "fapvid.com"), WebDomain(domain: "txxx.com"),
          WebDomain(domain: "imagefap.com"), WebDomain(domain: "sex.com"),
          WebDomain(domain: "eroprofile.com"), WebDomain(domain: "empflix.com"),
          WebDomain(domain: "pornone.com"), WebDomain(domain: "zbporn.com"),
          WebDomain(domain: "spankbang.party"), WebDomain(domain: "xhamster.one"),
          WebDomain(domain: "xvideos.es"), WebDomain(domain: "redtube.com.br"),
      ]
      store.webContent.blockedByFilter = .auto(blockedDomains)
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

      // Schedule first chunk (max 7 days)
      let chunkDays = min(daysInt, 7)
      let chunkEnd = Calendar.current.date(byAdding: .day, value: chunkDays, to: Date())!

      var startComponents = Calendar.current.dateComponents([.hour, .minute, .second], from: Date())
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
          NSLog("FamilyControlsBridge: Blocker scheduled for \(daysInt) days, first chunk \(chunkDays) days")
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
