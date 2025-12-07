use tauri::{Manager, tray::TrayIconEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_store::Builder::new().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Get the main window
      let window = app.get_webview_window("main").unwrap();

      // Initially hide the window (menu bar apps don't show on startup)
      window.hide().ok();

      // Handle tray icon clicks
      let tray = app.tray_by_id("main-tray").unwrap();
      tray.on_event(move |_tray, event| {
        if let TrayIconEvent::Click { button, .. } = event {
          if button == tauri::tray::MouseButton::Left {
            let window = window.clone();
            if window.is_visible().unwrap_or(false) {
              window.hide().ok();
            } else {
              window.show().ok();
              window.set_focus().ok();
            }
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
