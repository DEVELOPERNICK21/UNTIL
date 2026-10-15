// Layer boundaries from docs/ARCHITECTURE.md and .cursor/rules/architecture.mdc.
// Violations fail lint. Cross-feature rules (public index.ts only, the allowed-dependency table,
// no cycles) are enforced precisely by __tests__/architecture.test.ts, which resolves real paths.
const LAYER_RULE_LEVEL = 'error';

const forbid = (groups, message, extra = {}) => ({
  group: groups,
  message,
  ...extra,
});
// Outer layers may use domain *types* (DTOs, results); only runtime access must go via app/di.
const TYPES_OK = {allowTypeImports: true};

const STORAGE = forbid(
  ['**/shared/persistence', '**/shared/persistence/*'],
  'Storage is owned by data adapters. Go through a use case (via a hook).',
);
const DATA = forbid(
  ['**/data', '**/data/**'],
  'Data adapters are wired in app/di only. Go through a use case (via a hook).',
);
const PORTS = forbid(
  ['**/domain/ports', '**/domain/ports/*'],
  'Repositories and services are reached through use cases, not directly.',
  TYPES_OK,
);
const USE_CASE_CLASSES = forbid(
  ['**/domain/useCases/*'],
  'Import use case instances from app/di, not the classes.',
  TYPES_OK,
);
const DI = forbid(
  ['**/app/di', '**/app/di/**'],
  'Only hooks and the app shell may import the composition root (app/di).',
);

// ADR-7: UI must not call pure domain functions directly; derive from hook data instead.
// `core` used to be its own folder; these are the modules it held, now inside their feature's
// domain/ (or shared/time). Clock, time constants, home formatters and account copy stay allowed for display.
const CORE_MESSAGE =
  'UI must not call core domain logic directly (ADR-7). Derive from hook data instead.';
const CORE_MODULES = [
  'aggregate',
  'intervention',
  'projectRegret',
  'daysLeft',
  'inAppReviewEligibility',
  'studentEmail',
  'trialDay',
  'personalizedInsights',
  'quizFunnel',
  'deviceLimit',
  'entitlementProof',
  'ageGate',
  'dayWidgetAppeal',
];
const CORE = forbid(
  [
    '**/shared/time/*',
    '!**/shared/time/clock',
    '!**/shared/time/constants',
    '!**/shared/time/homeFormatters',
    '!**/shared/time/IClock',
    '!**/shared/time/ClockAdapter',
    ...CORE_MODULES.map(name => `**/domain/${name}`),
  ],
  CORE_MESSAGE,
);

// A bare `shared/time` import would reach the whole folder; the group above cannot re-include
// clock and homeFormatters under an excluded parent, so the bare paths are listed one by one.
const CORE_FOLDER_PATHS = ['./', '../', '../../', '../../../', '../../../../'].map(
  up => ({name: `${up}shared/time`, message: CORE_MESSAGE}),
);
// Inside shared/ the folder is a sibling: `../time`.
const SHARED_CORE_FOLDER_PATHS = [
  ...CORE_FOLDER_PATHS,
  {name: '../time', message: CORE_MESSAGE},
];

const HOOKS = forbid(
  ['**/hooks', '**/hooks/*'],
  'shared/ui is presentational: take data via props, not hooks.',
);
const OUTER_LAYERS = forbid(
  [
    '**/shared/persistence',
    '**/shared/persistence/*',
    '**/shared/analytics/*',
    '**/shared/platform',
    '**/shared/platform/*',
    '**/shared/theme/themeStore',
    '**/data',
    '**/data/**',
    '**/app/di',
    '**/app/di/**',
    '**/hooks',
    '**/hooks/**',
    '**/ui',
    '**/ui/**',
    'react',
    'react-native',
    'react-native-*',
    '@react-native*/**',
    '@react-native-firebase/*',
    'posthog-react-native',
    '@notifee/*',
  ],
  'domain/ and shared/time must stay pure: no React, SDKs, storage or outer layers.',
);

const layer = (files, patterns, paths = []) => ({
  files,
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      LAYER_RULE_LEVEL,
      {patterns, paths},
    ],
  },
});

// shared/time keeps the clock adapter next to its port, so only its pure core is held to OUTER_LAYERS.
const PURE_TIME = [
  'day',
  'life',
  'lifeWeeks',
  'month',
  'panelModel',
  'projections',
  'year',
  'homeFormatters',
  'clock',
  'IClock',
].map(name => `src/shared/time/${name}.ts`);

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    // Later entries win for the files they match, so the broad rules come first.
    // Data adapters and shared services may own private storage keys;
    // __tests__/storageKeyOwnership.test.ts guarantees no key is shared.
    layer(
      ['src/features/*/data/**', 'src/features/*/services/**', 'src/shared/**'],
      [DI],
    ),
    // Screens and the app shell.
    layer(
      [
        'src/features/*/ui/**',
        'src/app/AppEngagementLayer.tsx',
        'src/app/CrashErrorBoundary.tsx',
        'src/app/splash/**',
      ],
      [STORAGE, DATA, PORTS, USE_CASE_CLASSES, DI, CORE],
      CORE_FOLDER_PATHS,
    ),
    layer(
      ['src/shared/ui/**'],
      [STORAGE, DATA, PORTS, USE_CASE_CLASSES, DI, CORE, HOOKS],
      SHARED_CORE_FOLDER_PATHS,
    ),
    // Hooks are the only place a feature reaches the composition root.
    layer(
      ['src/features/*/hooks/**', 'src/app/bootstrap/**'],
      [STORAGE, PORTS, USE_CASE_CLASSES],
    ),
    layer(['src/features/*/domain/**', ...PURE_TIME], [OUTER_LAYERS]),
    layer(
      ['src/shared/types/**'],
      [forbid(['../*', '!../types'], 'types/ is the lowest layer.')],
    ),
  ],
};
