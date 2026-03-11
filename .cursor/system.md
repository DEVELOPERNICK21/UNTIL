# UNTIL — Agent System Context

This document provides persistent context for AI agents working on the UNTIL project. Always apply this context when making changes.

## Project Overview

**UNTIL** is a React Native time-progress app ("days left") with:
- Clean architecture and Single Source of Truth (SSOT)
- Cross-platform: iOS, Android
- Native widgets (Swift/Kotlin), Live Activity, Android overlay
- MMKV for persistence; no cloud backend

## Core Principles

1. **Clean Architecture** — Core (pure logic) → Domain (ports/use cases) → Infrastructure (repos) → Surfaces (UI)
2. **SSOT** — One place for each concern: TimeRepository for time/profile, `theme/progressColor` for progress colors, `types/` for DTOs
3. **Composition Root** — All wiring in `di.ts`; UI only imports from `di` and `hooks`
4. **No Cross-Layer Imports** — Surfaces never import from `core` or `persistence` for business data; use use cases via hooks

## Key Paths

| Concern | Location |
|---------|----------|
| Composition root | `src/di.ts` |
| Types (DTOs) | `src/types/index.ts` |
| Storage keys | `src/persistence/schema.ts` |
| Time logic | `src/core/time/*` |
| Use cases | `src/domain/useCases/*` |
| Repositories (interfaces) | `src/domain/repository/*` |
| Hooks (React bindings) | `src/hooks/*` |
| Screens | `src/surfaces/app/*` |
| Reusable UI | `src/ui/*` |
| Theme | `src/theme/*` |

## Before Making Changes

- **New feature?** Add use case → hook → screen. Wire in `di.ts`.
- **New storage key?** Add to `persistence/schema.ts`; document if widgets use it.
- **New time metric?** Add to `core/time/*`; TimeRepository and MmkvTimeRepository consume it.
- **New widget?** Follow `docs/WIDGETS.md`; add provider, layout, manifest, worker.

## Documentation

- `docs/ARCHITECTURE.md` — Clean architecture, data flow, SSOT
- `docs/FOLDER_STRUCTURE.md` — Directory layout and conventions
- `docs/CODING_STANDARDS.md` — TypeScript, React, naming
- `docs/STATE_MANAGEMENT.md` — Hooks, use cases, subscriptions
- `docs/DECISIONS.md` — Architecture Decision Records
- `docs/WIDGETS.md` — Widget implementation guide
