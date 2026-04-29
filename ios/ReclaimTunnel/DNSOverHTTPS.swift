import Foundation
import Network

// ============================================================================
// DNS over HTTPS Client
// Forwards DNS queries to CleanBrowsing Adult Filter
// Fallback: Cloudflare Family DNS
// ============================================================================

class DNSOverHTTPS {
    
    static let shared = DNSOverHTTPS()
    
    private let primaryURL = "https://doh.cleanbrowsing.org/doh/adult-filter/"
    private let fallbackURL = "https://family.cloudflare-dns.com/dns-query"
    private let timeout: TimeInterval = 5.0
    
    private init() {}
    
    // -------------------------------------------------------------------------
    // Resolve a domain name — returns IP or nil if blocked
    // -------------------------------------------------------------------------
    func resolve(query dnsData: Data, completion: @escaping (Data?) -> Void) {
        sendRequest(to: primaryURL, data: dnsData) { [weak self] result in
            if let result = result {
                completion(result)
            } else {
                // Primary failed — try fallback
                self?.sendRequest(to: self?.fallbackURL ?? "", data: dnsData) { fallbackResult in
                    // If both fail (no internet) — fail open, return nil
                    completion(fallbackResult)
                }
            }
        }
    }
    
    // -------------------------------------------------------------------------
    // Send DNS-over-HTTPS request
    // -------------------------------------------------------------------------
    private func sendRequest(to urlString: String, data: Data, completion: @escaping (Data?) -> Void) {
        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }
        
        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = "POST"
        request.setValue("application/dns-message", forHTTPHeaderField: "Content-Type")
        request.setValue("application/dns-message", forHTTPHeaderField: "Accept")
        request.httpBody = data
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                NSLog("ReclaimTunnel: DoH request failed: \(error.localizedDescription)")
                completion(nil)
                return
            }
            completion(data)
        }.resume()
    }
}
