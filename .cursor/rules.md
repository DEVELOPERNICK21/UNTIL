# UNTIL — Cursor Rules

Rules in `.cursor/rules/` provide persistent AI guidance. They are loaded automatically based on file patterns and `alwaysApply` settings.

## Rule Files

| Rule | Scope | Purpose |
|------|-------|---------|
| `architecture.mdc` | always | Clean architecture, SSOT, layer boundaries |
| `typescript-standards.mdc` | `**/*.ts`, `**/*.tsx` | TypeScript conventions, imports, error handling |
| `react-patterns.mdc` | `**/*.tsx` | Components, hooks, no direct storage/core |
| `state-management.mdc` | `**/hooks/**`, `**/surfaces/**` | Use cases, subscriptions, useState usage |

## Quick Reference

- **UI** → Use hooks from `hooks/`; never import `core`, `persistence`, or repositories directly
- **New use case** → Add to `domain/useCases/`, wire in `di.ts`, create hook in `hooks/`
- **Storage** → Keys in `persistence/schema.ts`; implementations in `infrastructure/repositories/`
- **Types** → Define in `types/index.ts`; re-export in `surfaces/widgets/dataContract` for widgets
