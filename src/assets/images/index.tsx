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

// App Images
export const appLogoIcon = require('./appLogo.png');

// Onboarding hero images (3-step flow)
export const onboardingImage1 = require('./onboarding_image_1.png');
export const onboardingImage2 = require('./onboarding_image_2.png');
export const onboardingImage3 = require('./onboarding_image_3.png');

/** Onboarding step images in order — Day Progress, Time Tracking, Cadence */
export const onboardingImages = [
  onboardingImage1,
  onboardingImage2,
  onboardingImage3,
] as const;

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

export const commonImages = [appLogoIcon] as const;
