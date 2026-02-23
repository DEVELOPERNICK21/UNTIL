import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../surfaces/app/HomeScreen';
import { SettingsScreen } from '../surfaces/app/SettingsScreen';
import { LifeScreen } from '../surfaces/app/LifeScreen';
import { WidgetScreen } from '../surfaces/app/WidgetScreen';
import { CustomCountersScreen } from '../surfaces/app/CustomCountersScreen';
import { CountdownsScreen } from '../surfaces/app/CountdownsScreen';
import { Text } from '../ui';
import { Colors, Typography } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Life: undefined;
  Widget: undefined;
  CustomCounters: undefined;
  Countdowns: undefined;
};

const headerStyle = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: {
    color: Colors.textPrimary,
    fontSize: Typography.sectionTitle,
    fontWeight: '500' as const,
  },
  headerShadowVisible: false,
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
            title: 'Until: Days left',
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Widget')} style={{ padding: 8 }}>
                  <Text variant="caption" color="secondary">Widgets</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
                  <Text variant="caption" color="secondary">Settings</Text>
                </TouchableOpacity>
              </View>
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
        <Stack.Screen
          name="Widget"
          component={WidgetScreen}
          options={{ title: 'Widgets', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="CustomCounters"
          component={CustomCountersScreen}
          options={{ title: 'Custom counters', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Countdowns"
          component={CountdownsScreen}
          options={{ title: 'Countdowns', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
