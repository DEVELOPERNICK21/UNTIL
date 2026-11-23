/**
 * Screen deep links: `until://open/<Screen>`.
 *
 * The Dynamic Island, the Lock Screen activity and every home screen widget use these so a tap
 * lands on the matching screen (Today, This month, Life, Tasks, Hour timer, Deadlines,
 * Counters...) instead of only opening Home.
 */

import { rootNavigationRef } from '../../shared/navigation/rootNavigationRef';
import { QUICK_RELIEF } from '../../features/pause';
import type { RootStackParamList } from '../../shared/navigation/types';

type OpenableScreen = Extract<
  keyof RootStackParamList,
  | 'DayDetail'
  | 'MonthDetail'
  | 'YearDetail'
  | 'Life'
  | 'DailyTasks'
  | 'HourCalculation'
  | 'Countdowns'
  | 'CustomCounters'
  | 'Badges'
  | 'Premium'
  | 'Pause'
>;

const OPENABLE: ReadonlySet<string> = new Set<OpenableScreen>([
  'DayDetail',
  'MonthDetail',
  'YearDetail',
  'Life',
  'DailyTasks',
  'HourCalculation',
  'Countdowns',
  'CustomCounters',
  'Badges',
  'Premium',
  'Pause',
]);

const OPEN_PATTERN = /^until:\/\/open\/([A-Za-z]+)\/?(?:[?#].*)?$/;

/**
 * `until://open/PauseNow`: the "I need calm now" button for a widget or shortcut. It skips the hub and
 * starts the one-minute quick calm at once, because someone reaching for it is not in a state to choose.
 */
const QUICK_CALM_ROUTE = 'PauseNow';

/** The screen a link asks for, or null if it is not an open link or not allowed. */
export function parseOpenScreenUrl(url: string | null): OpenableScreen | null {
  if (!url || typeof url !== 'string') return null;
  const match = OPEN_PATTERN.exec(url.trim());
  const name = match?.[1];
  return name && OPENABLE.has(name) ? (name as OpenableScreen) : null;
}

/** True for the quick-calm link (`until://open/PauseNow`). */
export function isQuickCalmUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return OPEN_PATTERN.exec(url.trim())?.[1] === QUICK_CALM_ROUTE;
}

const READY_POLL_MS = 250;
const READY_GIVE_UP_MS = 6000;

/**
 * Go to the screen named by an open link. On a cold start the navigator is not
 * up yet, so keep trying for a few seconds. Returns true when the link was an
 * open link (handled now or queued).
 */
export function openScreenFromUrl(url: string | null): boolean {
  const quickCalm = isQuickCalmUrl(url);
  const screen = quickCalm ? null : parseOpenScreenUrl(url);
  if (!quickCalm && !screen) return false;

  const go = (): boolean => {
    if (!rootNavigationRef.isReady()) return false;
    const current = rootNavigationRef.getCurrentRoute()?.name;
    if (quickCalm) {
      // A second tap while already breathing must not restart the minute.
      if (current !== 'PauseSession') {
        rootNavigationRef.navigate('PauseSession', { practice: QUICK_RELIEF, instant: true });
      }
    } else if (screen && current !== screen) {
      rootNavigationRef.navigate(screen);
    }
    return true;
  };

  if (go()) return true;

  let waited = 0;
  const timer = setInterval(() => {
    waited += READY_POLL_MS;
    if (go() || waited >= READY_GIVE_UP_MS) clearInterval(timer);
  }, READY_POLL_MS);
  return true;
}
