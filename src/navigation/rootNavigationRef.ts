/**
 * Navigate to main-app screens from components outside NavigationContainer
 * (e.g. modals rendered in app.tsx).
 */

import { InteractionManager } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const rootNavigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function navigateToPremium(): void {
  const go = (): boolean => {
    if (!rootNavigationRef.isReady()) return false;
    rootNavigationRef.navigate('Premium');
    return true;
  };

  if (go()) return;

  InteractionManager.runAfterInteractions(() => {
    go();
  });
}
