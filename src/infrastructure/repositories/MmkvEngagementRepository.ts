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
