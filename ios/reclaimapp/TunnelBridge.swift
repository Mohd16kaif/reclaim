import Foundation
import NetworkExtension

@objc(TunnelBridge)
class TunnelBridge: NSObject {
    private let tunnelBundleId = "com.reclaim.recovery.ReclaimTunnel"

    @objc func startTunnel(_ resolve: @escaping RCTPromiseResolveBlock, 
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        NETunnelProviderManager.loadAllFromPreferences { managers, error in
            if let error = error {
                reject("TUNNEL_LOAD_ERROR", error.localizedDescription, error)
                return
            }

            let manager = managers?.first ?? NETunnelProviderManager()

            if managers?.isEmpty ?? true {
                let proto = NETunnelProviderProtocol()
                proto.providerBundleIdentifier = self.tunnelBundleId
                proto.serverAddress = "Reclaim Shield"
                proto.providerConfiguration = ["mode": "dns_filter"]
                proto.username = "Reclaim"
                manager.protocolConfiguration = proto
                manager.localizedDescription = "Reclaim Shield"
                manager.isEnabled = true
            }

            if manager.connection.status == .connected || 
               manager.connection.status == .connecting {
                resolve(["success": true, "status": "enabled"])
                return
            }

            manager.saveToPreferences { saveError in
                if let saveError = saveError {
                    reject("TUNNEL_SAVE_ERROR", saveError.localizedDescription, saveError)
                    return
                }
                NETunnelProviderManager.loadAllFromPreferences { reloadedManagers, reloadError in
                    if let reloadError = reloadError {
                        reject("TUNNEL_RELOAD_ERROR", reloadError.localizedDescription, reloadError)
                        return
                    }
                    guard let reloadedManager = reloadedManagers?.first else {
                        reject("TUNNEL_NOT_FOUND", "VPN configuration not found after save", nil)
                        return
                    }
                    do {
                        try reloadedManager.connection.startVPNTunnel()
                        // Wait briefly then check actual connection status
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                            let status = reloadedManager.connection.status
                            if status == .connected || status == .connecting {
                                resolve(["success": true, "status": "enabled"])
                            } else {
                                resolve(["success": false, "status": "disabled"])
                            }
                        }
                    } catch {
                        reject("TUNNEL_START_ERROR", error.localizedDescription, error)
                    }
                }
            }
        }
    }

    @objc func stopTunnel(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        NETunnelProviderManager.loadAllFromPreferences { managers, error in
            if let error = error {
                reject("TUNNEL_LOAD_ERROR", error.localizedDescription, error)
                return
            }

            guard let manager = managers?.first else {
                resolve(["success": false, "status": "disabled"])
                return
            }

            manager.connection.stopVPNTunnel()
            resolve(["success": true, "status": "disabled"])
        }
    }

    @objc func getTunnelStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        NETunnelProviderManager.loadAllFromPreferences { managers, error in
            if let error = error {
                reject("TUNNEL_LOAD_ERROR", error.localizedDescription, error)
                return
            }

            guard let manager = managers?.first else {
                resolve(["status": "disabled"])
                return
            }

            let status: String
            switch manager.connection.status {
            case .connected, .connecting:
                status = "enabled"
            default:
                status = "disabled"
            }
            resolve(["status": status])
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool { return true }
}
