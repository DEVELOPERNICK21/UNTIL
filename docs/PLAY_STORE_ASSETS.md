# Google Play Store — Assets Checklist

Use this to fix the “Some languages have errors” and “Upload at least 2 phone or tablet screenshots” messages in Play Console.

---

## 1. App icon (required)

| Requirement | Value |
|-------------|--------|
| **Format** | PNG or JPEG |
| **Size** | **512 × 512 px** |
| **Max file size** | 1 MB |

**Status:** Your app uses launcher icons in `android/app/src/main/res/mipmap-*` (largest is **192×192** in `mipmap-xxxhdpi`). Play Store needs a **separate** 512×512 image.

**What to do:** Export a **512×512** version of your Until icon (same design as the launcher) and upload it in the “App icon” slot. Do not upscale the 192×192 PNG; use your source asset (e.g. Figma/Sketch) at 512×512.

---

## 2. Feature graphic (required)

| Requirement | Value |
|-------------|--------|
| **Dimensions** | **1024 × 500 px** |
| **Format** | PNG or JPEG (32-bit PNG, no alpha) |

**Status:** Not in repo. You need to create this once (brand strip / “Until: Days left” etc.) and upload it in the “Feature graphic” slot.

---

## 3. Phone screenshots (required)

| Requirement | Value |
|-------------|--------|
| **Count** | **At least 2**, up to 8 |
| **Format** | PNG or JPEG |
| **Max file size** | 8 MB per image |
| **Aspect ratio** | **16:9** or **9:16** |
| **Dimensions** | Each side **320 px – 3,840 px** |

**For promotion:** At least **4 screenshots**, minimum **1,080 px** on the shortest side (e.g. 1080×1920 for 9:16).

**Status:** None in repo. Capture 2–8 screens from the app (e.g. Home, Life, Widgets, Countdowns) on a phone or emulator, then upload under “Phone” → “Phone screenshots”.

**Suggested sizes:**  
- **9:16 (portrait):** 1080 × 1920 px  
- **16:9 (landscape):** 1920 × 1080 px  

---

## 4. Tablet screenshots (optional)

- **7-inch** and **10-inch** each allow up to 8 screenshots.
- Same rules: PNG/JPEG, up to 8 MB, 16:9 or 9:16, 320–3,840 px per side.
- If you don’t upload tablet screenshots, Play may use your phone screenshots or show a default; you can leave these empty if the app is phone-first.

---

## 5. Quick fix order

1. **App icon** — Export 512×512 from your icon source; upload in Graphics.
2. **Feature graphic** — Create 1024×500; upload in Graphics.
3. **Phone screenshots** — Capture 2–8 screens (9:16 or 16:9, e.g. 1080×1920); upload under Phone.

After these three are done, the main store listing errors for “Default - English” should be resolved. Then fix any other languages or contact/description fields as needed.
