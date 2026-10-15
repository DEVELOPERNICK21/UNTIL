/** Widget config types that require Premium (matches domain/premium.ts). */
export const PREMIUM_WIDGET_CONFIG_TYPES = ['month', 'life'] as const;

export type PremiumWidgetConfigType = (typeof PREMIUM_WIDGET_CONFIG_TYPES)[number];

export function isPremiumWidgetConfigType(type: string): type is PremiumWidgetConfigType {
  return (PREMIUM_WIDGET_CONFIG_TYPES as readonly string[]).includes(type);
}
