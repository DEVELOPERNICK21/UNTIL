/**
 * SyncWidgetUseCase - Returns widget cache from time repository (SSOT)
 * No I/O: callers persist and bridge to native.
 */

import type { ITimeRepository } from '../../../time/domain';
import type { WidgetCache } from '../../../../shared/types';

export class SyncWidgetUseCase {
  constructor(private readonly timeRepository: ITimeRepository) {}

  execute(): WidgetCache {
    return this.timeRepository.getWidgetCache();
  }
}
