'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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

const AUTO_ADVANCE_MS = 4000;
const DRAG_THRESHOLD = 50;

export function HeroScreenshotShowcase() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = platform === 'ios' ? IOS_IMAGES : ANDROID_IMAGES;
  const count = images.length;

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (isDragging) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [count, isDragging]);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
  }, []);

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const delta = clientX - startX.current;
      setDragOffset(delta);
    },
    [isDragging],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > DRAG_THRESHOLD) goTo(index - 1);
    else if (dragOffset < -DRAG_THRESHOLD) goTo(index + 1);
    setDragOffset(0);
  }, [isDragging, dragOffset, index, goTo]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => handleDragStart(e.clientX);
    const onPointerMove = (e: PointerEvent) => handleDragMove(e.clientX);
    const onPointerUp = () => handleDragEnd();
    const onPointerLeave = () => handleDragEnd();

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointerleave', onPointerLeave);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  return (
    <div
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {/* Platform toggle */}
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
          onClick={() => {
            setPlatform('ios');
            setIndex(0);
          }}
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
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          iPhone
        </button>
        <button
          type="button"
          onClick={() => {
            setPlatform('android');
            setIndex(0);
          }}
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
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          Android
        </button>
      </div>

      {/* Phone frame + carousel */}
      <div
        style={{
          width: 'min(280px, 85vw)',
          margin: '0 auto',
          background: '#1a1a1a',
          borderRadius: 36,
          padding: 10,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 2px var(--divider)',
          transition: 'transform 0.3s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
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
          ref={containerRef}
          style={{
            background: '#0e0e10',
            borderRadius: 28,
            overflow: 'hidden',
            aspectRatio: '9/19.5',
            minHeight: 420,
            position: 'relative',
            touchAction: 'pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {images.map((src, i) => {
            const offsetPercent = (i - index) * 100;
            const isActive = i === index;
            const opacity =
              Math.abs(offsetPercent) > 100
                ? 0
                : 1 - (Math.abs(offsetPercent) / 100) * 0.5;
            const scale = 1 - (Math.abs(offsetPercent) / 100) * 0.08;

            return (
              <div
                key={`${platform}-${src}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
                  transform: `translateX(calc(${offsetPercent}% + ${dragOffset}px)) scale(${scale})`,
                  opacity,
                  pointerEvents: 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={
                    platform === 'ios'
                      ? `Until on iPhone ${i + 1}`
                      : `Until on Android ${i + 1}`
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'cover',
                    borderRadius: 20,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to screenshot ${i + 1}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === index ? 'var(--text)' : 'var(--divider)',
              transform: i === index ? 'scale(1.2)' : 'scale(1)',
              transition: 'background 0.2s, transform 0.2s',
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginTop: '0.5rem',
          textAlign: 'center',
        }}
      >
        Swipe or drag to browse · Auto-rotates
      </p>
    </div>
  );
}
