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
                Image(systemName: context.isStale ? "checkmark.shield.fill" : "lock.shield.fill")
                    .foregroundColor(context.isStale ? .green : .red)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.isStale ? "Session Complete" : "Apps Blocked")
                        .font(.headline)
                        .foregroundColor(.white)
                    if context.isStale {
                        Text("You stayed aligned.")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    } else {
                        Text(timerInterval: Date()...context.state.timerEnd, countsDown: true)
                            .font(.subheadline.monospacedDigit())
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                Spacer()
            }
            .padding()
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.isStale ? "Complete" : "Blocked", systemImage: context.isStale ? "checkmark.shield.fill" : "lock.shield.fill")
                        .foregroundColor(context.isStale ? .green : .red)
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.isStale {
                        Image(systemName: "checkmark")
                            .foregroundColor(.green)
                    } else {
                        Text(timerInterval: Date()...context.state.timerEnd, countsDown: true)
                            .font(.headline.monospacedDigit())
                            .foregroundColor(.white)
                            .frame(maxWidth: 80)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.isStale ? "You stayed aligned." : "Reclaim is protecting you")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
            } compactLeading: {
                Image(systemName: context.isStale ? "checkmark.shield.fill" : "lock.shield.fill")
                    .foregroundColor(context.isStale ? .green : .red)
            } compactTrailing: {
                if context.isStale {
                    Image(systemName: "checkmark")
                        .foregroundColor(.green)
                } else {
                    Text(timerInterval: Date()...context.state.timerEnd, countsDown: true)
                        .font(.caption.monospacedDigit())
                        .foregroundColor(.white)
                        .frame(maxWidth: 40)
                }
            } minimal: {
                Image(systemName: context.isStale ? "checkmark.shield.fill" : "lock.shield.fill")
                    .foregroundColor(context.isStale ? .green : .red)
            }
        }
    }
}
