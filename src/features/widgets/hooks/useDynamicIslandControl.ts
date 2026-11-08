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
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type {
  t as translateFn,
  TranslationKey,
} from '../../../shared/i18n/translate';

function isPremiumLiveActivityType(type: LiveActivityWidgetType): boolean {
  return type === 'month' || type === 'life';
}

const WIDGET_OPTIONS: {
  type: LiveActivityWidgetType;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    type: 'day',
    titleKey: 'nav.today',
    descriptionKey: 'widgets.island.option.day.description',
  },
  {
    type: 'month',
    titleKey: 'nav.thisMonth',
    descriptionKey: 'widgets.island.option.month.description',
  },
  {
    type: 'year',
    titleKey: 'nav.thisYear',
    descriptionKey: 'widgets.island.option.year.description',
  },
  {
    type: 'life',
    titleKey: 'nav.life',
    descriptionKey: 'widgets.island.option.life.description',
  },
  {
    type: 'dailyTasks',
    titleKey: 'widgets.island.option.tasks.title',
    descriptionKey: 'widgets.island.option.tasks.description',
  },
  {
    type: 'hourCalc',
    titleKey: 'widgets.island.option.hour.title',
    descriptionKey: 'widgets.island.option.hour.description',
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
  translate: typeof translateFn,
): string | null {
  if (failure === 'unsupported' || (status && !status.supported)) {
    return translate('widgets.island.problem.unsupported');
  }
  if (failure === 'disabled' || (status && status.supported && !status.enabled)) {
    return translate('widgets.island.problem.disabled');
  }
  if (failure === 'failed') {
    return translate('widgets.island.problem.failed');
  }
  return null;
}

export function useDynamicIslandControl() {
  const { hasPremiumBundle } = useAccessControl();
  const { t } = useTranslation();
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

  const problem = describeProblem(status, failure, t);

  const options = useMemo(
    () =>
      WIDGET_OPTIONS.map(({ type, titleKey, descriptionKey }) => {
        const comingSoon = isComingSoonType(type);
        const lockedPremium =
          !comingSoon && isPremiumLiveActivityType(type) && !hasPremiumBundle;
        return {
          type,
          title: t(titleKey),
          description: t(descriptionKey),
          selected: activeWidget === type,
          comingSoon,
          lockedPremium,
          locked: comingSoon || lockedPremium,
        };
      }),
    [activeWidget, hasPremiumBundle, t],
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
