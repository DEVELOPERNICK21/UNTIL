'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ANDROID_SCREENSHOTS, IOS_SCREENSHOTS } from '@/lib/screenshots';

export function AppScreenshots() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const images = platform === 'ios' ? IOS_SCREENSHOTS : ANDROID_SCREENSHOTS;

  return (
    <div style={{ width: '100%' }}>
      <div
        role="group"
        aria-label="Platform"
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          aria-pressed={platform === 'ios'}
          onClick={() => setPlatform('ios')}
          className="landing-platform-btn"
        >
          iPhone
        </button>
        <button
          type="button"
          aria-pressed={platform === 'android'}
          onClick={() => setPlatform('android')}
          className="landing-platform-btn"
        >
          Android
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {images.map((src, i) => (
          <div
            key={src}
            style={{
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              maxWidth: 180,
              margin: '0 auto',
              position: 'relative',
              aspectRatio: '9 / 19.5',
              width: '100%',
            }}
          >
            <Image
              src={src}
              alt={
                platform === 'ios'
                  ? `UNTIL on iPhone screenshot ${i + 1}`
                  : `UNTIL on Android screenshot ${i + 1}`
              }
              fill
              sizes="180px"
              loading="lazy"
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
