import type { TranslationKey } from '../../../shared/i18n/translate';
import type { PeriodGlyphKind } from '../../../shared/ui';

/** The short lines each period's detail screen shows under its title, as message keys. */
export const PERIOD_PERSONALITY: Record<
  PeriodGlyphKind,
  { tagline: TranslationKey; cue: TranslationKey; accentHint: TranslationKey }
> = {
  day: {
    tagline: 'detail.persona.day.tagline',
    cue: 'detail.persona.day.cue',
    accentHint: 'detail.persona.day.hint',
  },
  month: {
    tagline: 'detail.persona.month.tagline',
    cue: 'detail.persona.month.cue',
    accentHint: 'detail.persona.month.hint',
  },
  year: {
    tagline: 'detail.persona.year.tagline',
    cue: 'detail.persona.year.cue',
    accentHint: 'detail.persona.year.hint',
  },
  life: {
    tagline: 'detail.persona.life.tagline',
    cue: 'detail.persona.life.cue',
    accentHint: 'detail.persona.life.hint',
  },
};
