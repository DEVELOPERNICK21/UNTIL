import type { OnboardingQuizAnswers } from '../../../shared/types';
import type { PersonalizationPriority } from '../../onboarding/domain';

export type ReflectionCategory = 'day' | 'month' | 'year' | 'life' | 'weekly';
export type ReflectionTone = 'quiet' | 'radical';
export type ReflectionAction = 'setBirthDate';

/**
 * What a reflection's text is built from. It is saved with the reflection, so the text can be
 * written again in the language that is active when the card is shown, not the one it was made in.
 */
export type ReflectionCopy =
  | { kind: 'birthDatePrompt' }
  | {
      kind: 'template';
      category: ReflectionCategory;
      tone: ReflectionTone;
      /** The share that has passed (day, month, year or life), put in front of the message. */
      percent?: number;
      /** Weekly only: how full the life grid is, when a birth date is saved. */
      lifeGridPercent?: number;
      /** Weekly only: what the quiz said to protect. */
      priority?: PersonalizationPriority;
    };

export interface DailyReflection {
  id: string;
  dateKey: string;
  title: string;
  message: string;
  category: ReflectionCategory;
  tone: ReflectionTone;
  premium: boolean;
  action?: ReflectionAction;
  /** Missing on a reflection saved by an older version: its text is then shown as it was saved. */
  copy?: ReflectionCopy;
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
  quizAnswers?: OnboardingQuizAnswers;
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
