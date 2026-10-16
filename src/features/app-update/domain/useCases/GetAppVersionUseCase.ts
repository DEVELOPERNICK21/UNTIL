import type { IAppVersionProvider } from '../ports/IAppVersionProvider';

/**
 * Use case: get current app version and build for display.
 */
export class GetAppVersionUseCase {
  constructor(private readonly appVersionProvider: IAppVersionProvider) {}

  execute(): { version: string; buildNumber: string | null } {
    return {
      version: this.appVersionProvider.getVersion(),
      buildNumber: this.appVersionProvider.getBuildNumber(),
    };
  }
}
