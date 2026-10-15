//! What the user chose, kept in `settings.json` in the app data folder: the notch island options
//! and which desktop widgets are on, how big, and where.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const FILE: &str = "settings.json";

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(default)]
pub struct WidgetPref {
    pub on: bool,
    /// `small` or `medium`. Empty means the widget's own default.
    pub size: String,
    /// Top-left corner in logical points, once the user has dragged it.
    pub x: Option<f64>,
    pub y: Option<f64>,
}

impl Default for WidgetPref {
    fn default() -> Self {
        Self {
            on: false,
            size: String::new(),
            x: None,
            y: None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(default)]
pub struct Settings {
    /// Show the island in the notch (Macs with a notch).
    pub notch: bool,
    /// While folded, show the countdown and Ember either side of the notch, like the iPhone's
    /// Dynamic Island. Off keeps the folded island to a thin line.
    pub compact: bool,
    /// Keep the desktop widgets above other windows, so they can be seen. Off puts them on the
    /// desktop, behind everything, like the phone's home screen.
    pub widgets_on_top: bool,
    pub widgets: BTreeMap<String, WidgetPref>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            notch: true,
            compact: true,
            widgets_on_top: true,
            widgets: BTreeMap::new(),
        }
    }
}

impl Settings {
    /// Reads settings text. Anything missing or unreadable falls back to the defaults, so a file
    /// written by an older version (only `notch`) still loads.
    pub fn parse(text: &str) -> Self {
        serde_json::from_str(text).unwrap_or_default()
    }
}

pub struct SettingsStore {
    path: Option<PathBuf>,
    inner: Mutex<Settings>,
    dirty: Mutex<bool>,
}

impl SettingsStore {
    pub fn load(app: &AppHandle) -> Self {
        let path = app.path().app_data_dir().ok().map(|dir| dir.join(FILE));
        let settings = path
            .as_ref()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .map(|text| Settings::parse(&text))
            .unwrap_or_default();
        Self {
            path,
            inner: Mutex::new(settings),
            dirty: Mutex::new(false),
        }
    }

    pub fn get(&self) -> Settings {
        self.inner.lock().unwrap().clone()
    }

    /// Change a setting and save it now.
    pub fn update(&self, change: impl FnOnce(&mut Settings)) {
        change(&mut self.inner.lock().unwrap());
        self.write();
    }

    /// Change a setting and save it a moment later. For things that change many times a second,
    /// like a widget being dragged.
    pub fn update_soon(&self, change: impl FnOnce(&mut Settings)) {
        change(&mut self.inner.lock().unwrap());
        *self.dirty.lock().unwrap() = true;
    }

    /// Save a change made with `update_soon`.
    pub fn flush(&self) {
        let mut dirty = self.dirty.lock().unwrap();
        if *dirty {
            *dirty = false;
            drop(dirty);
            self.write();
        }
    }

    fn write(&self) {
        let Some(path) = &self.path else { return };
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        if let Ok(text) = serde_json::to_string_pretty(&*self.inner.lock().unwrap()) {
            let _ = std::fs::write(path, text);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_empty_or_broken_file_gives_the_defaults() {
        assert_eq!(Settings::parse(""), Settings::default());
        assert_eq!(Settings::parse("not json"), Settings::default());
        assert_eq!(Settings::parse("{}"), Settings::default());
    }

    #[test]
    fn the_notch_is_on_and_compact_by_default() {
        let settings = Settings::default();
        assert!(settings.notch);
        assert!(settings.compact);
        assert!(settings.widgets.is_empty());
    }

    #[test]
    fn widgets_float_above_windows_unless_told_otherwise() {
        assert!(Settings::default().widgets_on_top);
        assert!(Settings::parse(r#"{"notch": false}"#).widgets_on_top);
        assert!(!Settings::parse(r#"{"widgets_on_top": false}"#).widgets_on_top);
    }

    #[test]
    fn a_file_from_an_older_version_keeps_its_choice_and_fills_the_rest() {
        let settings = Settings::parse(r#"{"notch": false}"#);
        assert!(!settings.notch);
        assert!(settings.compact);
    }

    #[test]
    fn widget_choices_round_trip() {
        let mut settings = Settings::default();
        settings.widgets.insert(
            "day".into(),
            WidgetPref {
                on: true,
                size: "medium".into(),
                x: Some(120.5),
                y: Some(64.0),
            },
        );
        let text = serde_json::to_string(&settings).unwrap();
        assert_eq!(Settings::parse(&text), settings);
    }

    #[test]
    fn a_widget_missing_fields_is_off_and_unplaced() {
        let settings = Settings::parse(r#"{"widgets": {"year": {"on": true}}}"#);
        let year = &settings.widgets["year"];
        assert!(year.on);
        assert_eq!(year.size, "");
        assert_eq!(year.x, None);
    }
}
