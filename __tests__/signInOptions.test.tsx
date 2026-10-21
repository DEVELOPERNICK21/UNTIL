import React from 'react';
import { Animated } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { SignInOptions } from '../src/features/account/ui/SignInOptions';

jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, sm: 8 },
  Radius: { sm: 4, md: 8, lg: 12 },
  Weight: { regular: 'regular', semibold: 'semibold' },
  getFontFamilyForWeight: () => 'System',
  useTheme: () => ({
    textPrimary: '#fff',
    textSecondary: '#ccc',
    textMuted: '#999',
    percent: '#f60',
    divider: '#333',
    glassBorder: '#444',
    glassHighlight: '#222',
    statusBarStyle: 'light-content',
  }),
}));

jest.mock('../src/shared/ui', () => {
  const ReactModule = require('react');
  const { Pressable, Text: NativeText } = require('react-native');
  return {
    Text: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(NativeText, null, children),
    useReduceMotion: () => true,
    LegalAgreementLine: () => null,
    AgeConfirmationCheck: ({
      checked,
      onChange,
      attention,
    }: {
      checked: boolean;
      onChange: (next: boolean) => void;
      attention?: boolean;
    }) =>
      ReactModule.createElement(
        Pressable,
        {
          testID: 'age-check',
          accessibilityState: { checked },
          accessibilityHint: attention && !checked ? 'nudged' : undefined,
          onPress: () => onChange(!checked),
        },
        ReactModule.createElement(NativeText, null, 'age'),
      ),
  };
});

jest.mock('../src/features/account/hooks/useAccountActions', () => ({
  MINIMUM_ACCOUNT_AGE_YEARS: 13,
}));

jest
  .spyOn(Animated, 'sequence')
  .mockImplementation(
    () => ({ start: jest.fn() } as unknown as Animated.CompositeAnimation),
  );

function setup(
  overrides: Partial<React.ComponentProps<typeof SignInOptions>> = {},
) {
  const props = {
    appleSignInAvailable: true,
    busy: false,
    error: null,
    onApple: jest.fn().mockResolvedValue(undefined),
    onGoogle: jest.fn().mockResolvedValue(undefined),
    onEmail: jest.fn().mockResolvedValue(undefined),
    onForgotPassword: jest.fn().mockResolvedValue(true),
    onClearError: jest.fn(),
    onAgeGateBlocked: jest.fn(),
    onEmailOpened: jest.fn(),
    ...overrides,
  };
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(<SignInOptions {...props} />);
  });
  const byLabel = (label: string) =>
    tree.root.findAll(
      n =>
        n.props.accessibilityLabel === label &&
        typeof n.props.onPress === 'function',
    )[0];
  const press = async (label: string) => {
    await act(async () => {
      byLabel(label).props.onPress();
    });
  };
  const tickAge = () => {
    act(() => {
      tree.root.findByProps({ testID: 'age-check' }).props.onPress();
    });
  };
  const typeInto = (label: string, value: string) => {
    act(() => {
      tree.root
        .findAll(
          n => n.props.accessibilityLabel === label && n.props.onChangeText,
        )[0]
        .props.onChangeText(value);
    });
  };
  const text = () => JSON.stringify(tree.toJSON());
  return { props, byLabel, press, tickAge, typeInto, text };
}

describe('SignInOptions', () => {
  it('blocks sign-in until the age box is ticked, then reports it', async () => {
    const { props, press } = setup();

    await press('Continue with Google');
    await press('Continue with Apple');

    expect(props.onGoogle).not.toHaveBeenCalled();
    expect(props.onApple).not.toHaveBeenCalled();
    expect(props.onAgeGateBlocked).toHaveBeenCalledWith('google');
    expect(props.onAgeGateBlocked).toHaveBeenCalledWith('apple');
  });

  it('signs in with Google once the age is confirmed', async () => {
    const { props, press, tickAge } = setup();

    tickAge();
    await press('Continue with Google');

    expect(props.onGoogle).toHaveBeenCalledWith(true);
    expect(props.onAgeGateBlocked).not.toHaveBeenCalled();
  });

  it('hides Apple when it is unavailable', () => {
    const { byLabel } = setup({ appleSignInAvailable: false });
    expect(byLabel('Continue with Apple')).toBeUndefined();
  });

  it('keeps the email form closed until asked, then opens it', async () => {
    const { props, byLabel, press } = setup();
    expect(byLabel('Email')).toBeUndefined();

    await press('Continue with email');

    expect(props.onEmailOpened).toHaveBeenCalled();
    expect(byLabel('Sign in')).toBeDefined();
  });

  it('submits the typed email and password with the chosen mode', async () => {
    const { props, press, tickAge, typeInto } = setup();
    await press('Continue with email');
    tickAge();
    typeInto('Email', 'nick@example.com');
    typeInto('Password', 'hunter22');

    await press('Sign in');

    expect(props.onEmail).toHaveBeenCalledWith(
      'sign_in',
      'nick@example.com',
      'hunter22',
      true,
    );

    await press('New here? Create an account');
    await press('Create account');
    expect(props.onEmail).toHaveBeenLastCalledWith(
      'create',
      'nick@example.com',
      'hunter22',
      true,
    );
  });

  it('does not submit email credentials before the age is confirmed', async () => {
    const { props, press, typeInto } = setup();
    await press('Continue with email');
    typeInto('Email', 'nick@example.com');
    typeInto('Password', 'hunter22');

    await press('Sign in');

    expect(props.onEmail).not.toHaveBeenCalled();
    expect(props.onAgeGateBlocked).toHaveBeenCalledWith('email');
  });

  it('sends a password reset without needing the age box and shows a neutral notice', async () => {
    const { props, press, typeInto, text } = setup();
    await press('Continue with email');
    typeInto('Email', 'nick@example.com');

    await press('Forgot password');

    expect(props.onForgotPassword).toHaveBeenCalledWith('nick@example.com');
    expect(text()).toContain('If that email has an account');
  });

  it('shows no reset notice when the reset failed', async () => {
    const { press, text } = setup({
      onForgotPassword: jest.fn().mockResolvedValue(false),
    });
    await press('Continue with email');

    await press('Forgot password');

    expect(text()).not.toContain('If that email has an account');
  });

  it('offers forgot password only when signing in', async () => {
    const { byLabel, press } = setup();
    await press('Continue with email');
    expect(byLabel('Forgot password')).toBeDefined();

    await press('New here? Create an account');
    expect(byLabel('Forgot password')).toBeUndefined();
  });

  it('shows the error and clears it when the person edits a field', async () => {
    const { props, press, typeInto, text } = setup({
      error: 'Incorrect email or password.',
    });
    expect(text()).toContain('Incorrect email or password.');

    await press('Continue with email');
    typeInto('Password', 'x');

    expect(props.onClearError).toHaveBeenCalled();
  });
});
