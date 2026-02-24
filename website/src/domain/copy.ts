/**
 * Landing & marketing copy — Single Source of Truth.
 * No duplicated strings; components import from here.
 */

export const LANDING_COPY = {
  /** Top-of-page price/offer line (e.g. "Intro price — Premium ₹99") */
  introPriceLine: 'Limited time — Premium ₹99 (was ₹299). One-time, no subscription. iPhone & Android.',

  hero: {
    title: 'See your time.',
    headline: 'Transform how you see time — day, month, year, life.',
    subtitle: 'One app. No clutter. Progress at a glance on your home screen.',
    cta: 'Get the app',
  },

  /** Feature cards (with optional category for layout) */
  features: [
    { category: 'Today', title: 'Day progress', description: 'Watch the day fill. Hours and minutes left, in real time.' },
    { category: 'Calendar', title: 'Month & year', description: 'How much of this month and year is already gone.' },
    { category: 'Life', title: 'Life view', description: 'Your life in progress. Set your horizon and see what’s left.' },
    { category: 'Widgets', title: 'Widgets & countdowns', description: 'Home screen widgets and countdowns to what matters.' },
  ],

  /** "Why people choose Until" — benefit bullets */
  whyChoose: {
    title: 'Why people choose Until',
    subtitle: 'Time awareness without opening the app.',
    items: [
      { title: 'Day, month, year, life', description: 'One place to see progress through today, the month, the year, and your life.' },
      { title: 'Home screen widgets', description: 'iOS and Android widgets. See time at a glance, no opening the app.' },
      { title: 'Countdowns & counters', description: 'Count down to deadlines. Tap-to-increment counters for habits.' },
      { title: 'No clutter', description: 'Minimal, honest design. No ads, no fluff.' },
    ],
  },

  /** Testimonials — replace with real quotes when you have them */
  testimonials: {
    title: 'Loved by people who care about time',
    items: [
      { quote: 'The day progress bar made me actually aware of how I spend hours. Simple and sobering.', author: 'Alex M.', role: 'iPhone user', stars: 5 },
      { quote: 'Home screen widget shows my year progress. No opening the app — just a glance.', author: 'Sam K.', role: 'Android user', stars: 5 },
      { quote: 'Life view hit different. One app that does time progress and countdowns well.', author: 'Jordan L.', role: 'Design lover', stars: 5 },
    ],
  },

  /** Pricing CTA block — checkmarks for premium value props */
  pricingCta: {
    title: 'Get Until',
    subtitle: 'Free to use. Unlock optional Premium for ₹99 (limited time — was ₹299) for extra features and to support development.',
    checkmarks: [
      'Day, month, year, life progress',
      'iOS & Android home screen widgets',
      'Countdowns & custom counters',
      'One-time Premium — no subscription',
    ],
    ctaLabelAndroid: 'Get on Google Play',
    iosComingSoon: 'Coming soon',
  },

  cta: {
    title: 'Start seeing time clearly.',
    subtitle: 'Available on Android now. iOS coming soon.',
  },

  footer: {
    appName: 'Until: Days left',
    tagline: 'See your time.',
    links: {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact',
    },
  },
} as const;
