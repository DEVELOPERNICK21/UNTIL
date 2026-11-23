import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { HELP_DIRECTORY_URL } from '../config/helpDirectory';
import type { RecordedSession } from '../domain/useCases/RecordPauseSessionUseCase';
import { calmMinutes, levelFor } from '../domain/pauseProgress';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';
import { LEVEL_LABEL, MILESTONE_LABEL } from './practiceLabels';

interface Props {
  /** The task chosen for ten minutes, said back once. */
  focus: string | null;
  /** Still tight after two rounds: offer more than a breath. */
  stillTight: boolean;
  /** What this session added; null while it is being saved. */
  result: RecordedSession | null;
  /** Back to the Pause menu. */
  onBack: () => void;
  /** Leave Pause altogether. */
  onLeave: () => void;
}

function openHelpDirectory(): void {
  Linking.openURL(HELP_DIRECTORY_URL).catch(() => {});
}

/**
 * It ends quietly, with a small, kind reward: the calm minutes just added, and a line only when
 * something was unlocked. No confetti, no streak, no prompt to rate or upgrade. For someone who is
 * still tight it says so plainly and points to real people; for everyone else that pointer is a small
 * line at the bottom, always there.
 */
export function CloseStep({ focus, stillTight, result, onBack, onLeave }: Props) {
  const { t } = useTranslation();
  const minutes = result ? calmMinutes(result.gainedSeconds) : 0;
  const level = result ? levelFor(result.progress.totalSeconds) : null;
  const wins: string[] = [];
  if (result?.leveledUp && level) wins.push(t('pause.end.levelUp', { level: t(LEVEL_LABEL[level.id]) }));
  result?.milestones.forEach(id => wins.push(t('pause.end.milestone', { name: t(MILESTONE_LABEL[id]) })));
  if (result?.goalReachedNow) wins.push(t('pause.end.goal'));

  return (
    <View style={styles.root}>
      <View style={styles.message}>
        <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
          {t('pause.end.title')}
        </CalmText>
        <CalmText variant="body" tone="secondary" style={styles.body}>
          {focus ? t('pause.end.focus', { task: focus }) : t('pause.end.body')}
        </CalmText>

        {result && result.gainedSeconds > 0 ? (
          <View style={styles.gain} accessibilityLiveRegion="polite">
            <CalmText variant="sectionTitle" tone="accent">
              {t('pause.end.gained', { minutes })}
            </CalmText>
          </View>
        ) : null}

        {wins.map(line => (
          <View key={line} style={styles.win}>
            <CalmText variant="body" tone="warm" style={styles.winText}>
              {line}
            </CalmText>
          </View>
        ))}

        {stillTight ? (
          <View style={styles.help}>
            <CalmText variant="body" tone="primary" style={styles.helpText}>
              {t('pause.help.tight')}
            </CalmText>
            <CalmButton label={t('pause.help.link')} onPress={openHelpDirectory} accessibilityHint={t('pause.help.a11y')} />
          </View>
        ) : null}

        <CalmText variant="micro" tone="muted" style={styles.private}>
          {t('pause.end.private')}
        </CalmText>
      </View>

      <View style={styles.actions}>
        <CalmButton variant="solid" label={t('pause.end.another')} onPress={onBack} />
        <CalmButton variant="soft" label={t('common.close')} onPress={onLeave} />
        {stillTight ? null : (
          <CalmButton
            variant="quiet"
            label={t('pause.help.footer')}
            onPress={openHelpDirectory}
            accessibilityHint={t('pause.help.a11y')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  message: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  body: {
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  gain: {
    alignSelf: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: CALM.accentSoft,
    backgroundColor: CALM.cardSelected,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    marginBottom: Spacing[2],
  },
  win: {
    alignSelf: 'center',
    marginBottom: Spacing[1],
  },
  winText: {
    textAlign: 'center',
  },
  help: {
    backgroundColor: CALM.card,
    borderColor: CALM.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  helpText: {
    textAlign: 'center',
  },
  private: {
    textAlign: 'center',
    marginTop: Spacing[3],
  },
  actions: {
    gap: Spacing[1],
  },
});
