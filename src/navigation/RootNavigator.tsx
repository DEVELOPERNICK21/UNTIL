import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../surfaces/app/HomeScreen';
import { SettingsScreen } from '../surfaces/app/SettingsScreen';
import { LifeScreen } from '../surfaces/app/LifeScreen';
import { Text } from '../ui';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Life: undefined;
};

import { Colors, Typography } from '../theme';

const headerStyle = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.primaryText,
  headerTitleStyle: {
    color: Colors.primaryText,
    fontSize: Typography.titleApp,
    letterSpacing: 1.5,
    fontWeight: '500' as const,
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          ...headerStyle,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'UNTIL',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={{ padding: 8 }}
              >
                <Text variant="meta" color="primary">Settings</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Life"
          component={LifeScreen}
          options={{ title: 'Your life', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
