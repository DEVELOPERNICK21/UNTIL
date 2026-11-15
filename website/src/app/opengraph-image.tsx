import { ImageResponse } from 'next/og';

export const alt = 'UNTIL: your life in weeks, year progress and time left on your Home Screen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The picture shown when the site is shared in a chat or a post. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #0e0e10 0%, #1d1208 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 6, color: '#f59a3d' }}>
            UNTIL
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>
            See your time, not just the clock.
          </div>
          <div style={{ fontSize: 32, color: '#c9c9cf', marginTop: 28 }}>
            Life in weeks, year progress and time left. On your Home Screen, Lock Screen and watch.
          </div>
        </div>
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 140,
            border: '22px solid #fff1dc',
            borderRightColor: 'rgba(255,241,220,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              background: 'radial-gradient(circle at 40% 35%, #ffe7b0, #f59a3d)',
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
