/**
 * UNTIL - Root app entry
 * Wires navigation, migrations
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  StatusBar,
  AppState,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';
import { runMigrations } from '../shared/persistence/migration';
import { AuthNavigator } from './navigation/AuthNavigator';
import { SplashScreen } from './splash/SplashScreen';
import { useOnboardingState } from '../features/onboarding';
import {
  useAppUpdateCheck,
  recordOptionalUpdateDismissed,
  ForceUpdateModal,
  OptionalUpdateModal,
} from '../features/app-update';
import { useTrialEndingReminder, TrialEndingModal } from '../features/premium';
import { useAnalyticsBootstrap } from './bootstrap/useAnalyticsBootstrap';
import { useAuthBootstrap } from '../features/account';
import { AppEngagementLayer } from './AppEngagementLayer';
import { logAppOpen, initAnalyticsConsent } from '../shared/analytics/analytics';
import { CrashErrorBoundary } from './CrashErrorBoundary';
import { initPostHogClient } from '../shared/analytics/posthogClient';
import {
  POSTHOG_AUTOCAPTURE,
  POSTHOG_HOST,
  POSTHOG_ENABLED,
} from '../config/analytics';
import {
  recordRetentionAppOpen,
  refreshTaskDeadlineNotifications,
  scheduleRetentionNotifications,
} from '../features/engagement';
import { schedulePresenceStreakSaver } from '../features/presence';
import { openScreenFromUrl } from './navigation/deepLinks';
import { ThemeProvider, useTheme } from '../shared/theme';
import {
  syncWidgetCache,
  syncCustomCounters,
  syncCustomCountersAfterAdopting,
  syncCountdowns,
  syncDailyTasksWidget,
  refreshLiveActivity,
  updateOverlay,
  syncPremiumStatus,
} from '../features/widgets';
import {
  incrementCustomCounterUseCase,
  replaceCustomCountersFromSyncUseCase,
  verifySubscriptionUseCase,
  runAppOpenSideEffectsUseCase,
  getPresenceStreakUseCase,
  ensurePurchasesConfigured,
  identifyPurchasesUserUseCase,
  syncCustomerInfoUseCase,
  purchasesRepository,
  authSessionRepository,
} from './di';

runMigrations();

function refreshPresenceStreakSaver(): void {
  void schedulePresenceStreakSaver(getPresenceStreakUseCase.execute());
}

function refreshPurchasesCustomerInfo(): void {
  if (!ensurePurchasesConfigured().configured) return;
  purchasesRepository
    .getCustomerInfo()
    .then(info => {
      syncCustomerInfoUseCase.execute(info);
    })
    .catch(() => {
      /* RevenueCat unreachable */
    });
}

function handleIncrementCounterUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const normalized = url.trim();
  if (!normalized.includes('increment-counter') || !normalized.includes('id='))
    return false;
  const match = /id=([^&\s]+)/.exec(normalized);
  const id = match?.[1];
  if (!id) return false;
  try {
    incrementCustomCounterUseCase.execute(decodeURIComponent(id));
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
  const posthogClient = useMemo(() => initPostHogClient(), []);

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
    let cancelled = false;
    let removeCustomerInfoListener: (() => void) | undefined;

    const { configured } = ensurePurchasesConfigured();
    const startPurchases = async () => {
      if (!configured || cancelled) return;

      try {
        const uid = authSessionRepository.getUid();
        if (uid) {
          await identifyPurchasesUserUseCase.execute(uid);
        } else {
          const info = await purchasesRepository.getCustomerInfo();
          if (!cancelled) {
            syncCustomerInfoUseCase.execute(info);
          }
        }
      } catch {
        /* RevenueCat unreachable */
      }

      if (cancelled) return;
      const unsub = purchasesRepository.addCustomerInfoListener(info => {
        syncCustomerInfoUseCase.execute(info);
        syncPremiumStatus();
      });
      if (cancelled) {
        unsub();
        return;
      }
      removeCustomerInfoListener = unsub;
    };

    void startPurchases();
    initAnalyticsConsent();
    verifySubscriptionUseCase.execute().then(() => {
      syncPremiumStatus();
    });
    // Engagement tracking for event-based Life unlock.
    runAppOpenSideEffectsUseCase.execute();
    refreshPresenceStreakSaver();
    recordRetentionAppOpen();
    logAppOpen().catch(() => {});
    scheduleRetentionNotifications().catch(() => {});
    refreshTaskDeadlineNotifications().catch(() => {});
    syncWidgetCache();
    void syncCustomCountersAfterAdopting(counters =>
      replaceCustomCountersFromSyncUseCase.execute(counters),
    );
    syncCountdowns();
    syncDailyTasksWidget();
    refreshLiveActivity();
    if (Platform.OS === 'android') updateOverlay();

    const processInitialUrl = () => {
      Linking.getInitialURL().then(url => {
        if (
          url &&
          !handledInitialUrl.current &&
          (handleIncrementCounterUrl(url) || openScreenFromUrl(url))
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
        runAppOpenSideEffectsUseCase.execute();
        refreshPresenceStreakSaver();
        recordRetentionAppOpen();
        logAppOpen().catch(() => {});
        scheduleRetentionNotifications().catch(() => {});
        refreshTaskDeadlineNotifications().catch(() => {});
        verifySubscriptionUseCase.execute().then(() => syncPremiumStatus());
        refreshPurchasesCustomerInfo();
        void syncCustomCountersAfterAdopting(counters =>
          replaceCustomCountersFromSyncUseCase.execute(counters),
        );
        syncPremiumStatus();
        syncWidgetCache();
        syncCountdowns();
        syncDailyTasksWidget();
        refreshLiveActivity();
        if (Platform.OS === 'android') updateOverlay();
        processInitialUrl();
      }
    });

    const subLinking = Linking.addEventListener('url', ({ url }) => {
      if (!handleIncrementCounterUrl(url)) openScreenFromUrl(url);
    });

    return () => {
      cancelled = true;
      removeCustomerInfoListener?.();
      clearTimeout(t);
      subAppState.remove();
      subLinking.remove();
    };
  }, []);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <CrashErrorBoundary>
          <SplashScreen durationMs={SPLASH_DURATION_MS} />
        </CrashErrorBoundary>
      </SafeAreaProvider>
    );
  }

  const appTree = (
    <ThemeProvider>
      <PostSplashContent />
    </ThemeProvider>
  );

  return (
    <SafeAreaProvider>
      <CrashErrorBoundary>
        {posthogClient && POSTHOG_ENABLED ? (
          <PostHogProvider
            client={posthogClient}
            autocapture={POSTHOG_AUTOCAPTURE}
            options={{ host: POSTHOG_HOST }}
          >
            {appTree}
          </PostHogProvider>
        ) : (
          appTree
        )}
      </CrashErrorBoundary>
    </SafeAreaProvider>
  );
}

/** After splash: show onboarding (auth stack) or main app based on completion. */
function PostSplashContent() {
  useAuthBootstrap();
  useAnalyticsBootstrap();
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
