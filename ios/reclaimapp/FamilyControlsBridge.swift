import Foundation
import FamilyControls
import ManagedSettings

@objc(FamilyControlsBridge)
class FamilyControlsBridge: NSObject {

  private let store = ManagedSettingsStore()

  // -------------------------------------------------------------------------
  // requestAuthorization
  // Requests Family Controls authorization from the user.
  // Shows the system permission popup if not already authorized.
  // Returns { authorized: true } on success, rejects on failure.
  // -------------------------------------------------------------------------
  @objc func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        resolve(["authorized": true])
      } catch {
        reject("AUTH_ERROR", error.localizedDescription, error)
      }
    }
  }

  // -------------------------------------------------------------------------
  // enableContentFilter
  // Enables Apple's built-in adult content web filter via ManagedSettingsStore.
  // Must be called AFTER requestAuthorization succeeds.
  // Returns { success: true } on success, rejects on failure.
  // -------------------------------------------------------------------------
  @objc func enableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      store.webContent.blockedByFilter = .enabled(
        autofilterEnabled: true,
        allowedActivityCategories: ActivityCategoryPolicy.none
      )
      resolve(["success": true])
    } catch {
      reject("FILTER_ERROR", error.localizedDescription, error)
    }
  }

  // -------------------------------------------------------------------------
  // disableContentFilter
  // Removes the adult content web filter from ManagedSettingsStore.
  // Returns { success: true } on success, rejects on failure.
  // -------------------------------------------------------------------------
  @objc func disableContentFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      store.webContent.blockedByFilter = nil
      resolve(["success": true])
    } catch {
      reject("FILTER_ERROR", error.localizedDescription, error)
    }
  }

  // -------------------------------------------------------------------------
  // getAuthorizationStatus
  // Returns the current Family Controls authorization status.
  // Returns { status: "authorized" } or { status: "notDetermined" } or
  // { status: "denied" }
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // startPanicSession — stub, will be implemented later
  // -------------------------------------------------------------------------
  @objc func startPanicSession(
    _ durationMinutes: Int,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(["success": false, "message": "not implemented yet"])
  }

  // -------------------------------------------------------------------------
  // stopPanicSession — stub, will be implemented later
  // -------------------------------------------------------------------------
  @objc func stopPanicSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(["success": false, "message": "not implemented yet"])
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
