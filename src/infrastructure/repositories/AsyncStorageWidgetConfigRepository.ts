/**
 * Widget customization config. SSOT for STORAGE_KEYS.WIDGET_CONFIG.
 * The accent is also published to native widgets through WidgetSync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IWidgetConfigRepository } from '../../domain/repository/IWidgetConfigRepository';
import {
  DEFAULT_WIDGET_CONFIG,
  type WidgetConfig,
} from '../../domain/widget/WidgetConfig';
import { STORAGE_KEYS } from '../../persistence/schema';
import { publishWidgetAccent } from '../WidgetSync';

const STORAGE_KEY = STORAGE_KEYS.WIDGET_CONFIG ?? 'widget.config';

export class AsyncStorageWidgetConfigRepository implements IWidgetConfigRepository {
  async load(): Promise<WidgetConfig> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<WidgetConfig>;
        const merged: WidgetConfig = {
          ...DEFAULT_WIDGET_CONFIG,
          ...parsed,
          accent: parsed.accent ?? DEFAULT_WIDGET_CONFIG.accent,
        };
        publishWidgetAccent(merged.accent, { sync: true });
        return merged;
      }
    } catch {
      // ignore and fall back to default
    }
    publishWidgetAccent(DEFAULT_WIDGET_CONFIG.accent, { sync: false });
    return DEFAULT_WIDGET_CONFIG;
  }

  async save(config: WidgetConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore persistence errors
    }
    publishWidgetAccent(config.accent ?? DEFAULT_WIDGET_CONFIG.accent, {
      sync: true,
    });
  }
}
