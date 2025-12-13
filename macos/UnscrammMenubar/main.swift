import Cocoa
import WebKit

final class KeyablePanel: NSPanel {
  override var canBecomeKey: Bool { true }
  override var canBecomeMain: Bool { true }
}

final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
  private let webRootUrl: URL

  init(webRootUrl: URL) {
    self.webRootUrl = webRootUrl
    super.init()
  }

  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    guard let url = urlSchemeTask.request.url else {
      urlSchemeTask.didFailWithError(NSError(domain: "UnscrammMenubar", code: 1))
      return
    }

    var relativePath = url.path
    if relativePath.isEmpty || relativePath == "/" {
      relativePath = "/index-macos.html"
    }
    if relativePath.hasPrefix("/") {
      relativePath.removeFirst()
    }

    let fileUrl = webRootUrl.appendingPathComponent(relativePath, isDirectory: false)

    do {
      let data = try Data(contentsOf: fileUrl)
      let mimeType = mimeTypeForExtension(fileUrl.pathExtension)

      // Some WebKit paths (fetch(), module loads) behave better when the response is HTTP-like.
      var statusCode = 200
      var body = data
      var headers: [String: String] = [
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      ]

      if let range = urlSchemeTask.request.value(forHTTPHeaderField: "Range"),
         let sliced = sliceDataForRangeHeader(data: data, rangeHeader: range) {
        statusCode = 206
        body = sliced.data
        headers["Content-Range"] = sliced.contentRange
      }

      headers["Content-Length"] = String(body.count)

      let response = HTTPURLResponse(
        url: url,
        statusCode: statusCode,
        httpVersion: "HTTP/1.1",
        headerFields: headers
      )

      if let response {
        urlSchemeTask.didReceive(response)
      } else {
        urlSchemeTask.didReceive(URLResponse(url: url, mimeType: mimeType, expectedContentLength: body.count, textEncodingName: nil))
      }

      urlSchemeTask.didReceive(body)
      urlSchemeTask.didFinish()
    } catch {
      // 404-style response (important so fetch() gets a status)
      let response = HTTPURLResponse(
        url: url,
        statusCode: 404,
        httpVersion: "HTTP/1.1",
        headerFields: ["Content-Type": "text/plain", "Content-Length": "0"]
      )
      if let response {
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didFinish()
        return
      }
      urlSchemeTask.didFailWithError(error)
    }
  }

  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    // no-op
    _ = urlSchemeTask
  }

  private func mimeTypeForExtension(_ ext: String) -> String {
    switch ext.lowercased() {
    case "html":
      return "text/html"
    case "js":
      return "application/javascript"
    case "css":
      return "text/css"
    case "png":
      return "image/png"
    case "svg":
      return "image/svg+xml"
    case "json":
      return "application/json"
    case "txt":
      return "text/plain"
    case "woff":
      return "font/woff"
    case "woff2":
      return "font/woff2"
    default:
      return "application/octet-stream"
    }
  }

  private func sliceDataForRangeHeader(
    data: Data,
    rangeHeader: String
  ) -> (data: Data, contentRange: String)? {
    // Example header: "bytes=0-1023" or "bytes=1024-"
    let lower = rangeHeader.lowercased()
    guard lower.hasPrefix("bytes=") else { return nil }
    let spec = lower.dropFirst("bytes=".count)
    let parts = spec.split(separator: "-", omittingEmptySubsequences: false)
    guard parts.count == 2 else { return nil }

    let total = data.count
    let startStr = String(parts[0])
    let endStr = String(parts[1])

    // Support:
    // - bytes=START-END
    // - bytes=START-
    // - bytes=-SUFFIX_LEN
    let start: Int
    let end: Int
    if startStr.isEmpty {
      // suffix range
      let suffixLen = Int(endStr) ?? 0
      if suffixLen <= 0 { return nil }
      start = max(total - suffixLen, 0)
      end = total - 1
    } else {
      start = Int(startStr) ?? 0
      if endStr.isEmpty {
        end = total - 1
      } else {
        end = Int(endStr) ?? (total - 1)
      }
    }

    if start < 0 || end < start || start >= total {
      return nil
    }

    let safeEnd = min(end, total - 1)

    // If the requested range covers the entire file, avoid 206 responses.
    if start == 0 && safeEnd == total - 1 {
      return nil
    }

    let sub = data.subdata(in: start..<(safeEnd + 1))
    let contentRange = "bytes \(start)-\(safeEnd)/\(total)"
    return (sub, contentRange)
  }
}

final class WebBridge: NSObject, WKScriptMessageHandler {
  private weak var webView: WKWebView?

  init(webView: WKWebView) {
    self.webView = webView
    super.init()
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    _ = userContentController
    guard message.name == "unscramm" else { return }
    guard let body = message.body as? [String: Any] else { return }
    guard let type = body["type"] as? String else { return }
    guard let id = body["id"] as? Int else { return }

    switch type {
    case "clipboard.read":
      let text = NSPasteboard.general.string(forType: .string) ?? ""
      respond(id: id, ok: true, result: text)
    case "clipboard.write":
      let text = body["text"] as? String ?? ""
      NSPasteboard.general.clearContents()
      _ = NSPasteboard.general.setString(text, forType: .string)
      respond(id: id, ok: true, result: true)
    default:
      respond(id: id, ok: false, error: "unknown message type")
    }
  }

  private func respond(id: Int, ok: Bool, result: Any? = nil, error: String? = nil) {
    guard let webView else { return }
    var payload: [String: Any] = ["id": id, "ok": ok]
    if let result { payload["result"] = result }
    if let error { payload["error"] = error }

    guard let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
          let json = String(data: data, encoding: .utf8) else {
      return
    }

    let js = "window.__unscrammNativeResponse && window.__unscrammNativeResponse(\(json));"
    webView.evaluateJavaScript(js)
  }
}

final class PanelController: NSObject, WKNavigationDelegate {
  private(set) var panel: NSPanel
  private let webView: WKWebView
  private let schemeHandler: AppSchemeHandler
  private let bridge: WebBridge
  private let debugWebView: Bool
  private var isWebViewLoaded = false
  private var pendingClipboardText: String?
  private var eventMonitor: Any?

  override init() {
    let quitButton = NSButton(title: "Quit", target: nil, action: nil)
    quitButton.bezelStyle = .rounded
    quitButton.translatesAutoresizingMaskIntoConstraints = false

    let contentController = WKUserContentController()
    debugWebView = UserDefaults.standard.bool(forKey: "UnscrammWebDebug")

    let resourcesUrl = Bundle.main.resourceURL
    let webRootUrl = resourcesUrl?.appendingPathComponent("web", isDirectory: true)
      ?? URL(fileURLWithPath: "/")

    schemeHandler = AppSchemeHandler(webRootUrl: webRootUrl)

    let config = WKWebViewConfiguration()
    config.userContentController = contentController
    config.setURLSchemeHandler(schemeHandler, forURLScheme: "unscramm")
    webView = WKWebView(frame: .zero, configuration: config)
    webView.translatesAutoresizingMaskIntoConstraints = false
    webView.setValue(false, forKey: "drawsBackground")

    bridge = WebBridge(webView: webView)
    contentController.add(bridge, name: "unscramm")

    if debugWebView {
      let errorScriptSource = """
        (function(){
          function renderError(title, message) {
            try {
              const existing = document.getElementById('__unscramm_error__');
              if (existing) existing.remove();
              const wrap = document.createElement('div');
              wrap.id = '__unscramm_error__';
              wrap.style.position = 'fixed';
              wrap.style.left = '8px';
              wrap.style.right = '8px';
              wrap.style.bottom = '8px';
              wrap.style.padding = '10px';
              wrap.style.background = 'rgba(0,0,0,0.85)';
              wrap.style.border = '1px solid rgba(255,255,255,0.15)';
              wrap.style.borderRadius = '8px';
              wrap.style.color = '#fff';
              wrap.style.fontFamily = '-apple-system';
              wrap.style.fontSize = '12px';
              wrap.style.zIndex = '999999';
              const header = document.createElement('div');
              header.style.fontWeight = '700';
              header.style.marginBottom = '6px';
              header.textContent = String(title);

              const pre = document.createElement('pre');
              pre.style.whiteSpace = 'pre-wrap';
              pre.style.margin = '0';
              pre.textContent = String(message);

              wrap.appendChild(header);
              wrap.appendChild(pre);
              document.body.appendChild(wrap);
            } catch (_) {}
          }

          window.addEventListener('error', function(e) {
            try {
              const message = (e && e.message) || 'unknown error';
              const filename = (e && e.filename) || '';
              const lineno = (e && e.lineno) || '';
              const colno = (e && e.colno) || '';
              const stack = (e && e.error && e.error.stack) ? '\n\n' + e.error.stack : '';
              const location = filename ? (filename + ':' + lineno + ':' + colno) : '';
              renderError('JS error', message + (location ? ('\n' + location) : '') + stack);
            } catch (_) {
              const msg = (e && (e.message || (e.error && e.error.stack) || e.error)) || 'unknown error';
              renderError('JS error', msg);
            }
          });

          window.addEventListener('unhandledrejection', function(e) {
            try {
              const reason = (e && e.reason) || 'unknown rejection';
              const msg = (reason && (reason.stack || reason.message)) || String(reason);
              renderError('Unhandled promise rejection', msg);
            } catch (_) {
              const reason = (e && e.reason && (e.reason.stack || e.reason.message)) || (e && e.reason) || 'unknown rejection';
              renderError('Unhandled promise rejection', reason);
            }
          });
        })();
      """ + "\n//# sourceURL=unscramm-debug-user-script.js\n"
      let errorScript = WKUserScript(source: errorScriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
      contentController.addUserScript(errorScript)
    }

    let container = NSVisualEffectView()
    container.material = .hudWindow
    container.blendingMode = .withinWindow
    container.state = .active
    container.translatesAutoresizingMaskIntoConstraints = false

    container.addSubview(webView)
    container.addSubview(quitButton)

    NSLayoutConstraint.activate([
      webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
      webView.topAnchor.constraint(equalTo: container.topAnchor),
      webView.bottomAnchor.constraint(equalTo: quitButton.topAnchor, constant: -10),

      quitButton.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 12),
      quitButton.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -10),
    ])

    panel = KeyablePanel(
      contentRect: NSRect(x: 0, y: 0, width: 420, height: 640),
      styleMask: [.borderless],
      backing: .buffered,
      defer: false
    )
    panel.contentView = container
    panel.isOpaque = false
    panel.backgroundColor = .clear
    panel.hasShadow = true
    panel.level = .statusBar
    panel.hidesOnDeactivate = false
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]
    panel.isReleasedWhenClosed = false
    panel.becomesKeyOnlyIfNeeded = false

    super.init()

    webView.navigationDelegate = self

    if #available(macOS 13.3, *) {
      webView.isInspectable = true
    }

    quitButton.target = self
    quitButton.action = #selector(quit)

    loadBundledWebUI()
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    let html = "<html><body style=\"font-family: -apple-system; padding: 16px;\"><div style=\"font-weight:600; margin-bottom:8px;\">WebView failed to load</div><pre style=\"white-space: pre-wrap;\">\(error)</pre></body></html>"
    webView.loadHTMLString(html, baseURL: nil)
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    let html = "<html><body style=\"font-family: -apple-system; padding: 16px;\"><div style=\"font-weight:600; margin-bottom:8px;\">WebView failed to start loading</div><pre style=\"white-space: pre-wrap;\">\(error)</pre></body></html>"
    webView.loadHTMLString(html, baseURL: nil)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    _ = navigation
    isWebViewLoaded = true
    if let pendingClipboardText {
      self.pendingClipboardText = nil
      sendClipboardToWeb(pendingClipboardText)
    }

    if !debugWebView { return }
    let js = """
      (async function(){
        const existing = document.getElementById('__unscramm_loaded__');
        if (!existing) {
          const banner = document.createElement('div');
          banner.id = '__unscramm_loaded__';
          banner.textContent = 'Loaded WKWebView HTML';
          banner.style.position = 'fixed';
          banner.style.top = '8px';
          banner.style.left = '8px';
          banner.style.padding = '6px 8px';
          banner.style.background = 'rgba(255, 0, 0, 0.85)';
          banner.style.color = '#fff';
          banner.style.fontFamily = '-apple-system';
          banner.style.fontSize = '12px';
          banner.style.zIndex = '999999';
          document.body.appendChild(banner);
        }

        const diagnostics = document.getElementById('__unscramm_error__') || document.createElement('div');
        diagnostics.id = '__unscramm_error__';
        diagnostics.style.position = 'fixed';
        diagnostics.style.left = '8px';
        diagnostics.style.right = '8px';
        diagnostics.style.bottom = '8px';
        diagnostics.style.padding = '10px';
        diagnostics.style.background = 'rgba(0,0,0,0.85)';
        diagnostics.style.border = '1px solid rgba(255,255,255,0.15)';
        diagnostics.style.borderRadius = '8px';
        diagnostics.style.color = '#fff';
        diagnostics.style.fontFamily = '-apple-system';
        diagnostics.style.fontSize = '12px';
        diagnostics.style.zIndex = '999999';

        function setDiag(title, body) {
          diagnostics.innerHTML = '<div style="font-weight:700; margin-bottom:6px;">' + title + '</div>' +
            '<pre style="white-space:pre-wrap; margin:0;">' + String(body) + '</pre>';
          if (!diagnostics.isConnected) document.body.appendChild(diagnostics);
        }

        const el = document.querySelector('script[type="module"]');
        const src = el && el.getAttribute('src');
        setDiag('WKWebView diagnostics', 'location: ' + location.href + '\nmodule src: ' + src);

        if (src) {
          // Create a second module script tag to detect load success/failure.
          const probe = document.createElement('script');
          probe.type = 'module';
          probe.src = src;
          probe.onload = function() {
            setDiag('Module script loaded', 'Loaded: ' + src + '\n(root child count: ' + (document.getElementById('root')?.childNodes?.length ?? 0) + ')');
          };
          probe.onerror = function(e) {
            setDiag('Module script failed to load', 'src: ' + src + '\nerror: ' + (e && (e.message || e.type)));
          };
          document.head.appendChild(probe);
        }
      })();
    """ + "\n//# sourceURL=unscramm-debug-didFinish.js\n"
    webView.evaluateJavaScript(js)
  }

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    let html = "<html><body style=\"font-family: -apple-system; padding: 16px;\"><div style=\"font-weight:600; margin-bottom:8px;\">Web content process terminated</div><div>Try reopening the panel.</div></body></html>"
    webView.loadHTMLString(html, baseURL: nil)
  }

  func updateClipboard(text: String) {
    if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return
    }

    if isWebViewLoaded {
      sendClipboardToWeb(text)
      return
    }

    pendingClipboardText = text
  }

  private func sendClipboardToWeb(_ text: String) {
    let payload: [String: Any] = ["detail": text]
    guard let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
          let json = String(data: data, encoding: .utf8) else {
      return
    }
    let js = "window.dispatchEvent(new CustomEvent('unscrammClipboard', \(json)));"
    webView.evaluateJavaScript(js)
  }

  private func loadBundledWebUI() {
    guard let url = URL(string: "unscramm://app/index-macos.html") else {
      return
    }
    webView.load(URLRequest(url: url))
  }

  func show(at origin: NSPoint) {
    panel.setFrameOrigin(origin)
    NSApp.activate(ignoringOtherApps: true)
    panel.makeKeyAndOrderFront(nil)
    panel.makeFirstResponder(webView)
    startEventMonitor()
  }

  func hide() {
    stopEventMonitor()
    panel.orderOut(nil)
  }

  var isVisible: Bool {
    panel.isVisible
  }

  private func startEventMonitor() {
    if !shouldDismissOnClickOutside() {
      stopEventMonitor()
      return
    }
    if eventMonitor != nil { return }
    eventMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
      guard let self else { return }
      guard self.panel.isVisible else { return }

      // Re-check dynamically so `defaults write ...` takes effect immediately.
      if !self.shouldDismissOnClickOutside() { return }

      let mouseLocation = NSEvent.mouseLocation
      if !self.panel.frame.contains(mouseLocation) {
        self.hide()
      }
    }
  }

  private func shouldDismissOnClickOutside() -> Bool {
    // Dev toggle: set to true to keep the panel open while you click Safari's Develop menu.
    // Usage:
    // defaults write com.scrappykin.unscramm.menubar-harness UnscrammDisableAutoDismiss -bool true
    !UserDefaults.standard.bool(forKey: "UnscrammDisableAutoDismiss")
  }

  private func stopEventMonitor() {
    guard let eventMonitor else { return }
    NSEvent.removeMonitor(eventMonitor)
    self.eventMonitor = nil
  }

  @objc private func quit() {
    NSApp.terminate(nil)
  }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
  private var statusItem: NSStatusItem?
  private let panelController = PanelController()

  func applicationDidFinishLaunching(_ notification: Notification) {
    let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    self.statusItem = item

    if let button = item.button {
      button.title = "U"
      button.target = self
      button.action = #selector(togglePanel)
      button.sendAction(on: [.leftMouseUp])
    }
  }

  @objc private func togglePanel() {
    if panelController.isVisible {
      panelController.hide()
      return
    }

    let text = NSPasteboard.general.string(forType: .string) ?? ""
    panelController.updateClipboard(text: text)

    guard let button = statusItem?.button, let buttonWindow = button.window else {
      return
    }

    let buttonFrame = buttonWindow.convertToScreen(button.frame)
    let panelSize = panelController.panel.frame.size

    let rawX = buttonFrame.midX - (panelSize.width / 2)
    let rawY = buttonFrame.minY - panelSize.height - 6

    let screen = buttonWindow.screen ?? NSScreen.main
    let visibleFrame = screen?.visibleFrame ?? NSRect(x: 0, y: 0, width: 0, height: 0)

    let x = min(max(rawX, visibleFrame.minX), visibleFrame.maxX - panelSize.width)
    let y = min(max(rawY, visibleFrame.minY), visibleFrame.maxY - panelSize.height)

    panelController.show(at: NSPoint(x: x, y: y))
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
