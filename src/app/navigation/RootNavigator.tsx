import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { rootNavigationRef } from '../../shared/navigation/rootNavigationRef';
import { trackNavigationStateChange } from './useNavigationAnalytics';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../features/home';
import { SettingsScreen } from '../../features/settings';
import { LifeScreen } from '../../features/life';
import {
  WidgetScreen,
  WidgetCustomizationScreen,
  HourCalculationScreen,
  DynamicIslandScreen,
  OverlayScreen,
} from '../../features/widgets';
import { CustomCountersScreen } from '../../features/counters';
import { CountdownsScreen } from '../../features/countdowns';
import {
  DailyTasksScreen,
  TaskReportScreen,
  MonthlyGoalsScreen,
  GoalDetailScreen,
  TasksComingSoonScreen,
} from '../../features/tasks';
import {
  DayDetailScreen,
  MonthDetailScreen,
  YearDetailScreen,
} from '../../features/time';
import { ShareSnapshotScreen } from '../../features/share';
import { BadgesScreen } from '../../features/badges';
import { PremiumScreen } from '../../features/premium';
import { AccountScreen } from '../../features/account';
import { PauseHubScreen, PauseSessionScreen } from '../../features/pause';
import {
  useTheme,
  Typography,
  Weight,
  getFontFamilyForWeight,
} from '../../shared/theme';
import { HomeHeaderActions } from './headerButtons';
import { ThemeToggleHeaderButton } from './ThemeToggleHeaderButton';
import { useThemeTransition } from './useThemeTransition';
import { useTranslation } from '../../shared/i18n/useTranslation';

import type { RootStackParamList } from '../../shared/navigation/types';
export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { resolvedTheme, themeTransition, themeTransitionCircleStyle, startThemeTransitionFrom } =
    useThemeTransition();

  const screenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: {
      color: theme.textPrimary,
      fontSize: Typography.sectionTitle,
      fontFamily: getFontFamilyForWeight(Weight.medium),
    },
    headerShadowVisible: false,
    headerBackTitle: t('common.back'),
  };
  return (
    <NavigationContainer
      ref={rootNavigationRef}
      onStateChange={state => trackNavigationStateChange(state)}
    >
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'UNTIL',
            headerRight: () => (
              <HomeHeaderActions navigation={navigation} theme={theme} />
            ),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={() => ({
            title: t('nav.settings'),
            headerRight: () => (
              <ThemeToggleHeaderButton
                resolvedTheme={resolvedTheme}
                theme={theme}
                onToggle={startThemeTransitionFrom}
              />
            ),
          })}
        />
        <Stack.Screen
          name="Life"
          component={LifeScreen}
          options={{ title: t('nav.life') }}
        />
        <Stack.Screen
          name="Widget"
          component={WidgetScreen}
          options={{ title: t('nav.widgets') }}
        />
        <Stack.Screen
          name="WidgetCustomization"
          component={WidgetCustomizationScreen}
          options={{ title: t('nav.customizeWidget') }}
        />
        <Stack.Screen
          name="CustomCounters"
          component={CustomCountersScreen}
          options={{ title: t('nav.customCounters') }}
        />
        <Stack.Screen
          name="Countdowns"
          component={CountdownsScreen}
          options={{ title: t('nav.deadlines') }}
        />
        <Stack.Screen
          name="DailyTasks"
          component={DailyTasksScreen}
          options={{ title: t('nav.todaysTasks') }}
        />
        <Stack.Screen
          name="TaskReport"
          component={TaskReportScreen}
          options={{ title: t('nav.taskReport') }}
        />
        <Stack.Screen
          name="DayDetail"
          component={DayDetailScreen}
          options={{ title: t('nav.today') }}
        />
        <Stack.Screen
          name="MonthDetail"
          component={MonthDetailScreen}
          options={{ title: t('nav.thisMonth') }}
        />
        <Stack.Screen
          name="YearDetail"
          component={YearDetailScreen}
          options={{ title: t('nav.thisYear') }}
        />
        <Stack.Screen
          name="MonthlyGoals"
          component={MonthlyGoalsScreen}
          options={{ title: t('nav.monthlyGoals') }}
        />
        <Stack.Screen
          name="GoalDetail"
          component={GoalDetailScreen}
          options={{ title: t('nav.goal') }}
        />
        <Stack.Screen
          name="HourCalculation"
          component={HourCalculationScreen}
          options={{ title: t('nav.hourCalculation') }}
        />
        <Stack.Screen
          name="DynamicIsland"
          component={DynamicIslandScreen}
          options={{
            title: Platform.OS === 'android' ? 'Live Island' : 'Dynamic Island',
          }}
        />
        <Stack.Screen
          name="Overlay"
          component={OverlayScreen}
          options={{ title: 'Live Island' }}
        />
        <Stack.Screen
          name="ShareSnapshot"
          component={ShareSnapshotScreen}
          options={{ title: t('nav.shareSnapshot') }}
        />
        <Stack.Screen
          name="Badges"
          component={BadgesScreen}
          options={{ title: t('nav.badges') }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ title: t('nav.premium') }}
        />
        <Stack.Screen
          name="Pause"
          component={PauseHubScreen}
          options={{ title: t('pause.title'), headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="PauseSession"
          component={PauseSessionScreen}
          options={{ title: t('pause.title'), headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="TasksComingSoon"
          component={TasksComingSoonScreen}
          options={{ title: t('nav.tasksAndGoals') }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ title: t('nav.account') }}
        />
      </Stack.Navigator>
      {themeTransition?.visible && themeTransitionCircleStyle ? (
        <View pointerEvents="none" style={styles.themeTransitionOverlay}>
          <Animated.View
            style={[styles.themeTransitionCircle, themeTransitionCircleStyle]}
          />
        </View>
      ) : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  themeTransitionOverlay: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  themeTransitionCircle: {
    position: 'absolute',
  },
});
