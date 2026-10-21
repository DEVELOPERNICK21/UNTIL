import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';

export class DecrementCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.decrement(id);
  }
}
