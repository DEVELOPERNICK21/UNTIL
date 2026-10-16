import { useWidgetConfigStore } from '../../../app/di';

export function useWidgetConfig() {
  return useWidgetConfigStore();
}
