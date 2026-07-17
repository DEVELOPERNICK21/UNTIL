/** Widget accent color palette. Ember is free; others require Premium. */

import type { WidgetAccent } from '../domain/widget/WidgetConfig';

export interface WidgetAccentOption {
  key: WidgetAccent;
  label: string;
  color: string;
  premium: boolean;
}

export const WIDGET_ACCENTS: WidgetAccentOption[] = [
  { key: 'ember', label: 'Ember', color: '#E87C20', premium: false },
  { key: 'ocean', label: 'Ocean', color: '#2E9BD6', premium: true },
  { key: 'forest', label: 'Forest', color: '#3FA96A', premium: true },
  { key: 'plum', label: 'Plum', color: '#9B5DE5', premium: true },
  { key: 'rose', label: 'Rose', color: '#E8608A', premium: true },
  { key: 'mono', label: 'Mono', color: '#C9C9C9', premium: true },
];

const ACCENT_BY_KEY: Record<WidgetAccent, WidgetAccentOption> =
  WIDGET_ACCENTS.reduce(
    (acc, option) => {
      acc[option.key] = option;
      return acc;
    },
    {} as Record<WidgetAccent, WidgetAccentOption>
  );

export function getWidgetAccentColor(accent: WidgetAccent): string {
  return (ACCENT_BY_KEY[accent] ?? ACCENT_BY_KEY.ember).color;
}

export function isPremiumWidgetAccent(accent: string): boolean {
  const option = ACCENT_BY_KEY[accent as WidgetAccent];
  return option ? option.premium : false;
}
