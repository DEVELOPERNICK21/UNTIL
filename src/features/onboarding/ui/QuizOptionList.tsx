import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
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
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={option.label}
        style={[
          styles.row,
          {
            backgroundColor: isSelected
              ? 'rgba(232, 124, 32, 0.14)'
              : theme.cardBase,
            borderColor: isSelected ? theme.percent : theme.divider,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        {option.emoji ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isSelected
                  ? 'rgba(232, 124, 32, 0.18)'
                  : theme.cardLighter,
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
          </View>
        ) : null}
        <Text
          variant="body"
          style={[
            styles.label,
            {
              color: isSelected ? theme.percent : theme.textPrimary,
              fontFamily: getFontFamilyForWeight(
                isSelected ? Weight.semibold : Weight.medium,
              ),
            },
          ]}
        >
          {option.label}
        </Text>
        <View
          style={[
            styles.radio,
            {
              borderColor: isSelected ? theme.percent : theme.divider,
              backgroundColor: isSelected ? theme.percent : 'transparent',
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {isSelected ? <Text style={styles.check}>✓</Text> : null}
        </View>
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
    gap: Spacing[3],
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: Radius.lg,
    minHeight: 64,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    flex: 1,
    fontSize: Typography.lead,
    textAlign: 'left',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#0E0E10',
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '700',
  },
});
