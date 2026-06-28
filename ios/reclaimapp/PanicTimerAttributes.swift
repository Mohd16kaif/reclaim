import ActivityKit

struct PanicTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timerEnd: Date
    }
    var sessionId: String
}
