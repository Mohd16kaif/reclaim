import ActivityKit
import WidgetKit
import SwiftUI

@main
struct PanicTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        PanicTimerLiveActivity()
    }
}

struct PanicTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PanicTimerAttributes.self) { context in
            // Lock Screen / Banner UI
            HStack(spacing: 12) {
                Image(systemName: "lock.shield.fill")
                    .foregroundColor(.red)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Apps Blocked")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(timerInterval: Date()...context.state.timerEnd, countsDown: true)
                        .font(.subheadline.monospacedDigit())
                        .foregroundColor(.white.opacity(0.8))
                }
                Spacer()
            }
            .padding()
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Blocked", systemImage: "lock.shield.fill")
                        .foregroundColor(.red)
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(timerInterval: Date()...context.state.timerEnd, countsDown: true)
                        .font(.headline.monospacedDigit())
                        .foregroundColor(.white)
                        .frame(maxWidth: 80)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Reclaim is protecting you")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
            } compactLeading: {
                Image(systemName: "lock.shield.fill")
                    .foregroundColor(.red)
            } compactTrailing: {
                Text(timerInterval: Date()...context.state.timerEnd, countsDown: true)
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.white)
                    .frame(maxWidth: 40)
            } minimal: {
                Image(systemName: "lock.shield.fill")
                    .foregroundColor(.red)
            }
        }
    }
}
