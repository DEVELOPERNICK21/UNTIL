/**
 * SyncWidgetUseCase - Returns widget cache from time repository (SSOT)
 * No I/O: callers persist and bridge to native.
 */

import type { ITimeRepository } from '../repository/ITimeRepository';
import type { WidgetCache } from '../../types';

export class SyncWidgetUseCase {
  constructor(private readonly timeRepository: ITimeRepository) {}

  execute(): WidgetCache {
    return this.timeRepository.getWidgetCache();
  }
}
