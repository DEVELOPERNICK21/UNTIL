import { useCallback, useMemo, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  syncLiveActivity,
  endLiveActivity,
  getLiveActivityWidgetType,
  setLiveActivityWidgetType,
  updateLiveActivity,
} from '../infrastructure/WidgetSync';
import type { LiveActivityWidgetType } from '../infrastructure/WidgetSync';

const { LiveActivityBridge } = NativeModules;

const WIDGET_OPTIONS: {
  type: LiveActivityWidgetType;
  title: string;
  description: string;
}[] = [
  {
    type: 'day',
    title: 'Today',
    description: '57% done · 42% left. Day progress with hours.',
  },
  {
    type: 'month',
    title: 'This month',
    description: 'Feb 17% · 23d left. Month progress.',
  },
  {
    type: 'year',
    title: 'This year',
    description: '9% · 329d left. Year progress.',
  },
  {
    type: 'life',
    title: 'Your life',
    description: 'Life progress. Set birth date in Settings.',
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
      setLiveActivityWidgetType(type);
      setActiveWidget(type);
      if (liveActivityActive) {
        updateLiveActivity(type);
      }
    },
    [liveActivityActive],
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
    liveActivityActive,
    handleSelectWidget,
    handleStart,
    handleStop,
    isIos: Platform.OS === 'ios',
  };
}
