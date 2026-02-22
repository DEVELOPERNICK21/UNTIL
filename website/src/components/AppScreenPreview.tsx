'use client';

import React from 'react';

/**
 * Static preview of the app Home screen for the phone mockup.
 * Mirrors app theme and layout (day/month/year/life progress).
 */
const PROGRESS = [
  { label: 'Today', progress: 0.42, color: '#22c55e' },
  { label: 'Month', progress: 0.65, color: '#f59e0b' },
  { label: 'Year', progress: 0.15, color: '#22c55e' },
  { label: 'Life', progress: 0.31, color: '#22c55e' },
];

export function AppScreenPreview() {
  return (
    <div
      style={{
        flex: 1,
        background: '#0e0e10',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#ededed', marginBottom: 4 }}>
        UNTIL
      </div>
      {PROGRESS.map(({ label, progress, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#9a9a9a' }}>{label}</span>
            <span style={{ fontSize: 11, color: '#9a9a9a' }}>{Math.round(progress * 100)}%</span>
          </div>
          <div
            style={{
              height: 6,
              background: '#2a2a2a',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: color,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 'auto',
          fontSize: 10,
          color: '#9a9a9a',
          textAlign: 'center',
        }}
      >
        Widgets · Settings
      </div>
    </div>
  );
}
