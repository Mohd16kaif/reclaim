import SwiftUI
import FamilyControls
import ManagedSettings

@available(iOS 16.0, *)
class FamilyPickerHostingController: UIViewController {

  private var onComplete: (Data?) -> Void
  private var selection = FamilyActivitySelection()

  init(onComplete: @escaping (Data?) -> Void) {
    self.onComplete = onComplete
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { fatalError() }

  override func viewDidLoad() {
    super.viewDidLoad()

    let pickerView = FamilyActivityPickerView(selection: $selection) { [weak self] in
      self?.handleDone()
    } onCancel: { [weak self] in
      self?.handleCancel()
    }

    let host = UIHostingController(rootView: pickerView)
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(host.view)
    host.didMove(toParent: self)
  }

  private func handleDone() {
    let tokens = selection.applicationTokens
    if let data = try? JSONEncoder().encode(tokens) {
      onComplete(data)
    } else {
      onComplete(nil)
    }
    dismiss(animated: true)
  }

  private func handleCancel() {
    onComplete(nil)
    dismiss(animated: true)
  }
}

@available(iOS 16.0, *)
struct FamilyActivityPickerView: View {
  @Binding var selection: FamilyActivitySelection
  let onDone: () -> Void
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
            Button("Done") { onDone() }
              .fontWeight(.bold)
          }
        }
    }
  }
}
