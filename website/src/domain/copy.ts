/**
 * Landing & marketing copy — Single Source of Truth.
 * No duplicated strings; components import from here.
 */

export const LANDING_COPY = {
  hero: {
    title: 'See your time.',
    subtitle: 'Day, month, year, life. One app. No clutter.',
    cta: 'Get the app',
  },
  features: [
    {
      title: 'Day progress',
      description: 'Watch the day fill. Hours and minutes left, in real time.',
    },
    {
      title: 'Month & year',
      description: 'How much of this month and year is already gone.',
    },
    {
      title: 'Life view',
      description: 'Your life in progress. Set your horizon and see what’s left.',
    },
    {
      title: 'Widgets & countdowns',
      description: 'Home screen widgets and countdowns to what matters.',
    },
  ],
  cta: {
    title: 'Start seeing time clearly.',
    subtitle: 'Free on iOS and Android.',
  },
  footer: {
    appName: 'UNTIL',
    tagline: 'See your time.',
    links: {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
    },
  },
} as const;
