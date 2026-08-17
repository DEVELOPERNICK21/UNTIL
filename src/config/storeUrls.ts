export const ANDROID_PACKAGE_NAME = 'app.until.time';

/** Opens Play Store app when installed. */
export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE_NAME}`;

/** HTTPS listing. Fallback when the Play Store app is missing. */
export const PLAY_STORE_LISTING_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

/**
 * Numeric App Store ID (digits only). Empty until the app is live on App Store.
 * When empty, iOS openStoreListing is a no-op.
 */
export const IOS_APP_STORE_ID = '';
