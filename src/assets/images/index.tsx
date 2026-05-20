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

// Onboarding hero illustrations (Stitch source art only — not full-screen mockups)
export const onboardingHeroToday = require('./onboarding_hero_today.png');
export const onboardingHeroHorizon = require('./onboarding_hero_horizon.png');
export const onboardingHeroCadence = require('./onboarding_hero_cadence.png');

/** Onboarding carousel: Today is Limited → Life Horizon → Find Your Cadence */
export const onboardingImages = [
  onboardingHeroToday,
  onboardingHeroHorizon,
  onboardingHeroCadence,
] as const;

/** @deprecated Use onboardingImages */
export const onboardingImage1 = onboardingHeroToday;
export const onboardingImage2 = onboardingHeroHorizon;
export const onboardingImage3 = onboardingHeroCadence;

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
