import React from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Text } from './Text';
import { ProgressLine } from './ProgressLine';
import { Spacing } from '../theme';

interface TimeStatementProps {
  label: string;
  value: string;
  suffix?: string;
  emphasis: 'primary' | 'secondary';
  showProgress?: boolean;
  progress?: number;
  onPress?: (event: GestureResponderEvent) => void;
}

export function TimeStatement({
  label,
  value,
  suffix,
  emphasis,
  showProgress = false,
  progress = 0,
  onPress,
}: TimeStatementProps) {
  const isPrimary = emphasis === 'primary';

  const content = (
    <>
      <Text
        variant="label"
        color="secondary"
        opacity={0.7}
        style={styles.label}
      >
        {label}
      </Text>
      <Text
        variant={isPrimary ? 'primaryValue' : 'secondaryBlock'}
        color="primary"
        style={styles.value}
      >
        {value}
      </Text>
      {suffix ? (
        <Text
          variant={isPrimary ? 'secondaryValue' : 'secondaryBlock'}
          color="secondary"
          opacity={0.7}
          style={[styles.suffix, showProgress && styles.suffixWithProgress]}
        >
          {suffix}
        </Text>
      ) : null}
      {showProgress ? (
        <ProgressLine progress={progress} style={styles.progress} />
      ) : null}
    </>
  );

  const wrapperStyle = [styles.block, onPress && styles.pressable];

  if (onPress) {
    return (
      <TouchableOpacity style={wrapperStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={wrapperStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
  },
  pressable: {},
  label: {
    marginBottom: Spacing.sm,
  },
  value: {
    marginBottom: 6,
  },
  suffix: {},
  suffixWithProgress: {
    marginBottom: Spacing.lg,
  },
  progress: {
    marginBottom: Spacing.xxl,
  },
});
