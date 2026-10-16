import type { ICountdownRepository } from '../ports/ICountdownRepository';

export class RemoveCountdownUseCase {
  constructor(private repository: ICountdownRepository) {}

  execute(id: string): void {
    this.repository.remove(id);
  }
}
