export type WidgetType = 'day' | 'month' | 'year' | 'life';

export type WidgetTheme = 'light' | 'dark' | 'amoled';

export type WidgetLayout = 'minimal' | 'detailed';

export type WidgetFont = 'clean' | 'emotional';

export type WidgetAccent =
  | 'ember'
  | 'ocean'
  | 'forest'
  | 'plum'
  | 'rose'
  | 'mono';

export interface WidgetConfig {
  type: WidgetType;
  theme: WidgetTheme;
  layout: WidgetLayout;
  font: WidgetFont;
  accent: WidgetAccent;
  showMessage: boolean;
  message: string;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  type: 'day',
  theme: 'light',
  layout: 'minimal',
  font: 'clean',
  accent: 'ember',
  showMessage: false,
  message: '',
};
