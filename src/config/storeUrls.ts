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

/** The public site. Legal pages, downloads and shared links all start here. */
export const SITE_URL = 'https://developernick1-until.vercel.app';

/** Where a visit or install came from. Shows up in Firebase as first-user source / medium / campaign. */
export interface CampaignTags {
  source: string;
  medium: string;
  campaign?: string;
}

/** What the snapshot share caption links with. */
export const SHARE_CAMPAIGN: CampaignTags = {
  source: 'share',
  medium: 'snapshot',
  campaign: 'viral',
};

function utmQuery(tags: CampaignTags): string {
  const parts = [`utm_source=${tags.source}`, `utm_medium=${tags.medium}`];
  if (tags.campaign) parts.push(`utm_campaign=${tags.campaign}`);
  return parts.join('&');
}

/** Play listing link that carries the tags through the install (Play's `referrer` parameter). */
export function playStoreCampaignUrl(tags: CampaignTags): string {
  return `${PLAY_STORE_LISTING_URL}&referrer=${encodeURIComponent(utmQuery(tags))}`;
}

export function siteCampaignUrl(tags: CampaignTags): string {
  return `${SITE_URL}/?${utmQuery(tags)}`;
}

/**
 * The link a shared snapshot points to. Android goes straight to the Play listing, so a friend is
 * one tap from installing and the install is attributed. Other platforms get the site.
 */
export function shareInviteUrl(
  platform: string,
  tags: CampaignTags = SHARE_CAMPAIGN,
): string {
  return platform === 'android' ? playStoreCampaignUrl(tags) : siteCampaignUrl(tags);
}
