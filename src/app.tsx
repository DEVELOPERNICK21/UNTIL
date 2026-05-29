/**
 * UNTIL - Root app entry
 * Wires navigation, migrations
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  AppState,
  Linking,
  NativeModules,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runMigrations } from './persistence/migration';
import { AuthNavigator } from './navigation/AuthNavigator';
import { SplashScreen } from './surfaces/splash';
import { useOnboardingState, useAppUpdateCheck, useTrialEndingReminder } from './hooks';
import { TrialEndingModal } from './components/premium/TrialEndingModal';
import { AppEngagementLayer } from './components/engagement/AppEngagementLayer';
import { logAppOpen } from './services/analytics';
import {
  recordRetentionAppOpen,
  scheduleRetentionNotifications,
} from './services/retentionNotifications';
import { recordOptionalUpdateDismissed } from './services/updateService';
import { ThemeProvider, useTheme } from './theme';
import {
  syncWidgetCache,
  syncCustomCounters,
  syncCountdowns,
  syncDailyTasksWidget,
  updateLiveActivity,
  updateOverlay,
  syncPremiumStatus,
} from './infrastructure';
import {
  incrementCustomCounterUseCase,
  replaceCustomCountersFromSyncUseCase,
  verifySubscriptionUseCase,
  trackAppOpenUseCase,
  ensurePlayBillingSession,
  reconcilePlayEntitlementUseCase,
} from './di';
import {
  recordPlayEntitlementReconcile,
  shouldReconcilePlayEntitlement,
} from './services/playEntitlementReconcile';
import { ForceUpdateModal } from './components/update/ForceUpdateModal';
import { OptionalUpdateModal } from './components/update/OptionalUpdateModal';

runMigrations();

function reconcilePlayEntitlementIfNeeded(): void {
  if (Platform.OS !== 'android' || !shouldReconcilePlayEntitlement()) {
    return;
  }
  recordPlayEntitlementReconcile();
  ensurePlayBillingSession()
    .then(() => reconcilePlayEntitlementUseCase.execute())
    .then(() => syncPremiumStatus())
    .catch(() => {
      /* Play unreachable */
    });
}

/**
 * Processes until://increment-counter?id=... deep links.
 * Validates scheme, host, and id format for security.
 */
function handleIncrementCounterUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const normalized = url.trim();
    if (!normalized.startsWith('until://increment-counter')) {
      return false;
    }

    const match = /[?&]id=([^&\s]+)/.exec(normalized);
    const id = match?.[1];
    if (!id) return false;

    const decodedId = decodeURIComponent(id);

    // Sentinel: Strict validation - alphanumeric only, max length 64.
    // Prevents potential exploitation of untrusted deep link input.
    if (!/^[a-zA-Z0-9]+$/.test(decodedId) || decodedId.length > 64) {
      return false;
    }

    incrementCustomCounterUseCase.execute(decodedId);
    syncCustomCounters();
    return true;
  } catch {
    return false;
  }
}

/** Splash display duration (SSOT); passed to SplashScreen for aligned progress animation */
const SPLASH_DURATION_MS = 1000;
const ACTIVE_EVENT_DEBOUNCE_MS = 2000;

function App() {
  const handledInitialUrl = useRef(false);
  const lastActiveHandledAt = useRef(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // Block back button on Android during splash (no going back)
  useEffect(() => {
    if (!showSplash) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [showSplash]);

  useEffect(() => {
    verifySubscriptionUseCase.execute().then(() => {
      syncPremiumStatus();
    });
    if (Platform.OS === 'android') {
      ensurePlayBillingSession().catch(() => {
        /* ignore */
      });
      reconcilePlayEntitlementIfNeeded();
    }
    // Engagement tracking for event-based Life unlock.
    trackAppOpenUseCase.execute();
    recordRetentionAppOpen();
    logAppOpen().catch(() => {});
    scheduleRetentionNotifications().catch(() => {});
    syncWidgetCache();
    syncCustomCounters();
    syncCountdowns();
    syncDailyTasksWidget();
    updateLiveActivity();
    if (Platform.OS === 'android') updateOverlay();

    const processInitialUrl = () => {
      Linking.getInitialURL().then(url => {
        if (
          url &&
          !handledInitialUrl.current &&
          handleIncrementCounterUrl(url)
        ) {
          handledInitialUrl.current = true;
        }
      });
    };

    processInitialUrl();
    const t = setTimeout(processInitialUrl, 500);

    const subAppState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        const activeAt = Date.now();
        if (activeAt - lastActiveHandledAt.current < ACTIVE_EVENT_DEBOUNCE_MS) {
          return;
        }
        lastActiveHandledAt.current = activeAt;
        // Count each time the user returns to foreground.
        trackAppOpenUseCase.execute();
        recordRetentionAppOpen();
        logAppOpen().catch(() => {});
        scheduleRetentionNotifications().catch(() => {});
        verifySubscriptionUseCase.execute().then(() => syncPremiumStatus());
        reconcilePlayEntitlementIfNeeded();
        if (
          Platform.OS === 'ios' &&
          NativeModules.WidgetBridge?.getCustomCountersFromAppGroup
        ) {
          NativeModules.WidgetBridge.getCustomCountersFromAppGroup().then(
            (json: string | null) => {
              if (json && typeof json === 'string') {
                try {
                  const counters = JSON.parse(json) as Array<{
                    id: string;
                    title: string;
                    count: number;
                  }>;
                  if (Array.isArray(counters)) {
                    replaceCustomCountersFromSyncUseCase.execute(counters);
                  }
                } catch {
                  /* ignore parse errors */
                }
              }
            },
          );
        }
        syncPremiumStatus();
        syncWidgetCache();
        syncCustomCounters();
        syncCountdowns();
        syncDailyTasksWidget();
        updateLiveActivity();
        if (Platform.OS === 'android') updateOverlay();
        processInitialUrl();
      }
    });

    const subLinking = Linking.addEventListener('url', ({ url }) => {
      handleIncrementCounterUrl(url);
    });

    return () => {
      clearTimeout(t);
      subAppState.remove();
      subLinking.remove();
    };
  }, []);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen durationMs={SPLASH_DURATION_MS} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PostSplashContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** After splash: show onboarding (auth stack) or main app based on completion. */
function PostSplashContent() {
  const theme = useTheme();
  const { hasCompleted, completeOnboarding } = useOnboardingState();
  const { updateType, storeUrl, latestVersion } = useAppUpdateCheck();
  const {
    visible: trialReminderVisible,
    trialDay,
    dismiss: dismissTrialReminder,
  } = useTrialEndingReminder();
  const [optionalVisible, setOptionalVisible] = useState(true);

  const showForce = updateType === 'FORCE_UPDATE';
  const showOptional = updateType === 'OPTIONAL_UPDATE' && optionalVisible;

  const handleDismissOptional = () => {
    if (latestVersion) {
      recordOptionalUpdateDismissed(latestVersion);
    }
    setOptionalVisible(false);
  };

  return (
    <>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />
      {hasCompleted ? (
        <AppContent />
      ) : (
        <AuthNavigator onComplete={completeOnboarding} />
      )}

      <ForceUpdateModal visible={showForce} storeUrl={storeUrl} />
      <OptionalUpdateModal
        visible={showOptional && !showForce}
        storeUrl={storeUrl}
        onDismiss={handleDismissOptional}
      />
      {hasCompleted ? (
        <TrialEndingModal
          visible={trialReminderVisible}
          trialDay={trialDay}
          onDismiss={dismissTrialReminder}
        />
      ) : null}
    </>
  );
}

function AppContent() {
  return <AppEngagementLayer />;
}

export { App };
