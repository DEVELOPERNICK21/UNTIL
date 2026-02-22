import type { ICustomCounterRepository } from '../repository/ICustomCounterRepository';

export class RemoveCustomCounterUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.remove(id);
  }
}
