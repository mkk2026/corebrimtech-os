// CoreBrimTech OS — Tauri desktop shell.
//
// B1 is the shell that loads the statically-exported Next app.
// B2 (this step) adds the native AI bridge (`ai::ai_request`) that replaces the /api/ai proxy with
// a direct provider call using the founder's stored BYO key.
// B4 adds tray + notifications + global hotkey.

mod ai;
mod net;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ai::ai_request, net::check_link])
        .run(tauri::generate_context!())
        .expect("error while running CoreBrimTech OS");
}
