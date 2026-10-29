/**
 * One-tap "add this widget to my home screen" (Android 8+). The launcher shows its own
 * confirmation; we then watch the widget status so analytics can tell a request from a widget
 * that really landed. iOS has no equivalent, so everything here is a no-op there.
 */

import { NativeModules, Platform } from 'react-native';
import { logAnalyticsEvent } from '../analytics/analytics';
import { MS_PER_SECOND } from '../time/constants';

export type PinWidgetKind = 'day' | 'year' | 'month' | 'life' | 'deadlines';
export type PinWidgetOutcome = 'requested' | 'unsupported' | 'error';

/** Field of the native widget status that flips to true once a widget of that kind exists. */
const STATUS_FIELD: Record<PinWidgetKind, string> = {
  day: 'dayWidgetAdded',
  year: 'yearWidgetAdded',
  month: 'monthWidgetAdded',
  life: 'lifeWidgetAdded',
  deadlines: 'deadlinesWidgetAdded',
};

const CONFIRM_POLL_MS = 700;
const CONFIRM_GIVE_UP_MS = 20 * MS_PER_SECOND;

type WidgetStatus = Record<string, boolean | undefined>;

interface WidgetBridgeShape {
  canPinWidgets?: () => Promise<boolean>;
  requestPinWidget?: (kind: PinWidgetKind) => Promise<string>;
  getWidgetStatus?: () => Promise<WidgetStatus>;
}

function bridge(): WidgetBridgeShape | undefined {
  return Platform.OS === 'android' ? NativeModules.WidgetBridge : undefined;
}

async function readStatus(): Promise<WidgetStatus | null> {
  try {
    return (await bridge()?.getWidgetStatus?.()) ?? null;
  } catch {
    return null;
  }
}

/** True when this phone's launcher can place a widget for us. */
export async function canPinWidgets(): Promise<boolean> {
  try {
    return (await bridge()?.canPinWidgets?.()) === true;
  } catch {
    return false;
  }
}

function watchForPinnedWidget(kind: PinWidgetKind, source: string): void {
  const startedAt = Date.now();
  const check = async () => {
    const status = await readStatus();
    if (status?.[STATUS_FIELD[kind]]) {
      void logAnalyticsEvent('widget_pin_confirmed', {
        kind,
        source,
        seconds: Math.round((Date.now() - startedAt) / MS_PER_SECOND),
      });
      return;
    }
    if (Date.now() - startedAt < CONFIRM_GIVE_UP_MS) {
      setTimeout(check, CONFIRM_POLL_MS);
    }
  };
  setTimeout(check, CONFIRM_POLL_MS);
}

export async function requestPinWidget(
  kind: PinWidgetKind,
  source: string,
): Promise<PinWidgetOutcome> {
  const native = bridge();
  if (typeof native?.requestPinWidget !== 'function') {
    void logAnalyticsEvent('widget_pin_requested', {
      kind,
      source,
      outcome: 'unsupported',
    });
    return 'unsupported';
  }

  const alreadyAdded = (await readStatus())?.[STATUS_FIELD[kind]] === true;
  try {
    const result = await native.requestPinWidget(kind);
    const outcome: PinWidgetOutcome =
      result === 'requested' ? 'requested' : 'unsupported';
    void logAnalyticsEvent('widget_pin_requested', {
      kind,
      source,
      outcome,
      had_widget: alreadyAdded,
    });
    // With one of this kind already on the screen we cannot tell the new one from the old.
    if (outcome === 'requested' && !alreadyAdded) {
      watchForPinnedWidget(kind, source);
    }
    return outcome;
  } catch {
    void logAnalyticsEvent('widget_pin_requested', {
      kind,
      source,
      outcome: 'error',
    });
    return 'error';
  }
}
