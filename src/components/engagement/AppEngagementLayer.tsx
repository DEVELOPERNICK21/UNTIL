import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { RootNavigator } from '../../navigation/RootNavigator';
import { WidgetCoachModal } from './WidgetCoachModal';
import { DeferredPaywallModal } from './DeferredPaywallModal';
import { FeatureDiscoveryModal } from './FeatureDiscoveryModal';
import { SharePromptModal } from './SharePromptModal';
import { EmberCompanion } from './EmberCompanion';
import { shouldShowDeferredPaywall } from '../../services/deferredPaywall';
import { useEngagementModals } from '../../hooks/useEngagementModals';
import { useAnalytics } from '../../hooks/useAnalytics';

/**
 * Main app shell with post-onboarding engagement modals.
 */
export function AppEngagementLayer() {
  const {
    readModalState,
    dismissWidgetCoach,
    dismissFeatureCoach,
    dismissSharePrompt,
    completeFeatureCoachCta,
    tryCountdownReview,
    tryOpensReview,
  } = useEngagementModals();
  const { logEvent } = useAnalytics();
  const autoReviewAttemptedRef = useRef(false);

  const initial = readModalState();
  const [widgetCoachVisible, setWidgetCoachVisible] = useState(
    initial.widgetCoachPending
  );
  const [featureCoachVisible, setFeatureCoachVisible] = useState(
    initial.featureCoachPending
  );
  const [sharePromptVisible, setSharePromptVisible] = useState(
    initial.sharePromptPending
  );
  const [deferredPaywallVisible, setDeferredPaywallVisible] = useState(false);

  const showNextEngagementModal = useCallback(() => {
    const state = readModalState();
    if (state.featureCoachPending) {
      setFeatureCoachVisible(true);
    } else if (state.sharePromptPending) {
      setSharePromptVisible(true);
    }
  }, [readModalState]);

  const tryAutoReview = useCallback(async () => {
    const countdownRequested = await tryCountdownReview(false);
    if (!countdownRequested) {
      await tryOpensReview(false);
    }
  }, [tryCountdownReview, tryOpensReview]);

  const refreshEngagementModals = useCallback(() => {
    const state = readModalState();
    const nextFeatureCoachVisible =
      featureCoachVisible || (!widgetCoachVisible && state.featureCoachPending);
    const nextSharePromptVisible =
      sharePromptVisible ||
      (!widgetCoachVisible &&
        !nextFeatureCoachVisible &&
        state.sharePromptPending);
    const nextDeferredPaywallVisible =
      deferredPaywallVisible || shouldShowDeferredPaywall();
    const engagementBlockingVisible =
      widgetCoachVisible ||
      nextFeatureCoachVisible ||
      nextSharePromptVisible;
    const reviewBlocked =
      engagementBlockingVisible || nextDeferredPaywallVisible;

    if (nextFeatureCoachVisible && !featureCoachVisible) {
      setFeatureCoachVisible(true);
    }
    if (nextSharePromptVisible && !sharePromptVisible) {
      setSharePromptVisible(true);
    }
    if (nextDeferredPaywallVisible && !deferredPaywallVisible) {
      setDeferredPaywallVisible(true);
    }
    if (!reviewBlocked && !autoReviewAttemptedRef.current) {
      autoReviewAttemptedRef.current = true;
      void tryAutoReview();
    }
  }, [
    deferredPaywallVisible,
    featureCoachVisible,
    readModalState,
    sharePromptVisible,
    tryAutoReview,
    widgetCoachVisible,
  ]);

  useEffect(() => {
    if (widgetCoachVisible) {
      logEvent('widget_coach_shown');
    }
  }, [widgetCoachVisible, logEvent]);

  useEffect(() => {
    if (featureCoachVisible) {
      logEvent('feature_coach_shown');
    }
  }, [featureCoachVisible, logEvent]);

  useEffect(() => {
    if (sharePromptVisible) {
      logEvent('share_prompt_shown');
    }
  }, [sharePromptVisible, logEvent]);

  useEffect(() => {
    refreshEngagementModals();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshEngagementModals();
      }
    });
    return () => sub.remove();
  }, [refreshEngagementModals]);

  const engagementBlockingVisible =
    widgetCoachVisible || featureCoachVisible || sharePromptVisible;
  const reviewBlocked = engagementBlockingVisible || deferredPaywallVisible;

  const handleDeferredPaywallClose = useCallback(() => {
    setDeferredPaywallVisible(false);
    if (!widgetCoachVisible && !featureCoachVisible && !sharePromptVisible) {
      autoReviewAttemptedRef.current = true;
      void tryAutoReview();
    }
  }, [
    featureCoachVisible,
    sharePromptVisible,
    tryAutoReview,
    widgetCoachVisible,
  ]);

  return (
    <>
      <RootNavigator />
      <EmberCompanion suppressed={reviewBlocked} />
      <WidgetCoachModal
        visible={widgetCoachVisible}
        onDismiss={() => {
          dismissWidgetCoach();
          setWidgetCoachVisible(false);
          showNextEngagementModal();
        }}
      />
      <FeatureDiscoveryModal
        visible={featureCoachVisible && !widgetCoachVisible}
        onDismiss={() => {
          dismissFeatureCoach();
          setFeatureCoachVisible(false);
          showNextEngagementModal();
        }}
        onCta={() => {
          completeFeatureCoachCta();
          setFeatureCoachVisible(false);
          showNextEngagementModal();
        }}
      />
      <SharePromptModal
        visible={sharePromptVisible && !widgetCoachVisible && !featureCoachVisible}
        onDismiss={() => {
          dismissSharePrompt();
          setSharePromptVisible(false);
        }}
      />
      <DeferredPaywallModal
        visible={deferredPaywallVisible && !engagementBlockingVisible}
        onClose={handleDeferredPaywallClose}
      />
    </>
  );
}
