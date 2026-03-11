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

  /** Value prop bullets — "That's why Until exists" (ChatPal-style) */
  valueProps: {
    tagline: "That's why Until exists",
    items: [
      { label: 'Less time blindness', desc: 'See what’s left, not just what’s passed.' },
      { label: 'More awareness', desc: 'Day, month, year, life — one glance.' },
      { label: 'More intentional choices', desc: 'Widgets and countdowns keep what matters in view.' },
    ],
  },

  /** FAQ — reduces friction, answers common questions */
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'What is Until?',
        answer: 'Until is a time-awareness app that shows how much of your day, month, year, and life has passed — and how much is left. Home screen widgets let you see progress at a glance without opening the app.',
      },
      {
        question: 'How does it work?',
        answer: 'Set your birth date (optional) for life progress. Add countdowns to deadlines. Use custom counters for habits. Add daily tasks and monthly goals. Widgets on your home screen show everything at a glance.',
      },
      {
        question: 'Is Until free?',
        answer: 'Yes. Until is free to use. Optional Premium (one-time, no subscription) unlocks extra features and supports development. Limited-time intro price available.',
      },
      {
        question: 'Who is Until for?',
        answer: 'Anyone who wants to see time clearly — day progress, month and year left, life in perspective. Great for people who use countdowns, track habits, or want a sobering view of time.',
      },
      {
        question: 'How do I get started?',
        answer: 'Download on Google Play (Android) or wait for the App Store release (iOS coming soon). Add a widget to your home screen. Optionally set your birth date and add countdowns or daily tasks.',
      },
    ],
  },

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
    community: {
      title: 'Join the community',
      subtitle: 'Share feedback, get updates, and connect with others who care about time.',
      cta: 'Coming soon',
    },
  },
} as const;
