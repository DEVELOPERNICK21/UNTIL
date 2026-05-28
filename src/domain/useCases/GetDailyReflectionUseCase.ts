import { TRIAL_DURATION_MS } from '../../config/accessConstants';
import { generateDailyReflection, getDateKey } from '../reflections/reflectionEngine';
import type {
  DailyReflection,
  DailyReflectionState,
  ReflectionInput,
  ReflectionPersistence,
  ReflectionTone,
} from '../reflections/reflectionTypes';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { ITimeRepository } from '../repository/ITimeRepository';

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
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly persistence: ReflectionPersistence
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

  private canUsePremiumReflections(date: Date): boolean {
    if (this.subscriptionRepository.getIsPremium()) return true;
    const trialStart = this.subscriptionRepository.getTrialStartDate();
    if (trialStart == null) return false;
    return date.getTime() <= trialStart + TRIAL_DURATION_MS;
  }
}
