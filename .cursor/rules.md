# UNTIL — Cursor Rules

Rules in `.cursor/rules/` provide persistent AI guidance. They are loaded automatically based on file patterns and `alwaysApply` settings.

## Rule Files

| Rule | Scope | Purpose |
|------|-------|---------|
| `architecture.mdc` | always | Clean architecture, SSOT, layer boundaries |
| `human-copy.mdc` | always | No AI-slop voice in user-facing copy |
| `typescript-standards.mdc` | `**/*.ts`, `**/*.tsx` | TypeScript conventions, imports, error handling |
| `react-patterns.mdc` | `**/*.tsx` | Components, hooks, no direct storage/core |
| `state-management.mdc` | `**/hooks/**`, `**/ui/**` | Use cases, subscriptions, useState usage |
| `monetization.mdc` | paywall / pricing files | Pricing, paywall, entitlement rules |

## Quick Reference

- **UI** → Use hooks from the feature's `hooks/`; never import `data`, `shared/persistence`, `app/di`, or repositories directly
- **New use case** → Add to `features/<f>/domain/useCases/`, wire in `app/di/<f>.ts`, create hook in `features/<f>/hooks/`
- **Another feature** → import its `index.ts` only (or `domain/index.ts` from domain/data/services); the allowed edges are in `__tests__/architecture.test.ts`
- **Storage** → Keys in `shared/persistence/schema.ts`; implementations in `features/<f>/data/`
- **Types** → Define in `shared/types/index.ts`; the widget data contract is `shared/types/widgetDataContract.ts`
