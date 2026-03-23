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

const WIDGET_OPTIONS: {
  type: OverlayWidgetType;
  title: string;
  description: string;
}[] = [
  { type: 'day', title: 'Today', description: '57% done · 42% left. Day progress with hours.' },
  { type: 'month', title: 'This month', description: 'Feb 17% · 23d left. Month progress.' },
  { type: 'year', title: 'This year', description: '9% · 329d left. Year progress.' },
  { type: 'life', title: 'Your life', description: 'Life progress. Set birth date in Settings.' },
  { type: 'hourCalc', title: 'Hour timer', description: 'Coming in a future update.' },
];

function isComingSoonType(type: OverlayWidgetType): boolean {
  return type === 'hourCalc';
}

export function useOverlayControl() {
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
      setOverlayWidgetType(type);
      setActiveWidget(type);
      updateOverlay();
    },
    [],
  );

  const handleStart = useCallback(() => {
    if (hasPermission === false) {
      requestOverlayPermission();
      return;
    }
    try {
      startOverlay();
      setOverlayActive(true);
      setError(null);
    } catch {
      setError('Could not start overlay. Grant "Display over other apps" permission.');
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
        return {
          ...option,
          selected: activeWidget === option.type,
          comingSoon,
          lockedPremium: false,
          locked: comingSoon,
        };
      }),
    [activeWidget],
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

