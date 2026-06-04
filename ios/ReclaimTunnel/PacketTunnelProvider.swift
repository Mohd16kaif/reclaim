import NetworkExtension
import Foundation

// ============================================================================
// ReclaimTunnel — NEPacketTunnelProvider
// Routes all DNS through CleanBrowsing Adult Filter
// Blocks adult content, enforces SafeSearch, resists bypasses
// ============================================================================

class PacketTunnelProvider: NEPacketTunnelProvider {
    
    private let dnsClient = DNSOverHTTPS.shared
    private var pendingCompletion: ((Error?) -> Void)?
    
    // -------------------------------------------------------------------------
    // Tunnel starts — configure DNS proxy
    // -------------------------------------------------------------------------
    override func startTunnel(options: [String: NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        NSLog("ReclaimTunnel: Starting tunnel")
        
        let settings = createTunnelSettings()
        
        setTunnelNetworkSettings(settings) { error in
            if let error = error {
                NSLog("ReclaimTunnel: Failed to set settings: \(error.localizedDescription)")
                completionHandler(error)
                return
            }
            NSLog("ReclaimTunnel: Tunnel started successfully")
            completionHandler(nil)
        }
    }
    
    // -------------------------------------------------------------------------
    // Tunnel stops
    // -------------------------------------------------------------------------
    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        NSLog("ReclaimTunnel: Stopping tunnel, reason: \(reason.rawValue)")
        completionHandler()
    }
    
    // -------------------------------------------------------------------------
    // Create tunnel network settings
    // Routes DNS through CleanBrowsing
    // -------------------------------------------------------------------------
    private func createTunnelSettings() -> NEPacketTunnelNetworkSettings {
        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "127.0.0.1")
        
        // Configure DNS to use CleanBrowsing Adult Filter
        let dnsSettings = NEDNSSettings(servers: [
            "185.228.168.9",
            "185.228.169.9",
            "1.1.1.3",
            "1.0.0.3"
        ])
        dnsSettings.matchDomains = [""]
        dnsSettings.searchDomains = []
        settings.dnsSettings = dnsSettings
        
        // Route ALL traffic through tunnel so DNS settings take effect
        let ipv4Settings = NEIPv4Settings(
            addresses: ["10.8.0.1"],
            subnetMasks: ["255.255.255.0"]
        )
        let defaultRoute = NEIPv4Route.default()
        ipv4Settings.includedRoutes = [defaultRoute]
        ipv4Settings.excludedRoutes = []
        settings.ipv4Settings = ipv4Settings
        
        // IPv6 routing
        let ipv6Settings = NEIPv6Settings(
            addresses: ["fd00::1"],
            networkPrefixLengths: [64]
        )
        ipv6Settings.includedRoutes = [NEIPv6Route.default()]
        ipv6Settings.excludedRoutes = []
        settings.ipv6Settings = ipv6Settings
        
        return settings
    }
    
    // -------------------------------------------------------------------------
    // Handle app messages from React Native bridge
    // -------------------------------------------------------------------------
    override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
        guard let message = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any],
              let action = message["action"] as? String else {
            completionHandler?(nil)
            return
        }
        
        switch action {
        case "status":
            let response: [String: Any] = ["status": "active", "dns": "cleanbrowsing"]
            let responseData = try? JSONSerialization.data(withJSONObject: response)
            completionHandler?(responseData)
        default:
            completionHandler?(nil)
        }
    }
}
