/**
 * Port: check for app updates and prompt the user.
 * Implemented by infrastructure (e.g. Play/App Store).
 */

export interface IAppUpdateService {
  checkAndPromptUpdate(): void;
}
