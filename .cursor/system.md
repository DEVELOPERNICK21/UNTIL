# UNTIL — Agent System Context

This document provides persistent context for AI agents working on the UNTIL project. Always apply this context when making changes.

## Project Overview

**UNTIL** is a React Native time-progress app ("days left") with:
- Clean architecture and Single Source of Truth (SSOT)
- Cross-platform: iOS, Android; desktop companion (macOS, Windows) in `desktop/`
- Native widgets (Swift/Kotlin), Live Activity, Android overlay
- MMKV for persistence; no cloud backend

## Core Principles

1. **Feature-Based + Pragmatic Clean Architecture** — `src/app` (composition root, navigation, shell), `src/features/<f>/{domain,data,services,hooks,ui}` (one product capability each), `src/shared` (kernel, knows no feature)
2. **SSOT** — One place for each concern: TimeRepository for time/profile, `shared/theme/progressColor` for progress colors, `shared/types` for DTOs
3. **Composition Root** — All wiring in `src/app/di/` (one file per feature); only hooks import it
4. **Dependency control** — Features meet only at public APIs (`features/<f>/index.ts`, or `domain/index.ts` for pure code) along the acyclic table in `__tests__/architecture.test.ts`; `shared/` never imports a feature; screens never import `data`, storage or pure domain logic

## Key Paths

| Concern | Location |
|---------|----------|
| Composition root | `src/app/di/*` |
| Types (DTOs) | `src/shared/types/index.ts` |
| Storage keys | `src/shared/persistence/schema.ts` |
| Time logic | `src/shared/time/*` |
| Use cases | `src/features/<f>/domain/useCases/*` |
| Ports (interfaces) | `src/features/<f>/domain/ports/*` |
| Hooks (React bindings) | `src/features/<f>/hooks/*` |
| Screens | `src/features/<f>/ui/*` |
| Reusable UI | `src/shared/ui/*` |
| Theme | `src/shared/theme/*` |
| Feature dependency table | `__tests__/architecture.test.ts` (`FEATURE_DEPENDENCIES`) |

## Before Making Changes

- **New feature?** Folder under `features/`, a row in the dependency table, a section in `app/di/`. Add use case → hook → screen inside it.
- **New storage key?** Add to `shared/persistence/schema.ts`; one owning module; document if widgets use it.
- **New time metric?** Add to `shared/time/*`; TimeRepository and MmkvTimeRepository consume it.
- **New widget?** Follow `docs/WIDGETS.md`; add provider, layout, manifest, worker.

## Documentation

- `docs/ARCHITECTURE.md` — Feature-based + clean architecture, dependency table, data flow, SSOT
- `docs/FOLDER_STRUCTURE.md` — Directory layout and conventions
- `docs/CODING_STANDARDS.md` — TypeScript, React, naming
- `docs/STATE_MANAGEMENT.md` — Hooks, use cases, subscriptions
- `docs/DECISIONS.md` — Architecture Decision Records
- `docs/WIDGETS.md` — Widget implementation guide
