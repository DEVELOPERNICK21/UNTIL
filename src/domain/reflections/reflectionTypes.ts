export type ReflectionCategory = 'day' | 'month' | 'year' | 'life' | 'weekly';
export type ReflectionTone = 'quiet' | 'radical';
export type ReflectionAction = 'setBirthDate';

export interface DailyReflection {
  id: string;
  dateKey: string;
  title: string;
  message: string;
  category: ReflectionCategory;
  tone: ReflectionTone;
  premium: boolean;
  action?: ReflectionAction;
}

export interface ReflectionInput {
  date: Date;
  dayProgress: number;
  monthProgress: number;
  yearProgress: number;
  lifeProgress?: number;
  hasBirthDate: boolean;
  hasPremiumBundle: boolean;
  tone: ReflectionTone;
}

export interface DailyReflectionState {
  reflection: DailyReflection;
  visible: boolean;
  tone: ReflectionTone;
  canUsePremiumReflections: boolean;
}

export interface ReflectionPersistence {
  getDailyReflectionDate(): string | undefined;
  setDailyReflectionDate(value: string): void;
  getDailyReflectionPayload(): string | undefined;
  setDailyReflectionPayload(value: string): void;
  getDailyReflectionDismissedDate(): string | undefined;
  setDailyReflectionDismissedDate(value: string): void;
  getReflectionTone(): string | undefined;
  setReflectionTone(value: ReflectionTone): void;
}
