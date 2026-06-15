// CoreBrimTech OS — Tauri desktop shell.
//
// B1 (this step) is the minimal shell that loads the statically-exported Next app.
// B2 adds the native AI bridge (invoke handler) that replaces the /api/ai proxy with a direct
// provider call using the founder's stored BYO key. B4 adds tray + notifications + global hotkey.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running CoreBrimTech OS");
}
