import { useCallback, useMemo, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  syncLiveActivity,
  endLiveActivity,
  getLiveActivityWidgetType,
  setLiveActivityWidgetType,
} from '../infrastructure/WidgetSync';
import type { LiveActivityWidgetType } from '../infrastructure/WidgetSync';
import { useAccessControl } from './useAccessControl';

function isPremiumLiveActivityType(type: LiveActivityWidgetType): boolean {
  return type === 'month' || type === 'life';
}

const { LiveActivityBridge } = NativeModules;

const WIDGET_OPTIONS: {
  type: LiveActivityWidgetType;
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

function isComingSoonType(type: LiveActivityWidgetType): boolean {
  return type === 'hourCalc';
}

export function useDynamicIslandControl() {
  const { hasPremiumBundle } = useAccessControl();
  const [activeWidget, setActiveWidget] = useState<LiveActivityWidgetType>(
    getLiveActivityWidgetType(),
  );
  const [liveActivityActive, setLiveActivityActive] = useState(false);

  const refreshStatus = useCallback(() => {
    if (Platform.OS === 'ios' && LiveActivityBridge?.isActivityActive) {
      LiveActivityBridge.isActivityActive()
        .then((active: boolean) => setLiveActivityActive(active))
        .catch(() => setLiveActivityActive(false));
    }
    setActiveWidget(getLiveActivityWidgetType());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus]),
  );

  const handleSelectWidget = useCallback(
    (type: LiveActivityWidgetType) => {
      if (isComingSoonType(type)) return;
      if (isPremiumLiveActivityType(type) && !hasPremiumBundle) return;
      setLiveActivityWidgetType(type);
      setActiveWidget(type);
      if (liveActivityActive) {
        // Restart so Dynamic Island / Lock Screen switch to the new type now.
        // ContentState-only updates can no-op if an older activity is still running.
        syncLiveActivity(type);
      }
    },
    [liveActivityActive, hasPremiumBundle],
  );

  const handleStart = useCallback(() => {
    syncLiveActivity(activeWidget);
    setLiveActivityActive(true);
  }, [activeWidget]);

  const handleStop = useCallback(() => {
    endLiveActivity();
    setLiveActivityActive(false);
  }, []);

  const options = useMemo(
    () =>
      WIDGET_OPTIONS.map(option => {
        const comingSoon = isComingSoonType(option.type);
        const lockedPremium =
          !comingSoon &&
          isPremiumLiveActivityType(option.type) &&
          !hasPremiumBundle;
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
    liveActivityActive,
    handleSelectWidget,
    handleStart,
    handleStop,
    isIos: Platform.OS === 'ios',
  };
}
