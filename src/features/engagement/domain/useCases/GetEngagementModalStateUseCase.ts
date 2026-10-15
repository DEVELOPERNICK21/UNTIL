import type {
  EngagementModalState,
  IEngagementRepository,
} from '../ports/IEngagementRepository';

export class GetEngagementModalStateUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): EngagementModalState {
    return this.engagementRepository.getModalState();
  }
}
