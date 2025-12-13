import Cocoa

final class AppDelegate: NSObject, NSApplicationDelegate, NSMenuDelegate {
  private var statusItem: NSStatusItem?
  private let menu = NSMenu()
  private let clipboardItem = NSMenuItem(title: "Clipboard: ", action: nil, keyEquivalent: "")

  func applicationDidFinishLaunching(_ notification: Notification) {
    let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    self.statusItem = item

    if let button = item.button {
      button.title = "U"
    }

    menu.delegate = self
    menu.addItem(clipboardItem)
    menu.addItem(.separator())
    menu.addItem(NSMenuItem(title: "Quit", action: #selector(quit), keyEquivalent: "q"))

    item.menu = menu
  }

  func menuWillOpen(_ menu: NSMenu) {
    clipboardItem.title = "Clipboard: \(readClipboardText().trimmingCharacters(in: .whitespacesAndNewlines))"
  }

  private func readClipboardText() -> String {
    NSPasteboard.general.string(forType: .string) ?? ""
  }

  @objc private func quit() {
    NSApp.terminate(nil)
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
