// CoreBrimTech OS — Tauri desktop shell.
//
// B1: shell that loads the static-exported Next app.
// B2: native AI bridge (`ai::ai_request`).
// B3: native link check (`net::check_link`).
// B4 (this step): tray icon, native notifications, global hotkey, and close-to-tray (so the
//     webview stays alive for B5's background signal scan).

mod ai;
mod net;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, Runtime, WindowEvent,
};

/// Show + focus the main window (used by the tray "Show" item and the global hotkey).
fn show_main<R: Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        show_main(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![ai::ai_request, net::check_link])
        .setup(|app| {
            // ── System tray ──────────────────────────────────────────────────
            let show = MenuItem::with_id(app, "show", "Show CoreBrimTech OS", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("default window icon").clone())
                .tooltip("CoreBrimTech OS")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // ── Global hotkey: Cmd/Ctrl+Shift+K summons the co-founder ────────
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            if let Err(e) = app.global_shortcut().register("CmdOrCtrl+Shift+K") {
                eprintln!("[CBT] failed to register global shortcut: {e}");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Close to tray: hide instead of exiting so the webview keeps running (background
            // signals in B5 depend on this). Quit is available from the tray menu.
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running CoreBrimTech OS");
}
