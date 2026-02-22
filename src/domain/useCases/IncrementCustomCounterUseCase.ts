import type { ICustomCounterRepository } from '../repository/ICustomCounterRepository';

export class IncrementCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.increment(id);
  }
}
