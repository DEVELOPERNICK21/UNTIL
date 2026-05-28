import type { ReflectionCategory, ReflectionTone } from './reflectionTypes';

export interface ReflectionTemplate {
  title: string;
  message: string;
}

type TemplateMap = Record<
  Exclude<ReflectionCategory, 'weekly'>,
  Record<ReflectionTone, ReflectionTemplate>
>;

export const REFLECTION_TEMPLATES: TemplateMap = {
  day: {
    quiet: {
      title: 'Today is still yours',
      message:
        'Most of today has passed. Choose one small action you will be glad you did.',
    },
    radical: {
      title: 'Use the remaining hours',
      message:
        'Most of today is gone. Stop negotiating with the remaining hours. Finish one thing.',
    },
  },
  month: {
    quiet: {
      title: 'This month is moving',
      message:
        'A little more of this month has passed. Return to what matters before it becomes background noise.',
    },
    radical: {
      title: 'The month will not wait',
      message:
        'This month is moving whether you act or not. Pick the work that matters.',
    },
  },
  year: {
    quiet: {
      title: 'A year in motion',
      message:
        'This year is quietly taking shape. Make one choice today that your future self can recognize.',
    },
    radical: {
      title: 'Shape the year',
      message:
        'The year is not paused. Put your energy into one move that changes its direction.',
    },
  },
  life: {
    quiet: {
      title: 'Life in view',
      message:
        'Your life is finite, and today is part of it. Give one ordinary moment your full attention.',
    },
    radical: {
      title: 'Remember the horizon',
      message:
        'Your life has a horizon. Do not spend today on autopilot. Choose deliberately.',
    },
  },
};

export const BIRTH_DATE_PROMPT: ReflectionTemplate = {
  title: 'Make it personal',
  message:
    'Set your birth date to unlock deeper Life reflections based on your own timeline.',
};
