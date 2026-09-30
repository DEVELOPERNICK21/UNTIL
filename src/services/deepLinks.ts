/**
 * Screen deep links: `until://open/<Screen>`.
 *
 * The Dynamic Island and Lock Screen activity use these so a tap lands on the
 * matching screen (Today detail, Tasks, Life...) instead of only opening Home.
 */

import { rootNavigationRef } from '../navigation/rootNavigationRef';
import type { RootStackParamList } from '../navigation/types';

type OpenableScreen = Extract<
  keyof RootStackParamList,
  | 'DayDetail'
  | 'MonthDetail'
  | 'YearDetail'
  | 'Life'
  | 'DailyTasks'
  | 'HourCalculation'
  | 'Badges'
  | 'Premium'
>;

const OPENABLE: ReadonlySet<string> = new Set<OpenableScreen>([
  'DayDetail',
  'MonthDetail',
  'YearDetail',
  'Life',
  'DailyTasks',
  'HourCalculation',
  'Badges',
  'Premium',
]);

const OPEN_PATTERN = /^until:\/\/open\/([A-Za-z]+)\/?(?:[?#].*)?$/;

/** The screen a link asks for, or null if it is not an open link or not allowed. */
export function parseOpenScreenUrl(url: string | null): OpenableScreen | null {
  if (!url || typeof url !== 'string') return null;
  const match = OPEN_PATTERN.exec(url.trim());
  const name = match?.[1];
  return name && OPENABLE.has(name) ? (name as OpenableScreen) : null;
}

const READY_POLL_MS = 250;
const READY_GIVE_UP_MS = 6000;

/**
 * Go to the screen named by an open link. On a cold start the navigator is not
 * up yet, so keep trying for a few seconds. Returns true when the link was an
 * open link (handled now or queued).
 */
export function openScreenFromUrl(url: string | null): boolean {
  const screen = parseOpenScreenUrl(url);
  if (!screen) return false;

  const go = (): boolean => {
    if (!rootNavigationRef.isReady()) return false;
    const current = rootNavigationRef.getCurrentRoute()?.name;
    if (current !== screen) rootNavigationRef.navigate(screen);
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
