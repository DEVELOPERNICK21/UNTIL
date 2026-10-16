import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';

export class IncrementCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.increment(id);
  }
}
