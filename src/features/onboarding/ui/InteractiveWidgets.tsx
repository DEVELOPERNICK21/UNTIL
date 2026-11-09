/**
 * Interactive home-screen widget preview beat.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Vibration, Animated } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { DAY_LEFT, useEnter, useLiveDayClock } from './onboardingMotion';
import { WidgetMock } from './WidgetMock';

interface InteractiveWidgetsProps {
  active: boolean;
}

export function InteractiveWidgets({ active }: InteractiveWidgetsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const clock = useLiveDayClock(active);
  const [focus, setFocus] = useState<'DAY' | 'YEAR' | null>(null);
  const title = useEnter(active, 40);
  const sub = useEnter(active, 120);
  const phone = useEnter(active, 200);
  const phoneScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!active) {
      phoneScale.setValue(0.94);
      return;
    }
    Animated.spring(phoneScale, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [active, phoneScale]);

  return (
    <View style={styles.body}>
      <Animated.View style={title}>
        <Text variant="micro" style={[styles.eyebrow, { color: theme.percent }]}>
          {t('onboarding.widgets.eyebrow')}
        </Text>
        <Text
          variant="display"
          style={[
            styles.slideTitle,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          {t('onboarding.widgets.title')}
        </Text>
      </Animated.View>

      <Animated.View style={sub}>
        <Text
          variant="body"
          style={[styles.slideSubtitle, { color: theme.textSecondary }]}
        >
          {t('onboarding.widgets.subtitle')}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          phone,
          {
            transform: [...(phone.transform ?? []), { scale: phoneScale }],
          },
        ]}
      >
        <View
          style={[
            styles.phoneFrame,
            {
              borderColor: theme.glassBorder,
              backgroundColor: theme.backgroundAlt,
            },
          ]}
        >
          <View
            style={[styles.phoneNotch, { backgroundColor: theme.divider }]}
          />
          <View style={styles.widgetGrid}>
            <WidgetMock
              title={t('onboarding.widgets.day')}
              value={`${clock.percentDone}%`}
              accent={theme.percent}
              progress={clock.progress}
              selected={focus === 'DAY'}
              onPress={() => {
                Vibration.vibrate(8);
                setFocus(f => (f === 'DAY' ? null : 'DAY'));
              }}
              enterDelay={260}
              active={active}
            />
            <WidgetMock
              title={t('onboarding.widgets.year')}
              value="53%"
              accent={DAY_LEFT}
              progress={0.53}
              selected={focus === 'YEAR'}
              onPress={() => {
                Vibration.vibrate(8);
                setFocus(f => (f === 'YEAR' ? null : 'YEAR'));
              }}
              enterDelay={360}
              active={active}
            />
          </View>
          <Text
            variant="micro"
            style={{
              color: theme.textSecondary,
              textAlign: 'center',
              marginTop: Spacing.md,
            }}
          >
            {t('onboarding.widgets.preview')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  slideTitle: {
    marginBottom: Spacing.sm,
    lineHeight: Typography.display * 1.2,
  },
  slideSubtitle: {
    lineHeight: Typography.body * 1.5,
    marginBottom: Spacing.md,
  },
  phoneFrame: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  phoneNotch: {
    alignSelf: 'center',
    width: 72,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.md,
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
