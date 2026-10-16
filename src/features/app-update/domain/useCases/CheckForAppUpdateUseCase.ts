import type { IAppUpdateService } from '../ports/IAppUpdateService';

/**
 * Use case: check store for a newer version and prompt to update.
 * Depends only on the port; infrastructure provides the implementation.
 */
export class CheckForAppUpdateUseCase {
  constructor(private readonly appUpdateService: IAppUpdateService) {}

  execute(): void {
    this.appUpdateService.checkAndPromptUpdate();
  }
}
