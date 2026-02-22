import type { ICountdownRepository } from '../repository/ICountdownRepository';
import type { Countdown } from '../../types';

export class AddCountdownUseCase {
  constructor(private repository: ICountdownRepository) {}

  execute(title: string, date: string): Countdown {
    return this.repository.add(title, date);
  }
}
