const TAU = Math.PI * 2;

/** Added to the radius to reach the top of the hanging loop, where the string attaches. */
export const CLOCK_HOOK_OFFSET = 9.5;

export type WallClockOptions = {
  radius: number;
  /** Extra hand rotation in radians. Whole turns leave the hands on real time. */
  spin: number;
  spinV: number;
  accent: string;
  now: Date;
  /** 0..1 white flash over the face after a hit. */
  flash?: number;
  motionBlur?: boolean;
};

function faceRadius(radius: number): number {
  return radius * 0.86;
}

export function clockFaceRadius(radius: number): number {
  return faceRadius(radius);
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  angle: number,
  len: number,
  base: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-base / 2, len * 0.16);
  ctx.lineTo(-base * 0.18, -len);
  ctx.lineTo(base * 0.18, -len);
  ctx.lineTo(base / 2, len * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draws a wall clock centered on the current origin. Caller handles translate/rotate. */
export function drawWallClock(ctx: CanvasRenderingContext2D, o: WallClockOptions) {
  const R = o.radius;
  const face = faceRadius(R);

  ctx.strokeStyle = '#9a9a9e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -R - 5, 4.5, 0, TAU);
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = R * 0.4;
  ctx.shadowOffsetY = R * 0.22;
  const bezel = ctx.createLinearGradient(-R, -R, R, R);
  bezel.addColorStop(0, '#8a8a90');
  bezel.addColorStop(0.45, '#3a3a3f');
  bezel.addColorStop(1, '#141416');
  ctx.fillStyle = bezel;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, R - 1, Math.PI * 1.05, Math.PI * 1.7);
  ctx.stroke();

  const faceFill = ctx.createRadialGradient(-face * 0.2, -face * 0.25, face * 0.1, 0, 0, face);
  faceFill.addColorStop(0, '#fbf8f1');
  faceFill.addColorStop(1, '#e2dacb');
  ctx.fillStyle = faceFill;
  ctx.beginPath();
  ctx.arc(0, 0, face, 0, TAU);
  ctx.fill();

  const rim = ctx.createRadialGradient(0, 0, face * 0.82, 0, 0, face);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, face, 0, TAU);
  ctx.fill();

  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const major = i % 5 === 0;
    const r2 = face - 4;
    const r1 = r2 - (major ? R * 0.1 : R * 0.045);
    ctx.strokeStyle = major ? '#1d1d1f' : 'rgba(29,29,31,0.45)';
    ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1);
    ctx.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2);
    ctx.stroke();
  }

  ctx.fillStyle = '#1d1d1f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(R * 0.19)}px Georgia, 'Times New Roman', serif`;
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * TAU;
    ctx.fillText(String(n), Math.sin(a) * face * 0.7, -Math.cos(a) * face * 0.7 + 1);
  }
  ctx.font = `700 ${Math.round(R * 0.095)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(29,29,31,0.55)';
  ctx.fillText('UNTIL', 0, face * 0.36);

  const d = o.now;
  const secs = d.getSeconds() + d.getMilliseconds() / 1000;
  const mins = d.getMinutes() + secs / 60;
  const hrs = (d.getHours() % 12) + mins / 60;
  const ghosts = o.motionBlur && Math.abs(o.spinV) > 6 ? [0.12, 0.08, 0.04] : [];

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  // Integer multipliers so every hand is back on real time when spin settles on a whole turn.
  const hands: Array<[number, number, number, number]> = [
    [(hrs / 12) * TAU, 1, face * 0.5, R * 0.085],
    [(mins / 60) * TAU, 3, face * 0.74, R * 0.06],
  ];
  for (const [base, mult, len, width] of hands) {
    const angle = base + o.spin * mult;
    ghosts.forEach((lag, i) =>
      drawHand(ctx, angle - o.spinV * mult * lag * 0.1, len, width, '#1d1d1f', 0.28 - i * 0.08),
    );
    drawHand(ctx, angle, len, width, '#1d1d1f', 1);
  }
  ctx.restore();

  ctx.save();
  ctx.rotate((secs / 60) * TAU - o.spin * 5);
  ctx.strokeStyle = o.accent;
  ctx.fillStyle = o.accent;
  ctx.lineWidth = Math.max(1.2, R * 0.02);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, face * 0.22);
  ctx.lineTo(0, -face * 0.84);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, face * 0.2, R * 0.045, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#1d1d1f';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.065, 0, TAU);
  ctx.fill();
  ctx.fillStyle = o.accent;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.03, 0, TAU);
  ctx.fill();

  if (o.flash && o.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, o.flash)})`;
    ctx.beginPath();
    ctx.arc(0, 0, face, 0, TAU);
    ctx.fill();
  }

  const glare = ctx.createLinearGradient(-face, -face, face * 0.3, face * 0.3);
  glare.addColorStop(0, 'rgba(255,255,255,0.4)');
  glare.addColorStop(0.45, 'rgba(255,255,255,0.06)');
  glare.addColorStop(0.46, 'rgba(255,255,255,0)');
  ctx.fillStyle = glare;
  ctx.beginPath();
  ctx.arc(0, 0, face, 0, TAU);
  ctx.fill();
}
