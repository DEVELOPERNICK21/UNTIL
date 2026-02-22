import type { ICustomCounterRepository } from '../repository/ICustomCounterRepository';
import type { CustomCounter } from '../../types';

export class AddCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(title: string): CustomCounter {
    return this.repository.add(title);
  }
}
