import { invoke } from '@tauri-apps/api/core';
import { getProgressColor } from '@until/theme/progressColor';
import type { PanelModel } from '@until/core/time/panelModel';

let lastKey: string | null = null;

/**
 * Push the extra when the text or the ring would visibly change (the ring is
 * redrawn per whole percent, same as the text).
 */
export async function pushExtra(model: PanelModel): Promise<void> {
  const key = model.extraText;
  if (key === lastKey) return;
  lastKey = key;
  const progress = model.extraProgress;
  await invoke('set_extra', {
    text: model.extraText,
    progress,
    color: progress == null ? null : getProgressColor(progress),
  });
}
