use tauri::{
  Manager,
  tray::{MouseButton, MouseButtonState, TrayIconEvent},
  WindowEvent,
  PhysicalPosition,
  PhysicalSize,
  Position,
};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default();

  builder
    .on_tray_icon_event(|app, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        rect,
        ..
      } = event
      {
        if let Some(window) = app.get_webview_window("main") {
          if window.is_visible().unwrap_or(false) {
            window.hide().ok();
          } else {
            // Position the window near the tray icon (popover style).
            // This uses the tray icon rect (screen coordinates) provided by Tauri.
            let window_width: f64 = 400.0;
            let gap: f64 = 8.0;

            let scale_factor = window.scale_factor().unwrap_or(1.0);
            let pos: PhysicalPosition<i32> = rect.position.to_physical(scale_factor);
            let size: PhysicalSize<u32> = rect.size.to_physical(scale_factor);

            let target_x = (pos.x as f64 + (size.width as f64 / 2.0)) - (window_width / 2.0);
            let target_y = pos.y as f64 + size.height as f64 + gap;

            let _ = window.set_position(Position::Physical(PhysicalPosition::new(
              target_x.round() as i32,
              target_y.round() as i32,
            )));

            #[cfg(target_os = "macos")]
            {
              window.show().ok();
              window.set_focus().ok();
            }

            #[cfg(not(target_os = "macos"))]
            {
              window.show().ok();
              window.set_focus().ok();
            }
          }
        }
      }
    })
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_store::Builder::new().build())
    .setup(|app| {
      #[cfg(target_os = "macos")]
      {
        app.set_activation_policy(tauri::ActivationPolicy::Accessory);
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Get the main window
      let window = app.get_webview_window("main").unwrap();

      // Ensure the menubar window can appear on top of fullscreen apps (macOS Spaces).
      // Without this, macOS may keep the window confined to the current Space.
      window.set_visible_on_all_workspaces(true).ok();



      // Hide the window when it loses focus (click outside).
      // This mimics native menubar popover behavior.
      let window_for_events = window.clone();
      window.on_window_event(move |event| {
        if let WindowEvent::Focused(false) = event {
          window_for_events.hide().ok();
        }
      });

      // Initially hide the window (menu bar apps don't show on startup)
      window.hide().ok();

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
