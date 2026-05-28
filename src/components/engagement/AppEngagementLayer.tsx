import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { RootNavigator } from '../../navigation/RootNavigator';
import { WidgetCoachModal } from './WidgetCoachModal';
import { DeferredPaywallModal } from './DeferredPaywallModal';
import {
  isWidgetCoachPending,
} from '../../services/onboardingCompletion';
import { shouldShowDeferredPaywall } from '../../services/deferredPaywall';
import { logAnalyticsEvent } from '../../services/analytics';

/**
 * Main app shell with post-onboarding engagement modals (widget coach, deferred paywall).
 */
export function AppEngagementLayer() {
  const [widgetCoachVisible, setWidgetCoachVisible] = useState(() =>
    isWidgetCoachPending()
  );
  const [deferredPaywallVisible, setDeferredPaywallVisible] = useState(false);

  const refreshDeferredPaywall = useCallback(() => {
    if (shouldShowDeferredPaywall()) {
      setDeferredPaywallVisible(true);
    }
  }, []);

  useEffect(() => {
    if (widgetCoachVisible) {
      void logAnalyticsEvent('widget_coach_shown');
    }
  }, [widgetCoachVisible]);

  useEffect(() => {
    refreshDeferredPaywall();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshDeferredPaywall();
      }
    });
    return () => sub.remove();
  }, [refreshDeferredPaywall]);

  return (
    <>
      <RootNavigator />
      <WidgetCoachModal
        visible={widgetCoachVisible}
        onDismiss={() => setWidgetCoachVisible(false)}
      />
      <DeferredPaywallModal
        visible={deferredPaywallVisible && !widgetCoachVisible}
        onClose={() => setDeferredPaywallVisible(false)}
      />
    </>
  );
}
