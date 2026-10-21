/**
 * React binding for the one-tap widget add: whether this launcher supports it, a busy flag, and
 * a `pin` action that falls back to plain instructions when the launcher says no.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  canPinWidgets,
  requestPinWidget,
  type PinWidgetKind,
  type PinWidgetOutcome,
} from './widgetPin';

const MANUAL_STEPS =
  'Long-press an empty spot on your home screen, tap Widgets, then pick UNTIL.';

export function usePinWidget(kind: PinWidgetKind, source: string) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void canPinWidgets().then(ok => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pin = useCallback(async (): Promise<PinWidgetOutcome> => {
    setBusy(true);
    try {
      const outcome = await requestPinWidget(kind, source);
      if (outcome !== 'requested') {
        Alert.alert('Add it by hand', MANUAL_STEPS);
      }
      return outcome;
    } finally {
      setBusy(false);
    }
  }, [kind, source]);

  return { available, busy, pin };
}
