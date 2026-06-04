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
        
        // DNS through CleanBrowsing Adult Filter
        let dnsSettings = NEDNSSettings(servers: [
            "185.228.168.9",
            "185.228.169.9",
            "1.1.1.3",
            "1.0.0.3"
        ])
        dnsSettings.matchDomains = [""]
        dnsSettings.searchDomains = []
        settings.dnsSettings = dnsSettings
        
        // Use split tunneling — only route DNS, not all traffic
        // This keeps YouTube, WhatsApp etc working normally
        let ipv4Settings = NEIPv4Settings(
            addresses: ["192.168.2.1"],
            subnetMasks: ["255.255.255.255"]
        )
        ipv4Settings.includedRoutes = []
        ipv4Settings.excludedRoutes = [NEIPv4Route.default()]
        settings.ipv4Settings = ipv4Settings
        
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
