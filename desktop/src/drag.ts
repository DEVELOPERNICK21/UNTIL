import type { MouseEvent } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Starts moving the current Tauri window. Used by the panel, widgets and the island so they can
 * sit anywhere, not only where they first opened. Clicks on buttons and links are left alone.
 */
export function startWindowDrag(event: MouseEvent) {
  if (event.button !== 0) return;
  if ((event.target as HTMLElement).closest('button, a, input, label, .ember-live, [data-no-drag]')) {
    return;
  }
  try {
    void getCurrentWindow()
      .startDragging()
      .catch(() => {});
  } catch {
    // Outside Tauri (a plain browser) there is no window to drag.
  }
}
