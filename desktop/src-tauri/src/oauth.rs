//! Browser sign-in helpers (RFC 8252). The loopback listener catches Google's
//! redirect; the code exchange runs here because Google's token endpoint is
//! not reachable from the webview (CORS).

use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

const CALLBACK_EVENT: &str = "oauth-callback";
const LISTEN_FOR: Duration = Duration::from_secs(300);

const DONE_PAGE: &str = "<!doctype html><meta charset=utf-8><title>UNTIL</title>\
<body style=\"font-family:system-ui;padding:40px\">\
<p>Signed in. You can close this tab and go back to UNTIL.</p>";

/// Binds 127.0.0.1 on a free port, returns the port, and emits the first
/// callback URL (`http://127.0.0.1:PORT/?code=..&state=..`) as `oauth-callback`.
#[tauri::command]
pub fn oauth_loopback_start(app: AppHandle) -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;

    std::thread::spawn(move || {
        let deadline = Instant::now() + LISTEN_FOR;
        while Instant::now() < deadline {
            let (mut stream, _) = match listener.accept() {
                Ok(conn) => conn,
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(Duration::from_millis(100));
                    continue;
                }
                Err(_) => return,
            };
            let _ = stream.set_nonblocking(false);
            let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));

            let mut buf = [0u8; 8192];
            let n = stream.read(&mut buf).unwrap_or(0);
            let request = String::from_utf8_lossy(&buf[..n]);
            let path = request
                .lines()
                .next()
                .and_then(|line| line.split_whitespace().nth(1))
                .unwrap_or("/");

            if !path.starts_with("/?") {
                let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n");
                continue;
            }

            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                DONE_PAGE.len(),
                DONE_PAGE
            );
            let _ = stream.write_all(response.as_bytes());
            let _ = app.emit(CALLBACK_EVENT, format!("http://127.0.0.1:{port}{path}"));
            crate::show_panel(&app);
            return;
        }
    });

    Ok(port)
}

#[derive(serde::Deserialize)]
struct TokenResponse {
    id_token: Option<String>,
    error: Option<String>,
}

/// Exchanges the authorization code (PKCE) for a Google id token.
#[tauri::command]
pub async fn google_exchange_code(
    client_id: String,
    client_secret: String,
    code: String,
    code_verifier: String,
    redirect_uri: String,
) -> Result<String, String> {
    let response = reqwest::Client::new()
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", code.as_str()),
            ("code_verifier", code_verifier.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .timeout(Duration::from_secs(15))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body: TokenResponse = response.json().await.map_err(|e| e.to_string())?;
    match (body.id_token, body.error) {
        (Some(token), _) => Ok(token),
        (None, Some(error)) => Err(error),
        (None, None) => Err("no id_token in response".into()),
    }
}
