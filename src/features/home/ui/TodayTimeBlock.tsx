import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { formatDayPassedLeftWithSeconds } from '../../../shared/time/homeFormatters';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { TimeBlock } from './TimeBlock';
import type { TileSize } from './TimeBlock';

/**
 * TodayTimeBlock isolates the 1-second timer to prevent the entire HomeScreen
 * from re-rendering every second.
 */
export function TodayTimeBlock({
  index,
  scrollY,
  reduceMotion,
  size,
  onPress,
}: {
  index: number;
  scrollY: Animated.Value;
  reduceMotion: boolean;
  size?: TileSize;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const [liveNow, setLiveNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setLiveNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const day = formatDayPassedLeftWithSeconds(liveNow);

  return (
    <TimeBlock
      index={index}
      scrollY={scrollY}
      reduceMotion={reduceMotion}
      size={size}
      glyph="day"
      title={t('home.tile.today')}
      passedLabel={day.passedStr}
      leftLabel={day.leftStr}
      progress={day.progress}
      passedPct={day.passedPct}
      leftPct={day.leftPct}
      onPress={onPress}
    />
  );
}
