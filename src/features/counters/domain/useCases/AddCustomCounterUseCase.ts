import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';
import type { CustomCounter } from '../../../../shared/types';

export class AddCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(title: string): CustomCounter {
    return this.repository.add(title);
  }
}
