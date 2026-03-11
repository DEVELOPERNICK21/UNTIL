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
import { DailyTasksScreen } from '../surfaces/app/DailyTasksScreen';
import { TaskReportScreen } from '../surfaces/app/TaskReportScreen';
import { DayDetailScreen } from '../surfaces/app/DayDetailScreen';
import { MonthDetailScreen } from '../surfaces/app/MonthDetailScreen';
import { YearDetailScreen } from '../surfaces/app/YearDetailScreen';
import { MonthlyGoalsScreen } from '../surfaces/app/MonthlyGoalsScreen';
import { GoalDetailScreen } from '../surfaces/app/GoalDetailScreen';
import { HourCalculationScreen } from '../surfaces/app/HourCalculationScreen';
import { DynamicIslandScreen } from '../surfaces/app/DynamicIslandScreen';
import { OverlayScreen } from '../surfaces/app/OverlayScreen';
import { Text } from '../ui';
import { Colors, Typography } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Life: undefined;
  Widget: undefined;
  CustomCounters: undefined;
  Countdowns: undefined;
  DailyTasks: undefined;
  TaskReport: undefined;
  DayDetail: undefined;
  MonthDetail: undefined;
  YearDetail: undefined;
  MonthlyGoals: undefined;
  GoalDetail: { goalId: string };
  HourCalculation: undefined;
  DynamicIsland: undefined;
  Overlay: undefined;
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
        <Stack.Screen
          name="DailyTasks"
          component={DailyTasksScreen}
          options={{ title: "Today's tasks", headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="TaskReport"
          component={TaskReportScreen}
          options={{ title: 'Task report', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="DayDetail"
          component={DayDetailScreen}
          options={{ title: 'Today', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="MonthDetail"
          component={MonthDetailScreen}
          options={{ title: 'This month', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="YearDetail"
          component={YearDetailScreen}
          options={{ title: 'This year', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="MonthlyGoals"
          component={MonthlyGoalsScreen}
          options={{ title: 'Monthly goals', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="GoalDetail"
          component={GoalDetailScreen}
          options={{ title: 'Goal', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="HourCalculation"
          component={HourCalculationScreen}
          options={{ title: 'Hour calculation', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="DynamicIsland"
          component={DynamicIslandScreen}
          options={{ title: 'Dynamic Island', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Overlay"
          component={OverlayScreen}
          options={{ title: 'Floating overlay', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
