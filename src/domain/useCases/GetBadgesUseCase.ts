import {
  BADGES,
  getBadgeProgress,
  pickUpNext,
  type BadgeDefinition,
  type BadgeProgress,
} from '../badges/badgeCatalog';
import type { IBadgeRepository } from '../repository/IBadgeRepository';
import type { EvaluateBadgesUseCase } from './EvaluateBadgesUseCase';

export interface BadgeView {
  definition: BadgeDefinition;
  progress: BadgeProgress;
  earned: boolean;
  /** Local date (YYYY-MM-DD) it was earned, or null. */
  earnedOn: string | null;
  /** Earned but the unlock celebration has not played yet. */
  isNew: boolean;
}

export interface BadgeOverview {
  badges: BadgeView[];
  earnedCount: number;
  total: number;
  /** Earned and not yet celebrated, oldest first. */
  pendingUnlocks: BadgeView[];
  upNext: BadgeView | null;
}

export class GetBadgesUseCase {
  constructor(
    private readonly badgeRepository: IBadgeRepository,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
  ) {}

  execute(): BadgeOverview {
    const state = this.badgeRepository.getState();
    const snapshot = this.evaluateBadges.snapshot();
    const seen = new Set(state.seen);
    const earnedIds = new Set(Object.keys(state.earned));

    const badges: BadgeView[] = BADGES.map(definition => {
      const earned = earnedIds.has(definition.id);
      return {
        definition,
        progress: getBadgeProgress(definition, snapshot),
        earned,
        earnedOn: earned ? state.earned[definition.id] : null,
        isNew: earned && !seen.has(definition.id),
      };
    });

    const nextDefinition = pickUpNext(snapshot, earnedIds);
    return {
      badges,
      earnedCount: earnedIds.size,
      total: BADGES.length,
      pendingUnlocks: badges.filter(b => b.isNew),
      upNext: nextDefinition
        ? badges.find(b => b.definition.id === nextDefinition.id) ?? null
        : null,
    };
  }
}
