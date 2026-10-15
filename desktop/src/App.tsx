import { useCallback, useEffect, useState } from 'react';
import type { UserCredential } from 'firebase/auth';
import { buildPanelModel } from '@until/core/time/panelModel';
import { getProgressColor } from '@until/theme/progressColor';
import { DEVICE_LIMIT_BANNER_COPY } from '@until/core/account/accountCopy';
import { loadLocalState, panelProfile } from './localState';
import { pushExtra } from './extra';
import { SignInError, signInWithApple, signInWithGoogle } from './auth/browserSignIn';
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

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
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

export function App() {
  const now = useNow();
  const local = loadLocalState();
  const model = buildPanelModel(panelProfile(local), now);
  const { view, setView, run, signIn } = useSession();

  useEffect(() => {
    void pushExtra(model).catch(() => {});
  }, [model.extraText, model.extraProgress]);

  return (
    <main className="panel">
      <h1>UNTIL</h1>
      <Row
        title="Today"
        left={model.day.leftStr}
        passed={model.day.passedStr}
        leftPct={model.day.leftPct}
        progress={model.day.progress}
      />
      <Row
        title="Month"
        left={`${model.month.leftDays} days`}
        passed={`${model.month.passedDays} days`}
        leftPct={model.month.leftPct}
        progress={model.month.passedPct / 100}
      />
      <Row
        title="Year"
        left={`${model.year.leftDays} days`}
        passed={`${model.year.passedDays} days`}
        leftPct={model.year.leftPct}
        progress={model.year.passedPct / 100}
      />
      {model.life ? (
        <Row
          title="Life"
          left={`${model.life.leftDays.toLocaleString()} days`}
          passed={`${model.life.passedDays.toLocaleString()} days`}
          leftPct={model.life.leftPct}
          progress={model.life.passedPct / 100}
        />
      ) : (
        <div className="row">
          <span className="row-title">Life</span>
          <span className="row-left muted">—</span>
        </div>
      )}

      {(() => {
        switch (view.kind) {
          case 'signed_in':
            return (
              <AccountFooter
                email={local.email}
                premium={local.entitlementActive}
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
            return <WaitingCard />;
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

function Row(props: {
  title: string;
  left: string;
  passed: string;
  leftPct: number;
  progress: number;
}) {
  return (
    <div className="row">
      <span className="row-title">{props.title}</span>
      <span className="row-left" style={{ color: getProgressColor(props.progress) }}>
        {props.left}
      </span>
      <span className="row-sub">
        {props.passed} passed · {props.leftPct}% left
      </span>
    </div>
  );
}
