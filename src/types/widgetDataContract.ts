import { STORAGE_KEYS, DEFAULTS } from '../persistence/schema';
import type { ActivityCategory } from './index';

export { STORAGE_KEYS, DEFAULTS };

export interface WidgetData {
  birthDate: string | null;
  deathAge: number;
  dayProgress: number;
  monthProgress: number;
  yearProgress: number;
  lifeProgress: number;
  categoryTotals?: Partial<Record<ActivityCategory, number>>;
}
