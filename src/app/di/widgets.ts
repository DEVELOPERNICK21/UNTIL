/**
 * Widgets feature.
 */

import { SyncWidgetUseCase } from '../../features/widgets/domain/useCases/SyncWidgetUseCase';
import { createWidgetConfigStore } from '../../features/widgets/data/widgetConfigStore';
import { timeRepository, widgetConfigRepository } from './repositories';

export const syncWidgetUseCase = new SyncWidgetUseCase(timeRepository);

export const useWidgetConfigStore = createWidgetConfigStore(widgetConfigRepository);
