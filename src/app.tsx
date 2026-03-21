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
import { RootNavigator } from './navigation/RootNavigator';
import { AuthNavigator } from './navigation/AuthNavigator';
import { SplashScreen } from './surfaces/splash';
import { useOnboardingState, useAppUpdateCheck } from './hooks';
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
  checkForAppUpdateUseCase,
  verifySubscriptionUseCase,
  trackAppOpenUseCase,
  ensurePlayBillingSession,
} from './di';
import { ForceUpdateModal } from './components/update/ForceUpdateModal';
import { OptionalUpdateModal } from './components/update/OptionalUpdateModal';

runMigrations();

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

function App() {
  const handledInitialUrl = useRef(false);
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
    }
    // Engagement tracking for event-based Life unlock.
    trackAppOpenUseCase.execute();
    syncWidgetCache();
    syncCustomCounters();
    syncCountdowns();
    syncDailyTasksWidget();
    updateLiveActivity();
    if (Platform.OS === 'android') updateOverlay();
    checkForAppUpdateUseCase.execute();

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
        // Count each time the user returns to foreground.
        trackAppOpenUseCase.execute();
        verifySubscriptionUseCase.execute().then(() => syncPremiumStatus());
        checkForAppUpdateUseCase.execute();
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
  const { updateType, storeUrl } = useAppUpdateCheck();
  const [optionalVisible, setOptionalVisible] = useState(true);

  const showForce = updateType === 'FORCE_UPDATE';
  const showOptional = updateType === 'OPTIONAL_UPDATE' && optionalVisible;

  const handleDismissOptional = () => {
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
    </>
  );
}

function AppContent() {
  return <RootNavigator />;
}

export { App };
