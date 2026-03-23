import { useCallback, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isOverlayEnabled } from '../infrastructure/WidgetSync';

const { LiveActivityBridge } = NativeModules;

export function useWidgetSurfaceStatus() {
  const [liveActivityActive, setLiveActivityActive] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);

  const refreshStatus = useCallback(() => {
    if (Platform.OS === 'ios' && LiveActivityBridge?.isActivityActive) {
      LiveActivityBridge.isActivityActive()
        .then((active: boolean) => setLiveActivityActive(active))
        .catch(() => setLiveActivityActive(false));
    }
    if (Platform.OS === 'android') {
      setOverlayActive(isOverlayEnabled());
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus]),
  );

  return { liveActivityActive, overlayActive };
}

