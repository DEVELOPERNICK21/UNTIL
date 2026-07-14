import type {
  EngagementModalState,
  IEngagementRepository,
} from '../repository/IEngagementRepository';

export class GetEngagementModalStateUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): EngagementModalState {
    return this.engagementRepository.getModalState();
  }
}
