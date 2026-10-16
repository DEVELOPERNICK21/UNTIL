import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppEngagementLayer } from '../src/app/AppEngagementLayer';
import { useEngagementModals } from '../src/features/engagement';

// The layer is tested against the public API of the features it composes.
jest.mock('../src/features/engagement', () => ({
  useEngagementModals: jest.fn(),
  WidgetCoachModal: () => null,
  FeatureDiscoveryModal: () => null,
  SharePromptModal: () => null,
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

describe('AppEngagementLayer review attempts', () => {
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
});
