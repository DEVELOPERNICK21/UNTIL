/**
 * ICountdownRepository - Port for countdown/deadline data (countdown widget).
 */

import type { Countdown } from '../../types';

type Subscriber = () => void;

export interface ICountdownRepository {
  getAll(): Countdown[];
  add(title: string, date: string): Countdown;
  remove(id: string): void;
  subscribe(callback: Subscriber): () => void;
}
