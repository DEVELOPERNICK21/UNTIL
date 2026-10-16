# UNTIL — Coding Standards

Standards for TypeScript, React, and project conventions to ensure consistency and maintainability.

---

## TypeScript

### Imports

- Prefer `import type` for type-only imports:
  ```typescript
  import type { UserProfile } from '../../../shared/types';
  ```
- Order: external packages first, then internal (same feature, then `shared`, then other features)
- Relative paths; there are no path aliases. Inside a feature, import files directly. To another feature, import its public API only:
  ```typescript
  import { useAccessControl } from '../../premium';        // ui / hooks / app
  import { hasPremiumBundle } from '../../premium/domain'; // domain / data / services only
  ```
- Never import a feature's `index.ts` from inside that same feature (it creates cycles); never deep-import another feature (the architecture test fails)

### Types and Interfaces

- Define shared DTOs in `src/shared/types/index.ts`; feature-private types stay in the feature
- Use `interface` for object shapes; `type` for unions and aliases
- Avoid `any`; use `unknown` and narrow with type guards when needed
- Export types that are used across layers

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Use case class | `XxxUseCase` | `ObserveTimeStateUseCase` |
| Repository interface | `IXxxRepository` | `ITimeRepository` |
| Repository impl | `MmkvXxxRepository` | `MmkvTimeRepository` |
| Hook | `useXxx` | `useObserveTimeState` |
| Screen | `XxxScreen` | `HomeScreen` |
| Component | `PascalCase` | `ProgressLine` |
| Constant | `UPPER_SNAKE` or `camelCase` for config | `STORAGE_KEYS`, `POLL_INTERVAL_MS` |

---

## React

### Components

- Functional components only
- Use design system components from `shared/ui/` (Text, Card, ProgressLine, etc.)
- Use theme tokens: `Colors`, `Spacing`, `Typography`, `getProgressColor` from `shared/theme/`

### Data Access

- **Screens** (`ui/`): Use hooks only; never import use cases, repositories, `data/` or `app/di` directly
- **Hooks**: Import use-case instances from `app/di`. To refresh widgets after a change call `widgetSync` from `shared/platform/widgetSync`; do not import the widgets feature

### Hooks

- Extract reusable logic into custom hooks in the feature's `hooks/` (or `shared/hooks/` if no feature owns it)
- Follow the observe/subscribe pattern for reactive data (see `docs/STATE_MANAGEMENT.md`)

---

## Error Handling

```typescript
// ❌ BAD — swallow errors
try {
  await fetchData();
} catch (e) {}

// ✅ GOOD — log or rethrow with context
try {
  await fetchData();
} catch (e) {
  console.error('Failed to fetch', e);
  throw new Error('Unable to load data', { cause: e });
}
```

---

## Formatting

- Use Prettier (project default)
- 2-space indentation
- Semicolons
- Double quotes for strings (unless template literals)

---

## File Organization

- One component/hook/use case per file
- Colocate related types with the module or in `shared/types/index.ts` if shared
- Keep files under ~300 lines; split into smaller modules if larger. The architecture test rejects new files over 300 lines and any growth of the legacy long files listed in `LEGACY_OVERSIZE`

---

## Testing

- Place tests in `__tests__/`
- Use Jest; prefer integration tests for critical flows
- Test domain code by importing the file directly; it loads nothing heavy
- Test a screen by mocking the *public API* of the features it uses (`jest.mock('../src/features/ember', …)`), and its hooks by file; do not let a test load `app/di` unless it is the composition-root test
