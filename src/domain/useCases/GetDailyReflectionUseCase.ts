import { generateDailyReflection, getDateKey } from '../reflections/reflectionEngine';
import type {
  DailyReflection,
  DailyReflectionState,
  ReflectionInput,
  ReflectionPersistence,
  ReflectionTone,
} from '../reflections/reflectionTypes';
import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import type { ITimeRepository } from '../repository/ITimeRepository';
import type { AccessState } from '../../types';
import { hasPremiumBundle } from '../accessControl';

/** Same shape as GetAccessStateUseCase; kept narrow so tests can stub it. */
export interface AccessStateProvider {
  execute(now?: number): AccessState;
}

function parseCachedReflection(raw: string | undefined): DailyReflection | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DailyReflection;
    return parsed?.dateKey && parsed?.message ? parsed : null;
  } catch {
    return null;
  }
}

export class GetDailyReflectionUseCase {
  constructor(
    private readonly timeRepository: ITimeRepository,
    private readonly getAccessState: AccessStateProvider,
    private readonly persistence: ReflectionPersistence,
    private readonly onboardingRepository: IOnboardingRepository
  ) {}

  execute(date: Date = new Date()): DailyReflectionState {
    const dateKey = getDateKey(date);
    const canUsePremiumReflections = this.canUsePremiumReflections(date);
    const tone = this.getTone(canUsePremiumReflections);
    const cachedDate = this.persistence.getDailyReflectionDate();
    const cached = parseCachedReflection(
      this.persistence.getDailyReflectionPayload()
    );

    const reflection =
      cachedDate === dateKey && cached != null
        ? cached
        : this.generateAndCache(date, tone, canUsePremiumReflections);

    return {
      reflection,
      visible: this.persistence.getDailyReflectionDismissedDate() !== dateKey,
      tone,
      canUsePremiumReflections,
    };
  }

  dismissForDay(dateKey: string): void {
    this.persistence.setDailyReflectionDismissedDate(dateKey);
  }

  setTone(tone: ReflectionTone): void {
    this.persistence.setReflectionTone(tone);
    this.persistence.setDailyReflectionDate('');
    this.persistence.setDailyReflectionPayload('');
  }

  private generateAndCache(
    date: Date,
    tone: ReflectionTone,
    canUsePremiumReflections: boolean
  ): DailyReflection {
    const { userProfile, timeState } = {
      userProfile: this.timeRepository.getUserProfile(),
      timeState: this.timeRepository.getTimeState(),
    };

    const input: ReflectionInput = {
      date,
      dayProgress: timeState.day,
      monthProgress: timeState.month,
      yearProgress: timeState.year,
      lifeProgress: userProfile.birthDate ? timeState.life : undefined,
      hasBirthDate: Boolean(userProfile.birthDate),
      hasPremiumBundle: canUsePremiumReflections,
      tone,
      quizAnswers: this.onboardingRepository.getQuizAnswers(),
    };
    const reflection = generateDailyReflection(input);
    this.persistence.setDailyReflectionDate(reflection.dateKey);
    this.persistence.setDailyReflectionPayload(JSON.stringify(reflection));
    return reflection;
  }

  private getTone(canUsePremiumReflections: boolean): ReflectionTone {
    const raw = this.persistence.getReflectionTone();
    if (raw === 'radical' && canUsePremiumReflections) return 'radical';
    return 'quiet';
  }

  /** Access state already folds in trial and the signed-in device cap. */
  private canUsePremiumReflections(date: Date): boolean {
    return hasPremiumBundle(this.getAccessState.execute(date.getTime()));
  }
}
