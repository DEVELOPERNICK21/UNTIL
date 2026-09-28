// Layer boundaries from docs/ARCHITECTURE.md and .cursor/rules/architecture.mdc.
// Violations fail lint.
const LAYER_RULE_LEVEL = 'error';

const forbid = (groups, message, extra = {}) => ({
  group: groups,
  message,
  ...extra,
});
// Outer layers may use domain *types* (DTOs, results); only runtime access must go via di.
const TYPES_OK = {allowTypeImports: true};

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
  TYPES_OK,
);
const USE_CASE_CLASSES = forbid(
  ['**/domain/useCases/*'],
  'Import use case instances from di, not the classes.',
  TYPES_OK,
);
const DI = forbid(['**/di'], 'Only hooks and app.tsx may import di.');
// ADR-7: UI may use core/time/clock (calendar parse/format) for display only.
const fs = require('fs');
const path = require('path');
const CORE_MESSAGE =
  'UI must not call core directly (ADR-7). Derive from hook data instead.';
const CORE_DIRS = fs
  .readdirSync(path.join(__dirname, 'src/core'), {withFileTypes: true})
  .filter(d => d.isDirectory())
  .map(d => d.name);
// ADR-7: UI may use core/time/clock (calendar parse/format) for display only.
// Globs cover files inside core folders; a glob on the folder itself would also
// swallow the clock exception, so bare folder imports are listed as exact paths.
const CORE = forbid(
  [...CORE_DIRS.map(dir => `**/core/${dir}/*`), '!**/core/time/clock'],
  CORE_MESSAGE,
);
const CORE_FOLDER_PATHS = ['', ...CORE_DIRS.map(dir => `/${dir}`)].flatMap(
  dir =>
    ['../', '../../', '../../../'].map(up => ({
      name: `${up}core${dir}`,
      message: CORE_MESSAGE,
    })),
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
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      LAYER_RULE_LEVEL,
      {
        patterns,
        paths: patterns.includes(CORE) ? CORE_FOLDER_PATHS : [],
      },
    ],
  },
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
    // Services and stores may own private storage keys;
    // __tests__/storageKeyOwnership.test.ts guarantees no key is shared.
    layer(['src/services/**', 'src/stores/**'], [DI]),
    layer(['src/infrastructure/**'], [DI]),
    layer(['src/core/**', 'src/domain/**'], [OUTER_LAYERS]),
    layer(
      ['src/types/**'],
      [forbid(['../*', '!../types'], 'types/ is the lowest layer.')],
    ),
  ],
};
