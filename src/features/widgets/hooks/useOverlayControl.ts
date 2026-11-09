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
} from '../data/WidgetSync';
import type { OverlayWidgetType } from '../data/WidgetSync';
import { useAccessControl } from '../../premium';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';

function isPremiumOverlayType(type: OverlayWidgetType): boolean {
  return type === 'month' || type === 'life';
}

const WIDGET_OPTIONS: {
  type: OverlayWidgetType;
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
    type: 'hourCalc',
    titleKey: 'widgets.island.option.hour.title',
    descriptionKey: 'widgets.tile.comingSoon',
  },
];

function isComingSoonType(type: OverlayWidgetType): boolean {
  return type === 'hourCalc';
}

export function useOverlayControl() {
  const { hasPremiumBundle } = useAccessControl();
  const { t } = useTranslation();
  const [activeWidget, setActiveWidget] = useState<OverlayWidgetType>(
    getOverlayWidgetType(),
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);
  // A flag, not the text, so the message follows the language when it changes.
  const [startFailed, setStartFailed] = useState(false);

  const refreshStatus = useCallback(() => {
    setActiveWidget(getOverlayWidgetType());
    setStartFailed(false);
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
      setStartFailed(false);
      if (hasPermission === false) {
        // Notification-only mode still runs; offer overlay permission separately.
      }
    } catch {
      setStartFailed(true);
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
      WIDGET_OPTIONS.map(({ type, titleKey, descriptionKey }) => {
        const comingSoon = isComingSoonType(type);
        const lockedPremium =
          !comingSoon && isPremiumOverlayType(type) && !hasPremiumBundle;
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
    hasPermission,
    overlayActive,
    error: startFailed ? t('widgets.island.problem.androidStart') : null,
    handleSelectWidget,
    handleStart,
    handleStop,
    handleOpenSettings,
    isAndroid: Platform.OS === 'android',
  };
}

