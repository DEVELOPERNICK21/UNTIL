import { useEffect, useState } from 'react';

export type Tick = 'second' | 'minute';

const STEP: Record<Tick, number> = { second: 1000, minute: 60_000 };

/** Milliseconds until the next whole second or minute, plus a hair so we land just after it. */
export function msUntilNext(stepMs: number, nowMs: number): number {
  return stepMs - (nowMs % stepMs) + 8;
}

/**
 * The current time, updated on the beat: every whole second, or every whole minute for things that
 * only show minutes (the widgets). A plain `setInterval` starts at a random point inside the
 * second, so a countdown sometimes shows the same second twice and then skips one. Landing on the
 * beat keeps it even, and keeps a widget's minutes changing at the same moment as the phone's.
 * It catches up straight away when a window is shown again after sleeping.
 */
export function useNow(every: Tick = 'second'): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const step = STEP[every];
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msUntilNext(step, Date.now()));
    };
    schedule();

    const catchUp = () => setNow(new Date());
    window.addEventListener('focus', catchUp);
    document.addEventListener('visibilitychange', catchUp);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', catchUp);
      document.removeEventListener('visibilitychange', catchUp);
    };
  }, [every]);

  return now;
}
