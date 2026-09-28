import type { ActivityCategory } from './index';

export interface WidgetData {
  birthDate: string | null;
  deathAge: number;
  dayProgress: number;
  monthProgress: number;
  yearProgress: number;
  lifeProgress: number;
  categoryTotals?: Partial<Record<ActivityCategory, number>>;
}
