import WidgetKit
import SwiftUI
import ActivityKit

@main
struct PanicTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        PanicTimerLiveActivity()
    }
}

struct PanicTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PanicTimerAttributes.self) { context in
            HStack {
                Image(systemName: "lock.shield.fill").foregroundColor(.red)
                Text("Apps Blocked")
                    .foregroundColor(.white)
            }
            .padding()
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Blocked", systemImage: "lock.shield.fill").foregroundColor(.red)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Active")
                }
            } compactLeading: {
                Image(systemName: "lock.shield.fill").foregroundColor(.red)
            } compactTrailing: {
                Text("•")
            } minimal: {
                Image(systemName: "lock.shield.fill").foregroundColor(.red)
            }
        }
    }
}
