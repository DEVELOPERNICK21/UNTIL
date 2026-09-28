import { useCallback, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  canDrawOverlays,
  getOverlayWidgetType,
  isOverlayEnabled,
  requestOverlayPermission,
  setOverlayWidgetType,
  startOverlay,
  stopOverlay,
  updateOverlay,
} from '../infrastructure/WidgetSync';
import type { OverlayWidgetType } from '../infrastructure/WidgetSync';
import { useAccessControl } from './useAccessControl';

function isPremiumOverlayType(type: OverlayWidgetType): boolean {
  return type === 'month' || type === 'life';
}

const WIDGET_OPTIONS: {
  type: OverlayWidgetType;
  title: string;
  description: string;
}[] = [
  {
    type: 'day',
    title: 'Today',
    description: 'How much of today is left · hours remaining.',
  },
  {
    type: 'month',
    title: 'This month',
    description: 'Days left in the month · Premium.',
  },
  {
    type: 'year',
    title: 'This year',
    description: 'How much of the year is left.',
  },
  {
    type: 'life',
    title: 'Your life',
    description: 'Days left in life · set birth date · Premium.',
  },
  {
    type: 'hourCalc',
    title: 'Hour timer',
    description: 'Coming in a future update.',
  },
];

function isComingSoonType(type: OverlayWidgetType): boolean {
  return type === 'hourCalc';
}

export function useOverlayControl() {
  const { hasPremiumBundle } = useAccessControl();
  const [activeWidget, setActiveWidget] = useState<OverlayWidgetType>(
    getOverlayWidgetType(),
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(() => {
    setActiveWidget(getOverlayWidgetType());
    setError(null);
    canDrawOverlays()
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
    setOverlayActive(isOverlayEnabled());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus]),
  );

  useFocusEffect(
    useCallback(() => {
      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') refreshStatus();
      });
      return () => sub.remove();
    }, [refreshStatus]),
  );

  const handleSelectWidget = useCallback(
    (type: OverlayWidgetType) => {
      if (isComingSoonType(type)) return;
      if (isPremiumOverlayType(type) && !hasPremiumBundle) return;
      setOverlayWidgetType(type);
      setActiveWidget(type);
      updateOverlay();
    },
    [hasPremiumBundle],
  );

  const handleStart = useCallback(() => {
    try {
      startOverlay();
      setOverlayActive(true);
      setError(null);
      if (hasPermission === false) {
        // Notification-only mode still runs; offer overlay permission separately.
      }
    } catch {
      setError(
        'Could not start Live Island. Check notification permission, then try again.',
      );
    }
  }, [hasPermission]);

  const handleStop = useCallback(() => {
    stopOverlay();
    setOverlayActive(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    requestOverlayPermission();
  }, []);

  const options = useMemo(
    () =>
      WIDGET_OPTIONS.map(option => {
        const comingSoon = isComingSoonType(option.type);
        const lockedPremium =
          !comingSoon && isPremiumOverlayType(option.type) && !hasPremiumBundle;
        return {
          ...option,
          selected: activeWidget === option.type,
          comingSoon,
          lockedPremium,
          locked: comingSoon || lockedPremium,
        };
      }),
    [activeWidget, hasPremiumBundle],
  );

  return {
    options,
    hasPermission,
    overlayActive,
    error,
    handleSelectWidget,
    handleStart,
    handleStop,
    handleOpenSettings,
    isAndroid: Platform.OS === 'android',
  };
}

