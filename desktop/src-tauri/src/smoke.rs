//! A self-test for a real machine. Started with `UNTIL_SMOKE_TEST=1`, the app turns every desktop
//! widget on from a background thread (the way the panel does), checks each window exists and is
//! visible, writes `smoke.txt` in the app data folder and quits with 0 (all good) or 1.
//!
//! It exists because creating a window from the wrong thread hangs the app on Windows, which no
//! unit test can catch. The release workflow runs it on a Windows machine after the build. A hang
//! shows up as the app never quitting, so the workflow gives it a minute.

use std::collections::HashSet;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

use crate::widgets;

/// The windows whose page has loaded and run its script. A window can exist and be visible while
/// its page is blank or broken (a blocked script, a failed IPC call), so each page says "ready"
/// once it has started, and the smoke test waits for that.
#[derive(Default)]
pub struct PagesReady(pub Mutex<HashSet<String>>);

impl PagesReady {
    pub fn mark(&self, label: &str) {
        self.0.lock().unwrap().insert(label.to_string());
    }

    fn has(&self, label: &str) -> bool {
        self.0.lock().unwrap().contains(label)
    }
}

fn wait_for_pages(app: &AppHandle, labels: &[String], limit: Duration) {
    let ready = app.state::<PagesReady>();
    let start = Instant::now();
    while start.elapsed() < limit && !labels.iter().all(|l| ready.has(l)) {
        std::thread::sleep(Duration::from_millis(250));
    }
}

pub fn maybe_run(app: AppHandle) {
    if std::env::var_os("UNTIL_SMOKE_TEST").is_none() {
        return;
    }
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(4));
        for kind in widgets::KINDS {
            widgets::set_open(&app, kind, true);
        }
        let mut labels: Vec<String> = widgets::KINDS.iter().map(|k| widgets::window_label(k)).collect();
        labels.push("panel".to_string());
        // The island exists only where there is one (Windows, and a Mac with a notch).
        let island = app.get_webview_window("notch").is_some();
        if island {
            labels.push("notch".to_string());
        }
        wait_for_pages(&app, &labels, Duration::from_secs(25));

        let ready = app.state::<PagesReady>();
        let mut report = String::new();
        let mut ok = true;
        for kind in widgets::KINDS {
            let label = widgets::window_label(kind);
            let window = app.get_webview_window(&label);
            let visible = window
                .as_ref()
                .map(|w| w.is_visible().unwrap_or(false))
                .unwrap_or(false);
            let rendered = ready.has(&label);
            ok &= visible && rendered;
            report.push_str(&format!(
                "widget {kind}: {}, page {}\n",
                if visible { "visible" } else { "MISSING" },
                if rendered { "ran" } else { "DID NOT RUN" }
            ));
        }
        for label in ["panel", "notch"] {
            if label == "notch" && !island {
                report.push_str("island: none on this machine\n");
                continue;
            }
            let rendered = ready.has(label);
            ok &= rendered;
            report.push_str(&format!(
                "{label}: page {}\n",
                if rendered { "ran" } else { "DID NOT RUN" }
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
