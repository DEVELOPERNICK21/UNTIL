import { useCallback, useMemo, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
  getLiveActivityStatus,
  getLiveActivityWidgetType,
  setLiveActivityWidgetType,
} from '../data/WidgetSync';
import type {
  LiveActivityStatus,
  LiveActivityWidgetType,
} from '../data/WidgetSync';
import { useAccessControl } from '../../premium';

function isPremiumLiveActivityType(type: LiveActivityWidgetType): boolean {
  return type === 'month' || type === 'life';
}

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
    type: 'dailyTasks',
    title: 'Tasks',
    description: 'Tasks left today.',
  },
  {
    type: 'hourCalc',
    title: 'Hour timer',
    description: 'A stopwatch you can start and stop from the island.',
  },
];

function isComingSoonType(_type: LiveActivityWidgetType): boolean {
  return false;
}

type StartFailure = 'disabled' | 'unsupported' | 'failed';

/** What to tell the user when the island is not showing, or null when all is well. */
function describeProblem(
  status: LiveActivityStatus | null,
  failure: StartFailure | null,
): string | null {
  if (failure === 'unsupported' || (status && !status.supported)) {
    return 'The Dynamic Island needs iOS 16.2 or later.';
  }
  if (failure === 'disabled' || (status && status.supported && !status.enabled)) {
    return 'Live Activities are off for UNTIL. Turn them on in Settings, then come back and press Start.';
  }
  if (failure === 'failed') {
    return 'Could not start it. Keep UNTIL open on this screen and press Start again.';
  }
  return null;
}

export function useDynamicIslandControl() {
  const { hasPremiumBundle } = useAccessControl();
  const [activeWidget, setActiveWidget] = useState<LiveActivityWidgetType>(
    getLiveActivityWidgetType(),
  );
  const [liveActivityActive, setLiveActivityActive] = useState(false);
  const [status, setStatus] = useState<LiveActivityStatus | null>(null);
  const [failure, setFailure] = useState<StartFailure | null>(null);

  const refreshStatus = useCallback(() => {
    if (Platform.OS === 'ios') {
      getLiveActivityStatus().then(next => {
        setStatus(next);
        setLiveActivityActive(next.active);
        if (next.enabled) setFailure(prev => (prev === 'disabled' ? null : prev));
      });
    }
    setActiveWidget(getLiveActivityWidgetType());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
      // Coming back from iOS Settings after turning Live Activities on.
      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') refreshStatus();
      });
      return () => sub.remove();
    }, [refreshStatus]),
  );

  const handleSelectWidget = useCallback(
    (type: LiveActivityWidgetType) => {
      if (isComingSoonType(type)) return;
      if (isPremiumLiveActivityType(type) && !hasPremiumBundle) return;
      setLiveActivityWidgetType(type);
      setActiveWidget(type);
      // Update in place: the island cross-fades to the new view instead of restarting.
      if (liveActivityActive) updateLiveActivity(type);
    },
    [liveActivityActive, hasPremiumBundle],
  );

  const handleStart = useCallback(async () => {
    setFailure(null);
    const result = await startLiveActivity(activeWidget);
    if (!result.ok) setFailure(result.reason);
    refreshStatus();
  }, [activeWidget, refreshStatus]);

  const handleStop = useCallback(() => {
    endLiveActivity();
    setLiveActivityActive(false);
    setFailure(null);
  }, []);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  const problem = describeProblem(status, failure);

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
    problem,
    showSettingsAction: failure === 'disabled' || (status?.supported && !status.enabled) || false,
    handleSelectWidget,
    handleStart,
    handleStop,
    handleOpenSettings,
    isIos: Platform.OS === 'ios',
  };
}
