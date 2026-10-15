/**
 * Custom counters feature.
 */

import { GetCustomCountersUseCase } from '../../features/counters/domain/useCases/GetCustomCountersUseCase';
import { AddCustomCounterUseCase } from '../../features/counters/domain/useCases/AddCustomCounterUseCase';
import { RemoveCustomCounterUseCase } from '../../features/counters/domain/useCases/RemoveCustomCounterUseCase';
import { IncrementCustomCounterUseCase } from '../../features/counters/domain/useCases/IncrementCustomCounterUseCase';
import { ReplaceCustomCountersFromSyncUseCase } from '../../features/counters/domain/useCases/ReplaceCustomCountersFromSyncUseCase';
import { customCounterRepository } from './repositories';

export const getCustomCountersUseCase = new GetCustomCountersUseCase(customCounterRepository);

export const addCustomCounterUseCase = new AddCustomCounterUseCase(customCounterRepository);

export const removeCustomCounterUseCase = new RemoveCustomCounterUseCase(customCounterRepository);

export const incrementCustomCounterUseCase = new IncrementCustomCounterUseCase(customCounterRepository);

export const replaceCustomCountersFromSyncUseCase = new ReplaceCustomCountersFromSyncUseCase(customCounterRepository);
