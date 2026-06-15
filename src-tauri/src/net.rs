//! Native network helpers — the desktop replacements for the web `/api/check-link` route.
//! Runs from the native side so it isn't subject to webview CORS.

use std::time::Duration;

const TIMEOUT_SECS: u64 = 8;
const USER_AGENT: &str = "CBT-OS-Research/1.0 (link check)";

/// Returns whether a URL is reachable. Mirrors the web route: try HEAD, fall back to GET on error.
#[tauri::command]
pub async fn check_link(url: String) -> bool {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return false;
    }

    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECS))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    match client.head(&url).header("user-agent", USER_AGENT).send().await {
        Ok(res) => res.status().is_success(),
        Err(_) => match client.get(&url).header("user-agent", USER_AGENT).send().await {
            Ok(res) => res.status().is_success(),
            Err(_) => false,
        },
    }
}
