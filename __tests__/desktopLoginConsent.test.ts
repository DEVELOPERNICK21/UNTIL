import {
  markLaunchAtLoginAsked,
  shouldAskLaunchAtLogin,
} from '../desktop/src/loginConsent';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('desktop: opening at login is opt-in', () => {
  it('asks a new person once, when it is off', () => {
    expect(shouldAskLaunchAtLogin(memoryStorage(), false)).toBe(true);
  });

  it('does not ask when it is already on', () => {
    expect(shouldAskLaunchAtLogin(memoryStorage(), true)).toBe(false);
  });

  it('remembers the answer, whichever it was', () => {
    const storage = memoryStorage();
    markLaunchAtLoginAsked(storage);
    expect(shouldAskLaunchAtLogin(storage, false)).toBe(false);
  });

  it('does not ask someone an older build already switched it on for', () => {
    const storage = memoryStorage({ 'until.desktop.loginDefaultApplied': '1' });
    expect(shouldAskLaunchAtLogin(storage, false)).toBe(false);
  });

  it('does not nag when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(shouldAskLaunchAtLogin(broken, false)).toBe(false);
    expect(() => markLaunchAtLoginAsked(broken)).not.toThrow();
  });
});
