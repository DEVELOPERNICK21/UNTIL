/**
 * MMKV-backed engagement modal flags.
 */

import type {
  EngagementModalState,
  IEngagementRepository,
} from '../../domain/repository/IEngagementRepository';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getString, setString } from '../../persistence/mmkv';

const FEATURE_COACH_OPEN_THRESHOLD = 3;

export class MmkvEngagementRepository implements IEngagementRepository {
  getModalState(): EngagementModalState {
    return {
      widgetCoachPending:
        getString(STORAGE_KEYS.WIDGET_COACH_PENDING) === '1',
      featureCoachPending:
        getString(STORAGE_KEYS.FEATURE_COACH_PENDING) === '1',
      sharePromptPending:
        getString(STORAGE_KEYS.SHARE_PROMPT_PENDING) === '1',
    };
  }

  setWidgetCoachPending(): void {
    setString(STORAGE_KEYS.WIDGET_COACH_PENDING, '1');
  }

  clearWidgetCoachPending(): void {
    setString(STORAGE_KEYS.WIDGET_COACH_PENDING, '');
  }

  scheduleFeatureCoachIfEligible(appOpenCount: number): void {
    if (appOpenCount < FEATURE_COACH_OPEN_THRESHOLD) return;
    if (getString(STORAGE_KEYS.FEATURE_COACH_SHOWN) === '1') return;
    if (getString(STORAGE_KEYS.FEATURE_COACH_PENDING) === '1') return;
    setString(STORAGE_KEYS.FEATURE_COACH_PENDING, '1');
  }

  markFeatureCoachShown(): void {
    setString(STORAGE_KEYS.FEATURE_COACH_PENDING, '');
    setString(STORAGE_KEYS.FEATURE_COACH_SHOWN, '1');
  }

  clearFeatureCoachPending(): void {
    setString(STORAGE_KEYS.FEATURE_COACH_PENDING, '');
  }

  scheduleSharePrompt(): void {
    setString(STORAGE_KEYS.SHARE_PROMPT_PENDING, '1');
  }

  clearSharePromptPending(): void {
    setString(STORAGE_KEYS.SHARE_PROMPT_PENDING, '');
  }

  scheduleReviewPrompt(): void {
    setString(STORAGE_KEYS.REVIEW_PROMPT_PENDING, '1');
  }

  clearReviewPending(): void {
    setString(STORAGE_KEYS.REVIEW_PROMPT_PENDING, '');
  }

  isReviewPending(): boolean {
    return getString(STORAGE_KEYS.REVIEW_PROMPT_PENDING) === '1';
  }

  getLastAutoReviewRequestAt(): number | null {
    const raw = getString(STORAGE_KEYS.LAST_AUTO_REVIEW_REQUEST_AT);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  setLastAutoReviewRequestAt(ms: number): void {
    setString(STORAGE_KEYS.LAST_AUTO_REVIEW_REQUEST_AT, String(ms));
  }

  ensureFirstOpenDate(dateKey: string): void {
    if (this.getFirstOpenDate()) return;
    setString(STORAGE_KEYS.FIRST_OPEN_DATE, dateKey);
  }

  getFirstOpenDate(): string | null {
    const raw = getString(STORAGE_KEYS.FIRST_OPEN_DATE);
    return raw?.trim() ? raw : null;
  }

  getCountdownCompletedFiredId(): string | null {
    const raw = getString(STORAGE_KEYS.COUNTDOWN_COMPLETED_FIRED);
    return raw?.trim() ? raw : null;
  }

  setCountdownCompletedFired(countdownId: string): void {
    setString(STORAGE_KEYS.COUNTDOWN_COMPLETED_FIRED, countdownId);
  }

  clearCountdownCompletedFired(): void {
    setString(STORAGE_KEYS.COUNTDOWN_COMPLETED_FIRED, '');
  }
}
