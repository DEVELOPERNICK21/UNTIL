import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';

export class RemoveCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.remove(id);
  }
}
