/**
 * Custom counters feature.
 */

import { GetCustomCountersUseCase } from '../../features/counters/domain/useCases/GetCustomCountersUseCase';
import { AddCustomCounterUseCase } from '../../features/counters/domain/useCases/AddCustomCounterUseCase';
import { RemoveCustomCounterUseCase } from '../../features/counters/domain/useCases/RemoveCustomCounterUseCase';
import { IncrementCustomCounterUseCase } from '../../features/counters/domain/useCases/IncrementCustomCounterUseCase';
import { DecrementCustomCounterUseCase } from '../../features/counters/domain/useCases/DecrementCustomCounterUseCase';
import { ResetCustomCounterUseCase } from '../../features/counters/domain/useCases/ResetCustomCounterUseCase';
import { ShowCounterOnWidgetUseCase } from '../../features/counters/domain/useCases/ShowCounterOnWidgetUseCase';
import { ReplaceCustomCountersFromSyncUseCase } from '../../features/counters/domain/useCases/ReplaceCustomCountersFromSyncUseCase';
import { customCounterRepository } from './repositories';

export const getCustomCountersUseCase = new GetCustomCountersUseCase(customCounterRepository);

export const addCustomCounterUseCase = new AddCustomCounterUseCase(customCounterRepository);

export const removeCustomCounterUseCase = new RemoveCustomCounterUseCase(customCounterRepository);

export const incrementCustomCounterUseCase = new IncrementCustomCounterUseCase(customCounterRepository);

export const decrementCustomCounterUseCase = new DecrementCustomCounterUseCase(customCounterRepository);

export const resetCustomCounterUseCase = new ResetCustomCounterUseCase(customCounterRepository);

export const showCounterOnWidgetUseCase = new ShowCounterOnWidgetUseCase(customCounterRepository);

export const replaceCustomCountersFromSyncUseCase = new ReplaceCustomCountersFromSyncUseCase(customCounterRepository);
