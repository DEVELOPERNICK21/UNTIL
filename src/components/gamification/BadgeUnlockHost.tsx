import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useBadgeOverview } from '../../hooks';
import { rootNavigationRef } from '../../navigation/rootNavigationRef';
import {
  getEmberSurfaceState,
  subscribeEmberSurface,
} from '../../services/emberSurface';
import { BadgeUnlockOverlay } from './BadgeUnlockOverlay';

/** Quiet moment after a modal closes, so the medal is not the first thing seen. */
const SETTLE_MS = 900;

function readModalCovering(): boolean {
  return getEmberSurfaceState().modalCovering;
}

interface BadgeUnlockHostProps {
  /** An app-level modal (widget tour, paywall, share prompt) is up. */
  suppressed: boolean;
}

/**
 * Plays the next waiting badge unlock above the whole app (header included).
 * Holds back while any modal is open, then waits a beat before showing.
 */
export function BadgeUnlockHost({ suppressed }: BadgeUnlockHostProps) {
  const { pendingUnlocks, earnedCount, total, markSeen, refresh } =
    useBadgeOverview();
  const nativeModalOpen = useSyncExternalStore(
    subscribeEmberSurface,
    readModalCovering,
  );
  const blocked = suppressed || nativeModalOpen;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (blocked) {
      setReady(false);
      return;
    }
    const t = setTimeout(() => setReady(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, [blocked]);

  // A badge can be earned on any screen (a task ticked, a deadline added), so
  // look again every time the user moves between screens.
  useEffect(() => rootNavigationRef.addListener('state', refresh), [refresh]);

  const current = ready ? pendingUnlocks[0] ?? null : null;
  return (
    <BadgeUnlockOverlay
      badge={current}
      mode="unlock"
      remaining={Math.max(0, pendingUnlocks.length - 1)}
      earnedCount={earnedCount}
      total={total}
      onClose={() => {
        if (current) markSeen([current.definition.id]);
      }}
    />
  );
}
