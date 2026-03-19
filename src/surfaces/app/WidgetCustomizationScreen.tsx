import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import { WidgetPreview } from '../widgets/WidgetPreview';
import { useWidgetConfigStore } from '../../stores/widgetConfigStore';

const PRESET_MESSAGES = [
  'Time is running',
  'Make today count',
  'You are using your life',
];

export function WidgetCustomizationScreen() {
  const {
    config,
    hydrate,
    setType,
    setTheme,
    setLayout,
    setFont,
    setShowMessage,
    setMessage,
  } = useWidgetConfigStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <ScreenGradient>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bounces
      >
        <Text variant="title" style={styles.title}>
          Widget preview
        </Text>

        <WidgetPreview config={config} />

        <View style={styles.section}>
          <SectionLabel label="Widget type" />
          <HorizontalPills
            options={[
              { key: 'day', label: 'Today' },
              { key: 'month', label: 'This month' },
              { key: 'year', label: 'This year' },
              { key: 'life', label: 'Life' },
            ]}
            selected={config.type}
            onSelect={value => setType(value as any)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label="Theme" />
          <HorizontalPills
            options={[
              { key: 'light', label: 'Light' },
              { key: 'dark', label: 'Dark' },
              { key: 'amoled', label: 'AMOLED' },
            ]}
            selected={config.theme}
            onSelect={value => setTheme(value as any)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label="Layout" />
          <HorizontalPills
            options={[
              { key: 'minimal', label: 'Minimal' },
              { key: 'detailed', label: 'Detailed' },
            ]}
            selected={config.layout}
            onSelect={value => setLayout(value as any)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label="Font style" />
          <HorizontalPills
            options={[
              { key: 'clean', label: 'Clean' },
              { key: 'emotional', label: 'Emotional' },
            ]}
            selected={config.font}
            onSelect={value => setFont(value as any)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label="Optional message" />
          <ToggleRow
            label="Show message"
            active={config.showMessage}
            onToggle={() => setShowMessage(!config.showMessage)}
          />
          {config.showMessage && (
            <View style={styles.messageSection}>
              <Text variant="caption" color="secondary" style={styles.subLabel}>
                Presets
              </Text>
              <HorizontalPills
                options={PRESET_MESSAGES.map(m => ({ key: m, label: m }))}
                selected={PRESET_MESSAGES.includes(config.message) ? config.message : undefined}
                onSelect={value => setMessage(value)}
                wrap
              />
              <Text variant="caption" color="secondary" style={styles.subLabel}>
                Or write your own
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={config.message}
                  onChangeText={setMessage}
                  placeholder="Type a short reminder to your future self"
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.input}
                  maxLength={80}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Add widget</Text>
        </TouchableOpacity>
      </View>
    </ScreenGradient>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text variant="caption" color="secondary" style={styles.sectionLabel}>
      {label.toUpperCase()}
    </Text>
  );
}

interface HorizontalPillsProps {
  options: { key: string; label: string }[];
  selected?: string;
  onSelect: (key: string) => void;
  wrap?: boolean;
}

function HorizontalPills({
  options,
  selected,
  onSelect,
  wrap,
}: HorizontalPillsProps) {
  return (
    <View
      style={[
        styles.pillRow,
        wrap && { flexWrap: 'wrap', rowGap: Spacing.sm },
      ]}
    >
      {options.map(option => {
        const isActive = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.8}
            onPress={() => onSelect(option.key)}
            style={[
              styles.pillOption,
              isActive && styles.pillOptionActive,
            ]}
          >
            <Text
              style={[
                styles.pillOptionText,
                isActive && styles.pillOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, active, onToggle }: ToggleRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.toggleRow}
      onPress={onToggle}
    >
      <Text variant="body" style={styles.toggleLabel}>
        {label}
      </Text>
      <View
        style={[
          styles.toggleTrack,
          active ? styles.toggleTrackOn : styles.toggleTrackOff,
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            active ? styles.toggleThumbOn : styles.toggleThumbOff,
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  pillRow: {
    flexDirection: 'row',
    columnGap: Spacing.sm,
  },
  pillOption: {
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
  },
  pillOptionActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  pillOptionText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  pillOptionTextActive: {
    color: Colors.textOnAccent,
  },
  messageSection: {
    marginTop: Spacing.sm,
  },
  subLabel: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    marginTop: Spacing.xs,
  },
  input: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  toggleLabel: {
    color: Colors.textPrimary,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTrackOn: {
    backgroundColor: Colors.accent,
    justifyContent: 'flex-end',
  },
  toggleTrackOff: {
    backgroundColor: Colors.borderSubtle,
    justifyContent: 'flex-start',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  toggleThumbOn: {},
  toggleThumbOff: {},
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSubtle,
  },
  footerSpacer: {
    height: Spacing.xl * 2,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textOnAccent,
    fontSize: Typography.body,
  },
});

