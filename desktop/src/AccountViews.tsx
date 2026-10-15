import { useState, type ReactNode } from 'react';
import type { AccountDevice } from '@until/types';
import { replaceDesktopBody } from '@until/core/account/accountCopy';
import { checkSetupForm } from './auth/afterSignIn';

function Card(props: { children: ReactNode }) {
  return <section className="card">{props.children}</section>;
}

export function SignInCard(props: {
  message?: string;
  onGoogle: () => void;
  onApple: () => void;
}) {
  return (
    <Card>
      <p>Sign in with the account you use on your phone.</p>
      {props.message ? <p className="note">{props.message}</p> : null}
      <button className="primary" onClick={props.onGoogle}>
        Sign in with Google
      </button>
      <button onClick={props.onApple}>Sign in with Apple</button>
    </Card>
  );
}

export function WaitingCard() {
  return (
    <Card>
      <p>Finish signing in in your browser.</p>
    </Card>
  );
}

export function MessageCard(props: { text: string; onDone: () => void }) {
  return (
    <Card>
      <p>{props.text}</p>
      <button onClick={props.onDone}>OK</button>
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
      <h2>Use UNTIL on this computer?</h2>
      <p>{replaceDesktopBody(props.existing)}</p>
      <button className="primary" onClick={props.onContinue}>
        Continue
      </button>
      <button onClick={props.onCancel}>Cancel</button>
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
      {error ? <p className="note">{error}</p> : null}
      <button className="primary" onClick={save}>
        Continue
      </button>
      <button onClick={props.onCancel}>Cancel</button>
    </Card>
  );
}

export function RetryCard(props: { onRetry: () => void; onCancel: () => void }) {
  return (
    <Card>
      <p>Couldn't reach your account. Check your connection and try again.</p>
      <button className="primary" onClick={props.onRetry}>
        Try again
      </button>
      <button onClick={props.onCancel}>Cancel</button>
    </Card>
  );
}

export function AccountFooter(props: {
  email: string | null;
  premium: boolean;
  onSignOut: () => void;
}) {
  return (
    <footer className="footer">
      {props.premium ? null : <p className="note">Premium is managed on your phone.</p>}
      <div className="footer-row">
        <span className="muted">{props.email ?? 'Signed in'}</span>
        <button className="link" onClick={props.onSignOut}>
          Sign out
        </button>
      </div>
    </footer>
  );
}
