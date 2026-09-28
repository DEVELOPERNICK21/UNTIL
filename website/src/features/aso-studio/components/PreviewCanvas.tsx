'use client';

import { useEffect, useRef } from 'react';
import type { Slide, TemplateId, TemplateOptions } from '../types';
import { renderTemplate } from '../templates';
import { loadImage } from '../export/renderSlide';

interface PreviewCanvasProps {
  slide: Slide;
  templateId: TemplateId;
  options: TemplateOptions;
  width: number;
  height: number;
  className?: string;
}

export function PreviewCanvas({
  slide,
  templateId,
  options,
  width,
  height,
  className,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    (async () => {
      try {
        const image = await loadImage(slide.imageUrl);
        if (cancelled) return;
        ctx.clearRect(0, 0, width, height);
        renderTemplate(templateId, {
          ctx,
          width,
          height,
          image,
          imageWidth: slide.naturalWidth || image.naturalWidth,
          imageHeight: slide.naturalHeight || image.naturalHeight,
          headline: slide.headline,
          subtext: slide.subtext,
          options,
        });
      } catch {
        if (cancelled) return;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#9a9a9a';
        ctx.font = '14px system-ui';
        ctx.fillText('Preview failed to load', 16, 32);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slide, templateId, options, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
