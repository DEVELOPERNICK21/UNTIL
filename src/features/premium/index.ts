/**
 * Public API of the premium feature. Other features and the app import from here only;
 * everything else in this folder is private. Add an export deliberately when another module needs it.
 */

export { shouldShowDeferredPaywall } from './data/deferredPaywall';
export { shouldPromptLifeUnlockEnded } from './data/paywallPrompt';
export { useAccessControl } from './hooks/useAccessControl';
export { useManageSubscription } from './hooks/useManageSubscription';
export { useObserveSubscription } from './hooks/useObserveSubscription';
export { useTrialEndingReminder } from './hooks/useTrialEndingReminder';
export { DeferredPaywallModal } from './ui/DeferredPaywallModal';
export { LifeUnlockEndedModal } from './ui/LifeUnlockEndedModal';
export { OnboardingPaywallScreen } from './ui/OnboardingPaywallScreen';
export { PremiumScreen } from './ui/PremiumScreen';
export { TrialEndingModal } from './ui/TrialEndingModal';
