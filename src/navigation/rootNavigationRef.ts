/**
 * Navigate to main-app screens from components outside NavigationContainer
 * (e.g. modals rendered in app.tsx).
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

export const rootNavigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function navigateToPremium(): void {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate('Premium');
  }
}
