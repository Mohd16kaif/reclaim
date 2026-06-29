import ActivityKit
import Foundation

struct PanicTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timerEnd: Date
    }
    var sessionId: String
}

