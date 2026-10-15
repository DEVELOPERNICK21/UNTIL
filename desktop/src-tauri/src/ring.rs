//! Menu bar / tray glyph: a ring that fills clockwise from 12 o'clock as the
//! day passes. Mac uses it as a template image (the system tints it); Windows
//! gets the progress color because the tray cannot show text.

use std::f64::consts::TAU;

pub struct RingStyle {
    pub fill: [u8; 3],
    pub track: [u8; 3],
    pub track_alpha: f64,
}

#[cfg(target_os = "macos")]
pub const TEMPLATE: RingStyle = RingStyle {
    fill: [0, 0, 0],
    track: [0, 0, 0],
    track_alpha: 0.3,
};

#[cfg(not(target_os = "macos"))]
pub fn colored(fill: [u8; 3]) -> RingStyle {
    RingStyle {
        fill,
        track: [150, 150, 150],
        track_alpha: 0.45,
    }
}

/// RGBA pixels, `size` x `size`. `progress` None draws only the track.
pub fn draw(size: u32, progress: Option<f64>, style: &RingStyle) -> Vec<u8> {
    let s = size as f64;
    let center = s / 2.0;
    let thickness = (s * 0.16).max(2.0);
    let radius = center - thickness / 2.0 - s * 0.06;
    let filled_to = progress.map(|p| p.clamp(0.0, 1.0));

    let mut rgba = vec![0u8; (size * size * 4) as usize];
    for y in 0..size {
        for x in 0..size {
            let dx = x as f64 + 0.5 - center;
            let dy = y as f64 + 0.5 - center;
            let dist = (dx * dx + dy * dy).sqrt();
            let coverage = (thickness / 2.0 - (dist - radius).abs() + 0.5).clamp(0.0, 1.0);
            if coverage == 0.0 {
                continue;
            }
            let mut angle = dx.atan2(-dy);
            if angle < 0.0 {
                angle += TAU;
            }
            let filled = filled_to.is_some_and(|p| angle / TAU <= p);
            let (rgb, alpha) = if filled {
                (style.fill, 1.0)
            } else {
                (style.track, style.track_alpha)
            };
            let i = ((y * size + x) * 4) as usize;
            rgba[i..i + 3].copy_from_slice(&rgb);
            rgba[i + 3] = (coverage * alpha * 255.0).round() as u8;
        }
    }
    rgba
}

#[cfg(not(target_os = "macos"))]
pub fn parse_hex(hex: &str) -> Option<[u8; 3]> {
    let h = hex.trim_start_matches('#');
    if h.len() != 6 {
        return None;
    }
    let byte = |i: usize| u8::from_str_radix(&h[i..i + 2], 16).ok();
    Some([byte(0)?, byte(2)?, byte(4)?])
}
