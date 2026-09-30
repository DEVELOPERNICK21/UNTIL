/**
 * Route param lists. Kept apart from the navigators so screens can import
 * them without importing the navigator that imports the screens.
 */

export type AuthStackParamList = {
  Onboarding: undefined;
  IdentitySetup: undefined;
  LifeWeeksPreview: undefined;
  OnboardingPaywall: undefined;
  AccountPrompt: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Life: undefined;
  Widget: undefined;
  WidgetCustomization: undefined;
  CustomCounters: undefined;
  Countdowns: undefined;
  DailyTasks: undefined;
  TaskReport: undefined;
  DayDetail: undefined;
  MonthDetail: undefined;
  YearDetail: undefined;
  MonthlyGoals: undefined;
  GoalDetail: { goalId: string };
  HourCalculation: undefined;
  DynamicIsland: undefined;
  Overlay: undefined;
  ShareSnapshot: undefined;
  Badges: undefined;
  Premium: undefined;
  TasksComingSoon: undefined;
  Account: undefined;
};
