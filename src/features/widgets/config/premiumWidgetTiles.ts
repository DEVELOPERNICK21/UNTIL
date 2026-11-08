/**
 * The Premium widgets listed on the widget screen: where each one is set up, and the messages
 * for its name and one-line description (see the `widgets` locale files).
 */

export const PREMIUM_WIDGET_TILES = [
  {
    titleKey: 'widgets.premiumWidgets.month.title',
    descriptionKey: 'widgets.premiumWidgets.month.description',
    route: 'WidgetCustomization',
  },
  {
    titleKey: 'widgets.premiumWidgets.life.title',
    descriptionKey: 'widgets.premiumWidgets.life.description',
    route: 'WidgetCustomization',
  },
  {
    titleKey: 'widgets.premiumWidgets.deadlines.title',
    descriptionKey: 'widgets.premiumWidgets.deadlines.description',
    route: 'Countdowns',
  },
] as const;
