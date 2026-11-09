/**
 * Settings profile hero: the UNTIL avatar, the name line, born and expected years, how much of
 * life is complete, and (for subscribers) which plan they have.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  Spacing,
  Weight,
  getFontFamilyForWeight,
  useTheme,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { PlanChip } from '../../premium';

interface ProfileHeroProps {
  bornExpectedLine: string;
  lifePercent: number;
}

export function ProfileHero({ bornExpectedLine, lifePercent }: ProfileHeroProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.profileHero}>
      <View style={[styles.avatarRing, { borderColor: theme.divider }]}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.cardLighter },
          ]}
        >
          <Text
            variant="sectionTitle"
            style={{ color: theme.textSecondary }}
          >
            UNTIL
          </Text>
        </View>
        <View
          style={[
            styles.avatarEditBadge,
            { backgroundColor: theme.background },
          ]}
        >
          <Text style={[styles.editIcon, { color: theme.textPrimary }]}>
            ✎
          </Text>
        </View>
      </View>
      <Text
        variant="title"
        style={[styles.profileName, { color: theme.textPrimary }]}
      >
        {t('settings.profile.name')}
      </Text>
      <Text
        variant="caption"
        style={[styles.profileMeta, { color: theme.textSecondary }]}
      >
        {bornExpectedLine}
      </Text>
      <Text
        variant="caption"
        style={[styles.profileMeta, { color: theme.textSecondary }]}
      >
        {t('settings.profile.lifeComplete', { percent: lifePercent })}
      </Text>
      <PlanChip />
    </View>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editIcon: {
    fontSize: 12,
  },
  profileName: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginBottom: Spacing.xs,
  },
  profileMeta: {
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
});
