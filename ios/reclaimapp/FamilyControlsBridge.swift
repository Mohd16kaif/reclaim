import Foundation
import FamilyControls
import ManagedSettings

@objc(FamilyControlsBridge)
class FamilyControlsBridge: NSObject {

  private let store = ManagedSettingsStore()

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

  @objc func enableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    store.webContent.blockedByFilter = .auto([])
    resolve(["success": true])
  }

  @objc func disableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    store.webContent.blockedByFilter = nil
    resolve(["success": true])
  }

  @objc func getAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = AuthorizationCenter.shared.authorizationStatus
    switch status {
    case .approved:
      resolve(["status": "authorized"])
    case .denied:
      resolve(["status": "denied"])
    default:
      resolve(["status": "notDetermined"])
    }
  }

  @objc func startPanicSession(
    _ durationMinutes: Int,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(["success": false, "message": "not implemented yet"])
  }

  @objc func stopPanicSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(["success": false, "message": "not implemented yet"])
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}