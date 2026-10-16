//! A self-test for a real machine. Started with `UNTIL_SMOKE_TEST=1`, the app turns every desktop
//! widget on from a background thread (the way the panel does), checks each window exists and is
//! visible, writes `smoke.txt` in the app data folder and quits with 0 (all good) or 1.
//!
//! It exists because creating a window from the wrong thread hangs the app on Windows, which no
//! unit test can catch. The release workflow runs it on a Windows machine after the build. A hang
//! shows up as the app never quitting, so the workflow gives it a minute.

use std::time::Duration;

use tauri::{AppHandle, Manager};

use crate::widgets;

pub fn maybe_run(app: AppHandle) {
    if std::env::var_os("UNTIL_SMOKE_TEST").is_none() {
        return;
    }
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(4));
        for kind in widgets::KINDS {
            widgets::set_open(&app, kind, true);
        }
        std::thread::sleep(Duration::from_secs(4));

        let mut report = String::new();
        let mut ok = true;
        for kind in widgets::KINDS {
            let window = app.get_webview_window(&widgets::window_label(kind));
            let visible = window
                .as_ref()
                .map(|w| w.is_visible().unwrap_or(false))
                .unwrap_or(false);
            ok &= visible;
            report.push_str(&format!(
                "widget {kind}: {}\n",
                if visible { "visible" } else { "MISSING" }
            ));
        }
        report.push_str(if ok { "result: ok\n" } else { "result: FAILED\n" });

        if let Ok(dir) = app.path().app_data_dir() {
            let _ = std::fs::create_dir_all(&dir);
            let _ = std::fs::write(dir.join("smoke.txt"), &report);
        }
        app.exit(if ok { 0 } else { 1 });
    });
}
