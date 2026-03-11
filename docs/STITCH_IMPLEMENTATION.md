# Stitch Design → UNTIL Implementation Guide

How to fetch Stitch designs and implement them in the React Native app.

---

## 1. Stitch MCP Setup (for Cursor/agents)

Add the Stitch MCP to Cursor so agents can fetch designs directly.

**Edit** `~/.cursor/mcp.json` (or Cursor Settings → MCP):

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"]
    }
  }
}
```

**One-time auth:**

```bash
npx @_davideast/stitch-mcp init
```

Follow the wizard (Google Cloud OAuth, project selection). Or use an API key:

```bash
export STITCH_API_KEY="your-api-key"
```

**Verify:**

```bash
npx @_davideast/stitch-mcp doctor
```

---

## 2. Fetch Screens via CLI (without MCP)

If the MCP isn’t configured, use the fetch script:

```bash
# One-time auth
npx @_davideast/stitch-mcp init

# Fetch all screens (code + images)
node scripts/stitch-fetch.js
```

Output goes to `stitch-output/`:

```
stitch-output/
├── code/
│   ├── HomeTimeProgress.html
│   ├── Settings.html
│   ├── CountdownTimers.html
│   └── ...
└── images/
    ├── HomeTimeProgress.png
    ├── Settings.png
    └── ...
```

---

## 3. Project & Screen IDs

| Screen            | Screen ID                              | UNTIL File              |
|-------------------|----------------------------------------|-------------------------|
| Home - Time Progress | `307e23b60a9549769100aa1930168a38` | `HomeScreen.tsx`        |
| Settings          | `7972a8c5b83c4c3e9b9a8612e29cc2dc` | `SettingsScreen.tsx`     |
| Countdown Timers  | `2ad5e8a97377474baa3f1bcbec4aba42` | `CountdownsScreen.tsx`   |
| Hour Calculation  | `2b5cba9aff6b4a01ac1ac022d33c9b9e` | `HourCalculationScreen.tsx` |
| Custom Counters   | `8b737491c2024314afc5a978e616027e` | `CustomCountersScreen.tsx` |
| Life Visualization| `ac6960cce00d49eb8bb14d2f422e3088` | `LifeScreen.tsx`        |
| Monthly Goals     | `bf4a7cd0b0e14670b3fd0a4903d7b8f1` | `MonthlyGoalsScreen.tsx` |
| Screenshot        | `e474da70-094e-4231-a619-b4c5aa52cc5b` | —                    |

**Project ID:** `1707733117784992041`

---

## 4. Implementing Stitch HTML/CSS in React Native

Stitch exports **HTML/CSS**. UNTIL is **React Native**. Use the designs as reference, not direct code.

### Workflow

1. **Use images as reference** — `stitch-output/images/*.png` for layout and hierarchy.
2. **Use HTML for structure** — Inspect `stitch-output/code/*.html` for sections, labels, and order.
3. **Map to RN components** — Use `ui/Text`, `ui/Card`, `ui/ProgressLine`, etc.
4. **Apply theme tokens** — `Colors`, `Spacing`, `Typography`, `getProgressColor` from `theme/`.

### Mapping Stitch → React Native

| Stitch (HTML/CSS) | UNTIL (React Native) |
|-------------------|------------------------|
| `<div>` sections  | `<View>` with `StyleSheet` |
| Text blocks       | `<Text variant="…" color="…">` |
| Cards / panels    | `<Card>` from `ui/Card` |
| Progress bars     | `<ProgressLine>` or `<ProgressBar>` + `getProgressColor(progress)` |
| Colors            | `Colors.textPrimary`, `Colors.background`, etc. |
| Spacing           | `Spacing.md`, `Spacing.lg`, etc. |
| Flexbox           | `flexDirection`, `alignItems`, `justifyContent` |

### Design constraints

- **Colors:** Near-black monochrome (`#0E0E10`, `#EDEDED`, `#9A9A9A`).
- **Progress:** Green → amber → red via `getProgressColor(progress)`.
- **Typography:** Use `Text` variants (`title`, `body`, `label`, `primaryValue`, etc.).
- **Layout:** `ScrollView` for long screens, `SafeAreaView` for notches.

---

## 5. Screen-by-Screen Checklist

When updating a screen from Stitch:

- [ ] Compare Stitch image with current screen.
- [ ] Identify new sections, labels, and order.
- [ ] Replace/adjust layout in the corresponding `*Screen.tsx`.
- [ ] Use `theme` tokens only (no hardcoded colors).
- [ ] Use `ui/` components (Text, Card, ProgressLine, etc.).
- [ ] Keep data flow via hooks (no direct repo imports).

---

## 6. Manual Fetch (single screen)

```bash
# Get HTML for Home screen
npx @_davideast/stitch-mcp tool get_screen_code -d '{"projectId": "1707733117784992041", "screenId": "307e23b60a9549769100aa1930168a38"}'

# Get image (base64)
npx @_davideast/stitch-mcp tool get_screen_image -d '{"projectId": "1707733117784992041", "screenId": "307e23b60a9549769100aa1930168a38"}'
```

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| "Permission Denied" | Enable Stitch API, billing, and Owner/Editor role in GCP. |
| Auth URL not showing | Check terminal for OAuth URL; open manually if needed. |
| MCP "stitch" not found | Add config to `~/.cursor/mcp.json` and restart Cursor. |
| Empty fetch output | Run `npx @_davideast/stitch-mcp init` and re-auth. |
