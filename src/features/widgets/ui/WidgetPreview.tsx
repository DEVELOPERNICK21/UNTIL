import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../shared/ui';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { getWidgetAccentColor } from '../config/widgetAccents';
import type { WidgetConfig } from '../domain/WidgetConfig';

interface Props {
  config: WidgetConfig;
}

export function WidgetPreview({ config }: Props) {
  const { t } = useTranslation();
  const isLight = config.theme === 'light';
  const backgroundColor =
    config.theme === 'amoled'
      ? '#000000'
      : config.theme === 'dark'
        ? 'rgba(255, 255, 255, 0.07)'
        : 'rgba(255, 255, 255, 0.82)';

  const textColor = isLight ? Colors.textPrimary : Colors.textPrimary;
  const mutedDot = isLight ? Colors.divider : 'rgba(255, 255, 255, 0.22)';
  const borderColor = isLight
    ? 'rgba(255, 255, 255, 0.55)'
    : Colors.glassBorder;
  const accentColor = getWidgetAccentColor(config.accent);
  const sheenColor = isLight
    ? 'rgba(255, 255, 255, 0.45)'
    : Colors.glassHighlight;

  const titleStyle =
    config.font === 'emotional' ? styles.titleEmotional : styles.titleClean;

  const percent = {
    day: 42,
    month: 65,
    year: 18,
    life: 73,
  }[config.type];

  const label = {
    day: t('nav.today'),
    month: t('nav.thisMonth'),
    year: t('nav.thisYear'),
    life: t('nav.life'),
  }[config.type];

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor, borderColor }, Shadows.glass]}>
        <View style={[styles.sheen, { backgroundColor: sheenColor }]} />
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          <View style={[styles.pill, { borderColor: accentColor }]}>
            <Text style={[styles.pillText, { color: accentColor }]}>
              {config.layout === 'minimal'
                ? t('widgets.custom.layout.minimal')
                : t('widgets.custom.layout.detailed')}
            </Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.percentBlock}>
            <Text style={[styles.percent, titleStyle, { color: textColor }]}>
              {percent}%
            </Text>
            <Text style={[styles.caption, { color: textColor }]}>
              {t('widgets.preview.done')}
            </Text>
          </View>
          {config.layout === 'detailed' && (
            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: accentColor }]} />
                <Text style={[styles.metaText, { color: textColor }]}>
                  {t(
                    config.type === 'life'
                      ? 'widgets.preview.yearsUsed'
                      : 'widgets.preview.timeUsed',
                    { percent },
                  )}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: mutedDot }]} />
                <Text style={[styles.metaText, { color: textColor }]}>
                  {t('widgets.preview.remaining', { percent: 100 - percent })}
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
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
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
    textTransform: 'uppercase',
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
