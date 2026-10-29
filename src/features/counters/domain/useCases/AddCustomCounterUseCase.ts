import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';
import type { CustomCounter } from '../../../../shared/types';

export class AddCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  /** Returns null, and changes nothing, when the person already holds `limit` counters. */
  execute(title: string, limit: number): CustomCounter | null {
    if (this.repository.getAll().length >= limit) return null;
    return this.repository.add(title);
  }
}
