import type { Ios69SizeId, PlatformTarget } from './types';

export interface OutputSize {
  id: string;
  label: string;
  width: number;
  height: number;
  folder: string;
  target: PlatformTarget;
}

export const IOS_69_SIZES: Record<
  Ios69SizeId,
  { width: number; height: number; label: string }
> = {
  '1290x2796': { width: 1290, height: 2796, label: '1290 × 2796 (default)' },
  '1320x2868': { width: 1320, height: 2868, label: '1320 × 2868' },
  '1260x2736': { width: 1260, height: 2736, label: '1260 × 2736' },
};

export const ANDROID_PHONE: OutputSize = {
  id: 'android-phone',
  label: 'Android phone',
  width: 1080,
  height: 1920,
  folder: 'android/phone',
  target: 'android-phone',
};

export function getOutputSizes(
  ios69SizeId: Ios69SizeId,
  targets: PlatformTarget[],
): OutputSize[] {
  const sizes: OutputSize[] = [];
  if (targets.includes('ios-6.9')) {
    const ios = IOS_69_SIZES[ios69SizeId];
    sizes.push({
      id: `ios-6.9-${ios69SizeId}`,
      label: `iOS 6.9" · ${ios.label}`,
      width: ios.width,
      height: ios.height,
      folder: 'ios/6.9in',
      target: 'ios-6.9',
    });
  }
  if (targets.includes('android-phone')) {
    sizes.push(ANDROID_PHONE);
  }
  return sizes;
}

/** Portrait 9:19.5-ish to 9:16; warn if far off */
export function aspectWarning(
  width: number,
  height: number,
): string | null {
  if (width <= 0 || height <= 0) return 'Could not read image size.';
  const ratio = height / width;
  if (ratio < 1.4) {
    return 'Looks landscape or square. Store slots are portrait; crop may look odd.';
  }
  if (ratio > 2.4) {
    return 'Very tall screenshot. Edges may crop hard into the frame.';
  }
  return null;
}
