import { useState, type ReactNode } from 'react';
import type { AccountDevice } from '@until/types';
import { replaceDesktopBody } from '@until/core/account/accountCopy';
import { checkSetupForm } from './auth/afterSignIn';

function Card(props: { children: ReactNode }) {
  return <section className="card">{props.children}</section>;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 384 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

export function SignInCard(props: {
  message?: string;
  onGoogle: () => void;
  onApple: () => void;
}) {
  return (
    <Card>
      <p className="card-lead">Sign in with the account you use on your phone.</p>
      {props.message ? <p className="note warn">{props.message}</p> : null}
      <div className="stack">
        <button className="btn btn-light" onClick={props.onGoogle}>
          <GoogleIcon />
          Sign in with Google
        </button>
        <button className="btn btn-dark" onClick={props.onApple}>
          <AppleIcon />
          Sign in with Apple
        </button>
      </div>
    </Card>
  );
}

export function WaitingCard(props: { onCancel: () => void }) {
  return (
    <Card>
      <div className="waiting">
        <span className="spinner" aria-hidden="true" />
        <p>Finish signing in in your browser.</p>
      </div>
      <button className="btn btn-ghost" onClick={props.onCancel}>
        Cancel
      </button>
    </Card>
  );
}

export function MessageCard(props: { text: string; onDone: () => void }) {
  return (
    <Card>
      <p className="card-lead">{props.text}</p>
      <button className="btn btn-ghost" onClick={props.onDone}>
        OK
      </button>
    </Card>
  );
}

export function ReplaceDialog(props: {
  existing: AccountDevice;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <h2 className="card-title">Use UNTIL on this computer?</h2>
      <p className="card-lead">{replaceDesktopBody(props.existing)}</p>
      <div className="row-buttons">
        <button className="btn btn-ghost" onClick={props.onCancel}>
          Cancel
        </button>
        <button className="btn btn-light" onClick={props.onContinue}>
          Continue
        </button>
      </div>
    </Card>
  );
}

const SETUP_ERRORS: Record<string, string> = {
  birth_date_required: 'Add your birth date.',
  confirmation_required: 'Tick the box to continue.',
};

export function SetupForm(props: {
  askBirthDate: boolean;
  askAgeConfirmation: boolean;
  onSave: (input: { birthDate: string | null; confirmedMinimumAge: boolean }) => void;
  onCancel: () => void;
}) {
  const [birthDate, setBirthDate] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const check = checkSetupForm(
      {
        askBirthDate: props.askBirthDate,
        birthDate,
        confirmed: props.askAgeConfirmation ? confirmed : true,
      },
      new Date(),
    );
    if (check === 'allowed' || check === 'under_minimum_age') {
      props.onSave({
        birthDate: props.askBirthDate ? birthDate : null,
        confirmedMinimumAge: props.askAgeConfirmation && confirmed,
      });
      return;
    }
    setError(SETUP_ERRORS[check]);
  };

  return (
    <Card>
      <h2 className="card-title">One more step</h2>
      {props.askBirthDate ? (
        <label className="field">
          <span>Birth date</span>
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setBirthDate(e.target.value)}
          />
        </label>
      ) : null}
      {props.askAgeConfirmation ? (
        <label className="check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
          />
          <span>I am 13 or older.</span>
        </label>
      ) : null}
      {error ? <p className="note warn">{error}</p> : null}
      <div className="row-buttons">
        <button className="btn btn-ghost" onClick={props.onCancel}>
          Cancel
        </button>
        <button className="btn btn-light" onClick={save}>
          Continue
        </button>
      </div>
    </Card>
  );
}

export function RetryCard(props: { onRetry: () => void; onCancel: () => void }) {
  return (
    <Card>
      <p className="card-lead">Couldn't reach your account. Check your connection and try again.</p>
      <div className="row-buttons">
        <button className="btn btn-ghost" onClick={props.onCancel}>
          Cancel
        </button>
        <button className="btn btn-light" onClick={props.onRetry}>
          Try again
        </button>
      </div>
    </Card>
  );
}

export function AccountFooter(props: {
  email: string | null;
  premium: boolean;
  onSignOut: () => void;
}) {
  const initial = (props.email ?? '?').charAt(0).toUpperCase();
  return (
    <footer className="footer">
      {props.premium ? null : <p className="note">Premium is managed on your phone.</p>}
      <div className="footer-row">
        <span className="avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="email">{props.email ?? 'Signed in'}</span>
        <button className="link" onClick={props.onSignOut}>
          Sign out
        </button>
      </div>
    </footer>
  );
}

export function PanelBar(props: {
  launchAtLogin: boolean | null;
  onLaunchAtLogin: (on: boolean) => void;
  updateReady: boolean;
  onRestart: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="panel-bar">
      {props.updateReady ? (
        <div className="update">
          <span>Update ready.</span>
          <button className="link strong" onClick={props.onRestart}>
            Restart
          </button>
        </div>
      ) : null}
      <div className="panel-bar-row">
        {props.launchAtLogin == null ? (
          <span />
        ) : (
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              checked={props.launchAtLogin}
              onChange={e => props.onLaunchAtLogin(e.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
            <span>Open at login</span>
          </label>
        )}
        <button className="link" onClick={props.onQuit}>
          Quit
        </button>
      </div>
    </div>
  );
}
