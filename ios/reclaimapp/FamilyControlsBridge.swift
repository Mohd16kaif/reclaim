import Foundation

@objc(FamilyControlsBridge)
class FamilyControlsBridge: NSObject {
    @objc func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["authorized": false])
    }
    @objc func startPanicSession(_ durationMinutes: Int, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["success": false])
    }
    @objc func stopPanicSession(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["success": false])
    }
    @objc func getAuthorizationStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        resolve(["status": "disabled"])
    }
    @objc static func requiresMainQueueSetup() -> Bool { return true }
}
