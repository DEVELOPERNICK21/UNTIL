import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePaywallVisit } from '../src/features/premium/hooks/usePaywallVisit';

const mockShown = jest.fn();
const mockDismissed = jest.fn();
jest.mock('../src/features/premium/services/paywallTelemetry', () => ({
  logPaywallShown: (...a: unknown[]) => mockShown(...a),
  logPaywallDismissed: (...a: unknown[]) => mockDismissed(...a),
}));

let markConverted: () => void = () => {};
function Probe({ isPremium }: { isPremium: boolean }) {
  markConverted = usePaywallVisit('premium_screen', isPremium);
  return null;
}

async function mount(isPremium: boolean) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe isPremium={isPremium} />);
  });
  return renderer;
}

describe('usePaywallVisit', () => {
  beforeEach(() => {
    mockShown.mockClear();
    mockDismissed.mockClear();
  });

  it('logs shown on mount and dismissed when it closes without a purchase', async () => {
    const r = await mount(false);
    expect(mockShown).toHaveBeenCalledWith('premium_screen', 'custom', false);
    await act(async () => r.unmount());
    expect(mockDismissed).toHaveBeenCalledWith(
      'premium_screen', 'custom', expect.any(Number), 'leave',
    );
  });

  it('does not log dismissed after a purchase or restore', async () => {
    const r = await mount(false);
    await act(async () => markConverted());
    await act(async () => r.unmount());
    expect(mockDismissed).not.toHaveBeenCalled();
  });

  it('logs a subscriber as shown, flagged, and never as dismissed', async () => {
    const r = await mount(true);
    expect(mockShown).toHaveBeenCalledWith('premium_screen', 'custom', true);
    await act(async () => r.unmount());
    expect(mockDismissed).not.toHaveBeenCalled();
  });
});
