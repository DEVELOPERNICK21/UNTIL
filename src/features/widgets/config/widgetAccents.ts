/** Widget accent color palette. Ember is free; others require Premium. */

import type { TranslationKey } from '../../../shared/i18n/translate';
import type { WidgetAccent } from '../domain/WidgetConfig';

export interface WidgetAccentOption {
  key: WidgetAccent;
  /** Message key of the colour's name. */
  labelKey: TranslationKey;
  color: string;
  premium: boolean;
}

export const WIDGET_ACCENTS: WidgetAccentOption[] = [
  {
    key: 'ember',
    labelKey: 'widgets.accent.ember',
    color: '#E87C20',
    premium: false,
  },
  {
    key: 'ocean',
    labelKey: 'widgets.accent.ocean',
    color: '#2E9BD6',
    premium: true,
  },
  {
    key: 'forest',
    labelKey: 'widgets.accent.forest',
    color: '#3FA96A',
    premium: true,
  },
  {
    key: 'plum',
    labelKey: 'widgets.accent.plum',
    color: '#9B5DE5',
    premium: true,
  },
  {
    key: 'rose',
    labelKey: 'widgets.accent.rose',
    color: '#E8608A',
    premium: true,
  },
  {
    key: 'mono',
    labelKey: 'widgets.accent.mono',
    color: '#C9C9C9',
    premium: true,
  },
];

const ACCENT_BY_KEY: Record<WidgetAccent, WidgetAccentOption> =
  WIDGET_ACCENTS.reduce((acc, option) => {
    acc[option.key] = option;
    return acc;
  }, {} as Record<WidgetAccent, WidgetAccentOption>);

export function getWidgetAccentColor(accent: WidgetAccent): string {
  return (ACCENT_BY_KEY[accent] ?? ACCENT_BY_KEY.ember).color;
}

export function isPremiumWidgetAccent(accent: string): boolean {
  const option = ACCENT_BY_KEY[accent as WidgetAccent];
  return option ? option.premium : false;
}
