import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppEngagementLayer } from '../src/app/AppEngagementLayer';
import { useEngagementModals } from '../src/features/engagement';

const mockOptInVisible = { value: false };

// The layer is tested against the public API of the features it composes.
jest.mock('../src/features/engagement', () => ({
  useEngagementModals: jest.fn(),
  WidgetCoachModal: () => null,
  FeatureDiscoveryModal: () => null,
  SharePromptModal: () => null,
  ReminderOptInModal: (props: { visible: boolean }) => {
    mockOptInVisible.value = props.visible;
    return null;
  },
}));

const mockUpdateSheet = { shown: false };
const mockUseAppUpdate = jest.fn();
jest.mock('../src/features/app-update', () => ({
  useAppUpdate: () => mockUseAppUpdate(),
  UpdateSheet: (props: { decision: { kind: string } }) => {
    mockUpdateSheet.shown = props.decision.kind !== 'none';
    return null;
  },
}));

jest.mock('../src/features/onboarding', () => ({
  useOnboardingQuizAnswers: () => ({}),
}));

jest.mock('../src/features/premium', () => ({
  DeferredPaywallModal: () => null,
}));

jest.mock('../src/features/ember', () => ({
  EmberCompanion: () => null,
}));

jest.mock('../src/features/badges', () => ({
  BadgeUnlockHost: () => null,
}));

jest.mock('../src/shared/analytics/useAnalytics', () => ({
  useAnalytics: () => ({ logEvent: jest.fn() }),
}));

jest.mock('../src/app/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

const NO_UPDATE = {
  decision: { kind: 'none' },
  update: jest.fn(),
  later: jest.fn(),
};

describe('AppEngagementLayer review attempts', () => {
  beforeEach(() => {
    mockUseAppUpdate.mockReturnValue(NO_UPDATE);
    mockUpdateSheet.shown = false;
  });

  it('does not try opens when countdown requests a review', async () => {
    const tryCountdownReview = jest.fn().mockResolvedValue(true);
    const tryOpensReview = jest.fn().mockResolvedValue(false);

    jest.mocked(useEngagementModals).mockReturnValue({
      readModalState: () => ({
        widgetCoachPending: false,
        featureCoachPending: false,
        sharePromptPending: false,
      }),
      readDeferredPaywallDue: () => false,
      readReminderOptInDue: () => false,
      recordReminderOptInAsk: jest.fn(),
      acceptReminderOptIn: jest.fn().mockResolvedValue(false),
      dismissWidgetCoach: jest.fn(),
      dismissFeatureCoach: jest.fn(),
      dismissSharePrompt: jest.fn(),
      completeFeatureCoachCta: jest.fn(),
      tryCountdownReview,
      tryOpensReview,
    });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<AppEngagementLayer />);
    });

    expect(tryCountdownReview).toHaveBeenCalledWith(false);
    expect(tryOpensReview).not.toHaveBeenCalled();
  });

  it('offers the reminder sheet only when nothing else is waiting, and records the ask once', async () => {
    const recordReminderOptInAsk = jest.fn();
    const base = {
      readModalState: () => ({
        widgetCoachPending: false,
        featureCoachPending: false,
        sharePromptPending: false,
      }),
      readDeferredPaywallDue: () => false,
      recordReminderOptInAsk,
      acceptReminderOptIn: jest.fn().mockResolvedValue(true),
      dismissWidgetCoach: jest.fn(),
      dismissFeatureCoach: jest.fn(),
      dismissSharePrompt: jest.fn(),
      completeFeatureCoachCta: jest.fn(),
      tryCountdownReview: jest.fn().mockResolvedValue(false),
      tryOpensReview: jest.fn().mockResolvedValue(false),
    };

    // A coach is still pending: the sheet waits.
    jest.mocked(useEngagementModals).mockReturnValue({
      ...base,
      readModalState: () => ({
        widgetCoachPending: false,
        featureCoachPending: true,
        sharePromptPending: false,
      }),
      readReminderOptInDue: () => true,
    });
    mockOptInVisible.value = false;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<AppEngagementLayer />);
    });
    expect(mockOptInVisible.value).toBe(false);
    expect(recordReminderOptInAsk).not.toHaveBeenCalled();

    // Nothing else waiting and the offer is due: shown, and counted.
    jest.mocked(useEngagementModals).mockReturnValue({
      ...base,
      readReminderOptInDue: () => true,
    });
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<AppEngagementLayer />);
    });
    expect(mockOptInVisible.value).toBe(true);
    expect(recordReminderOptInAsk).toHaveBeenCalledTimes(1);
  });

  it('lets a store update go first: the other prompts wait and the reminder offer is not used up', async () => {
    const recordReminderOptInAsk = jest.fn();
    const base = {
      readModalState: () => ({
        widgetCoachPending: false,
        featureCoachPending: false,
        sharePromptPending: false,
      }),
      readDeferredPaywallDue: () => false,
      readReminderOptInDue: () => true,
      recordReminderOptInAsk,
      acceptReminderOptIn: jest.fn().mockResolvedValue(true),
      dismissWidgetCoach: jest.fn(),
      dismissFeatureCoach: jest.fn(),
      dismissSharePrompt: jest.fn(),
      completeFeatureCoachCta: jest.fn(),
      tryCountdownReview: jest.fn().mockResolvedValue(false),
      tryOpensReview: jest.fn().mockResolvedValue(false),
    };
    jest.mocked(useEngagementModals).mockReturnValue(base);

    // An update is showing: the sheet is up, and the reminder offer neither shows nor counts as asked.
    mockUseAppUpdate.mockReturnValue({
      decision: {
        kind: 'optional',
        latestBuild: 40,
        versionName: '1.4',
        notes: [],
        storeUrl: 'x',
      },
      update: jest.fn(),
      later: jest.fn(),
    });
    mockOptInVisible.value = false;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<AppEngagementLayer />);
    });
    expect(mockUpdateSheet.shown).toBe(true);
    expect(mockOptInVisible.value).toBe(false);
    expect(recordReminderOptInAsk).not.toHaveBeenCalled();

    // No update: the reminder offer takes its turn as before.
    mockUseAppUpdate.mockReturnValue(NO_UPDATE);
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<AppEngagementLayer />);
    });
    expect(mockUpdateSheet.shown).toBe(false);
    expect(mockOptInVisible.value).toBe(true);
    expect(recordReminderOptInAsk).toHaveBeenCalledTimes(1);
  });
});
