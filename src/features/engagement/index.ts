/**
 * Public API of the engagement feature. Other features and the app import from here only;
 * everything else in this folder is private. Add an export deliberately when another module needs it.
 */

export {
  recordRetentionAppOpen,
  scheduleRetentionNotifications,
} from './data/retentionNotifications';
export { useEngagementModals } from './hooks/useEngagementModals';
export { useInAppReview } from './hooks/useInAppReview';
export { useRetentionNotifications } from './hooks/useRetentionNotifications';
export { FeatureDiscoveryModal } from './ui/FeatureDiscoveryModal';
export { SharePromptModal } from './ui/SharePromptModal';
export { WidgetCoachModal } from './ui/WidgetCoachModal';
