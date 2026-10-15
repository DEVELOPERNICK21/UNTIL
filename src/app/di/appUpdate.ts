/**
 * App-update feature.
 */

import { CheckForAppUpdateUseCase } from '../../features/app-update/domain/useCases/CheckForAppUpdateUseCase';
import { GetAppVersionUseCase } from '../../features/app-update/domain/useCases/GetAppVersionUseCase';
import { appUpdateService, appVersionProvider } from './repositories';

export const checkForAppUpdateUseCase = new CheckForAppUpdateUseCase(appUpdateService);

export const getAppVersionUseCase = new GetAppVersionUseCase(appVersionProvider);
