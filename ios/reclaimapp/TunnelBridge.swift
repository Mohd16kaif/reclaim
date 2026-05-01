import Foundation

@objc(TunnelBridge)
class TunnelBridge: NSObject {
    @objc func startTunnel(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["success": false, "status": "disabled"])
    }
    @objc func stopTunnel(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["success": false, "status": "disabled"])
    }
    @objc func getTunnelStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["status": "disabled"])
    }
    @objc static func requiresMainQueueSetup() -> Bool { return true }
}
