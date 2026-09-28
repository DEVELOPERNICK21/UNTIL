import { create } from 'zustand';
import { DEFAULT_WIDGET_CONFIG, type WidgetConfig } from '../domain/widget/WidgetConfig';
import type { IWidgetConfigRepository } from '../domain/repository/IWidgetConfigRepository';

interface WidgetConfigState {
  config: WidgetConfig;
  hydrate: () => Promise<void>;
  setType: (type: WidgetConfig['type']) => void;
  setTheme: (theme: WidgetConfig['theme']) => void;
  setLayout: (layout: WidgetConfig['layout']) => void;
  setFont: (font: WidgetConfig['font']) => void;
  setAccent: (accent: WidgetConfig['accent']) => void;
  setShowMessage: (show: boolean) => void;
  setMessage: (message: string) => void;
  reset: () => void;
}

/** UI cache over IWidgetConfigRepository. Created in di.ts. */
export function createWidgetConfigStore(repository: IWidgetConfigRepository) {
  return create<WidgetConfigState>((set, get) => {
    const update = (patch: Partial<WidgetConfig>) => {
      const next = { ...get().config, ...patch };
      set({ config: next });
      void repository.save(next);
    };

    return {
      config: DEFAULT_WIDGET_CONFIG,

      hydrate: async () => {
        set({ config: await repository.load() });
      },

      setType: type => update({ type }),
      setTheme: theme => update({ theme }),
      setLayout: layout => update({ layout }),
      setFont: font => update({ font }),
      setAccent: accent => update({ accent }),
      setShowMessage: show =>
        update({ showMessage: show, message: show ? get().config.message : '' }),
      setMessage: message => update({ message }),

      reset: () => {
        set({ config: DEFAULT_WIDGET_CONFIG });
        void repository.save(DEFAULT_WIDGET_CONFIG);
      },
    };
  });
}
