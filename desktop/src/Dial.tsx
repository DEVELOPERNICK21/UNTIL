import { useEffect, useState, type ReactNode } from 'react';

const VIEW = 200;
const CENTER = VIEW / 2;
const RADIUS = 74;
const LENGTH = 2 * Math.PI * RADIUS;
const TICK_INNER = 90;
const TICK_OUTER = 97;

export interface DialProps {
  /** Share of the period that has passed, 0..1. Null draws an empty dial. */
  progress: number | null;
  color: string;
  /** Marks around the dial: the units of the period. The ones already gone are lit. */
  ticks: { count: number; passed: number } | null;
  size?: number;
  children?: ReactNode;
}

/**
 * The big ring. It draws itself in when it mounts, the unit marks around it light up as they
 * pass, and a bright dot rides the end of the arc. It keeps no time of its own.
 */
export function Dial({ progress, color, ticks, size = 196, children }: DialProps) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const share = progress == null ? 0 : Math.min(1, Math.max(0, progress));
  const shown = drawn ? share : 0;
  const knobAngle = shown * 360;

  return (
    <div className="dial" style={{ width: size, height: size, ['--dial' as string]: color }}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} aria-hidden="true">
        {ticks
          ? Array.from({ length: ticks.count }, (_, i) => {
              const state = i < ticks.passed ? 'past' : i === ticks.passed ? 'now' : 'next';
              return (
                <line
                  key={i}
                  className={`tick tick-${state}`}
                  x1={CENTER}
                  y1={CENTER - TICK_OUTER}
                  x2={CENTER}
                  y2={CENTER - TICK_INNER}
                  strokeWidth={ticks.count <= 12 ? 3.2 : 2.2}
                  strokeLinecap="round"
                  transform={`rotate(${(i * 360) / ticks.count} ${CENTER} ${CENTER})`}
                  style={{ transitionDelay: `${Math.min(i * 14, 420)}ms` }}
                />
              );
            })
          : null}

        <circle className="dial-track" cx={CENTER} cy={CENTER} r={RADIUS} fill="none" strokeWidth="11" />
        <circle
          className="dial-arc"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${LENGTH * shown} ${LENGTH}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        {progress != null ? (
          <g className="dial-knob" style={{ transform: `rotate(${knobAngle}deg)` }}>
            <circle cx={CENTER} cy={CENTER - RADIUS} r="8.5" className="dial-knob-glow" />
            <circle cx={CENTER} cy={CENTER - RADIUS} r="5.5" fill="#FFFFFF" />
          </g>
        ) : null}
      </svg>
      <div className="dial-center">{children}</div>
    </div>
  );
}
