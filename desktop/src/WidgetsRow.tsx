import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Kind = 'day' | 'month' | 'year' | 'life';

interface WidgetsState extends Record<Kind, boolean> {
  onTop: boolean;
}

const KINDS: Array<[Kind, string]> = [
  ['day', 'Today'],
  ['month', 'Month'],
  ['year', 'Year'],
  ['life', 'Life'],
];

/**
 * Switches for the desktop widgets, so they can be turned on without finding the menu bar menu.
 * A widget you switch on shows above your windows for a few seconds, then settles on the desktop.
 * Outside the Tauri app (a plain browser) there are no widgets and nothing is drawn.
 */
export function WidgetsRow() {
  const [state, setState] = useState<WidgetsState | null>(null);

  const refresh = useCallback(() => {
    void invoke<WidgetsState>('widgets_state')
      .then(setState)
      .catch(() => setState(null));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  const toggle = useCallback(
    (kind: Kind, on: boolean) => {
      setState(current => (current ? { ...current, [kind]: on } : current));
      void invoke('widget_set_open', { kind, on })
        .catch(() => {})
        .finally(refresh);
    },
    [refresh],
  );

  const setOnTop = useCallback(
    (on: boolean) => {
      setState(current => (current ? { ...current, onTop: on } : current));
      void invoke('widgets_set_on_top', { on })
        .catch(() => {})
        .finally(refresh);
    },
    [refresh],
  );

  if (!state) return null;
  const anyOn = KINDS.some(([kind]) => state[kind]);

  return (
    <section className="wrow" aria-label="Desktop widgets">
      <div className="wrow-head">
        <span className="wrow-title">Desktop widgets</span>
        {anyOn ? (
          <button type="button" className="link" onClick={() => void invoke('widgets_peek')}>
            Show them now
          </button>
        ) : null}
      </div>
      <div className="wrow-pills">
        {KINDS.map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            className={`wpill${state[kind] ? ' wpill-on' : ''}`}
            aria-pressed={state[kind]}
            onClick={() => toggle(kind, !state[kind])}
          >
            <span className="wpill-dot" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <label className="wrow-top">
        <input
          type="checkbox"
          checked={state.onTop}
          onChange={event => setOnTop(event.target.checked)}
        />
        <span>Keep them above my windows</span>
      </label>
    </section>
  );
}
