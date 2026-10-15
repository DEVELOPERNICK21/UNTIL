import type { ICountdownRepository } from '../ports/ICountdownRepository';
import type { Countdown } from '../../../../shared/types';

export class GetCountdownsUseCase {
  constructor(private repository: ICountdownRepository) {}

  execute(): Countdown[] {
    return this.repository.getAll();
  }
}
