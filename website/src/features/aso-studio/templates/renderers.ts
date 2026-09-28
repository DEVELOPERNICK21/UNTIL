import type { BrandColors, TemplateOptions } from '../types';

export interface RenderInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  image: CanvasImageSource;
  imageWidth: number;
  imageHeight: number;
  headline: string;
  subtext: string;
  options: TemplateOptions;
}

function fillBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: BrandColors,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.backgroundFrom);
  gradient.addColorStop(1, colors.backgroundTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  params: {
    headline: string;
    subtext: string;
    x: number;
    y: number;
    maxWidth: number;
    align: CanvasTextAlign;
    fontFamily: string;
    colors: BrandColors;
    headlineSize: number;
    subtextSize: number;
  },
): number {
  const {
    headline,
    subtext,
    x,
    y,
    maxWidth,
    align,
    fontFamily,
    colors,
    headlineSize,
    subtextSize,
  } = params;

  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  let cursorY = y;

  if (headline.trim()) {
    ctx.fillStyle = colors.headline;
    ctx.font = `700 ${headlineSize}px ${fontFamily}`;
    const lines = wrapText(ctx, headline, maxWidth);
    const lineHeight = headlineSize * 1.15;
    for (const line of lines) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
    cursorY += headlineSize * 0.35;
  }

  if (subtext.trim()) {
    ctx.fillStyle = colors.subtext;
    ctx.font = `400 ${subtextSize}px ${fontFamily}`;
    const lines = wrapText(ctx, subtext, maxWidth);
    const lineHeight = subtextSize * 1.35;
    for (const line of lines) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
  }

  return cursorY - y;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / imageWidth, h / imageHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (imageWidth - sw) / 2;
  const sy = (imageHeight - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function drawDynamicIsland(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  screenW: number,
) {
  const islandW = screenW * 0.34;
  const islandH = screenW * 0.075;
  const islandX = screenX + (screenW - islandW) / 2;
  const islandY = screenY + screenW * 0.04;
  roundRectPath(ctx, islandX, islandY, islandW, islandH, islandH / 2);
  ctx.fillStyle = '#000';
  ctx.fill();
}

export function renderMinimalFrame(input: RenderInput) {
  const { ctx, width, height, image, imageWidth, imageHeight, headline, subtext, options } =
    input;
  const { brandColors: colors, fontFamily, showDeviceFrame, textPosition } = options;

  fillBackground(ctx, width, height, colors);

  const padX = width * 0.08;
  const textMax = width - padX * 2;
  const headlineSize = Math.round(width * 0.072);
  const subtextSize = Math.round(width * 0.036);

  const textBlockHeightEstimate =
    (headline.trim() ? headlineSize * 2.4 : 0) +
    (subtext.trim() ? subtextSize * 2.8 : 0) +
    height * 0.02;

  const topTextY = height * 0.06;
  const bottomTextY = height - textBlockHeightEstimate - height * 0.05;

  if (textPosition === 'top') {
    drawTextBlock(ctx, {
      headline,
      subtext,
      x: width / 2,
      y: topTextY,
      maxWidth: textMax,
      align: 'center',
      fontFamily,
      colors,
      headlineSize,
      subtextSize,
    });
  }

  const textOccupiedTop =
    textPosition === 'top' ? topTextY + textBlockHeightEstimate : height * 0.04;
  const textOccupiedBottom =
    textPosition === 'bottom'
      ? textBlockHeightEstimate + height * 0.05
      : height * 0.04;

  const availableTop = textOccupiedTop;
  const availableBottom = height - textOccupiedBottom;
  const availableH = availableBottom - availableTop;
  const availableW = width * 0.78;

  const deviceAspect = 9 / 19.5;
  let frameW = availableW;
  let frameH = frameW / deviceAspect;
  if (frameH > availableH * 0.98) {
    frameH = availableH * 0.98;
    frameW = frameH * deviceAspect;
  }

  const frameX = (width - frameW) / 2;
  const frameY = availableTop + (availableH - frameH) / 2;

  if (showDeviceFrame) {
    const bezel = Math.max(10, frameW * 0.028);
    const radius = frameW * 0.12;
    roundRectPath(ctx, frameX, frameY, frameW, frameH, radius);
    ctx.fillStyle = colors.frame;
    ctx.fill();
    ctx.strokeStyle = colors.bezel;
    ctx.lineWidth = Math.max(2, frameW * 0.006);
    ctx.stroke();

    const screenX = frameX + bezel;
    const screenY = frameY + bezel;
    const screenW = frameW - bezel * 2;
    const screenH = frameH - bezel * 2;
    const screenRadius = radius * 0.78;

    ctx.save();
    roundRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();
    drawCoverImage(
      ctx,
      image,
      imageWidth,
      imageHeight,
      screenX,
      screenY,
      screenW,
      screenH,
    );
    drawDynamicIsland(ctx, screenX, screenY, screenW);
    ctx.restore();
  } else {
    const radius = frameW * 0.06;
    ctx.save();
    roundRectPath(ctx, frameX, frameY, frameW, frameH, radius);
    ctx.clip();
    drawCoverImage(
      ctx,
      image,
      imageWidth,
      imageHeight,
      frameX,
      frameY,
      frameW,
      frameH,
    );
    ctx.restore();
  }

  if (textPosition === 'bottom') {
    drawTextBlock(ctx, {
      headline,
      subtext,
      x: width / 2,
      y: bottomTextY,
      maxWidth: textMax,
      align: 'center',
      fontFamily,
      colors,
      headlineSize,
      subtextSize,
    });
  }
}

export function renderTextOverScreen(input: RenderInput) {
  const { ctx, width, height, image, imageWidth, imageHeight, headline, subtext, options } =
    input;
  const { brandColors: colors, fontFamily, showDeviceFrame } = options;

  fillBackground(ctx, width, height, colors);

  const padX = width * 0.08;
  const textMax = width - padX * 2;
  const headlineSize = Math.round(width * 0.085);
  const subtextSize = Math.round(width * 0.038);

  drawTextBlock(ctx, {
    headline,
    subtext,
    x: padX,
    y: height * 0.08,
    maxWidth: textMax,
    align: 'left',
    fontFamily,
    colors,
    headlineSize,
    subtextSize,
  });

  // Device bleeds off bottom; top of device sits around 42% of canvas
  const frameTop = height * 0.42;
  const deviceAspect = 9 / 19.5;
  let frameW = width * 0.82;
  let frameH = frameW / deviceAspect;
  const frameX = (width - frameW) / 2;
  // Allow overflow below canvas
  const frameY = frameTop;

  if (showDeviceFrame) {
    const bezel = Math.max(10, frameW * 0.028);
    const radius = frameW * 0.12;

    roundRectPath(ctx, frameX, frameY, frameW, frameH, radius);
    ctx.fillStyle = colors.frame;
    ctx.fill();
    ctx.strokeStyle = colors.bezel;
    ctx.lineWidth = Math.max(2, frameW * 0.006);
    ctx.stroke();

    const screenX = frameX + bezel;
    const screenY = frameY + bezel;
    const screenW = frameW - bezel * 2;
    const screenH = frameH - bezel * 2;
    const screenRadius = radius * 0.78;

    ctx.save();
    roundRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();
    drawCoverImage(
      ctx,
      image,
      imageWidth,
      imageHeight,
      screenX,
      screenY,
      screenW,
      screenH,
    );
    drawDynamicIsland(ctx, screenX, screenY, screenW);
    ctx.restore();
  } else {
    const radius = frameW * 0.06;
    ctx.save();
    roundRectPath(ctx, frameX, frameY, frameW, frameH, radius);
    ctx.clip();
    drawCoverImage(
      ctx,
      image,
      imageWidth,
      imageHeight,
      frameX,
      frameY,
      frameW,
      frameH,
    );
    ctx.restore();
  }
}
