/**
 * MmkvPlanRecordStore - MMKV-backed IPlanRecordStore.
 * Values are small JSON blobs; anything that does not parse reads as "nothing recorded".
 */

import type {
  IPlanRecordStore,
  PendingWelcome,
} from '../domain/ports/IPlanRecordStore';
import { isPlanKind, PLAN_KINDS } from '../domain/plan';
import type { PlanKind, PlanRecord } from '../../../shared/types/purchases';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { getString, setString, remove } from '../../../shared/persistence/mmkv';

function readJson(key: string): unknown {
  const raw = getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parsePlan(value: unknown): PlanRecord | null {
  if (value == null || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!isPlanKind(v.kind) || typeof v.productId !== 'string') return null;
  const store = v.store === 'app_store' || v.store === 'play' || v.store === 'other' ? v.store : null;
  return {
    kind: v.kind,
    productId: v.productId,
    store,
    startedMs: numberOrNull(v.startedMs),
    expiresMs: numberOrNull(v.expiresMs),
    willRenew: v.willRenew === true,
    trial: v.trial === true,
    billingIssue: v.billingIssue === true,
  };
}

export class MmkvPlanRecordStore implements IPlanRecordStore {
  private readonly subscribers = new Set<() => void>();

  getPlan(): PlanRecord | null {
    return parsePlan(readJson(STORAGE_KEYS.PREMIUM_PLAN));
  }

  setPlan(plan: PlanRecord | null): void {
    if (plan) setString(STORAGE_KEYS.PREMIUM_PLAN, JSON.stringify(plan));
    else remove(STORAGE_KEYS.PREMIUM_PLAN);
    this.notify();
  }

  getPlansBought(): PlanKind[] {
    const raw = readJson(STORAGE_KEYS.PREMIUM_PLANS_BOUGHT);
    if (!Array.isArray(raw)) return [];
    return PLAN_KINDS.filter(kind => raw.includes(kind));
  }

  addPlanBought(kind: PlanKind): void {
    const bought = this.getPlansBought();
    if (bought.includes(kind)) return;
    setString(STORAGE_KEYS.PREMIUM_PLANS_BOUGHT, JSON.stringify([...bought, kind]));
    this.notify();
  }

  getPendingWelcome(): PendingWelcome | null {
    const raw = readJson(STORAGE_KEYS.PREMIUM_WELCOME_PENDING);
    if (raw == null || typeof raw !== 'object') return null;
    const v = raw as Record<string, unknown>;
    const at = numberOrNull(v.at);
    return isPlanKind(v.kind) && at != null ? { kind: v.kind, at } : null;
  }

  setPendingWelcome(welcome: PendingWelcome | null): void {
    if (welcome) setString(STORAGE_KEYS.PREMIUM_WELCOME_PENDING, JSON.stringify(welcome));
    else remove(STORAGE_KEYS.PREMIUM_WELCOME_PENDING);
    this.notify();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb());
  }
}
