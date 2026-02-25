/**
 * UNTIL - Root app entry
 * Wires navigation, migrations
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, AppState, Linking, NativeModules, Platform } from 'react-native';
import { Colors } from './theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runMigrations } from './persistence/migration';
import { RootNavigator } from './navigation/RootNavigator';
import {
  syncWidgetCache,
  syncCustomCounters,
  syncCountdowns,
  syncDailyTasksWidget,
} from './infrastructure';
import {
  incrementCustomCounterUseCase,
  replaceCustomCountersFromSyncUseCase,
  checkForAppUpdateUseCase,
} from './di';

runMigrations();

function handleIncrementCounterUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const normalized = url.trim();
  if (!normalized.includes('increment-counter') || !normalized.includes('id=')) return false;
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

function App() {
  const handledInitialUrl = useRef(false);

  useEffect(() => {
    syncWidgetCache();
    syncCustomCounters();
    syncCountdowns();
    syncDailyTasksWidget();
    checkForAppUpdateUseCase.execute();

    const processInitialUrl = () => {
      Linking.getInitialURL().then((url) => {
        if (url && !handledInitialUrl.current && handleIncrementCounterUrl(url)) {
          handledInitialUrl.current = true;
        }
      });
    };

    processInitialUrl();
    const t = setTimeout(processInitialUrl, 500);

    const subAppState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkForAppUpdateUseCase.execute();
        if (Platform.OS === 'ios' && NativeModules.WidgetBridge?.getCustomCountersFromAppGroup) {
          NativeModules.WidgetBridge.getCustomCountersFromAppGroup().then((json: string | null) => {
            if (json && typeof json === 'string') {
              try {
                const counters = JSON.parse(json) as Array<{ id: string; title: string; count: number }>;
                if (Array.isArray(counters)) {
                  replaceCustomCountersFromSyncUseCase.execute(counters);
                }
              } catch { /* ignore parse errors */ }
            }
          });
        }
        syncWidgetCache();
        syncCustomCounters();
        syncCountdowns();
        syncDailyTasksWidget();
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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export { App };
