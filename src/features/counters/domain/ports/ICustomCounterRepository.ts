/**
 * ICustomCounterRepository - Port for custom counter data (tap-to-increment widgets).
 */

import type { CustomCounter } from '../../../../shared/types';

type Subscriber = () => void;

export interface ICustomCounterRepository {
  getAll(): CustomCounter[];
  add(title: string): CustomCounter;
  remove(id: string): void;
  increment(id: string): void;
  /** One less, never below zero: the undo for a tap by mistake. */
  decrement(id: string): void;
  /** Back to zero, keeping the counter and its title. */
  reset(id: string): void;
  /** Makes this the counter the widgets show: they read the first one. */
  moveToFront(id: string): void;
  replaceAll(counters: CustomCounter[]): void;
  subscribe(callback: Subscriber): () => void;
}
