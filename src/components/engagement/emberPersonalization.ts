import { personalizedEmberTipsForRoute } from '../../core/onboarding/personalizedInsights';
import { emberTipPoolForRoute, type EmberInsight } from '../../theme';
import type { OnboardingQuizAnswers } from '../../types';

type EmberContext = {
  dayProgress: number;
  streakCount?: number;
};

export function mergedEmberTipPool(
  routeName: string,
  ctx: EmberContext,
  quizAnswers?: OnboardingQuizAnswers
): EmberInsight[] | null {
  const personalized = personalizedEmberTipsForRoute(routeName, quizAnswers, ctx);
  const base = emberTipPoolForRoute(routeName, ctx) ?? [];
  const pool = [...personalized, ...base].filter(tip => tip.body.trim().length > 0);
  return pool.length ? pool : null;
}

export function pickMergedEmberTip(
  routeName: string,
  ctx: EmberContext,
  tipIndex: number,
  quizAnswers?: OnboardingQuizAnswers
): EmberInsight | null {
  const pool = mergedEmberTipPool(routeName, ctx, quizAnswers);
  if (!pool) return null;
  const index = ((tipIndex % pool.length) + pool.length) % pool.length;
  return pool[index] ?? pool[0];
}
