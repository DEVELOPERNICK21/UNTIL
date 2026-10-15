use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, Rect, Runtime, WebviewWindow, WindowEvent,
};

mod oauth;
mod ring;

const TRAY_ID: &str = "until-extra";
const PANEL: &str = "panel";
const PANEL_GAP: f64 = 6.0;
const SCREEN_MARGIN: f64 = 8.0;

#[cfg(target_os = "macos")]
const RING_PX: u32 = 36;
#[cfg(not(target_os = "macos"))]
const RING_PX: u32 = 32;

/// When the panel last hid because it lost focus. Clicking the tray icon to
/// close an open panel first blurs it; without this the click would reopen it.
#[derive(Default)]
struct PanelState {
    blurred_at: Mutex<Option<Instant>>,
}

pub(crate) fn show_panel<R: Runtime>(app: &AppHandle<R>) {
    if let Some(panel) = app.get_webview_window(PANEL) {
        let _ = panel.show();
        let _ = panel.set_focus();
    }
}

/// Drops the panel below the menu bar icon (Mac, top-edge taskbars) or above
/// the tray icon (Windows bottom taskbar), kept inside the screen.
fn place_panel<R: Runtime>(panel: &WebviewWindow<R>, icon: &Rect) {
    let Ok(Some(monitor)) = panel.current_monitor() else {
        return;
    };
    let scale = monitor.scale_factor();
    let pos = icon.position.to_physical::<f64>(scale);
    let size = icon.size.to_physical::<f64>(scale);
    let Ok(win) = panel.outer_size() else {
        return;
    };
    let (win_w, win_h) = (win.width as f64, win.height as f64);
    let screen_pos = monitor.position();
    let screen = monitor.size();
    let (left, top) = (screen_pos.x as f64, screen_pos.y as f64);
    let (right, bottom) = (left + screen.width as f64, top + screen.height as f64);
    let margin = SCREEN_MARGIN * scale;
    let gap = PANEL_GAP * scale;

    let x = (pos.x + size.width / 2.0 - win_w / 2.0).clamp(left + margin, right - win_w - margin);
    let icon_in_top_half = pos.y < top + (bottom - top) / 2.0;
    let y = if icon_in_top_half {
        pos.y + size.height + gap
    } else {
        pos.y - win_h - gap
    };
    let _ = panel.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
}

fn on_tray_click<R: Runtime>(app: &AppHandle<R>, icon: &Rect) {
    let Some(panel) = app.get_webview_window(PANEL) else {
        return;
    };
    let just_blurred = app
        .state::<PanelState>()
        .blurred_at
        .lock()
        .ok()
        .and_then(|t| *t)
        .is_some_and(|t| t.elapsed() < Duration::from_millis(250));
    if just_blurred {
        return;
    }
    if panel.is_visible().unwrap_or(false) {
        let _ = panel.hide();
    } else {
        place_panel(&panel, icon);
        let _ = panel.show();
        let _ = panel.set_focus();
    }
}

/// Mac: template ring + `text` as the menu bar title. Windows: colored ring,
/// `text` as tooltip (the tray has no text).
#[tauri::command]
fn set_extra(
    app: AppHandle,
    text: String,
    progress: Option<f64>,
    color: Option<String>,
) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("missing tray")?;
    tray.set_tooltip(Some(format!("UNTIL · {text}")))
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    {
        let _ = color;
        let pixels = ring::draw(RING_PX, progress, &ring::TEMPLATE);
        tray.set_icon(Some(Image::new_owned(pixels, RING_PX, RING_PX)))
            .map_err(|e| e.to_string())?;
        tray.set_icon_as_template(true).map_err(|e| e.to_string())?;
        tray.set_title(Some(&text)).map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let fill = color
            .as_deref()
            .and_then(ring::parse_hex)
            .unwrap_or([237, 237, 237]);
        let pixels = ring::draw(RING_PX, progress, &ring::colored(fill));
        tray.set_icon(Some(Image::new_owned(pixels, RING_PX, RING_PX)))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Must be the first plugin. A second launch (including an until-desktop://
    // link on Windows) is forwarded here and the deep-link plugin re-emits it.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
        show_panel(app);
    }));

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .manage(PanelState::default())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Mac registers the scheme from the bundle's Info.plist; Windows and
            // Linux dev builds register at runtime.
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |_event| show_panel(&handle));
            }

            let quit = MenuItemBuilder::with_id("quit", "Quit UNTIL").build(app)?;
            let menu = MenuBuilder::new(app).item(&quit).build()?;

            #[cfg(target_os = "macos")]
            let track = ring::draw(RING_PX, None, &ring::TEMPLATE);
            #[cfg(not(target_os = "macos"))]
            let track = ring::draw(RING_PX, None, &ring::colored([237, 237, 237]));
            let builder = TrayIconBuilder::with_id(TRAY_ID)
                .icon(Image::new_owned(track, RING_PX, RING_PX))
                .tooltip("UNTIL")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id() == "quit" {
                        app.exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        on_tray_click(tray.app_handle(), &rect);
                    }
                });

            #[cfg(target_os = "macos")]
            let builder = builder.icon_as_template(true).title("—");

            builder.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.hide();
            }
            WindowEvent::Focused(false) if window.label() == PANEL => {
                if let Ok(mut at) = window.state::<PanelState>().blurred_at.lock() {
                    *at = Some(Instant::now());
                }
                let _ = window.hide();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            set_extra,
            quit_app,
            oauth::oauth_loopback_start,
            oauth::google_exchange_code
        ])
        .run(tauri::generate_context!())
        .expect("error while running UNTIL desktop");
}
