import { useWidgetConfigStore } from '../stores/widgetConfigStore';

export function useWidgetConfig() {
  return useWidgetConfigStore();
}
