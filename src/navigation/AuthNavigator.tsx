/**
 * Auth stack — onboarding then login. Shown after splash when auth not completed.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  OnboardingScreen,
  OnboardingCompleteContext,
} from '../surfaces/onboarding';
import { LoginScreen } from '../surfaces/auth/LoginScreen';
import { IdentitySetupScreen } from '../surfaces/auth/IdentitySetupScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  IdentitySetup: undefined;
  Login: undefined;
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
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </OnboardingCompleteContext.Provider>
  );
}
