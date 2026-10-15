import type { IActivityRepository } from '../ports/IActivityRepository';

export class SetDailyLimitNothingUseCase {
  constructor(private readonly repository: IActivityRepository) {}

  execute(hours: number): void {
    this.repository.setDailyLimitNothing(hours);
  }
}
