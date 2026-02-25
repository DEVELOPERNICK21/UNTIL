/**
 * Infrastructure adapter: implements IAppUpdateService using sp-react-native-in-app-updates.
 * All third-party and native details are confined here; domain only sees the port.
 */

import type { IAppUpdateService } from '../../domain/ports/IAppUpdateService';
import { checkForAppUpdate } from '../InAppUpdate';

export class AppUpdateServiceAdapter implements IAppUpdateService {
  checkAndPromptUpdate(): void {
    checkForAppUpdate();
  }
}
