/**
 * Landing & marketing copy — Single Source of Truth.
 * No duplicated strings; components import from here.
 */

export const LANDING_COPY = {
  /** Top-of-page price/offer line (e.g. "Intro price — Premium ₹99") */
  introPriceLine:
    'Start free. Premium includes 14-day trial, then monthly, yearly, or lifetime on Android.',

  hero: {
    title: 'See your time.',
    headline: 'Day, month, year, and life - always visible.',
    subtitle:
      'Track progress, deadlines, counters, tasks, and shareable snapshots. Built for home screen glanceability.',
    cta: 'Get the app',
  },

  /** Feature cards (with optional category for layout) */
  features: [
    {
      category: 'Core',
      title: 'Live day, month, year, life progress',
      description:
        'Real-time progress with left vs passed view so you always know where your time is going.',
    },
    {
      category: 'Widgets',
      title: 'Home + lock screen widgets',
      description:
        'Today, month, year, life, deadlines, tasks, counters, and hour timer on your home screen.',
    },
    {
      category: 'Focus',
      title: 'Deadlines, counters, and daily tasks',
      description:
        'Countdown to important dates, tap-to-increment custom counters, and track daily tasks with reports.',
    },
    {
      category: 'Sharing',
      title: 'Share snapshot',
      description:
        'Generate a clean story-style image of your progress to post or send in one tap.',
    },
  ],

  /** Value prop bullets — "That's why Until exists" (ChatPal-style) */
  valueProps: {
    tagline: "That's why Until exists",
    items: [
      {
        label: 'Less time blindness',
        desc: 'See what is left, not only what is gone.',
      },
      {
        label: 'Faster decisions',
        desc: 'A glance at widgets helps you course-correct during the day.',
      },
      {
        label: 'Consistent action',
        desc: 'Tasks, counters, and deadlines keep your priorities visible.',
      },
    ],
  },

  /** FAQ — reduces friction, answers common questions */
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'What is Until?',
        answer:
          'Until is a time-awareness app that shows how much of your day, month, year, and life has passed and how much is left. You can keep this visible through home and lock screen widgets.',
      },
      {
        question: 'How does it work?',
        answer:
          'Set your profile (including optional birth date), then add deadlines, custom counters, and daily tasks. Until calculates progress continuously and syncs widget data so your key numbers stay visible.',
      },
      {
        question: 'Is Until free or paid?',
        answer:
          'Until has a free core experience (day/year progress and sharing). Premium unlocks more surfaces and features such as month/life widgets, Dynamic Island on iOS, and floating overlay on Android. Premium starts with a 14-day trial and supports monthly, yearly, and lifetime options on Android.',
      },
      {
        question: 'What can I put on widgets?',
        answer:
          'You can show day, month, year, life, deadlines, daily task progress, custom counters, and hour timer state. Widget options vary by device and platform.',
      },
      {
        question: 'Who is Until for?',
        answer:
          'People who want time clarity, not another noisy productivity app. It is useful for students, creators, professionals, and anyone who benefits from seeing progress and remaining time in one glance.',
      },
      {
        question: 'How do I get started?',
        answer:
          'Download on Google Play, open the app, and set up one thing first (a deadline, task list, or counter). Then add an Until widget so the app stays useful even when closed.',
      },
    ],
  },

  /** "Why people choose Until" — benefit bullets */
  whyChoose: {
    title: 'Why people choose Until',
    subtitle: 'Time awareness without opening the app.',
    items: [
      {
        title: 'One glance, full context',
        description:
          'See today, this month, this year, and life progress in a single system.',
      },
      {
        title: 'Built for surfaces',
        description:
          'Widgets first, plus Dynamic Island on iOS and floating overlay on Android.',
      },
      {
        title: 'Action + reflection',
        description:
          'Use deadlines, counters, and daily tasks to translate awareness into action.',
      },
      {
        title: 'Simple, serious design',
        description: 'No ads, low friction, and focused visuals that keep attention on time.',
      },
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
    title: 'Start free, upgrade when ready',
    subtitle:
      'Use core features for free. Premium includes a 14-day trial and unlocks advanced surfaces and features.',
    checkmarks: [
      'Free core: day + year progress and share snapshot',
      'Premium: month + life widgets and advanced surfaces',
      'Dynamic Island (iOS) and overlay (Android)',
      'Android plans: monthly, yearly, and lifetime',
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
