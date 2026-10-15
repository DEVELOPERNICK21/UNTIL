/**
 * Public API of the app-update feature. Other features and the app import from here only;
 * everything else in this folder is private. Add an export deliberately when another module needs it.
 */

export { recordOptionalUpdateDismissed } from './data/updateService';
export { useAppUpdateCheck } from './hooks/useAppUpdateCheck';
export { useAppVersion } from './hooks/useAppVersion';
export { ForceUpdateModal } from './ui/ForceUpdateModal';
export { OptionalUpdateModal } from './ui/OptionalUpdateModal';
