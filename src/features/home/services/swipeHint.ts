import { getNumber, setNumber } from '../../../shared/persistence/mmkv';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';

/** "Swipe left for task report" is shown for the first few opens, or until the person swipes. */
const MAX_SHOWS = 3;

export function shouldShowSwipeHint(): boolean {
  return (getNumber(STORAGE_KEYS.HOME_SWIPE_HINT_SHOWN) ?? 0) < MAX_SHOWS;
}

export function recordSwipeHintShown(): void {
  setNumber(STORAGE_KEYS.HOME_SWIPE_HINT_SHOWN, (getNumber(STORAGE_KEYS.HOME_SWIPE_HINT_SHOWN) ?? 0) + 1);
}

/** They found it, so stop reminding them. */
export function markSwipeHintLearned(): void {
  setNumber(STORAGE_KEYS.HOME_SWIPE_HINT_SHOWN, MAX_SHOWS);
}
