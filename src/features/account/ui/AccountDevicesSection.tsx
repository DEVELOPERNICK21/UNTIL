/**
 * Account → Devices: every phone, tablet and computer UNTIL is signed in on, how many of the
 * account's slots are in use, and a way to free one.
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassCard, Text } from '../../../shared/ui';
import { Radius, Spacing, useTheme } from '../../../shared/theme';
import type { AccountDevice } from '../../../shared/types';
import { DEVICE_RULES_NOTE } from '../domain/accountCopy';
import { describeDevices } from '../domain/deviceList';
import { DeviceGlyph } from './DeviceGlyph';

interface AccountDevicesSectionProps {
  devices: AccountDevice[];
  currentDeviceId: string | null;
  loading: boolean;
  removingId: string | null;
  now: number;
  onRemove: (device: AccountDevice) => void;
}

export function AccountDevicesSection({
  devices,
  currentDeviceId,
  loading,
  removingId,
  now,
  onRemove,
}: AccountDevicesSectionProps) {
  const theme = useTheme();
  const view = useMemo(
    () => describeDevices(devices, currentDeviceId, now),
    [devices, currentDeviceId, now],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text
          variant="caption"
          style={[styles.label, { color: theme.textSecondary }]}
        >
          Devices
        </Text>
        <Text
          variant="caption"
          accessibilityLabel={`${view.used} of ${view.max} device slots in use`}
          style={{ color: theme.textSecondary }}
        >
          {view.used} of {view.max} in use
        </Text>
      </View>

      <GlassCard style={styles.card}>
        <View style={styles.meter} accessibilityElementsHidden>
          {Array.from({ length: view.max }, (_, i) => (
            <View
              key={i}
              style={[
                styles.meterSlot,
                {
                  backgroundColor:
                    i < view.used ? theme.percent : theme.divider,
                },
              ]}
            />
          ))}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.textSecondary} />
          </View>
        ) : view.rows.length === 0 ? (
          <Text
            variant="caption"
            style={[styles.empty, { color: theme.textSecondary }]}
          >
            No devices yet.
          </Text>
        ) : (
          view.rows.map((row, index) => {
            const device = devices.find(d => d.id === row.id);
            return (
              <View
                key={row.id}
                style={[
                  styles.row,
                  index < view.rows.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.glassBorder,
                  },
                  row.stale && styles.stale,
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: theme.glassHighlight },
                  ]}
                >
                  <DeviceGlyph kind={row.kind} color={theme.textPrimary} />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.titleRow}>
                    <Text
                      variant="body"
                      numberOfLines={1}
                      style={[styles.title, { color: theme.textPrimary }]}
                    >
                      {row.title}
                    </Text>
                    {row.isCurrent ? (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: theme.percent },
                        ]}
                      >
                        <Text variant="caption" style={styles.badgeLabel}>
                          This device
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    variant="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {row.subtitle}
                  </Text>
                </View>
                {row.canRemove && device ? (
                  <TouchableOpacity
                    onPress={() => onRemove(device)}
                    disabled={removingId === row.id}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${row.title}`}
                  >
                    {removingId === row.id ? (
                      <ActivityIndicator color={theme.textSecondary} />
                    ) : (
                      <Text variant="caption" style={styles.removeLabel}>
                        Remove
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </GlassCard>

      <Text variant="caption" style={[styles.note, { color: theme.textMuted }]}>
        {DEVICE_RULES_NOTE}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
    marginHorizontal: Spacing[1],
  },
  label: {
    letterSpacing: 0.4,
  },
  card: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  meter: {
    flexDirection: 'row',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
  },
  meterSlot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  loading: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  empty: {
    paddingVertical: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
  },
  stale: {
    opacity: 0.6,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    flexShrink: 1,
  },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  badgeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  removeLabel: {
    color: '#E85C5C',
  },
  note: {
    marginTop: Spacing[2],
    marginHorizontal: Spacing[1],
    lineHeight: 18,
  },
});
