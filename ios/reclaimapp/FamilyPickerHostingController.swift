import SwiftUI
import FamilyControls
import ManagedSettings
import UIKit

@available(iOS 16.0, *)
class FamilyPickerHostingController: UIViewController {

  private var onComplete: (Data?) -> Void

  init(onComplete: @escaping (Data?) -> Void) {
    self.onComplete = onComplete
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { fatalError() }

  override func viewDidLoad() {
    super.viewDidLoad()

    let pickerView = FamilyActivityPickerView { [weak self] data in
      self?.onComplete(data)
      self?.dismiss(animated: true)
    } onCancel: { [weak self] in
      self?.onComplete(nil)
      self?.dismiss(animated: true)
    }

    let host = UIHostingController(rootView: pickerView)
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [
      UIView.AutoresizingMask.flexibleWidth,
      UIView.AutoresizingMask.flexibleHeight
    ]
    view.addSubview(host.view)
    host.didMove(toParent: self)
  }
}

@available(iOS 16.0, *)
struct FamilyActivityPickerView: View {
    @State private var selection = FamilyActivitySelection()
    let onDone: (Data?) -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Block During Panic")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") { onCancel() }
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            guard !selection.applicationTokens.isEmpty else {
                                onCancel()
                                return
                            }
                            let data = try? JSONEncoder().encode(selection.applicationTokens)
                            onDone(data)
                        }
                        .fontWeight(.bold)
                    }
                }
                .onChange(of: selection) { newSelection in
                    // Strip any category selections immediately —
                    // user can expand categories to pick individual apps
                    // but cannot select an entire category at once
                    if !newSelection.categoryTokens.isEmpty {
                        selection.categoryTokens = []
                    }
                }
        }
    }
}
