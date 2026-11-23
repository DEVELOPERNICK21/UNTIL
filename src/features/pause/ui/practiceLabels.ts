import type { TranslationKey } from '../../../shared/i18n/translate';
import type { EvidenceLevel, PracticeId } from '../domain/practices';
import type { LevelId, MilestoneId } from '../domain/pauseProgress';
import type { BreathPhaseKind } from '../domain/breathing';

export const PRACTICE_NAME: Record<PracticeId, TranslationKey> = {
  sigh: 'pause.practice.sigh.name',
  coherent: 'pause.practice.coherent.name',
  box: 'pause.practice.box.name',
  extended: 'pause.practice.extended.name',
  wind: 'pause.practice.wind.name',
  grounding: 'pause.practice.grounding.name',
};

export const PRACTICE_HOW: Record<PracticeId, TranslationKey> = {
  sigh: 'pause.practice.sigh.how',
  coherent: 'pause.practice.coherent.how',
  box: 'pause.practice.box.how',
  extended: 'pause.practice.extended.how',
  wind: 'pause.practice.wind.how',
  grounding: 'pause.practice.grounding.how',
};

export const EVIDENCE_LABEL: Record<EvidenceLevel, TranslationKey> = {
  strong: 'pause.evidence.strong',
  good: 'pause.evidence.good',
  early: 'pause.evidence.early',
  little: 'pause.evidence.little',
  indirect: 'pause.evidence.indirect',
};

export const LEVEL_LABEL: Record<LevelId, TranslationKey> = {
  settling: 'pause.level.settling',
  steady: 'pause.level.steady',
  still: 'pause.level.still',
  deep: 'pause.level.deep',
  tranquil: 'pause.level.tranquil',
};

export const MILESTONE_LABEL: Record<MilestoneId, TranslationKey> = {
  first: 'pause.ms.first',
  five: 'pause.ms.five',
  ten: 'pause.ms.ten',
  explorer: 'pause.ms.explorer',
  week: 'pause.ms.week',
  night: 'pause.ms.night',
};

export const CUE_LABEL: Record<BreathPhaseKind, TranslationKey> = {
  inhale: 'pause.breathe.in',
  top: 'pause.breathe.top',
  hold: 'pause.breathe.hold',
  exhale: 'pause.breathe.out',
  rest: 'pause.breathe.rest',
};
