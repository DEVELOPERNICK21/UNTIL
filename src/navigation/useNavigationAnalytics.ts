/**
 * Logs screen_view on navigation state changes (auth + main stacks).
 */

import type { NavigationState } from '@react-navigation/native';
import { logAnalyticsEvent } from '../services/analytics';

function getActiveRouteName(
  state: NavigationState | undefined
): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index ?? 0];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

let lastScreen = '';
let lastLoggedAt = 0;
const DEBOUNCE_MS = 300;

export function trackNavigationStateChange(
  state: NavigationState | undefined
): void {
  const screen = getActiveRouteName(state);
  if (!screen) return;

  const now = Date.now();
  if (screen === lastScreen && now - lastLoggedAt < DEBOUNCE_MS) {
    return;
  }
  lastScreen = screen;
  lastLoggedAt = now;
  void logAnalyticsEvent('screen_view', { screen });
}
