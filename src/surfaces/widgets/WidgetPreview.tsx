import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../ui';
import { Colors, Spacing, Radius, Typography } from '../../theme';

type WidgetConfig = {
  type: 'day' | 'month' | 'year' | 'life';
  theme: 'light' | 'dark' | 'amoled';
  layout: 'minimal' | 'detailed';
  font: 'clean' | 'emotional';
  showMessage: boolean;
  message: string;
};

interface Props {
  config: WidgetConfig;
}

export function WidgetPreview({ config }: Props) {
  const backgroundColor =
    config.theme === 'amoled'
      ? '#000000'
      : config.theme === 'dark'
      ? Colors.surfaceDark
      : Colors.surface;

  const textColor =
    config.theme === 'amoled' || config.theme === 'dark'
      ? Colors.textOnDark
      : Colors.textPrimary;

  const accentColor =
    config.theme === 'light'
      ? Colors.accent
      : config.theme === 'dark'
      ? Colors.accentSoft
      : Colors.accent;

  const titleStyle =
    config.font === 'emotional'
      ? styles.titleEmotional
      : styles.titleClean;

  const percent = {
    day: 42,
    month: 65,
    year: 18,
    life: 73,
  }[config.type];

  const label = {
    day: 'Today',
    month: 'This month',
    year: 'This year',
    life: 'Your life',
  }[config.type];

  return (
    <View style={[styles.container]}>
      <View style={[styles.card, { backgroundColor }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          <View style={[styles.pill, { borderColor: accentColor }]}>
            <Text style={[styles.pillText, { color: accentColor }]}>
              {config.layout === 'minimal' ? 'Minimal' : 'Detailed'}
            </Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.percentBlock}>
            <Text style={[styles.percent, titleStyle, { color: textColor }]}>
              {percent}%
            </Text>
            <Text style={[styles.caption, { color: textColor }]}>
              done
            </Text>
          </View>
          {config.layout === 'detailed' && (
            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: accentColor }]} />
                <Text style={[styles.metaText, { color: textColor }]}>
                  {percent} of {config.type === 'life' ? 'years' : 'time'} used
                </Text>
              </View>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: Colors.borderSubtle },
                  ]}
                />
                <Text style={[styles.metaText, { color: textColor }]}>
                  {100 - percent}% remaining
                </Text>
              </View>
            </View>
          )}
        </View>

        {config.showMessage && config.message.trim().length > 0 && (
          <View style={[styles.messageBubble, { borderColor: accentColor }]}>
            <Text style={[styles.messageText, { color: textColor }]}>
              {config.message}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.caption,
    letterSpacing: 1,
  },
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: Typography.caption,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  percentBlock: {
    flexDirection: 'column',
  },
  percent: {
    fontSize: 40,
  },
  titleClean: {
    fontWeight: '700',
  },
  titleEmotional: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: Typography.caption,
    opacity: 0.8,
  },
  metaBlock: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  metaText: {
    fontSize: Typography.caption,
  },
  messageBubble: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  messageText: {
    fontSize: Typography.body,
  },
});

