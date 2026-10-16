/**
 * Stable device ID for license binding.
 * Uses react-native-device-info getUniqueId when available.
 * Note: On iOS, getUniqueId can change after OS update; consider fallback for critical use.
 */

let cachedId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  try {
    const DeviceInfo = require('react-native-device-info').default;
    if (DeviceInfo?.getUniqueId) {
      const id = await DeviceInfo.getUniqueId();
      if (typeof id === 'string' && id) {
        cachedId = id;
        return cachedId;
      }
    }
  } catch {
    // Fallback: generate and persist a random ID (survives app restart, not device)
  }
  // Fallback: use a hash of device model + build (best effort)
  try {
    const DeviceInfo = require('react-native-device-info').default;
    const model = (await DeviceInfo?.getModel?.()) ?? 'unknown';
    const buildId = (await DeviceInfo?.getBuildId?.()) ?? 'unknown';
    cachedId = `fallback-${hashString(model + buildId)}`;
    return cachedId;
  } catch {
    cachedId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return cachedId;
  }
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
