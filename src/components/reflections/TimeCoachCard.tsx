import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from '../../ui';
import { Radius, Spacing, useTheme } from '../../theme';
import type {
  DailyReflection,
  ReflectionTone,
} from '../../domain/reflections/reflectionTypes';
import { logAnalyticsEvent } from '../../services/analytics';

interface TimeCoachCardProps {
  reflection: DailyReflection;
  tone: ReflectionTone;
  canUsePremiumReflections: boolean;
  onDismiss: () => void;
  onToneChange: (tone: ReflectionTone) => void;
  onBirthDatePress: () => void;
}

export function TimeCoachCard({
  reflection,
  tone,
  canUsePremiumReflections,
  onDismiss,
  onToneChange,
  onBirthDatePress,
}: TimeCoachCardProps) {
  const theme = useTheme();

  useEffect(() => {
    logAnalyticsEvent('reflection_seen', {
      category: reflection.category,
      tone: reflection.tone,
      premium: reflection.premium,
    }).catch(() => {});
  }, [reflection.category, reflection.id, reflection.premium, reflection.tone]);

  const handleDismiss = () => {
    logAnalyticsEvent('reflection_dismissed', {
      category: reflection.category,
      tone: reflection.tone,
    }).catch(() => {});
    onDismiss();
  };

  const handleToneChange = (next: ReflectionTone) => {
    logAnalyticsEvent('reflection_tone_changed', { tone: next }).catch(() => {});
    onToneChange(next);
  };

  const handleBirthDatePress = () => {
    logAnalyticsEvent('reflection_birthdate_cta_tapped').catch(() => {});
    onBirthDatePress();
  };

  return (
    <Card style={styles.card} lighter>
      <View style={styles.headerRow}>
        <Text variant="caption" color="secondary" style={styles.overline}>
          TIME COACH
        </Text>
        <TouchableOpacity onPress={handleDismiss} hitSlop={10}>
          <Text variant="caption" color="secondary">
            Not today
          </Text>
        </TouchableOpacity>
      </View>

      <Text variant="sectionTitle" color="primary" style={styles.title}>
        {reflection.title}
      </Text>
      <Text variant="body" color="secondary" style={styles.message}>
        {reflection.message}
      </Text>

      <View style={styles.footerRow}>
        {canUsePremiumReflections ? (
          <View style={styles.toneRow}>
            {(['quiet', 'radical'] as const).map(option => {
              const active = tone === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.tonePill,
                    active && styles.tonePillActive,
                    {
                      borderColor: active ? theme.percent : theme.divider,
                    },
                  ]}
                  onPress={() => handleToneChange(option)}
                  activeOpacity={0.8}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: active ? theme.percent : theme.textSecondary,
                    }}
                  >
                    {option === 'quiet' ? 'Quiet' : 'Radical'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text variant="caption" color="secondary" style={styles.lockHint}>
            Life reflections unlock during preview or Premium.
          </Text>
        )}

        {reflection.action === 'setBirthDate' ? (
          <TouchableOpacity
            style={[styles.cta, { borderColor: theme.percent }]}
            onPress={handleBirthDatePress}
            activeOpacity={0.8}
          >
            <Text variant="caption" style={{ color: theme.percent }}>
              Set birth date
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[4],
    padding: Spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  overline: {
    letterSpacing: 1,
  },
  title: {
    marginBottom: Spacing[1],
  },
  message: {
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  toneRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  tonePill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 6,
  },
  tonePillActive: {
    backgroundColor: 'rgba(232, 124, 32, 0.14)',
  },
  lockHint: {
    flex: 1,
    lineHeight: 18,
  },
  cta: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 6,
  },
});
