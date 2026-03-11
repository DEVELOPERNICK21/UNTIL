# UNTIL — Coding Standards

Standards for TypeScript, React, and project conventions to ensure consistency and maintainability.

---

## TypeScript

### Imports

- Prefer `import type` for type-only imports:
  ```typescript
  import type { UserProfile } from '../types';
  ```
- Order: external packages first, then internal (`di`, `hooks`, `ui`, `theme`, `types`)
- Use path aliases if configured; otherwise relative paths from `src/`

### Types and Interfaces

- Define shared DTOs in `src/types/index.ts`
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
- Use design system components from `ui/` (Text, Card, ProgressLine, etc.)
- Use theme tokens: `Colors`, `Spacing`, `Typography`, `getProgressColor` from `theme/`

### Data Access

- **Screens**: Use hooks only; never import use cases or repositories directly
- **Hooks**: Import use cases from `di`; optionally call `syncWidgetCache()` etc. from `infrastructure` when data changes

### Hooks

- Extract reusable logic into custom hooks in `hooks/`
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
- Colocate related types with the module or in `types/index.ts` if shared
- Keep files under ~300 lines; split into smaller modules if larger

---

## Testing

- Place tests in `__tests__/` or colocate with `*.test.ts(x)`
- Use Jest; prefer integration tests for critical flows
- Mock `di` use cases in unit tests
