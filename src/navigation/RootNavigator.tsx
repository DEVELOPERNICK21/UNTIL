import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
  TouchableOpacity,
  type GestureResponderEvent,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../surfaces/app/HomeScreen';
import { SettingsScreen } from '../surfaces/app/SettingsScreen';
import { LifeScreen } from '../surfaces/app/LifeScreen';
import { WidgetScreen } from '../surfaces/app/WidgetScreen';
import { WidgetCustomizationScreen } from '../surfaces/app/WidgetCustomizationScreen';
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
import { ShareSnapshotScreen } from '../surfaces/app/ShareSnapshotScreen';
import { PremiumScreen } from '../surfaces/app/PremiumScreen';
import { TasksComingSoonScreen } from '../surfaces/app/TasksComingSoonScreen';
import {
  getPaletteForMode,
  useTheme,
  Typography,
  Weight,
  getFontFamilyForWeight,
} from '../theme';
import { useThemeStore } from '../stores/themeStore';
import {
  MoonIcon,
  ProfileIcon,
  SettingsIcon,
  ShareIcon,
  SunIcon,
} from '../assets/icons';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Life: undefined;
  Widget: undefined;
  WidgetCustomization: undefined;
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
  ShareSnapshot: undefined;
  Premium: undefined;
  TasksComingSoon: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const HEADER_ICON_SIZE = 19;
const THEME_ICON_SIZE = 22;
const THEME_WIPE_DURATION_MS = 760;

function getGlassIconButtonStyle(theme: ReturnType<typeof useTheme>) {
  return {
    backgroundColor: theme.glassBg,
    borderColor: theme.glassBorder,
  };
}

function ThemeToggleHeaderButton({
  resolvedTheme,
  theme,
  onToggle,
}: {
  resolvedTheme: 'light' | 'dark';
  theme: ReturnType<typeof useTheme>;
  onToggle: (origin: { x: number; y: number }) => void;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handlePress = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    rotateAnim.setValue(0);
    pulseAnim.setValue(0);

    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.14,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onToggle({ x: pageX, y: pageY });
  };

  return (
    <TouchableOpacity
      style={[
        styles.headerIconButton,
        getGlassIconButtonStyle(theme),
        resolvedTheme === 'dark'
          ? styles.themeToggleDarkBg
          : styles.themeToggleLightBg,
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.themePulseRing,
          resolvedTheme === 'dark'
            ? styles.themePulseRingDark
            : styles.themePulseRingLight,
          {
            opacity: pulseAnim,
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.86, 1.24],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={{ transform: [{ rotate: rotation }, { scale: scaleAnim }] }}
      >
        {resolvedTheme === 'dark' ? (
          <SunIcon
            width={THEME_ICON_SIZE}
            height={THEME_ICON_SIZE}
            color={theme.percent}
          />
        ) : (
          <MoonIcon
            width={THEME_ICON_SIZE}
            height={THEME_ICON_SIZE}
            color={theme.textSecondary}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const resolvedTheme = useThemeStore(s => s.resolvedTheme);
  const setThemeMode = useThemeStore(s => s.setThemeMode);
  const [themeTransition, setThemeTransition] = useState<{
    x: number;
    y: number;
    color: string;
    visible: boolean;
  } | null>(null);
  const themeWipeAnim = useRef(new Animated.Value(0)).current;
  const themeApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxRadius = Math.sqrt(
    screenWidth * screenWidth + screenHeight * screenHeight,
  );
  const circleDiameter = maxRadius * 2;

  useEffect(() => {
    return () => {
      if (themeApplyTimerRef.current) {
        clearTimeout(themeApplyTimerRef.current);
      }
    };
  }, []);

  const themeTransitionCircleStyle = themeTransition
    ? {
        width: circleDiameter,
        height: circleDiameter,
        borderRadius: circleDiameter / 2,
        left: themeTransition.x - circleDiameter / 2,
        top: themeTransition.y - circleDiameter / 2,
        backgroundColor: themeTransition.color,
        opacity: themeWipeAnim.interpolate({
          // Higher mid opacity masks the store flip for a smoother transition.
          inputRange: [0, 0.2, 0.55, 1],
          outputRange: [0, 0.58, 0.5, 0],
        }),
        transform: [
          {
            scale: themeWipeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.02, 1],
            }),
          },
        ],
      }
    : null;

  const startThemeTransitionFrom = (origin: { x: number; y: number }) => {
    const nextMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    const nextThemeColor = getPaletteForMode(nextMode).background;

    if (themeApplyTimerRef.current) {
      clearTimeout(themeApplyTimerRef.current);
    }

    setThemeTransition({
      x: origin.x,
      y: origin.y,
      color: nextThemeColor,
      visible: true,
    });

    themeWipeAnim.setValue(0);
    Animated.timing(themeWipeAnim, {
      toValue: 1,
      duration: THEME_WIPE_DURATION_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start(() => {
      setThemeTransition(prev => (prev ? { ...prev, visible: false } : prev));
      themeWipeAnim.setValue(0);
    });

    // Apply while overlay is dense, so UI token changes are hidden smoothly.
    themeApplyTimerRef.current = setTimeout(() => {
      setThemeMode(nextMode).catch(() => {
        // Ignore persistence errors; in-memory theme still updates.
      });
    }, Math.round(THEME_WIPE_DURATION_MS * 0.18));
  };

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
  };
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Until: Days left',
            headerRight: () => (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ShareSnapshot')}
                  style={[
                    styles.headerIconButton,
                    getGlassIconButtonStyle(theme),
                  ]}
                  activeOpacity={0.78}
                >
                  <ShareIcon
                    width={HEADER_ICON_SIZE}
                    height={HEADER_ICON_SIZE}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Widget')}
                  style={[
                    styles.headerIconButton,
                    styles.headerIconButtonSpacing,
                    getGlassIconButtonStyle(theme),
                  ]}
                  activeOpacity={0.78}
                >
                  <SettingsIcon
                    width={HEADER_ICON_SIZE}
                    height={HEADER_ICON_SIZE}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  style={[
                    styles.headerIconButton,
                    styles.headerIconButtonSpacing,
                    getGlassIconButtonStyle(theme),
                  ]}
                  activeOpacity={0.78}
                >
                  <ProfileIcon
                    width={HEADER_ICON_SIZE}
                    height={HEADER_ICON_SIZE}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={() => ({
            title: 'Settings',
            headerBackTitle: 'Back',
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
          options={{ title: 'Your life', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Widget"
          component={WidgetScreen}
          options={{ title: 'Settings', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="WidgetCustomization"
          component={WidgetCustomizationScreen}
          options={{ title: 'Customize widget', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="CustomCounters"
          component={CustomCountersScreen}
          options={{ title: 'Custom counters', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Countdowns"
          component={CountdownsScreen}
          options={{ title: 'Deadlines', headerBackTitle: 'Back' }}
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
        <Stack.Screen
          name="ShareSnapshot"
          component={ShareSnapshotScreen}
          options={{ title: 'Share snapshot', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ title: 'Premium', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="TasksComingSoon"
          component={TasksComingSoonScreen}
          options={{ title: 'Tasks & goals', headerBackTitle: 'Back' }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonSpacing: {
    marginLeft: 8,
  },
  themeToggleDarkBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  themeToggleLightBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderColor: 'rgba(0, 0, 0, 0.26)',
  },
  themePulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.2,
    borderRadius: 16,
  },
  themePulseRingDark: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  themePulseRingLight: {
    borderColor: 'rgba(0, 0, 0, 0.35)',
  },
  themeTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  themeTransitionCircle: {
    position: 'absolute',
  },
});
