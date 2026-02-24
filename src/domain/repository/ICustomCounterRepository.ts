/**
 * ICustomCounterRepository - Port for custom counter data (tap-to-increment widgets).
 */

import type { CustomCounter } from '../../types';

type Subscriber = () => void;

export interface ICustomCounterRepository {
  getAll(): CustomCounter[];
  add(title: string): CustomCounter;
  remove(id: string): void;
  increment(id: string): void;
  replaceAll(counters: CustomCounter[]): void;
  subscribe(callback: Subscriber): () => void;
}
