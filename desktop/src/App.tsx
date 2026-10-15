import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import type { UserCredential } from 'firebase/auth';
import { buildPanelModel } from '@until/core/time/panelModel';
import { getProgressColor } from '@until/theme/progressColor';
import { DEVICE_LIMIT_BANNER_COPY } from '@until/core/account/accountCopy';
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
  type SessionView,
} from './session';
import {
  AccountFooter,
  MessageCard,
  ReplaceDialog,
  RetryCard,
  SetupForm,
  SignInCard,
  WaitingCard,
} from './AccountViews';

const PANEL_WIDTH = 320;

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

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

export function App() {
  const now = useNow();
  const local = loadLocalState();
  const model = buildPanelModel(panelProfile(local), now);
  const { view, setView, run, signIn } = useSession();
  const panelRef = useFitWindow();

  useEffect(() => {
    void pushExtra(model).catch(() => {});
  }, [model.extraText, model.extraProgress]);

  const dayColor = getProgressColor(model.day.progress);

  return (
    <main className="panel" ref={panelRef}>
      <header className="head">
        <span className="mark">UNTIL</span>
        <span className="date">{now.toLocaleDateString(undefined, DATE_FORMAT)}</span>
      </header>

      <section className="hero" aria-label="Today">
        <div className="hero-label">Today</div>
        <div className="hero-value" style={{ color: dayColor }}>
          {model.day.leftStr}
        </div>
        <div className="hero-sub">
          left today · {model.day.passedPct}% passed
        </div>
        <Bar progress={model.day.progress} color={dayColor} />
      </section>

      <section className="rows">
        <Row
          title="Month"
          value={`${model.month.leftDays} days`}
          meta={`${model.month.leftPct}% left`}
          progress={model.month.passedPct / 100}
        />
        <Row
          title="Year"
          value={`${model.year.leftDays} days`}
          meta={`${model.year.leftPct}% left`}
          progress={model.year.passedPct / 100}
        />
        {model.life ? (
          <Row
            title="Life"
            value={`${model.life.leftDays.toLocaleString()} days`}
            meta={`${model.life.leftPct}% left`}
            progress={model.life.passedPct / 100}
          />
        ) : (
          <Row
            title="Life"
            value="—"
            meta={view.kind === 'signed_in' ? 'Needs your birth date' : 'Sign in to see'}
            progress={null}
          />
        )}
      </section>

      {(() => {
        switch (view.kind) {
          case 'signed_in':
            return (
              <AccountFooter
                email={local.email}
                premium={local.entitlementActive}
                onSignOut={() => void run(signOutDesktop)}
                onQuit={() => void invoke('quit_app')}
              />
            );
          case 'signed_out':
            return (
              <SignInCard
                message={view.message}
                onGoogle={() => void signIn(signInWithGoogle)}
                onApple={() => void signIn(signInWithApple)}
                onQuit={() => void invoke('quit_app')}
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
    </main>
  );
}

function Bar(props: { progress: number | null; color?: string }) {
  const pct = props.progress == null ? 0 : Math.max(0, Math.min(1, props.progress)) * 100;
  return (
    <div className="bar" aria-hidden="true">
      <div className="bar-fill" style={{ width: `${pct}%`, background: props.color }} />
    </div>
  );
}

function Row(props: {
  title: string;
  value: string;
  meta: string;
  progress: number | null;
}) {
  return (
    <div className="row">
      <span className="row-title">{props.title}</span>
      <span className="row-value">{props.value}</span>
      <span className="row-meta">{props.meta}</span>
      <Bar
        progress={props.progress}
        color={props.progress == null ? undefined : getProgressColor(props.progress)}
      />
    </div>
  );
}
