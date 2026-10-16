/**
 * Public API of the account feature. Other features and the app import from here only;
 * everything else in this folder is private. Add an export deliberately when another module needs it.
 */

export { MINIMUM_ACCOUNT_AGE_YEARS } from './domain/ageGate';
export { useAuthBootstrap } from './hooks/useAuthBootstrap';
export { useAuthSession } from './hooks/useAuthSession';
export { AccountPromptScreen } from './ui/AccountPromptScreen';
export { AccountScreen } from './ui/AccountScreen';
export { IdentitySetupScreen } from './ui/IdentitySetupScreen';
