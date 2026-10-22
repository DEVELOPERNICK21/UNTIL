/**
 * The update decision for this session, plus the two things the sheet can do about it.
 * Checks at launch and whenever the app comes back to the foreground (the service throttles).
 */

import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import type { UpdateDecision } from '../domain/updatePolicy';
import {
  checkForAppUpdate,
  getInstalledBuild,
  openStoreListing,
  shouldSkipUpdateCheck,
  snoozeUpdate,
} from '../services/updateService';

const NONE: UpdateDecision = { kind: 'none' };

export function useAppUpdate(): {
  decision: UpdateDecision;
  update: () => void;
  later: () => void;
} {
  const [decision, setDecision] = useState<UpdateDecision>(NONE);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (shouldSkipUpdateCheck()) return;
      const next = await checkForAppUpdate();
      if (alive) setDecision(next);
    };
    void run();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void run();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  const kind = decision.kind;
  const latestBuild = decision.kind === 'none' ? null : decision.latestBuild;
  useEffect(() => {
    if (kind === 'none' || latestBuild == null) return;
    void logAnalyticsEvent('app_update_sheet_shown', {
      kind,
      latest_build: latestBuild,
      installed_build: getInstalledBuild(),
    });
  }, [kind, latestBuild]);

  const update = useCallback(() => {
    if (decision.kind === 'none') return;
    void logAnalyticsEvent('app_update_tapped', {
      kind: decision.kind,
      latest_build: decision.latestBuild,
    });
    void openStoreListing(decision.storeUrl);
  }, [decision]);

  const later = useCallback(() => {
    // A required update cannot be put off.
    if (decision.kind !== 'optional') return;
    void logAnalyticsEvent('app_update_later', { latest_build: decision.latestBuild });
    snoozeUpdate(decision.latestBuild);
    setDecision(NONE);
  }, [decision]);

  return { decision, update, later };
}
