/**
 * Image assets for Android and iOS.
 * Add new images here when you add files to this folder.
 */

// iOS screenshots
export const iOSImage1 = require('./iOSImage1.PNG');
export const iOSImage2 = require('./iOSImage2.PNG');
export const iOSImage3 = require('./iOSImage3.PNG');
export const iOSImage4 = require('./iOSImage4.PNG');

// Android screenshots
export const screenshotAndroid1 = require('./screenshotAndroid1.JPG');
export const screenshotAndroid2 = require('./screenshotAndroid2.JPG');
export const screenshotAndroid3 = require('./screenshotAndroid3.JPG');
export const screenshotAndroid4 = require('./screenshotAndroid4.JPG');

/** All iOS screenshot assets (for carousels or lists) */
export const iosScreenshots = [
  iOSImage1,
  iOSImage2,
  iOSImage3,
  iOSImage4,
] as const;

/** All Android screenshot assets (for carousels or lists) */
export const androidScreenshots = [
  screenshotAndroid1,
  screenshotAndroid2,
  screenshotAndroid3,
  screenshotAndroid4,
] as const;
