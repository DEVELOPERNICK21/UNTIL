import {
  APP_STORE_LISTING_URL,
  APP_STORE_WRITE_REVIEW_URL,
  IOS_APP_STORE_ID,
  SHARE_CAMPAIGN,
  SITE_URL,
  appStoreCampaignUrl,
  playStoreCampaignUrl,
  shareInviteUrl,
  siteCampaignUrl,
} from '../src/config/storeUrls';
import { LEGAL_URLS, DESKTOP_DOWNLOAD_URLS } from '../src/config/monetization';

describe('campaign links', () => {
  it('carries the tags through a Play install as the referrer', () => {
    const url = playStoreCampaignUrl({
      source: 'reddit',
      medium: 'post',
      campaign: 'launch',
    });
    expect(url).toBe(
      'https://play.google.com/store/apps/details?id=app.until.time&referrer=' +
        'utm_source%3Dreddit%26utm_medium%3Dpost%26utm_campaign%3Dlaunch',
    );
    // The referrer decodes back to ordinary utm parameters.
    const referrer = new URL(url).searchParams.get('referrer');
    expect(referrer).toBe(
      'utm_source=reddit&utm_medium=post&utm_campaign=launch',
    );
  });

  it('leaves the campaign out when there is none', () => {
    expect(siteCampaignUrl({ source: 'instagram', medium: 'bio' })).toBe(
      `${SITE_URL}/?utm_source=instagram&utm_medium=bio`,
    );
  });

  it('sends a shared snapshot to each phone store, and to the site anywhere else', () => {
    expect(shareInviteUrl('android')).toBe(
      playStoreCampaignUrl(SHARE_CAMPAIGN),
    );
    expect(shareInviteUrl('ios')).toBe(appStoreCampaignUrl(SHARE_CAMPAIGN));
    expect(shareInviteUrl('web')).toBe(siteCampaignUrl(SHARE_CAMPAIGN));
    expect(shareInviteUrl('android')).toContain('utm_source%3Dshare');
  });

  it('points the iPhone app at the real App Store listing', () => {
    expect(IOS_APP_STORE_ID).toBe('6813366004');
    expect(APP_STORE_LISTING_URL).toBe('https://apps.apple.com/app/id6813366004');
    expect(APP_STORE_WRITE_REVIEW_URL).toBe(
      'https://apps.apple.com/app/id6813366004?action=write-review',
    );
  });

  it('names the campaign in an App Store link and keeps it within 40 characters', () => {
    expect(appStoreCampaignUrl(SHARE_CAMPAIGN)).toBe(
      'https://apps.apple.com/app/id6813366004?ct=share_snapshot_viral&mt=8',
    );
    const long = appStoreCampaignUrl({
      source: 'instagram',
      medium: 'story',
      campaign: 'launch-week-with-a-very-long-name',
    });
    const ct = new URL(long).searchParams.get('ct') ?? '';
    expect(ct.length).toBeLessThanOrEqual(40);
    expect(ct.startsWith('instagram_story_launch')).toBe(true);
  });

  it('never points a share at the old domain that has no DNS records', () => {
    expect(shareInviteUrl('android')).not.toContain('until-app.com');
    expect(shareInviteUrl('ios')).not.toContain('until-app.com');
    expect(shareInviteUrl('web')).not.toContain('until-app.com');
  });

  it('keeps the legal and download links on the one site address', () => {
    expect(LEGAL_URLS.privacy).toBe(`${SITE_URL}/privacy`);
    expect(LEGAL_URLS.terms).toBe(`${SITE_URL}/terms`);
    expect(DESKTOP_DOWNLOAD_URLS.mac).toBe(`${SITE_URL}/download/mac`);
  });
});
