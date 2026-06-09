/**
 * Auth stack — shortened onboarding, optional identity/paywall screens. Shown before main app.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  OnboardingScreen,
  OnboardingCompleteContext,
} from '../surfaces/onboarding';
import { IdentitySetupScreen } from '../surfaces/auth/IdentitySetupScreen';
import { LifeWeeksPreviewScreen } from '../surfaces/auth/LifeWeeksPreviewScreen';
import { OnboardingPaywallScreen } from '../surfaces/auth/OnboardingPaywallScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  IdentitySetup: undefined;
  LifeWeeksPreview: undefined;
  OnboardingPaywall: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onComplete: () => void;
}

export function AuthNavigator({ onComplete }: AuthNavigatorProps) {
  return (
    <OnboardingCompleteContext.Provider value={onComplete}>
      <NavigationContainer>
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
        </Stack.Navigator>
      </NavigationContainer>
    </OnboardingCompleteContext.Provider>
  );
}
