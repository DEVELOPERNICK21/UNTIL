import {
  SHARE_CAMPAIGN,
  SITE_URL,
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

  it('sends a shared snapshot to the Play listing on Android and to the site elsewhere', () => {
    expect(shareInviteUrl('android')).toBe(
      playStoreCampaignUrl(SHARE_CAMPAIGN),
    );
    expect(shareInviteUrl('ios')).toBe(siteCampaignUrl(SHARE_CAMPAIGN));
    expect(shareInviteUrl('android')).toContain('utm_source%3Dshare');
  });

  it('never points a share at the old domain that has no DNS records', () => {
    expect(shareInviteUrl('android')).not.toContain('until-app.com');
    expect(shareInviteUrl('ios')).not.toContain('until-app.com');
  });

  it('keeps the legal and download links on the one site address', () => {
    expect(LEGAL_URLS.privacy).toBe(`${SITE_URL}/privacy`);
    expect(LEGAL_URLS.terms).toBe(`${SITE_URL}/terms`);
    expect(DESKTOP_DOWNLOAD_URLS.mac).toBe(`${SITE_URL}/download/mac`);
  });
});
