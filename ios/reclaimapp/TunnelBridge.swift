import Foundation
import NetworkExtension

@objc(TunnelBridge)
class TunnelBridge: NSObject {

    private let tunnelBundleId = "com.reclaim.recovery.ReclaimTunnel"

    @objc func startTunnel(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            NETunnelProviderManager.loadAllFromPreferences { managers, error in
                if let error = error {
                    reject("TUNNEL_ERROR", "Failed to load tunnel preferences", error)
                    return
                }
                let manager = managers?.first ?? NETunnelProviderManager()
                let proto = NETunnelProviderProtocol()
                proto.providerBundleIdentifier = self.tunnelBundleId
                proto.serverAddress = "CleanBrowsing DNS"
                manager.protocolConfiguration = proto
                manager.localizedDescription = "Reclaim Shield"
                manager.isEnabled = true
                manager.saveToPreferences { error in
                    if let error = error {
                        reject("TUNNEL_SAVE_ERROR", "Failed to save tunnel config", error)
                        return
                    }
                    manager.loadFromPreferences { error in
                        if let error = error {
                            reject("TUNNEL_LOAD_ERROR", "Failed to reload tunnel config", error)
                            return
                        }
                        do {
                            try manager.connection.startVPNTunnel()
                            resolve(["success": true, "status": "starting"])
                        } catch {
                            reject("TUNNEL_START_ERROR", "Failed to start tunnel: \(error.localizedDescription)", error)
                        }
                    }
                }
            }
        }
    }

    @objc func stopTunnel(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            NETunnelProviderManager.loadAllFromPreferences { managers, error in
                if let error = error {
                    reject("TUNNEL_ERROR", "Failed to load preferences", error)
                    return
                }
                guard let manager = managers?.first else {
                    resolve(["success": true, "status": "not_configured"])
                    return
                }
                manager.connection.stopVPNTunnel()
                resolve(["success": true, "status": "stopped"])
            }
        }
    }

    @objc func getTunnelStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            NETunnelProviderManager.loadAllFromPreferences { managers, error in
                if let error = error {
                    reject("TUNNEL_ERROR", "Failed to load preferences", error)
                    return
                }
                guard let manager = managers?.first else {
                    resolve(["status": "not_configured"])
                    return
                }
                let statusMap: [NEVPNStatus: String] = [
                    .invalid: "invalid",
                    .disconnected: "disconnected",
                    .connecting: "connecting",
                    .connected: "connected",
                    .reasserting: "reconnecting",
                    .disconnecting: "disconnecting"
                ]
                resolve(["status": statusMap[manager.connection.status] ?? "unknown"])
            }
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
