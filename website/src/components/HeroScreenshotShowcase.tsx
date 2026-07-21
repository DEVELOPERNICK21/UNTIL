'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ANDROID_SCREENSHOTS, IOS_SCREENSHOTS } from '@/lib/screenshots';

const AUTO_ADVANCE_MS = 4000;
const DRAG_THRESHOLD = 50;

export function HeroScreenshotShowcase() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = platform === 'ios' ? IOS_SCREENSHOTS : ANDROID_SCREENSHOTS;
  const count = images.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isDragging || reduceMotion || paused) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [count, isDragging, reduceMotion, paused]);

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
      setDragOffset(clientX - startX.current);
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
      role="region"
      aria-roledescription="carousel"
      aria-label="App screenshots"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: reduceMotion
          ? 'none'
          : 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
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
          onClick={() => {
            setPlatform('ios');
            setIndex(0);
          }}
          className="landing-platform-btn"
        >
          iPhone
        </button>
        <button
          type="button"
          aria-pressed={platform === 'android'}
          onClick={() => {
            setPlatform('android');
            setIndex(0);
          }}
          className="landing-platform-btn"
        >
          Android
        </button>
      </div>

      <div
        style={{
          width: 'min(280px, 85vw)',
          margin: '0 auto',
          background: '#1a1a1a',
          borderRadius: 36,
          padding: 10,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 2px var(--divider)',
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
          }}
        >
          {images.map((src, i) => {
            const offsetPercent = (i - index) * 100;
            const opacity =
              Math.abs(offsetPercent) > 100
                ? 0
                : 1 - (Math.abs(offsetPercent) / 100) * 0.5;
            const scale = 1 - (Math.abs(offsetPercent) / 100) * 0.08;

            return (
              <div
                key={`${platform}-${src}`}
                aria-hidden={i !== index}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition:
                    isDragging || reduceMotion
                      ? 'none'
                      : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
                  transform: `translateX(calc(${offsetPercent}% + ${dragOffset}px)) scale(${scale})`,
                  opacity,
                  pointerEvents: 'none',
                }}
              >
                <Image
                  src={src}
                  alt={
                    platform === 'ios'
                      ? `UNTIL on iPhone, screenshot ${i + 1}`
                      : `UNTIL on Android, screenshot ${i + 1}`
                  }
                  fill
                  sizes="280px"
                  priority={i === 0 && platform === 'android'}
                  draggable={false}
                  style={{
                    objectFit: 'cover',
                    borderRadius: 20,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                  className="landing-carousel-img"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
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
            aria-current={i === index ? 'true' : undefined}
            className="landing-carousel-dot"
            data-active={i === index ? 'true' : undefined}
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
        {reduceMotion
          ? 'Use the dots or drag to browse'
          : 'Swipe or drag to browse · Pauses on hover'}
      </p>
    </div>
  );
}
