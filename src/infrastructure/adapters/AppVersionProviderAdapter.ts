/**
 * Infrastructure adapter: implements IAppVersionProvider using device-info or package.json.
 */

import type { IAppVersionProvider } from '../../domain/ports/IAppVersionProvider';
import { getAppVersion, getBuildNumber } from '../AppVersion';

export class AppVersionProviderAdapter implements IAppVersionProvider {
  getVersion(): string {
    return getAppVersion();
  }

  getBuildNumber(): string | null {
    return getBuildNumber();
  }
}
