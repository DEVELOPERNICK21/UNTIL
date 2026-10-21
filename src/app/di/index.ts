/**
 * Composition root - wires data adapters to domain use cases.
 *
 * The one place where repository implementations are instantiated and injected into use cases,
 * split into one file per feature (and `repositories` for the leaf adapters). Hooks import their
 * use cases from here; nothing else in a feature may import app/di (see ARCHITECTURE.md).
 * Importing this barrel runs every section, including `wiring`.
 */

export {
  accountCloudStore,
  authService,
  authSessionRepository,
  deviceIdProvider,
  paywallPresenter,
  purchasesRepository,
} from './repositories';
export { observeTimeStateUseCase, updateUserProfileUseCase } from './time';
export { getPresenceStreakUseCase, recordPresenceUseCase } from './presence';
export {
  acknowledgeBadgesUseCase,
  evaluateBadgesUseCase,
  getBadgesUseCase,
} from './badges';
export {
  addGoalTaskUseCase,
  addMonthlyGoalUseCase,
  addTaskUseCase,
  addToDailyFromGoalUseCase,
  getDailyTaskStatsUseCase,
  getGoalUseCase,
  getMonthlyGoalsUseCase,
  getMonthlyTaskStatsUseCase,
  getStoredTasksForDayUseCase,
  getTasksForDayUseCase,
  getWeeklyTaskStatsUseCase,
  isRepeatDailyUseCase,
  moveTaskUseCase,
  moveTasksUseCase,
  observeDailyTasksUseCase,
  removeGoalTaskUseCase,
  removeMonthlyGoalUseCase,
  removeRepeatDailyFromGoalUseCase,
  removeTaskUseCase,
  setRepeatDailyFromGoalUseCase,
  taskCarryoverDismissalUseCase,
  toggleTaskUseCase,
  updateGoalTaskUseCase,
  updateMonthlyGoalUseCase,
  updateTaskUseCase,
} from './tasks';
export {
  addCountdownUseCase,
  checkCountdownCompletionUseCase,
  getCountdownsUseCase,
  removeCountdownUseCase,
} from './countdowns';
export {
  addCustomCounterUseCase,
  getCustomCountersUseCase,
  incrementCustomCounterUseCase,
  removeCustomCounterUseCase,
  replaceCustomCountersFromSyncUseCase,
} from './counters';
export {
  getCategoryTotalsUseCase,
  getDailyLimitNothingUseCase,
  getInterventionStateUseCase,
  getRegretProjectionUseCase,
  logActivityUseCase,
  setDailyLimitNothingUseCase,
} from './activity';
export { getDailyReflectionUseCase } from './reflections';
export {
  advanceOnboardingFunnelUseCase,
  getOnboardingCompletedUseCase,
  getOnboardingFunnelEncouragementUseCase,
  getOnboardingFunnelProgressUseCase,
  getOnboardingFunnelStepUseCase,
  getOnboardingQuizAnswersUseCase,
  getOnboardingResultCardsUseCase,
  patchOnboardingQuizAnswersUseCase,
  rewindOnboardingFunnelUseCase,
  setOnboardingCompletedUseCase,
  setOnboardingFunnelStepUseCase,
} from './onboarding';
export { assertAccountAgeGateUseCase } from './ageGate';
export {
  activateLicenseUseCase,
  configurePurchasesUseCase,
  ensurePurchasesConfigured,
  getAccessStateUseCase,
  getOfferingsUseCase,
  identifyPurchasesUserUseCase,
  observeSubscriptionUseCase,
  presentRevenueCatPaywallUseCase,
  purchasePackageUseCase,
  resetPurchasesUserUseCase,
  restorePurchasesUseCase,
  syncCustomerInfoUseCase,
  syncTrialPreviewUseCase,
  updateSubscriptionUseCase,
  verifyStudentEmailUseCase,
  verifySubscriptionUseCase,
} from './premium';
export {
  clearSharePromptPendingUseCase,
  clearWidgetCoachPendingUseCase,
  getEngagementModalStateUseCase,
  getReminderOptInDueUseCase,
  markFeatureCoachShownUseCase,
  maybeRequestInAppReviewUseCase,
  recordReminderOptInAskUseCase,
  requestInAppReviewFromSettingsUseCase,
  runAppOpenSideEffectsUseCase,
  setWidgetCoachPendingUseCase,
  trackAppOpenUseCase,
} from './engagement';
export { trackLifeScreenViewedUseCase } from './life';
export { checkForAppUpdateUseCase, getAppVersionUseCase } from './appUpdate';
export {
  bindEntitlementToAccountUseCase,
  completeAccountSignInUseCase,
  createAccountWithEmailUseCase,
  deleteAccountUseCase,
  observeAuthSessionUseCase,
  registerDeviceUseCase,
  removeAccountDeviceUseCase,
  signInWithAppleUseCase,
  sendPasswordResetUseCase,
  signInWithEmailUseCase,
  signInWithGoogleUseCase,
  signOutUseCase,
  syncAccountProfileUseCase,
} from './account';
export { syncWidgetUseCase, useWidgetConfigStore } from './widgets';
import './wiring';
