/**
 * Auth stack — psychology quiz funnel + identity/life/paywall. Shown before main app.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { trackNavigationStateChange } from './useNavigationAnalytics';
import {
  OnboardingScreen,
  OnboardingCompleteContext,
} from '../surfaces/onboarding';
import type { OnboardingExitParams } from '../services/onboardingCompletion';
import { IdentitySetupScreen } from '../surfaces/auth/IdentitySetupScreen';
import { LifeWeeksPreviewScreen } from '../surfaces/auth/LifeWeeksPreviewScreen';
import { OnboardingPaywallScreen } from '../surfaces/auth/OnboardingPaywallScreen';
import { AccountPromptScreen } from '../surfaces/auth/AccountPromptScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  IdentitySetup: undefined;
  LifeWeeksPreview: undefined;
  OnboardingPaywall: undefined;
  AccountPrompt: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onComplete: (params?: OnboardingExitParams) => void;
}

export function AuthNavigator({ onComplete }: AuthNavigatorProps) {
  return (
    <OnboardingCompleteContext.Provider value={onComplete}>
      <NavigationContainer onStateChange={state => trackNavigationStateChange(state)}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
          initialRouteName="Onboarding"
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="IdentitySetup" component={IdentitySetupScreen} />
          <Stack.Screen
            name="LifeWeeksPreview"
            component={LifeWeeksPreviewScreen}
          />
          <Stack.Screen
            name="OnboardingPaywall"
            component={OnboardingPaywallScreen}
          />
          <Stack.Screen name="AccountPrompt" component={AccountPromptScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </OnboardingCompleteContext.Provider>
  );
}
