/**
 * Public API of the presence feature. Other features and the app import from here only;
 * everything else in this folder is private. Add an export deliberately when another module needs it.
 */

export {
  schedulePresenceStreakSaver,
} from './services/presenceStreakNotifications';
export { usePresenceStreak } from './hooks/usePresenceStreak';
export { useStreakCelebration } from './hooks/useStreakCelebration';
export { StreakChip } from './ui/StreakChip';
