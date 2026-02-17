/**
 * UpdateUserProfileUseCase - Updates user profile via TimeRepository
 */

import type { ITimeRepository } from '../repository/TimeRepository';

export class UpdateUserProfileUseCase {
  constructor(private readonly repository: ITimeRepository) {}

  execute(birthDate: string, deathAge: number): void {
    this.repository.setUserProfile(birthDate, deathAge);
  }
}
