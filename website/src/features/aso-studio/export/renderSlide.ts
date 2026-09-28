import type { TemplateId, TemplateOptions } from '../types';
import { renderTemplate } from '../templates';

export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export async function renderSlideToBlob(params: {
  templateId: TemplateId;
  options: TemplateOptions;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  headline: string;
  subtext: string;
  width: number;
  height: number;
  mimeType?: 'image/png' | 'image/jpeg';
}): Promise<Blob> {
  const {
    templateId,
    options,
    imageUrl,
    imageWidth,
    imageHeight,
    headline,
    subtext,
    width,
    height,
    mimeType = 'image/png',
  } = params;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const image = await loadImage(imageUrl);
  renderTemplate(templateId, {
    ctx,
    width,
    height,
    image,
    imageWidth: imageWidth || image.naturalWidth,
    imageHeight: imageHeight || image.naturalHeight,
    headline,
    subtext,
    options,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode image'));
        else resolve(blob);
      },
      mimeType,
      mimeType === 'image/jpeg' ? 0.92 : undefined,
    );
  });
}

export async function resizeIconToBlob(
  iconUrl: string,
  size: number,
  mimeType: 'image/png' = 'image/png',
): Promise<Blob> {
  const image = await loadImage(iconUrl);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  // Flatten onto opaque black so iOS 1024 has no alpha surprises
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(image, 0, 0, size, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode icon'));
        else resolve(blob);
      },
      mimeType,
    );
  });
}
