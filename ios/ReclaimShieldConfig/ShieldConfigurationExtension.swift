import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.05, green: 0.05, blue: 0.1, alpha: 0.95),
            icon: UIImage(systemName: "shield.fill"),
            title: ShieldConfiguration.Label(
                text: "You're in Panic Mode",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "You've got this. Stay strong.",
                color: UIColor(white: 0.8, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Reclaim",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.2, green: 0.4, blue: 1.0, alpha: 1.0)
        )
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.05, green: 0.05, blue: 0.1, alpha: 0.95),
            icon: UIImage(systemName: "shield.fill"),
            title: ShieldConfiguration.Label(
                text: "Reclaim is protecting you",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Your panic session is still active.",
                color: UIColor(white: 0.8, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Reclaim",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.2, green: 0.4, blue: 1.0, alpha: 1.0)
        )
    }
}
