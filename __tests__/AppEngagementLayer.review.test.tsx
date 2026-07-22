import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppEngagementLayer } from '../src/components/engagement/AppEngagementLayer';
import { useEngagementModals } from '../src/hooks/useEngagementModals';

jest.mock('../src/hooks/useEngagementModals', () => ({
  useEngagementModals: jest.fn(),
}));

jest.mock('../src/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ logEvent: jest.fn() }),
}));

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('../src/components/engagement/WidgetCoachModal', () => ({
  WidgetCoachModal: () => null,
}));

jest.mock('../src/components/engagement/DeferredPaywallModal', () => ({
  DeferredPaywallModal: () => null,
}));

jest.mock('../src/components/engagement/FeatureDiscoveryModal', () => ({
  FeatureDiscoveryModal: () => null,
}));

jest.mock('../src/components/engagement/SharePromptModal', () => ({
  SharePromptModal: () => null,
}));

jest.mock('../src/components/engagement/EmberCompanion', () => ({
  EmberCompanion: () => null,
}));

jest.mock('../src/services/deferredPaywall', () => ({
  shouldShowDeferredPaywall: () => false,
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
