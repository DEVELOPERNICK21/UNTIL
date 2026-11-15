export const ANDROID_PACKAGE_NAME = 'app.until.time';

/** Opens Play Store app when installed. */
export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE_NAME}`;

/** HTTPS listing. Fallback when the Play Store app is missing. */
export const PLAY_STORE_LISTING_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

/**
 * Numeric App Store ID (digits only): App Store Connect > App Information > Apple ID.
 * When empty, iOS openStoreListing is a no-op.
 */
export const IOS_APP_STORE_ID = '6813366004';

/** HTTPS App Store listing. Empty when there is no App Store ID. */
export const APP_STORE_LISTING_URL = IOS_APP_STORE_ID
  ? `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`
  : '';

/** Opens the review box on the App Store page, for people who asked to rate us. */
export const APP_STORE_WRITE_REVIEW_URL = APP_STORE_LISTING_URL
  ? `${APP_STORE_LISTING_URL}?action=write-review`
  : '';

/**
 * App Store campaign links need the provider token as well (App Store Connect > Analytics >
 * Campaigns > "Create campaign link"). Without it the links still open the app page, but
 * Connect cannot group the downloads by campaign. Paste it here once.
 */
export const APP_STORE_PROVIDER_TOKEN = '';

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

/** App Store listing link that names the campaign (`ct`, 40 characters at most) for App Analytics. */
export function appStoreCampaignUrl(tags: CampaignTags): string {
  if (!APP_STORE_LISTING_URL) return siteCampaignUrl(tags);
  const campaign = [tags.source, tags.medium, tags.campaign]
    .filter(Boolean)
    .join('_')
    .slice(0, 40);
  const params = [`ct=${encodeURIComponent(campaign)}`];
  if (APP_STORE_PROVIDER_TOKEN) params.unshift(`pt=${APP_STORE_PROVIDER_TOKEN}`);
  params.push('mt=8');
  return `${APP_STORE_LISTING_URL}?${params.join('&')}`;
}

export function siteCampaignUrl(tags: CampaignTags): string {
  return `${SITE_URL}/?${utmQuery(tags)}`;
}

/**
 * The link a shared snapshot points to. Each phone platform goes straight to its own store
 * listing, so a friend is one tap from installing and the install is attributed. Anything else
 * gets the site.
 */
export function shareInviteUrl(
  platform: string,
  tags: CampaignTags = SHARE_CAMPAIGN,
): string {
  if (platform === 'android') return playStoreCampaignUrl(tags);
  if (platform === 'ios') return appStoreCampaignUrl(tags);
  return siteCampaignUrl(tags);
}
