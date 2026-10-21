/**
 * "Add the Day widget now" on the widgets step of onboarding (Android launchers that support it).
 * Widgets are why most people open the app again, so the offer sits right where they see one.
 */

import React from 'react';
import { PinWidgetButton } from '../../../shared/ui';
import { usePinWidget } from '../../../shared/platform/usePinWidget';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';

export function OnboardingPinWidget() {
  const { available, busy, pin } = usePinWidget('day', 'onboarding');
  const { logEvent } = useAnalytics();
  if (!available) return null;
  return (
    <PinWidgetButton
      variant="link"
      label="Add the Day widget now"
      busy={busy}
      onPress={() => {
        logEvent('widget_add_tapped', { source: 'onboarding', one_tap: true });
        void pin();
      }}
    />
  );
}
