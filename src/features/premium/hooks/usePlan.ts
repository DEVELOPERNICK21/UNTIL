/**
 * usePlan - the plan the store reports (kind, start, end or renewal), for the screens that show it.
 */

import { useEffect, useState } from 'react';
import { observePlanUseCase } from '../../../app/di';
import { planTimeline, type PlanTimeline } from '../domain/plan';
import type { PlanRecord } from '../../../shared/types/purchases';

export interface PlanInfo {
  /** Null when Premium has no store plan (a license, or Premium mirrored from the account). */
  plan: PlanRecord | null;
  timeline: PlanTimeline | null;
}

export function usePlan(): PlanInfo {
  const [view, setView] = useState(() => observePlanUseCase.observe());
  useEffect(
    () => observePlanUseCase.subscribe(() => setView(observePlanUseCase.observe())),
    [],
  );
  return {
    plan: view.plan,
    timeline: view.plan ? planTimeline(view.plan) : null,
  };
}
