import type { ReflectionCategory, ReflectionTone } from './reflectionTypes';

export interface ReflectionTemplate {
  title: string;
  message: string;
}

type TemplateMap = Record<
  ReflectionCategory,
  Record<ReflectionTone, ReflectionTemplate>
>;

export const REFLECTION_TEMPLATES: TemplateMap = {
  day: {
    quiet: {
      title: 'Today is still yours',
      message:
        'Most of today has passed. Pick one small action you’ll be glad you did.',
    },
    radical: {
      title: 'Use what’s left',
      message:
        'Most of today is gone. Finish one thing before the day ends.',
    },
  },
  month: {
    quiet: {
      title: 'This month is moving',
      message:
        'More of this month is gone. Return to what matters before it fades into the background.',
    },
    radical: {
      title: 'The month won’t wait',
      message:
        'This month moves whether you act or not. Pick the work that matters.',
    },
  },
  year: {
    quiet: {
      title: 'A year in motion',
      message:
        'This year is taking shape. Make one choice today your future self will notice.',
    },
    radical: {
      title: 'Shape the year',
      message:
        'The year isn’t paused. Put energy into one move that changes its direction.',
    },
  },
  life: {
    quiet: {
      title: 'Life in view',
      message:
        'Your life is finite, and today is part of it. Give one ordinary moment full attention.',
    },
    radical: {
      title: 'Remember the horizon',
      message:
        'Your life has a horizon. Don’t spend today on autopilot. Choose on purpose.',
    },
  },
  weekly: {
    quiet: {
      title: 'Week in review',
      message:
        'Seven days passed whether you noticed or not. Name one moment worth repeating.',
    },
    radical: {
      title: 'Don’t waste another week',
      message:
        'Another week is gone. Stop treating Mondays as reset buttons. Change one pattern now.',
    },
  },
};

export const BIRTH_DATE_PROMPT: ReflectionTemplate = {
  title: 'Make it personal',
  message:
    'Set your birth date for Life reflections based on your own timeline.',
};
