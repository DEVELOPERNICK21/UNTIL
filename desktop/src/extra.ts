import { invoke } from '@tauri-apps/api/core';
import { getProgressColor } from '@until/theme/progressColor';
import type { PanelModel } from '@until/core/time/panelModel';

const SIZE = 32;
const MUTED = '#9A9A9A';

/** Windows tray glyph: a disc in the progress color with the percent (or a dash). */
function glyphPng(text: string, color: string): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0E0E10';
  ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.replace('%', ''), SIZE / 2, SIZE / 2 + 1);
  const binary = atob(canvas.toDataURL('image/png').split(',')[1]);
  return Array.from(binary, ch => ch.charCodeAt(0));
}

let lastText: string | null = null;

/** Push the extra only when the shown text changes (about every 15 minutes for the day %). */
export async function pushExtra(model: PanelModel): Promise<void> {
  if (model.extraText === lastText) return;
  lastText = model.extraText;
  const color =
    model.extraProgress == null ? MUTED : getProgressColor(model.extraProgress);
  const isMac = navigator.userAgent.includes('Mac');
  await invoke('set_extra', {
    text: model.extraText,
    png: isMac ? null : glyphPng(model.extraText, color),
  });
}
