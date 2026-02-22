import type { ICountdownRepository } from '../repository/ICountdownRepository';
import type { Countdown } from '../../types';

export class GetCountdownsUseCase {
  constructor(private repository: ICountdownRepository) {}

  execute(): Countdown[] {
    return this.repository.getAll();
  }
}
