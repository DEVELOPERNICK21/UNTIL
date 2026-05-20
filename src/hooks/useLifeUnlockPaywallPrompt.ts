import { useEffect, useState } from 'react';
import { useAccessControl } from './useAccessControl';
import { shouldPromptLifeUnlockEnded } from '../services/paywallPrompt';

/**
 * Shows interstitial when 24h Life preview ended (audit: highest-intent upgrade moment).
 */
export function useLifeUnlockPaywallPrompt(enabled: boolean = true) {
  const { access } = useAccessControl();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (shouldPromptLifeUnlockEnded(access)) {
      setVisible(true);
    }
  }, [enabled, access]);

  const dismiss = () => setVisible(false);

  return { visible, dismiss };
}
