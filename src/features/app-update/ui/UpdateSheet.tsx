/**
 * Bottom sheet that says a newer version is out. Optional updates can be put off ("Not now");
 * a required one (the installed build is below the minimum) has no way out but the store.
 */

import React from 'react';
import { Image, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../shared/ui';
import { Radius, Spacing, Weight, getFontFamilyForWeight, useTheme } from '../../../shared/theme';
import { appLogoIcon } from '../../../assets/images';
import type { UpdateDecision } from '../domain/updatePolicy';

interface UpdateSheetProps {
  decision: UpdateDecision;
  onUpdate: () => void;
  onLater: () => void;
}

export function UpdateSheet({ decision, onUpdate, onLater }: UpdateSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  if (decision.kind === 'none') return null;

  const required = decision.kind === 'required';
  const title = required ? 'Please update UNTIL' : 'A new version is ready';
  const body = required
    ? 'This version is no longer supported. Update to keep your widgets and account working.'
    : decision.versionName
      ? `UNTIL ${decision.versionName} is out, with the latest fixes and improvements.`
      : 'A new version of UNTIL is out, with the latest fixes and improvements.';

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={required ? undefined : onLater}
    >
      <Pressable
        style={styles.backdrop}
        onPress={required ? undefined : onLater}
        accessibilityLabel="Close"
        accessibilityRole="button"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Pressable
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: theme.cardBaseAlpha,
              paddingBottom: Math.max(insets.bottom, Spacing[4]),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.divider }]} />

          <View style={styles.header}>
            <Image
              source={appLogoIcon}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.headerText}>
              <Text variant="title" style={{ color: theme.textPrimary }}>
                {title}
              </Text>
              <Text variant="body" style={[styles.body, { color: theme.textSecondary }]}>
                {body}
              </Text>
            </View>
          </View>

          {decision.notes.length > 0 ? (
            <View style={styles.notes}>
              <Text variant="caption" style={[styles.notesLabel, { color: theme.textMuted }]}>
                WHAT'S NEW
              </Text>
              {decision.notes.map(note => (
                <View key={note} style={styles.noteRow}>
                  <View style={[styles.dot, { backgroundColor: theme.percent }]} />
                  <Text variant="body" style={[styles.noteText, { color: theme.textPrimary }]}>
                    {note}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={onUpdate}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Update now"
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              Update now
            </Text>
          </TouchableOpacity>

          {required ? null : (
            <TouchableOpacity
              style={styles.later}
              onPress={onLater}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Not now"
            >
              <Text variant="body" style={{ color: theme.textSecondary }}>
                Not now
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'flex-start',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
  },
  headerText: {
    flex: 1,
    gap: Spacing[1],
  },
  body: {
    lineHeight: 22,
  },
  notes: {
    marginTop: Spacing[4],
    gap: Spacing[2],
  },
  notesLabel: {
    letterSpacing: 1,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  noteText: {
    flex: 1,
    lineHeight: 22,
  },
  primary: {
    marginTop: Spacing[4],
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  later: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: Spacing[1],
  },
});
