/**
 * The "Welcome to Premium" popup, the plan card and the profile chip speak the person's
 * language and say which plan they bought.
 */

import React from 'react';
import { Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PlanCard } from '../src/features/premium/ui/PlanCard';
import { PlanChip } from '../src/features/premium/ui/PlanChip';
import { PurchaseWelcomeSheet } from '../src/features/premium/ui/PurchaseWelcomeSheet';
import { planName, timelineText } from '../src/features/premium/ui/planLabels';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage, tIn } from '../src/shared/i18n/translate';
import type { PlanRecord } from '../src/shared/types/purchases';

const mockPlan: { current: PlanRecord | null; premium: boolean } = {
  current: null,
  premium: true,
};
const mockOpenManage = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../src/features/premium/hooks/usePlan', () => {
  const { planTimeline } = require('../src/features/premium/domain/plan');
  return {
    usePlan: () => ({
      plan: mockPlan.current,
      timeline: mockPlan.current ? planTimeline(mockPlan.current) : null,
    }),
  };
});
jest.mock('../src/features/premium/hooks/useObserveSubscription', () => ({
  useObserveSubscription: () => ({ isPremium: mockPlan.premium }),
}));
jest.mock('../src/features/premium/hooks/useManageSubscription', () => ({
  useManageSubscription: () => ({ openManageSubscription: mockOpenManage }),
}));
jest.mock('../src/shared/navigation/rootNavigationRef', () => ({
  navigateToPremium: () => mockNavigate(),
}));
jest.mock('../src/shared/ui', () => {
  const { Text: Native } = require('react-native');
  return { Text: Native };
});
jest.mock('../src/shared/theme', () => {
  const loose = (value: unknown) =>
    new Proxy({}, { get: (_t, key) => (key === 'then' ? undefined : value) });
  return {
    Spacing: loose(8),
    Radius: loose(8),
    Weight: loose('600'),
    getFontFamilyForWeight: () => 'System',
    useTheme: () => loose('#888'),
  };
});

const YEAR_MS = Date.UTC(2027, 10, 8, 12);
const yearly: PlanRecord = {
  kind: 'yearly',
  productId: 'yearly_subscription',
  store: 'play',
  startedMs: Date.UTC(2026, 10, 8, 12),
  expiresMs: YEAR_MS,
  willRenew: true,
  trial: false,
  billingIssue: false,
};

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];
function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(element);
  });
  mounted.push(tree);
  return tree;
}
function texts(tree: ReactTestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(NativeText)
    .map(node => React.Children.toArray(node.props.children).join(''));
}

beforeEach(() => {
  mockPlan.current = yearly;
  mockPlan.premium = true;
  mockOpenManage.mockClear();
  mockNavigate.mockClear();
});
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
});

describe('welcome popup', () => {
  const welcome = (over = {}) => ({
    visible: true,
    kind: 'yearly' as const,
    timeline: { kind: 'renews' as const, onMs: YEAR_MS },
    greeting: 'evening' as const,
    ...over,
  });

  it('greets, names the plan, says when it renews and lists what is unlocked', () => {
    const tree = render(
      <PurchaseWelcomeSheet welcome={welcome()} onClose={() => {}} onSeePlan={() => {}} />,
    );
    const shown = texts(tree);
    expect(shown.slice(0, 3)).toEqual([
      'Good evening',
      'Welcome to Premium',
      'Yearly plan is now active.',
    ]);
    expect(shown[3]).toMatch(/^Renews on .*2027$/);
    expect(shown).toEqual(
      expect.arrayContaining([
        'YOU NOW HAVE',
        'Month widget',
        'Life view',
        'Overlay',
        'Every deadline and counter',
        'Lost-time alerts',
        'Start exploring',
        'See my plan',
      ]),
    );
  });

  it('is silent until it is time, and for a plan it cannot name', () => {
    expect(
      render(
        <PurchaseWelcomeSheet
          welcome={welcome({ visible: false })}
          onClose={() => {}}
          onSeePlan={() => {}}
        />,
      ).toJSON(),
    ).toBeNull();
    expect(
      render(
        <PurchaseWelcomeSheet
          welcome={welcome({ kind: null })}
          onClose={() => {}}
          onSeePlan={() => {}}
        />,
      ).toJSON(),
    ).toBeNull();
  });

  it('closes, or opens the plan, from its two buttons', () => {
    const onClose = jest.fn();
    const onSeePlan = jest.fn();
    const tree = render(
      <PurchaseWelcomeSheet welcome={welcome()} onClose={onClose} onSeePlan={onSeePlan} />,
    );
    const press = (label: string) =>
      act(() => {
        let node: ReactTestRenderer.ReactTestInstance | null =
          tree.root.findAllByType(NativeText).find(n => n.props.children === label) ?? null;
        while (node && !node.props.onPress) node = node.parent;
        node?.props.onPress();
      });
    press('Start exploring');
    press('See my plan');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSeePlan).toHaveBeenCalledTimes(1);
  });

  it('speaks in the active language and follows a change', () => {
    setLanguage('de');
    const tree = render(
      <PurchaseWelcomeSheet
        welcome={welcome({ greeting: 'morning' })}
        onClose={() => {}}
        onSeePlan={() => {}}
      />,
    );
    expect(texts(tree).slice(0, 3)).toEqual([
      'Guten Morgen',
      'Willkommen bei Premium',
      'Jahrestarif ist jetzt aktiv.',
    ]);
    act(() => setLanguage('ja'));
    expect(texts(tree).slice(0, 3)).toEqual([
      'おはようございます',
      'プレミアムへようこそ',
      '年間プランが有効になりました。',
    ]);
  });
});

describe('plan card', () => {
  it('shows the plan, since when, when it renews and where it is billed', () => {
    const tree = render(<PlanCard />);
    const shown = texts(tree);
    expect(shown[0]).toBe('YOUR PLAN');
    expect(shown[1]).toBe('Yearly plan');
    expect(shown[2]).toMatch(/^Renews on .*2027$/);
    expect(shown[3]).toMatch(/^Since .*2026 · Google Play$/);
    expect(shown).toContain('Manage subscription');
  });

  it('says a cancelled plan ends, and flags a payment problem', () => {
    mockPlan.current = { ...yearly, willRenew: false, billingIssue: true };
    const shown = texts(render(<PlanCard />));
    expect(shown[2]).toMatch(/^Ends on .*2027\. It will not renew\.$/);
    expect(shown).toContain(
      'The store could not take your last payment. Update your payment method to keep Premium.',
    );
  });

  it('shows lifetime as yours for good, with nothing to manage', () => {
    mockPlan.current = { ...yearly, kind: 'lifetime', productId: 'lifetime_unlock', expiresMs: null, willRenew: false };
    const shown = texts(render(<PlanCard />));
    expect(shown.slice(0, 3)).toEqual(['YOUR PLAN', 'Lifetime access', 'Yours for good. It never renews.']);
    expect(shown).not.toContain('Manage subscription');
  });

  it('falls back to a plain line when Premium has no store plan, and hides without Premium', () => {
    mockPlan.current = null;
    expect(texts(render(<PlanCard />)).slice(0, 2)).toEqual(['YOUR PLAN', 'Premium is active']);
    mockPlan.premium = false;
    expect(render(<PlanCard />).toJSON()).toBeNull();
  });

  it('opens the store subscription page from "Manage subscription"', () => {
    const tree = render(<PlanCard />);
    let node: ReactTestRenderer.ReactTestInstance | null =
      tree.root.findAllByType(NativeText).find(n => n.props.children === 'Manage subscription') ?? null;
    while (node && !node.props.onPress) node = node.parent;
    act(() => node?.props.onPress());
    expect(mockOpenManage).toHaveBeenCalledWith('plan_card');
  });
});

describe('profile chip', () => {
  it('names the plan, and opens the Premium screen when tapped', () => {
    const tree = render(<PlanChip />);
    expect(texts(tree)).toEqual(['Premium · Yearly plan']);
    act(() => tree.root.findByProps({ accessibilityRole: 'button' }).props.onPress());
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('is empty without Premium', () => {
    mockPlan.premium = false;
    expect(render(<PlanChip />).toJSON()).toBeNull();
  });
});

describe('words in every language', () => {
  it('names each plan and writes a date line, never a raw key, in all 11 languages', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (const kind of ['weekly', 'monthly', 'yearly', 'student', 'lifetime'] as const) {
        const name = planName(kind);
        expect(name.length).toBeGreaterThan(0);
        expect(name).not.toContain('premium.plan');
      }
      for (const timeline of [
        { kind: 'forever' as const },
        { kind: 'renews' as const, onMs: YEAR_MS },
        { kind: 'ends' as const, onMs: YEAR_MS },
        { kind: 'trialEnds' as const, onMs: YEAR_MS },
      ]) {
        const line = timelineText(timeline) ?? '';
        expect(line.length).toBeGreaterThan(0);
        expect(line).not.toContain('{{');
        expect(line).not.toContain('premium.plan');
      }
    }
  });

  it('keeps the same placeholders in every language', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      expect(tIn(code, 'premium.plan.renews', { date: 'D' })).toContain('D');
      expect(tIn(code, 'premium.welcome.active', { plan: 'P' })).toContain('P');
    }
  });
});
