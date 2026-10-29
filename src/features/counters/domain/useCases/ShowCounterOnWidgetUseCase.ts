import type { ICustomCounterRepository } from '../ports/ICustomCounterRepository';

/** Picks which counter the home screen widget and the watch show. */
export class ShowCounterOnWidgetUseCase {
  constructor(private repository: ICustomCounterRepository) {}

  execute(id: string): void {
    this.repository.moveToFront(id);
  }
}
