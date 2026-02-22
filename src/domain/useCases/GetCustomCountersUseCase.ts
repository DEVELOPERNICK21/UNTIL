import type { ICustomCounterRepository } from '../repository/ICustomCounterRepository';
import type { CustomCounter } from '../../types';

export class GetCustomCountersUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(): CustomCounter[] {
    return this.repository.getAll();
  }
}
