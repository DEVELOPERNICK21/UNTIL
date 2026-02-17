/**
 * UNTIL - Root app entry
 * Wires navigation, migrations
 */

import React, { useEffect } from 'react';
import { StatusBar, AppState } from 'react-native';
import { Colors } from './theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runMigrations } from './persistence/migration';
import { RootNavigator } from './navigation/RootNavigator';
import { syncWidgetCache } from './infrastructure';

runMigrations();

function App() {
  useEffect(() => {
    syncWidgetCache();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncWidgetCache();
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export { App };
