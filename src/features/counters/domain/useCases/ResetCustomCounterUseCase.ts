import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';

export class ResetCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.reset(id);
  }
}
