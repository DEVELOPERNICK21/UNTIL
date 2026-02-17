/**
 * Versioned data migrations
 */

import { storage } from './mmkv';
import { STORAGE_KEYS, DEFAULTS } from './schema';

const CURRENT_VERSION = 3;

export function runMigrations(): void {
  const currentVersion =
    storage.getNumber(STORAGE_KEYS.MIGRATION_VERSION) ??
    DEFAULTS.MIGRATION_VERSION;

  if (currentVersion >= CURRENT_VERSION) {
    return;
  }

  // Run migrations in order
  for (let v = currentVersion + 1; v <= CURRENT_VERSION; v++) {
    runMigration(v);
    storage.set(STORAGE_KEYS.MIGRATION_VERSION, v);
  }
}

function runMigration(version: number): void {
  switch (version) {
    case 1:
      // Initial migration - ensure version key exists
      break;
    case 2:
      // Activity schema - keys added; no data migration needed
      break;
    default:
      break;
  }
}
