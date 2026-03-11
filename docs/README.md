# UNTIL Documentation

Index of project documentation for developers and AI agents.

---

## Architecture & Design

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Clean architecture, SSOT, data flow, layer boundaries |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Directory layout, naming, where to put new code |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records (ADRs) |

---

## Standards & Patterns

| Doc | Purpose |
|-----|---------|
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | TypeScript, React, naming, error handling |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | Use cases, hooks, subscriptions, local state |

---

## Platform & Features

| Doc | Purpose |
|-----|---------|
| [WIDGETS.md](./WIDGETS.md) | Widget implementation (iOS/Android) |
| [DynamicIslandLiveActivity.md](./DynamicIslandLiveActivity.md) | Live Activity / Dynamic Island setup |
| [ANDROID_RELEASE_BUILD.md](./ANDROID_RELEASE_BUILD.md) | Android release build and signing |
| [PLAY_STORE_ASSETS.md](./PLAY_STORE_ASSETS.md) | Play Store listing assets |

---

## Agent Context

For AI agents: `.cursor/system.md` and `.cursor/rules/` provide persistent context. The system file is always applied; rules load based on file patterns.
