# Attribution — knowing which channel brings paying users

Before this, every user in Firebase was "Direct". Tag every link you post and the Acquisition report (Firebase → Reports → Acquisition → User acquisition, "First user source / medium / campaign") shows where installs, onboarding completions and purchases came from.

## Android: tag the Play link

Play passes the `referrer` value through the install, and Firebase reads it automatically. Build links with `playStoreCampaignUrl` in `src/config/storeUrls.ts`, or write them by hand:

```
https://play.google.com/store/apps/details?id=app.until.time&referrer=utm_source%3D<source>%26utm_medium%3D<medium>%26utm_campaign%3D<campaign>
```

| Where you post it | source | medium | campaign |
|-------------------|--------|--------|----------|
| Instagram bio / story | `instagram` | `bio` or `story` | launch name |
| Reddit post | `reddit` | `post` | subreddit or launch name |
| YouTube description | `youtube` | `description` | video name |
| X / Threads | `x` | `post` | |
| The website's Play button | `website` | `button` | |
| QR code on a poster or video | `qr` | `offline` | place or event |
| A friend's shared snapshot (automatic) | `share` | `snapshot` | `viral` |

Keep names lower case, no spaces. Use the same source and medium spelling every time, or the report splits one channel into two rows.

## iPhone: tag the App Store link

App Store links take a campaign name (`ct`, at most 40 characters). Build them with `appStoreCampaignUrl` in `src/config/storeUrls.ts`, or write them by hand:

```
https://apps.apple.com/app/id6813366004?pt=<provider token>&ct=<source>_<medium>_<campaign>&mt=8
```

App Store Connect only groups downloads by campaign when the link also carries your **provider token**: App Store Connect → Analytics → Campaigns → "Create campaign link" shows it. Paste it once into `APP_STORE_PROVIDER_TOKEN` (`src/config/storeUrls.ts`) and into `appStoreCtaUrl` (`website/src/domain/config.ts`). Until then the links open the app page and carry the name, but Connect cannot report on them.

Anywhere else (a web page, a poster) use the site link: `siteCampaignUrl` (`?utm_source=…&utm_medium=…`).

## What is already tagged

- Shared snapshots: the caption's link is `shareInviteUrl(Platform.OS)`. Android → Play with `utm_source=share`; iPhone → the App Store with `ct=share_snapshot_viral`; anything else → the site.
- Every store button on the website: Play with `utm_source=website&utm_medium=button`; App Store with `ct=website_button`. The pricing buttons send iPhone and iPad visitors to the App Store and everyone else to Play.
