import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, useTheme } from '../../../shared/theme';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import type { HomeCardId, HomeCardOrder } from '../domain/homeCardOrder';

/**
 * The cards under the period tiles: the few that matter right now, then a "More" row for the rest.
 * Each card is built by the screen; this decides which show and counts what people see.
 */
export function HomeCardStack({
  order,
  cards,
}: {
  order: HomeCardOrder;
  cards: Partial<Record<HomeCardId, React.ReactNode>>;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const counted = useRef(false);

  const visible = order.visible.filter(id => cards[id]);
  const more = order.more.filter(id => cards[id]);

  // One impression per card per visit to Home, so a reorder can be judged on what was seen.
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    visible.forEach((id, position) => {
      void logAnalyticsEvent('home_card_impression', { card: id, position });
    });
  }, [visible]);

  const toggle = () => {
    void logAnalyticsEvent('home_more_cards_tapped', { expanded: !expanded });
    setExpanded(value => !value);
  };

  return (
    <View>
      {visible.map(id => (
        <View key={id}>{cards[id]}</View>
      ))}
      {more.length > 0 ? (
        <>
          {expanded ? more.map(id => <View key={id}>{cards[id]}</View>) : null}
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show fewer cards' : 'Show more cards'}
            style={styles.more}
          >
            <Text variant="caption" style={{ color: theme.textSecondary }}>
              {expanded ? 'Show less' : `More (${more.length})`}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  more: {
    alignSelf: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
});
