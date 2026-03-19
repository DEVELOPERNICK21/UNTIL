import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_WIDGET_CONFIG, type WidgetConfig } from '../domain/widget/WidgetConfig';
import { STORAGE_KEYS } from '../persistence/schema';

interface WidgetConfigState {
  config: WidgetConfig;
  hydrate: () => Promise<void>;
  setType: (type: WidgetConfig['type']) => void;
  setTheme: (theme: WidgetConfig['theme']) => void;
  setLayout: (layout: WidgetConfig['layout']) => void;
  setFont: (font: WidgetConfig['font']) => void;
  setShowMessage: (show: boolean) => void;
  setMessage: (message: string) => void;
  reset: () => void;
}

const STORAGE_KEY = STORAGE_KEYS.WIDGET_CONFIG ?? 'widget.config';

async function persistConfig(config: WidgetConfig) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore persistence errors
  }
}

export const useWidgetConfigStore = create<WidgetConfigState>((set, get) => ({
  config: DEFAULT_WIDGET_CONFIG,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<WidgetConfig>;
        const merged: WidgetConfig = {
          ...DEFAULT_WIDGET_CONFIG,
          ...parsed,
        };
        set({ config: merged });
        return;
      }
    } catch {
      // ignore and fall back to default
    }
    set({ config: DEFAULT_WIDGET_CONFIG });
  },

  setType: type => {
    const next = { ...get().config, type };
    set({ config: next });
    void persistConfig(next);
  },

  setTheme: theme => {
    const next = { ...get().config, theme };
    set({ config: next });
    void persistConfig(next);
  },

  setLayout: layout => {
    const next = { ...get().config, layout };
    set({ config: next });
    void persistConfig(next);
  },

  setFont: font => {
    const next = { ...get().config, font };
    set({ config: next });
    void persistConfig(next);
  },

  setShowMessage: show => {
    const next = {
      ...get().config,
      showMessage: show,
      message: show ? get().config.message : '',
    };
    set({ config: next });
    void persistConfig(next);
  },

  setMessage: message => {
    const next = { ...get().config, message };
    set({ config: next });
    void persistConfig(next);
  },

  reset: () => {
    set({ config: DEFAULT_WIDGET_CONFIG });
    void persistConfig(DEFAULT_WIDGET_CONFIG);
  },
}));

