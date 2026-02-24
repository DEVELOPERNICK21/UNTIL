'use client';

import React, { useState } from 'react';

const IOS_IMAGES = [
  '/images/iOSImage1.PNG',
  '/images/iOSImage2.PNG',
  '/images/iOSImage3.PNG',
  '/images/iOSImage4.PNG',
];

const ANDROID_IMAGES = [
  '/images/screenshotAndroid1.JPG',
  '/images/screenshotAndroid2.JPG',
  '/images/screenshotAndroid3.JPG',
  '/images/screenshotAndroid4.JPG',
];

export function AppScreenshots() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const images = platform === 'ios' ? IOS_IMAGES : ANDROID_IMAGES;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setPlatform('ios')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${
              platform === 'ios' ? 'var(--text)' : 'var(--divider)'
            }`,
            background: platform === 'ios' ? 'var(--divider)' : 'transparent',
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          iPhone
        </button>
        <button
          type="button"
          onClick={() => setPlatform('android')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${
              platform === 'android' ? 'var(--text)' : 'var(--divider)'
            }`,
            background:
              platform === 'android' ? 'var(--divider)' : 'transparent',
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
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
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={
                platform === 'ios'
                  ? `Until app on iPhone screenshot ${i + 1}`
                  : `Until app on Android screenshot ${i + 1}`
              }
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                aspectRatio: '9 / 19.5',
                objectFit: 'cover',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
