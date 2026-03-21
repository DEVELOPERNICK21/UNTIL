import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Canvas,
  Group,
  Image as SkiaImage,
  Path,
  Rect,
  Skia,
  useCanvasRef,
  Text as SkiaText,
  useFont,
  useImage,
} from '@shopify/react-native-skia';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, ScreenGradient, Card } from '../../ui';
import { useObserveTimeState } from '../../hooks';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  FontFamily,
  getProgressColor,
} from '../../theme';
import { getDayProgress } from '../../core/time/day';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type FocusKey = 'day' | 'month' | 'year' | 'life';

const BACKGROUND_COLOR = '#000000';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

function HeaderShareButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerShareButton}
      activeOpacity={0.8}
    >
      <Text variant="caption" color="secondary">
        Share
      </Text>
    </TouchableOpacity>
  );
}

export function ShareSnapshotScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ShareSnapshot'>
    >();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { timeState } = useObserveTimeState();
  const canvasRef = useCanvasRef();
  const exportCanvasRef = useCanvasRef();
  const [focus, setFocus] = useState<FocusKey>('day');
  const { width: screenWidth } = useWindowDimensions();

  const dayProgressPct = Math.round(getDayProgress(new Date()).progress * 100);
  const monthProgressPct = Math.round((timeState.month ?? 0) * 100);
  const yearProgressPct = Math.round((timeState.year ?? 0) * 100);
  const lifeProgressPct = Math.round((timeState.life ?? 0) * 100);

  const focusConfig: Record<
    FocusKey,
    { pct: number; label: string; unit: 'day' | 'month' | 'year' | 'life' }
  > = {
    day: { pct: dayProgressPct, label: 'TODAY', unit: 'day' },
    month: { pct: monthProgressPct, label: 'MONTH', unit: 'month' },
    year: { pct: yearProgressPct, label: 'YEAR', unit: 'year' },
    life: { pct: lifeProgressPct, label: 'LIFE', unit: 'life' },
  };

  const current = focusConfig[focus];
  const currentColor = useMemo(
    () => getProgressColor(current.pct / 100),
    [current.pct],
  );

  const quote = useMemo(() => {
    const unitPhrase =
      current.unit === 'life' ? 'your life' : `your ${current.unit}`;
    return `${current.pct}% of ${unitPhrase} is gone and it's not coming back`;
  }, [current.pct, current.unit]);

  // Device-friendly canvas size so snapshot has real pixel dimensions
  const maxCanvasWidth = 360;
  const canvasWidth = Math.min(screenWidth - Spacing[4] * 2, maxCanvasWidth);
  const canvasSize = { width: canvasWidth, height: (canvasWidth * 16) / 9 }; // 9:16 preview
  const exportSize = { width: 1080, height: 1920 }; // story export only

  const quoteFont = useFont(
    require('../../assets/fonts/Inter_18pt-Medium.ttf'),
    54,
  );
  const percentFont = useFont(
    require('../../assets/fonts/Inter_18pt-Bold.ttf'),
    120,
  );
  const labelFont = useFont(
    require('../../assets/fonts/Inter_18pt-Medium.ttf'),
    28,
  );
  const lineFont = useFont(
    require('../../assets/fonts/Inter_18pt-Regular.ttf'),
    40,
  );
  const miniPercentFont = useFont(
    require('../../assets/fonts/Inter_18pt-Medium.ttf'),
    26,
  );
  const miniLabelFont = useFont(
    require('../../assets/fonts/Inter_18pt-Regular.ttf'),
    22,
  );
  const brandFont = useFont(
    require('../../assets/fonts/Inter_18pt-Bold.ttf'),
    40,
  );
  const brandByFont = useFont(
    require('../../assets/fonts/Inter_18pt-Regular.ttf'),
    22,
  );
  const brandLogo = useImage(require('../../assets/images/appLogo.png'));

  const primaryLine = useMemo(() => {
    const unitPhrase =
      current.unit === 'life' ? 'your life' : `your ${current.unit}`;
    return `${current.pct}% of ${unitPhrase} is gone`;
  }, [current.pct, current.unit]);

  function centerXForText(font: any, canvasW: number, text: string) {
    const w = font?.getTextWidth?.(text) ?? 0;
    return canvasW / 2 - w / 2;
  }

  function wrapWords(font: any, text: string, maxWidth: number): string[] {
    if (!font) return [text];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      const w = font.getTextWidth?.(test) ?? 0;
      if (w <= maxWidth || !currentLine) {
        currentLine = test;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 3);
  }

  const handleShare = useCallback(async () => {
    try {
      if (!exportCanvasRef.current) {
        Alert.alert(
          'Share unavailable',
          'Preparing the snapshot… try again in a second.',
        );
        return;
      }
      if (
        !quoteFont ||
        !percentFont ||
        !labelFont ||
        !lineFont ||
        !miniPercentFont ||
        !miniLabelFont ||
        !brandFont
      ) {
        Alert.alert(
          'Share unavailable',
          'Loading fonts… try again in a second.',
        );
        return;
      }

      await new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve()),
      );

      const image = exportCanvasRef.current.makeImageSnapshot();
      const pngBase64 = image.encodeToBase64();
      const fileName = `until-share-${Date.now()}.png`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      await RNFS.writeFile(filePath, pngBase64, 'base64');

      await Share.open({
        url: `file://${filePath}`,
        type: 'image/png',
        message: quote,
        failOnCancel: false,
      });
    } catch (error) {
      console.warn('Share snapshot failed', error);
      Alert.alert(
        'Share failed',
        'Something went wrong while preparing the image.',
      );
    }
  }, [
    exportCanvasRef,
    quoteFont,
    percentFont,
    labelFont,
    lineFont,
    miniPercentFont,
    miniLabelFont,
    brandFont,
    quote,
  ]);

  const renderCircularProgressPath = (
    pct: number,
    w: number,
    h: number,
    layout?: { centerY?: number; radius?: number },
  ) => {
    const centerX = w / 2;
    const centerY = layout?.centerY ?? h / 2.1;
    const radius = layout?.radius ?? Math.min(w, h) / 3;
    const strokeWidth = 18;

    const backgroundPath = Skia.Path.Make();
    backgroundPath.addCircle(centerX, centerY, radius);

    const foregroundPath = Skia.Path.Make();
    const startAngle = -Math.PI / 2;
    const sweepAngle = (Math.min(Math.max(pct, 0), 100) / 100) * Math.PI * 2;
    const steps = 128;
    const clampSweep = Math.max(0.01, sweepAngle);

    foregroundPath.moveTo(
      centerX + radius * Math.cos(startAngle),
      centerY + radius * Math.sin(startAngle),
    );

    for (let i = 1; i <= steps; i += 1) {
      const t = (i / steps) * clampSweep + startAngle;
      foregroundPath.lineTo(
        centerX + radius * Math.cos(t),
        centerY + radius * Math.sin(t),
      );
    }

    return {
      backgroundPath,
      foregroundPath,
      centerX,
      centerY,
      radius,
      strokeWidth,
    };
  };

  // Preview ring: slightly larger in the on-screen UI.
  const previewRing = renderCircularProgressPath(
    current.pct,
    canvasSize.width,
    canvasSize.height,
    {
      centerY: canvasSize.height / 2.05,
      radius: Math.min(canvasSize.width, canvasSize.height) / 2.55,
    },
  );
  const exportLayout = useMemo(
    () => ({
      paddingX: 110,
      brandTopY: 140,
      quoteTopY: 320,
      ringCenterY: 860,
      // Export ring slightly smaller so mini pies breathe.
      ringRadius: 285,
      primaryLineY: 1265,
      miniPieY: 1480,
      // Mini pies slightly larger in export.
      miniPieSize: 210,
    }),
    [],
  );

  const exportRing = renderCircularProgressPath(
    current.pct,
    exportSize.width,
    exportSize.height,
    { centerY: exportLayout.ringCenterY, radius: exportLayout.ringRadius },
  );

  const miniStats: {
    key: FocusKey;
    label: string;
    value: string;
    pct: number;
  }[] = [
    {
      key: 'month',
      label: 'MONTH',
      value: `${monthProgressPct}%`,
      pct: monthProgressPct,
    },
    {
      key: 'year',
      label: 'YEAR',
      value: `${yearProgressPct}%`,
      pct: yearProgressPct,
    },
    {
      key: 'life',
      label: 'LIFE',
      value: `${lifeProgressPct}%`,
      pct: lifeProgressPct,
    },
  ];

  const canvasStyle = {
    width: canvasSize.width,
    height: canvasSize.height,
  };

  // Scale the story preview so the whole thing is visible on smaller screens.
  const previewMaxHeight = 420;
  const previewScale = Math.min(1, previewMaxHeight / canvasSize.height);

  const topSafePadding = insets.top;
  const bottomSafePadding = Math.max(insets.bottom, Spacing[4]);

  const headerRight = useCallback(
    () => <HeaderShareButton onPress={handleShare} />,
    [handleShare],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight,
    });
  }, [navigation, headerRight]);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topSafePadding,
              paddingBottom: bottomSafePadding + Spacing[6],
            },
          ]}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.previewWrapper}>
            <Card style={styles.previewCard} lighter>
              <View style={styles.quoteBlock}>
                <Text variant="title" style={styles.quoteLine}>
                  {quote}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setFocus('day')}
                style={styles.mainRingWrapper}
              >
                <View
                  style={[
                    styles.previewCanvasWrap,
                    {
                      width: canvasSize.width,
                      height: canvasSize.height * previewScale,
                    },
                  ]}
                >
                  <View
                    style={{
                      transform: [{ scale: previewScale }],
                      transformOrigin: 'top' as any,
                    }}
                  >
                    <Canvas
                      ref={canvasRef}
                      style={[styles.canvas, canvasStyle]}
                    >
                      {/* Background */}
                      <Rect
                        x={0}
                        y={0}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        color={BACKGROUND_COLOR}
                      />

                      {/* Circular progress */}
                      <Path
                        path={previewRing.backgroundPath}
                        color="rgba(255,255,255,0.12)"
                        style="stroke"
                        strokeWidth={18}
                        strokeCap="round"
                      />
                      <Path
                        path={previewRing.foregroundPath}
                        color={hexToRgba(currentColor, 0.22)}
                        style="stroke"
                        strokeWidth={28}
                        strokeCap="round"
                      />
                      <Path
                        path={previewRing.foregroundPath}
                        color={currentColor}
                        style="stroke"
                        strokeWidth={18}
                        strokeCap="round"
                      />
                    </Canvas>
                  </View>
                </View>
                <View
                  style={styles.mainRingCenter}
                  collapsable={false}
                  pointerEvents="none"
                >
                  <Text variant="title" style={styles.primaryPercent}>
                    {current.pct}%
                  </Text>
                  <Text variant="caption" style={styles.primaryLabel}>
                    {current.label}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.primaryTextBlock}>
                <Text variant="body" style={styles.primaryLine}>
                  {quote}
                </Text>
              </View>
              <View style={styles.miniStatsRow}>
                {miniStats.map(stat => (
                  <TouchableOpacity
                    key={stat.label}
                    style={[
                      styles.miniStat,
                      focus === stat.key && styles.miniStatActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setFocus(stat.key)}
                  >
                    <View style={styles.miniPieWrapper}>
                      <Canvas style={styles.miniPieCanvas}>
                        <Rect
                          x={0}
                          y={0}
                          width={80}
                          height={80}
                          color={BACKGROUND_COLOR}
                        />
                        {(() => {
                          const size = 80;
                          const radius = size / 2.4;
                          const cx = size / 2;
                          const cy = size / 2;
                          const strokeWidthMini = 8;
                          const bgPath = Skia.Path.Make();
                          bgPath.addCircle(cx, cy, radius);

                          const fgPath = Skia.Path.Make();
                          const start = -Math.PI / 2;
                          const sweep =
                            (Math.min(Math.max(stat.pct, 0), 100) / 100) *
                            Math.PI *
                            2;
                          const steps = 64;
                          const clampSweepMini = Math.max(0.01, sweep);

                          fgPath.moveTo(
                            cx + radius * Math.cos(start),
                            cy + radius * Math.sin(start),
                          );
                          for (let i = 1; i <= steps; i += 1) {
                            const t = (i / steps) * clampSweepMini + start;
                            fgPath.lineTo(
                              cx + radius * Math.cos(t),
                              cy + radius * Math.sin(t),
                            );
                          }

                          return (
                            <>
                              <Path
                                path={bgPath}
                                color="rgba(255,255,255,0.16)"
                                style="stroke"
                                strokeWidth={strokeWidthMini}
                                strokeCap="round"
                              />
                              <Path
                                path={fgPath}
                                color={hexToRgba(
                                  getProgressColor(stat.pct / 100),
                                  0.22,
                                )}
                                style="stroke"
                                strokeWidth={strokeWidthMini + 5}
                                strokeCap="round"
                              />
                              <Path
                                path={fgPath}
                                color={getProgressColor(stat.pct / 100)}
                                style="stroke"
                                strokeWidth={strokeWidthMini}
                                strokeCap="round"
                              />
                            </>
                          );
                        })()}
                      </Canvas>
                      <View
                        style={styles.miniPieCenter}
                        collapsable={false}
                        pointerEvents="none"
                      >
                        <Text variant="caption" style={styles.miniPiePercent}>
                          {stat.value}
                        </Text>
                      </View>
                    </View>
                    <Text variant="caption" style={styles.miniStatLabel}>
                      {stat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text variant="caption" style={styles.branding}>
                UNTIL
              </Text>
            </Card>
          </View>

          {/* Hidden high-res export canvas (Skia-only) */}
          <Canvas
            ref={exportCanvasRef}
            style={[
              styles.exportCanvas,
              { width: exportSize.width, height: exportSize.height },
            ]}
          >
            <Rect
              x={0}
              y={0}
              width={exportSize.width}
              height={exportSize.height}
              color={BACKGROUND_COLOR}
            />

            {/* Quote */}
            {quoteFont &&
              (() => {
                const maxW = exportSize.width - exportLayout.paddingX * 2;
                const lines = wrapWords(quoteFont, quote, maxW);
                const startY = exportLayout.quoteTopY;
                const lineH = 64;
                return (
                  <>
                    {lines.map((line, i) => (
                      <SkiaText
                        key={`q-${i}`}
                        x={centerXForText(quoteFont, exportSize.width, line)}
                        y={startY + i * lineH}
                        text={line}
                        font={quoteFont}
                        color="#FFFFFF"
                      />
                    ))}
                  </>
                );
              })()}

            {/* Branding (top lockup) */}
            {brandFont && (
              <>
                {brandByFont && (
                  <SkiaText
                    x={centerXForText(
                      brandByFont,
                      exportSize.width,
                      'Created by',
                    )}
                    y={exportLayout.brandTopY}
                    text="Created by"
                    font={brandByFont}
                    color="rgba(255,255,255,0.55)"
                  />
                )}
                {(() => {
                  const logoSize = 78;
                  const gap = 18;
                  const r = logoSize / 2;
                  const untilText = 'UNTIL';
                  const textW = brandFont.getTextWidth(untilText) ?? 0;
                  const lockupW = logoSize + gap + textW;
                  const startX = exportSize.width / 2 - lockupW / 2;
                  const logoX = startX;
                  const textX = startX + logoSize + gap;
                  const textBaselineY = exportLayout.brandTopY + 70;

                  const capHeight = brandFont.getSize() * 0.7;
                  const logoY = Math.round(
                    textBaselineY - capHeight + (capHeight - logoSize) / 2,
                  );

                  const clip = Skia.Path.Make();
                  clip.addCircle(logoX + r, logoY + r, r);

                  return (
                    <>
                      {brandLogo && (
                        <Group clip={clip}>
                          <SkiaImage
                            image={brandLogo}
                            x={logoX}
                            y={logoY}
                            width={logoSize}
                            height={logoSize}
                            fit="cover"
                          />
                        </Group>
                      )}
                      <SkiaText
                        x={textX}
                        y={textBaselineY}
                        text={untilText}
                        font={brandFont}
                        color="rgba(255,255,255,0.72)"
                      />
                    </>
                  );
                })()}
              </>
            )}

            {/* Main ring */}
            <Path
              path={exportRing.backgroundPath}
              color="rgba(255,255,255,0.12)"
              style="stroke"
              strokeWidth={18}
              strokeCap="round"
            />
            <Path
              path={exportRing.foregroundPath}
              color={hexToRgba(currentColor, 0.22)}
              style="stroke"
              strokeWidth={30}
              strokeCap="round"
            />
            <Path
              path={exportRing.foregroundPath}
              color={currentColor}
              style="stroke"
              strokeWidth={18}
              strokeCap="round"
            />

            {/* Center text */}
            {percentFont &&
              labelFont &&
              (() => {
                const percentText = `${current.pct}%`;
                const labelText = current.label;
                const cy = exportRing.centerY;
                return (
                  <>
                    <SkiaText
                      x={centerXForText(
                        percentFont,
                        exportSize.width,
                        percentText,
                      )}
                      y={cy + percentFont.getSize() * 0.35}
                      text={percentText}
                      font={percentFont}
                      color="#FFFFFF"
                    />
                    <SkiaText
                      x={centerXForText(labelFont, exportSize.width, labelText)}
                      y={cy + percentFont.getSize() * 1.1}
                      text={labelText}
                      font={labelFont}
                      color="rgba(255,255,255,0.72)"
                    />
                  </>
                );
              })()}

            {/* Primary line */}
            {lineFont && (
              <SkiaText
                x={centerXForText(lineFont, exportSize.width, primaryLine)}
                y={exportLayout.primaryLineY}
                text={primaryLine}
                font={lineFont}
                color="#FFFFFF"
              />
            )}

            {/* Mini pies */}
            {miniPercentFont &&
              miniLabelFont &&
              (() => {
                const size = exportLayout.miniPieSize;
                const radius = size / 2.4;
                const strokeW = 14;
                const y = exportLayout.miniPieY;
                const xs = [
                  exportSize.width * 0.25,
                  exportSize.width * 0.5,
                  exportSize.width * 0.75,
                ];
                const stats = [
                  {
                    label: 'MONTH',
                    pct: monthProgressPct,
                    value: `${monthProgressPct}%`,
                  },
                  {
                    label: 'YEAR',
                    pct: yearProgressPct,
                    value: `${yearProgressPct}%`,
                  },
                  {
                    label: 'LIFE',
                    pct: lifeProgressPct,
                    value: `${lifeProgressPct}%`,
                  },
                ];
                return (
                  <>
                    {stats.map((s, i) => {
                      const cx = xs[i];
                      const cy = y;
                      const fgColor = getProgressColor(s.pct / 100);
                      const bg = Skia.Path.Make();
                      bg.addCircle(cx, cy, radius);
                      const fg = Skia.Path.Make();
                      const start = -Math.PI / 2;
                      const sweep =
                        (Math.min(Math.max(s.pct, 0), 100) / 100) * Math.PI * 2;
                      const steps = 64;
                      const clamp = Math.max(0.01, sweep);
                      fg.moveTo(
                        cx + radius * Math.cos(start),
                        cy + radius * Math.sin(start),
                      );
                      for (let k = 1; k <= steps; k += 1) {
                        const t = (k / steps) * clamp + start;
                        fg.lineTo(
                          cx + radius * Math.cos(t),
                          cy + radius * Math.sin(t),
                        );
                      }
                      return (
                        <React.Fragment key={s.label}>
                          <Path
                            path={bg}
                            color="rgba(255,255,255,0.16)"
                            style="stroke"
                            strokeWidth={strokeW}
                            strokeCap="round"
                          />
                          <Path
                            path={fg}
                            color={hexToRgba(fgColor, 0.22)}
                            style="stroke"
                            strokeWidth={strokeW + 8}
                            strokeCap="round"
                          />
                          <Path
                            path={fg}
                            color={fgColor}
                            style="stroke"
                            strokeWidth={strokeW}
                            strokeCap="round"
                          />
                          <SkiaText
                            x={
                              cx -
                              (miniPercentFont.getTextWidth(s.value) ?? 0) / 2
                            }
                            y={cy + miniPercentFont.getSize() * 0.35}
                            text={s.value}
                            font={miniPercentFont}
                            color="#FFFFFF"
                          />
                          <SkiaText
                            x={
                              cx -
                              (miniLabelFont.getTextWidth(s.label) ?? 0) / 2
                            }
                            y={cy + radius + 44}
                            text={s.label}
                            font={miniLabelFont}
                            color="rgba(255,255,255,0.72)"
                          />
                        </React.Fragment>
                      );
                    })}
                  </>
                );
              })()}
          </Canvas>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.percent }]}
            activeOpacity={0.9}
            onPress={handleShare}
          >
            <Text variant="sectionTitle" style={styles.shareLabel}>
              Share image
            </Text>
          </TouchableOpacity>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  headerShareButton: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  previewWrapper: {
    alignItems: 'center',
  },
  previewCard: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    backgroundColor: '#050505',
  },
  canvas: {
    alignSelf: 'center',
  },
  previewCanvasWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mainRingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainRingCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  quoteBlock: {
    marginBottom: Spacing[2],
  },
  quoteLine: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
  },
  primaryTextBlock: {
    alignItems: 'center',
    marginTop: Spacing[3],
  },
  primaryPercent: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: Typography.greeting,
  },
  primaryLabel: {
    marginTop: Spacing[1],
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1,
  },
  primaryLine: {
    marginTop: Spacing[3],
    color: '#FFFFFF',
    textAlign: 'center',
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[3],
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatActive: {
    opacity: 1,
  },
  miniStatValue: {
    color: '#FFFFFF',
  },
  miniStatLabel: {
    marginTop: Spacing[1],
    color: 'rgba(255,255,255,0.72)',
  },
  miniPieWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPieCanvas: {
    width: 80,
    height: 80,
  },
  miniPieCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  miniPiePercent: {
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
  },
  branding: {
    marginTop: Spacing[3],
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
  },
  shareButton: {
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
  },
  bottomSpacer: {
    height: Spacing[6],
  },
  shareLabel: {
    color: '#000000',
    fontSize: Typography.sectionTitle,
  },
  exportCanvas: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0,
  },
});
