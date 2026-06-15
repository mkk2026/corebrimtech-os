//! Native AI bridge — the desktop replacement for the web `/api/ai` proxy.
//!
//! Calls the provider API directly with the founder's own (BYO) key, passed from the webview.
//! Returns the same `{ ok, status, data }` shape the web proxy returns, so the TypeScript AI
//! layer (`src/lib/llm.ts`) is transport-agnostic. This also fixes the web quirk where the proxy
//! used a server env key instead of the founder's stored key.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiRequest {
    pub provider: String,
    pub api_key: String,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub prompt: Option<String>,
    #[serde(default)]
    pub system: Option<String>,
    #[serde(default)]
    pub messages: Option<Vec<Value>>,
    #[serde(default)]
    pub max_tokens: Option<u32>,
    #[serde(default)]
    pub tools: Option<Vec<Value>>,
    #[serde(default)]
    pub anthropic_beta: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AiResponse {
    pub ok: bool,
    pub status: u16,
    pub data: Value,
}

#[tauri::command]
pub async fn ai_request(request: AiRequest) -> Result<AiResponse, String> {
    if request.api_key.trim().is_empty() {
        return Ok(AiResponse {
            ok: false,
            status: 401,
            data: json!({ "error": { "message": "No API key set. Add a key in Settings." } }),
        });
    }

    match request.provider.as_str() {
        "google" => call_google(request).await,
        _ => call_claude(request).await,
    }
}

async fn call_claude(req: AiRequest) -> Result<AiResponse, String> {
    let model = req.model.unwrap_or_else(|| "claude-sonnet-4-20250514".to_string());
    let max_tokens = req.max_tokens.unwrap_or(2000);

    let messages = req.messages.unwrap_or_else(|| match req.prompt {
        Some(p) => vec![json!({ "role": "user", "content": p })],
        None => vec![],
    });
    if messages.is_empty() {
        return Ok(bad_request("No messages or prompt provided"));
    }

    let mut payload = json!({ "model": model, "max_tokens": max_tokens, "messages": messages });
    if let Some(system) = req.system {
        payload["system"] = json!(system);
    }
    if let Some(tools) = req.tools {
        if !tools.is_empty() {
            payload["tools"] = json!(tools);
        }
    }

    let client = reqwest::Client::new();
    let mut builder = client
        .post("https://api.anthropic.com/v1/messages")
        .header("content-type", "application/json")
        .header("x-api-key", req.api_key)
        .header("anthropic-version", "2023-06-01");
    if let Some(beta) = req.anthropic_beta {
        builder = builder.header("anthropic-beta", beta);
    }

    send(builder.json(&payload)).await
}

async fn call_google(req: AiRequest) -> Result<AiResponse, String> {
    let model = req.model.unwrap_or_else(|| "gemini-2.0-flash".to_string());
    let max_tokens = req.max_tokens.unwrap_or(2000);

    let mut full_prompt = req.prompt.unwrap_or_default();
    if full_prompt.is_empty() {
        if let Some(messages) = &req.messages {
            let parts: Vec<String> = messages
                .iter()
                .filter_map(|m| m.get("content").and_then(|c| c.as_str()).map(String::from))
                .collect();
            full_prompt = parts.join("\n\n");
        }
    }
    if let Some(system) = req.system {
        full_prompt = format!("{system}\n\n{full_prompt}");
    }
    if full_prompt.trim().is_empty() {
        return Ok(bad_request("No prompt provided"));
    }

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={}",
        urlencoding(&req.api_key)
    );
    let payload = json!({
        "contents": [{ "parts": [{ "text": full_prompt }] }],
        "generationConfig": { "maxOutputTokens": max_tokens }
    });

    let client = reqwest::Client::new();
    let res = client.post(&url).header("content-type", "application/json").json(&payload).send().await;
    match res {
        Ok(resp) => {
            let status = resp.status().as_u16();
            let ok = resp.status().is_success();
            let body: Value = resp.json().await.unwrap_or_else(|_| json!({}));
            if !ok {
                return Ok(AiResponse { ok, status, data: body });
            }
            // Normalize Google's response to the Claude-like shape the TS layer expects.
            let text = body
                .pointer("/candidates/0/content/parts/0/text")
                .and_then(|t| t.as_str())
                .unwrap_or("");
            Ok(AiResponse {
                ok: true,
                status,
                data: json!({ "content": [{ "type": "text", "text": text }], "model": model }),
            })
        }
        Err(e) => Err(e.to_string()),
    }
}

async fn send(builder: reqwest::RequestBuilder) -> Result<AiResponse, String> {
    match builder.send().await {
        Ok(resp) => {
            let status = resp.status().as_u16();
            let ok = resp.status().is_success();
            let data: Value = resp.json().await.unwrap_or_else(|_| json!({}));
            Ok(AiResponse { ok, status, data })
        }
        Err(e) => Err(e.to_string()),
    }
}

fn bad_request(message: &str) -> AiResponse {
    AiResponse { ok: false, status: 400, data: json!({ "error": { "message": message } }) }
}

/// Minimal percent-encoding for the Google API key query parameter.
fn urlencoding(s: &str) -> String {
    s.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => (b as char).to_string(),
            _ => format!("%{b:02X}"),
        })
        .collect()
}
