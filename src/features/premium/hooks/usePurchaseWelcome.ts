/**
 * usePurchaseWelcome - drives the "Welcome to Premium" popup.
 *
 * A welcome is queued when a plan becomes active (see SyncCustomerInfoUseCase). It waits a
 * beat after the store sheet or paywall closes, then shows once; closing it clears it.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { observePlanUseCase } from '../../../app/di';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';
import { navigateToPremium } from '../../../shared/navigation/rootNavigationRef';
import {
  getEmberSurfaceState,
  subscribeEmberSurface,
} from '../../../shared/ui/emberSurface';
import { dayPart, planTimeline, type PlanTimeline } from '../domain/plan';
import type { PlanKind, PlanRecord } from '../../../shared/types/purchases';

/** Quiet moment after the store's own sheet closes, so the popup is not drawn under it. */
const SETTLE_MS = 900;

function readModalCovering(): boolean {
  return getEmberSurfaceState().modalCovering;
}

export interface PurchaseWelcome {
  /** A welcome is queued, even if it is not on screen yet. Other prompts should hold back. */
  pending: boolean;
  /** Time to show the popup. */
  visible: boolean;
  kind: PlanKind | null;
  plan: PlanRecord | null;
  timeline: PlanTimeline | null;
  greeting: 'morning' | 'afternoon' | 'evening';
  dismiss: () => void;
  /** Close the popup and open the Premium screen, where the full plan is shown. */
  seePlan: () => void;
}

export function usePurchaseWelcome(): PurchaseWelcome {
  const [view, setView] = useState(() => observePlanUseCase.observe());
  useEffect(
    () => observePlanUseCase.subscribe(() => setView(observePlanUseCase.observe())),
    [],
  );
  const covered = useSyncExternalStore(subscribeEmberSurface, readModalCovering);
  const welcome = view.welcome;
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!welcome || covered) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [welcome, covered]);

  const { logEvent } = useAnalytics();
  const kind = welcome?.kind ?? null;
  const visible = welcome != null && settled;

  useEffect(() => {
    if (visible) logEvent('premium_welcome_shown', { plan: kind ?? undefined });
  }, [visible, kind, logEvent]);

  const dismiss = useCallback(() => {
    observePlanUseCase.dismissWelcome();
  }, []);

  const seePlan = useCallback(() => {
    logEvent('premium_welcome_see_plan', { plan: kind ?? undefined });
    observePlanUseCase.dismissWelcome();
    navigateToPremium();
  }, [kind, logEvent]);

  const greeting = useMemo(
    () => dayPart(new Date(welcome?.at ?? Date.now()).getHours()),
    [welcome?.at],
  );

  return {
    pending: welcome != null,
    visible,
    kind,
    plan: view.plan,
    timeline: view.plan ? planTimeline(view.plan) : null,
    greeting,
    dismiss,
    seePlan,
  };
}
