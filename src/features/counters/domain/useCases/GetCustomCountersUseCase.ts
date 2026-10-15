import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';
import type { CustomCounter } from '../../../../shared/types';

export class GetCustomCountersUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(): CustomCounter[] {
    return this.repository.getAll();
  }
}
