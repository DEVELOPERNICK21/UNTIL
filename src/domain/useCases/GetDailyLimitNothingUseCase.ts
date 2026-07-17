import type { IActivityRepository } from '../repository/IActivityRepository';

export class GetDailyLimitNothingUseCase {
  constructor(private readonly repository: IActivityRepository) {}

  execute(): number {
    return this.repository.getDailyLimitNothing();
  }
}
