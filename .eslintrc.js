// Layer boundaries from docs/ARCHITECTURE.md and .cursor/rules/architecture.mdc.
// Set to 'warn' while existing violations are paid down; promote to 'error' once clean.
const LAYER_RULE_LEVEL = 'warn';

const forbid = (groups, message) => ({group: groups, message});

const STORAGE = forbid(
  ['**/persistence', '**/persistence/*'],
  'Storage is owned by infrastructure repositories. Go through a use case (via a hook).',
);
const INFRA = forbid(
  ['**/infrastructure', '**/infrastructure/**'],
  'Infrastructure is wired in di.ts only. Go through a use case (via a hook).',
);
const REPOSITORIES = forbid(
  ['**/domain/repository', '**/domain/repository/*'],
  'Repositories are reached through use cases, not directly.',
);
const USE_CASE_CLASSES = forbid(
  ['**/domain/useCases/*'],
  'Import use case instances from di, not the classes.',
);
const DI = forbid(['**/di'], 'Only hooks and app.tsx may import di.');
const CORE = forbid(
  ['**/core/**'],
  'UI must not call core directly (ADR-7). Derive from hook data instead.',
);
const HOOKS = forbid(
  ['**/hooks', '**/hooks/*'],
  'ui/ is presentational: take data via props, not hooks.',
);
const OUTER_LAYERS = forbid(
  [
    '**/persistence',
    '**/persistence/*',
    '**/infrastructure',
    '**/infrastructure/**',
    '**/di',
    '**/hooks',
    '**/hooks/*',
    '**/services/*',
    '**/stores',
    '**/stores/*',
    '**/surfaces/**',
    '**/components/**',
    '**/ui/*',
    'react',
    'react-native',
    'react-native-*',
    '@react-native*/**',
    '@react-native-firebase/*',
    'posthog-react-native',
    '@notifee/*',
  ],
  'core/ and domain/ must stay pure: no React, SDKs, storage or outer layers.',
);

const layer = (files, patterns) => ({
  files,
  rules: {'no-restricted-imports': [LAYER_RULE_LEVEL, {patterns}]},
});

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    layer(
      ['src/surfaces/**', 'src/components/**'],
      [STORAGE, INFRA, REPOSITORIES, USE_CASE_CLASSES, DI, CORE],
    ),
    layer(
      ['src/ui/**'],
      [STORAGE, INFRA, REPOSITORIES, USE_CASE_CLASSES, DI, CORE, HOOKS],
    ),
    layer(['src/hooks/**'], [STORAGE, REPOSITORIES, USE_CASE_CLASSES]),
    // Services may own private storage keys; __tests__/storageKeyOwnership.test.ts
    // guarantees no key is shared with another module.
    layer(['src/services/**'], [DI]),
    layer(['src/stores/**'], [STORAGE, DI]),
    layer(['src/infrastructure/**'], [DI]),
    layer(['src/core/**', 'src/domain/**'], [OUTER_LAYERS]),
    layer(
      ['src/types/**'],
      [forbid(['../*', '!../types'], 'types/ is the lowest layer.')],
    ),
  ],
};
