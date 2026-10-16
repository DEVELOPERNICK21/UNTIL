import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import type { UserCredential } from 'firebase/auth';
import { buildPanelModel } from '@until/shared/time/panelModel';
import { getProgressColor } from '@until/shared/theme/progressColor';
import { timeOfDayLabel } from '@until/shared/theme/emotionalCopy';
import { DEVICE_LIMIT_BANNER_COPY } from '@until/features/account/domain/accountCopy';
import { loadLocalState, panelProfile } from './localState';
import { pushExtra } from './extra';
import {
  SignInError,
  cancelBrowserSignIn,
  signInWithApple,
  signInWithGoogle,
} from './auth/browserSignIn';
import {
  REFRESH_INTERVAL_MS,
  abandonSignIn,
  afterCredential,
  continueSignIn,
  initialView,
  refreshSession,
  register,
  saveSetup,
  signOutDesktop,
  watchAccountProfile,
  type SessionView,
} from './session';
import { useNow } from './useNow';
import { useSystem } from './useSystem';
import { WidgetsRow } from './WidgetsRow';
import { openUrl } from '@tauri-apps/plugin-opener';
import { LEGAL_URLS } from '@until/config/monetization';
import { restartApp } from './system';
import { startWindowDrag } from './drag';
import { Ember } from './ember/Ember';
import { Dial } from './Dial';
import { Digits } from './Digits';
import { PERIOD_KEYS, buildPeriods, type PeriodKey, type PeriodView } from './periods';
import {
  AccountFooter,
  MessageCard,
  PanelBar,
  ReplaceDialog,
  RetryCard,
  SetupForm,
  SignInCard,
  WaitingCard,
} from './AccountViews';

const PANEL_WIDTH = 340;
const PERIOD_KEY = 'until.desktop.period';

/** The window follows the content height, so each state fits without scrolling. */
function useFitWindow() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = 0;
    const fit = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height === last) return;
      last = height;
      try {
        void getCurrentWindow()
          .setSize(new LogicalSize(PANEL_WIDTH, height))
          .catch(() => {});
      } catch {
        // Outside Tauri (plain browser preview) there is no window to size.
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, []);
  return ref;
}

const SIGN_IN_ERRORS: Record<string, string> = {
  not_configured: 'Google sign-in is not set up in this build.',
  failed: 'Sign-in did not finish. Try again.',
};

function useSession() {
  const [view, setView] = useState<SessionView>(initialView);

  const run = useCallback(async (step: () => Promise<SessionView>) => {
    setView({ kind: 'working' });
    try {
      setView(await step());
    } catch (e) {
      const reason = e instanceof SignInError ? e.reason : 'failed';
      setView({ kind: 'signed_out', message: SIGN_IN_ERRORS[reason] });
    }
  }, []);

  const signIn = useCallback(
    (provider: () => Promise<UserCredential>) =>
      run(async () => afterCredential(await provider())),
    [run],
  );

  useEffect(() => {
    const refresh = () =>
      void refreshSession().then(next => {
        if (next) setView(next);
      });
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return { view, setView, run, signIn };
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
};

const HERO_LABEL: Record<PeriodKey, string> = {
  day: 'Today',
  month: 'This month',
  year: 'This year',
  life: 'Your life',
};

function loadPeriod(): PeriodKey {
  try {
    const saved = localStorage.getItem(PERIOD_KEY);
    return PERIOD_KEYS.includes(saved as PeriodKey) ? (saved as PeriodKey) : 'day';
  } catch {
    return 'day';
  }
}

/** The panel plays its entrance again every time it is shown. */
function useOpenCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const open = () => setCount(c => c + 1);
    window.addEventListener('focus', open);
    return () => window.removeEventListener('focus', open);
  }, []);
  return count;
}

export function App() {
  const now = useNow();
  const local = loadLocalState();
  const profile = panelProfile(local);
  const model = buildPanelModel(profile, now);
  const periods = buildPeriods(model, { signedIn: profile.signedIn });
  const { view, setView, run, signIn } = useSession();
  const panelRef = useFitWindow();
  const system = useSystem();
  const openCount = useOpenCount();

  const [period, setPeriod] = useState<PeriodKey>(loadPeriod);
  const [flipped, setFlipped] = useState(false);
  const [pulse, setPulse] = useState(0);

  // Tells the app this page has run (the release self-test waits for it).
  useEffect(() => {
    void invoke('page_ready').catch(() => {});
  }, []);

  // Follow the profile on your account, so a change made on the phone shows up here in seconds.
  useEffect(() => watchAccountProfile(), [local.uid, local.deviceRegistered]);

  useEffect(() => {
    void pushExtra(model).catch(() => {});
  }, [model.extraText, model.extraProgress]);

  const choose = useCallback((next: PeriodKey) => {
    setPeriod(current => {
      if (current === next) return current;
      try {
        localStorage.setItem(PERIOD_KEY, next);
      } catch {
        // Not worth failing over.
      }
      return next;
    });
    setFlipped(false);
    setPulse(n => n + 1);
  }, []);

  const step = useCallback(
    (delta: number) => {
      const index = PERIOD_KEYS.indexOf(period);
      choose(PERIOD_KEYS[(index + delta + PERIOD_KEYS.length) % PERIOD_KEYS.length]);
    },
    [period, choose],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Ctrl+Q (Windows, Linux) or Cmd+Q (Mac) quits, so there is always a way out.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'q') {
        void invoke('quit_app');
        return;
      }
      // Esc closes the panel, like any menu bar popover or tray flyout.
      if (event.key === 'Escape') {
        void invoke('hide_panel').catch(() => {});
        return;
      }
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
      else if (/^[1-4]$/.test(event.key)) choose(PERIOD_KEYS[Number(event.key) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, choose]);

  const current = periods[period];
  const side = flipped ? current.passed : current.left;
  const color = current.progress == null ? 'var(--text-3)' : getProgressColor(current.progress);

  return (
    <main className="panel" ref={panelRef} onMouseDown={startWindowDrag}>
      <div className="enter" key={openCount}>
        <header className="top" data-tauri-drag-region title="Drag to move">
          <Ember progress={model.day.progress} size={54} pulse={pulse} />
          <div className="greet">
            <span className="eyebrow">{timeOfDayLabel(now)}</span>
            <h1>Time reality</h1>
          </div>
          <span className="date">{now.toLocaleDateString(undefined, DATE_FORMAT)}</span>
        </header>

        <div className="chips" role="tablist" aria-label="Period">
          <span
            className="chip-glide"
            aria-hidden="true"
            style={{ transform: `translateX(${PERIOD_KEYS.indexOf(period) * 100}%)` }}
          />
          {PERIOD_KEYS.map(key => (
            <Chip
              key={key}
              item={periods[key]}
              selected={key === period}
              onSelect={() => choose(key)}
            />
          ))}
        </div>

        <section className="stage" aria-live="off" style={{ ['--accent' as string]: color }}>
          <button
            type="button"
            className="dial-button"
            onClick={() => {
              if (current.locked) return;
              setFlipped(f => !f);
              setPulse(n => n + 1);
            }}
            title={current.locked ? undefined : 'Click to flip between left and passed'}
            aria-label={`${HERO_LABEL[period]}: ${side.parts
              .map(part => `${part.value}${part.unit}`)
              .join(' ')} ${side.caption}`}
          >
            <Dial
              key={period}
              progress={current.progress}
              color={color}
              ticks={current.ticks}
              size={184}
            >
              <span className="dial-label">{HERO_LABEL[period]}</span>
              <div className="face" key={`${period}-${flipped}`}>
                <Digits parts={side.parts} />
                <span className="dial-caption">{side.caption}</span>
              </div>
            </Dial>
          </button>
          <div className="stage-foot">
            {current.passedPct == null ? (
              <span className="muted">{current.left.caption}</span>
            ) : (
              <>
                <b style={{ color }}>{flipped ? current.leftPct : current.passedPct}%</b>
                <span className="muted">{flipped ? 'left' : 'passed'}</span>
              </>
            )}
          </div>
        </section>
      </div>

      {(() => {
        switch (view.kind) {
          case 'signed_in':
            return (
              <AccountFooter
                email={local.email}
                premium={local.entitlementActive}
                syncedAt={local.syncedAt}
                now={now.getTime()}
                onSync={() =>
                  refreshSession().then(next => {
                    if (next) setView(next);
                  })
                }
                onSignOut={() => void run(signOutDesktop)}
              />
            );
          case 'signed_out':
            return (
              <SignInCard
                message={view.message}
                onGoogle={() => void signIn(signInWithGoogle)}
                onApple={() => void signIn(signInWithApple)}
              />
            );
          case 'working':
            return <WaitingCard onCancel={cancelBrowserSignIn} />;
          case 'setup':
            return (
              <SetupForm
                askBirthDate={view.askBirthDate}
                askAgeConfirmation={view.askAgeConfirmation}
                onSave={input => void run(() => saveSetup(input))}
                onCancel={() => void run(abandonSignIn)}
              />
            );
          case 'under_age':
            return (
              <MessageCard
                text="UNTIL accounts are for people 13 and older."
                onDone={() => setView({ kind: 'signed_out' })}
              />
            );
          case 'needs_replace':
            return (
              <ReplaceDialog
                existing={view.existing}
                onContinue={() => void run(() => register(true))}
                onCancel={() => void run(abandonSignIn)}
              />
            );
          case 'limit_reached':
            return (
              <MessageCard
                text={DEVICE_LIMIT_BANNER_COPY}
                onDone={() => setView({ kind: 'signed_out' })}
              />
            );
          case 'incomplete':
            return (
              <RetryCard
                onRetry={() => void run(continueSignIn)}
                onCancel={() => void run(abandonSignIn)}
              />
            );
        }
      })()}

      <WidgetsRow />

      <PanelBar
        launchAtLogin={system.launchAtLogin}
        onLaunchAtLogin={system.toggleLaunchAtLogin}
        askLaunchAtLogin={system.askLaunchAtLogin}
        onAnswerLaunchAtLogin={system.answerLaunchAtLogin}
        updateReady={system.updateReady}
        onRestart={() => void restartApp()}
        onQuit={() => void invoke('quit_app')}
        version={system.version}
        onOpenLegal={page => void openUrl(LEGAL_URLS[page]).catch(() => {})}
      />
    </main>
  );
}

function MiniRing(props: { progress: number | null }) {
  const R = 11;
  const len = 2 * Math.PI * R;
  const share = props.progress == null ? 0 : Math.min(1, Math.max(0, props.progress));
  const color = props.progress == null ? 'var(--text-3)' : getProgressColor(share);
  return (
    <svg className="mini" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <circle className="mini-track" cx="14" cy="14" r={R} fill="none" strokeWidth="3.4" />
      {props.progress == null ? (
        <g className="mini-lock" fill="none" strokeWidth="1.6" strokeLinecap="round">
          <rect x="10.5" y="13.5" width="7" height="5.5" rx="1.4" />
          <path d="M12 13.5v-1.6a2 2 0 0 1 4 0v1.6" />
        </g>
      ) : (
        <circle
          className="mini-arc"
          cx="14"
          cy="14"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeDasharray={`${len * share} ${len}`}
          transform="rotate(-90 14 14)"
        />
      )}
    </svg>
  );
}

function Chip(props: { item: PeriodView; selected: boolean; onSelect: () => void }) {
  const { item } = props;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.selected}
      className={`chip${props.selected ? ' chip-on' : ''}`}
      onClick={props.onSelect}
    >
      <MiniRing progress={item.progress} />
      <span className="chip-label">{item.label}</span>
      <span className="chip-value">{item.chip}</span>
    </button>
  );
}
