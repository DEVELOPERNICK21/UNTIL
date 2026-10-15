import type { WidgetConfig } from '../WidgetConfig';

export interface IWidgetConfigRepository {
  /** Saved config merged over defaults; defaults when nothing is saved. */
  load(): Promise<WidgetConfig>;
  save(config: WidgetConfig): Promise<void>;
}
