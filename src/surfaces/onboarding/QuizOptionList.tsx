import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import type { QuizOption } from './quizContent';

interface QuizOptionListProps<T extends string> {
  options: QuizOption<T>[];
  selected?: T;
  onSelect: (value: T) => void;
  active?: boolean;
}

function OptionRow<T extends string>({
  option,
  isSelected,
  onSelect,
  index,
  active,
}: {
  option: QuizOption<T>;
  isSelected: boolean;
  onSelect: (value: T) => void;
  index: number;
  active: boolean;
}) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0);
      y.setValue(16);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: 80 + index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: 0,
        duration: 460,
        delay: 80 + index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, index, opacity, y]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: y }, { scale }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.97,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }}
        onPress={() => {
          Vibration.vibrate(8);
          onSelect(option.value);
        }}
        style={[
          styles.row,
          {
            backgroundColor: isSelected
              ? 'rgba(232, 124, 32, 0.14)'
              : theme.cardBase,
            borderColor: isSelected ? theme.percent : theme.divider,
          },
        ]}
      >
        <Text
          variant="body"
          style={[
            styles.label,
            {
              color: isSelected ? theme.percent : theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.medium),
            },
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function QuizOptionList<T extends string>({
  options,
  selected,
  onSelect,
  active = true,
}: QuizOptionListProps<T>) {
  return (
    <View style={styles.list}>
      {options.map((option, index) => (
        <OptionRow
          key={option.value}
          option={option}
          index={index}
          active={active}
          isSelected={selected === option.value}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing[2],
    width: '100%',
  },
  row: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  label: {
    fontSize: Typography.body,
    textAlign: 'center',
  },
});
