import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';
import type { CustomCounter } from '../../../../shared/types';

/**
 * Replaces all custom counters with the given list (e.g. from iOS App Group after widget tap increments).
 */
export class ReplaceCustomCountersFromSyncUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(counters: CustomCounter[]): void {
    this.repository.replaceAll(counters);
  }
}
