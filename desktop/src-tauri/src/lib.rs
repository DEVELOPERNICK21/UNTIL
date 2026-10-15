use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime, WindowEvent,
};

const TRAY_ID: &str = "until-extra";
const PANEL: &str = "panel";

fn toggle_panel<R: Runtime>(app: &AppHandle<R>) {
    let Some(panel) = app.get_webview_window(PANEL) else {
        return;
    };
    if panel.is_visible().unwrap_or(false) {
        let _ = panel.hide();
    } else {
        let _ = panel.show();
        let _ = panel.set_focus();
    }
}

/// Mac shows `text` in the menu bar. Windows has no tray text, so it shows the
/// `png` glyph (percent or dash, drawn by the panel) with `text` as tooltip.
#[tauri::command]
fn set_extra(app: AppHandle, text: String, png: Option<Vec<u8>>) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("missing tray")?;
    tray.set_tooltip(Some(&text)).map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    {
        let _ = png;
        tray.set_title(Some(&text)).map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    if let Some(bytes) = png {
        let icon = tauri::image::Image::from_bytes(&bytes).map_err(|e| e.to_string())?;
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let quit = MenuItemBuilder::with_id("quit", "Quit UNTIL").build(app)?;
            let menu = MenuBuilder::new(app).item(&quit).build()?;

            let builder = TrayIconBuilder::with_id(TRAY_ID)
                .tooltip("—")
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
                        ..
                    } = event
                    {
                        toggle_panel(tray.app_handle());
                    }
                });

            #[cfg(target_os = "macos")]
            let builder = builder.title("—");

            #[cfg(not(target_os = "macos"))]
            let builder = match app.default_window_icon() {
                Some(icon) => builder.icon(icon.clone()),
                None => builder,
            };

            builder.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![set_extra])
        .run(tauri::generate_context!())
        .expect("error while running UNTIL desktop");
}
