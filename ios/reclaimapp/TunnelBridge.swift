import Foundation

// TunnelBridge disabled — DNS tunnel approach removed.
// Kept as stub to avoid breaking any existing JS imports.
@objc(TunnelBridge)
class TunnelBridge: NSObject {
  @objc func startTunnel(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(["success": false, "status": "disabled"])
  }
  @objc func stopTunnel(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(["success": false, "status": "disabled"])
  }
  @objc func getTunnelStatus(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(["status": "disabled"])
  }
  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
