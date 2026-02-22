'use client';

import React from 'react';

/**
 * Phone frame with rounded corners and notch.
 * Renders children as the "screen" content (app preview).
 */
export function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="phone-mockup"
      style={{
        width: 'min(280px, 85vw)',
        margin: '0 auto',
        background: '#1a1a1a',
        borderRadius: 36,
        padding: 10,
        boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 2px var(--divider)',
      }}
    >
      {/* Notch */}
      <div
        style={{
          height: 28,
          background: '#0e0e10',
          borderRadius: '0 0 16px 16px',
          margin: '-4px 24px 8px',
          width: 'calc(100% - 48px)',
          marginLeft: 24,
          marginRight: 24,
        }}
      />
      <div
        style={{
          background: '#0e0e10',
          borderRadius: 28,
          overflow: 'hidden',
          aspectRatio: '9/19.5',
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
