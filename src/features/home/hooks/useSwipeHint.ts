import { useCallback, useEffect, useState } from 'react';
import {
  markSwipeHintLearned,
  recordSwipeHintShown,
  shouldShowSwipeHint,
} from '../services/swipeHint';

/** Whether to show the swipe hint on this visit to Home, and how to say it has been learned. */
export function useSwipeHint(): { visible: boolean; learned: () => void } {
  const [visible, setVisible] = useState(shouldShowSwipeHint);

  useEffect(() => {
    if (visible) recordSwipeHintShown();
    // Counting a visit happens once, when Home first shows the hint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const learned = useCallback(() => {
    markSwipeHintLearned();
    setVisible(false);
  }, []);

  return { visible, learned };
}
