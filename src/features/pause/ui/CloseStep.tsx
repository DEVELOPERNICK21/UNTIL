import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { GlassCard, Text } from '../../../shared/ui';
import { Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { HELP_DIRECTORY_URL } from '../config/helpDirectory';
import { PauseButton } from './PauseButton';

interface Props {
  /** The task chosen for ten minutes, said back once. */
  focus: string | null;
  /** Still tight after two rounds: offer more than a breath. */
  stillTight: boolean;
  onClose: () => void;
}

function openHelpDirectory(): void {
  Linking.openURL(HELP_DIRECTORY_URL).catch(() => {});
}

/**
 * It ends quietly. No streak, no confetti, no prompt to rate or upgrade. For someone who is still
 * tight it says so plainly and points to real people; for everyone else that pointer is a small line
 * at the bottom, always there.
 */
export function CloseStep({ focus, stillTight, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={styles.message}>
        <Text variant="headline" color="primary" accessibilityRole="header" style={styles.title}>
          {t('pause.end.title')}
        </Text>
        <Text variant="body" color="secondary" style={styles.body}>
          {focus ? t('pause.end.focus', { task: focus }) : t('pause.end.body')}
        </Text>

        {stillTight ? (
          <GlassCard style={styles.help}>
            <Text variant="body" color="primary" style={styles.helpText}>
              {t('pause.help.tight')}
            </Text>
            <PauseButton
              label={t('pause.help.link')}
              onPress={openHelpDirectory}
              accessibilityHint={t('pause.help.a11y')}
            />
          </GlassCard>
        ) : null}

        <Text variant="micro" color="muted" style={styles.private}>
          {t('pause.end.private')}
        </Text>
      </View>

      <View style={styles.actions}>
        <PauseButton label={t('common.close')} onPress={onClose} />
        {stillTight ? null : (
          <PauseButton
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
  help: {
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  helpText: {
    textAlign: 'center',
  },
  private: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing[1],
  },
});
