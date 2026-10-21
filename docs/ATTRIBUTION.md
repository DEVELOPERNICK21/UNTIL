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

## iPhone and everyone else

Link to the site with `?utm_source=…&utm_medium=…` (`siteCampaignUrl`). iOS installs are not attributed to the tags through the App Store link; compare site visits to installs by day instead.

## What is already tagged

- Shared snapshots: the caption's link is `shareInviteUrl(Platform.OS)` (Android → Play with `utm_source=share`; others → the site).

## Still to do (website)

The website's own Play button (`SITE_CONFIG.playStoreUrl`) is untagged. Add `utm_source=website&utm_medium=button` to it so visits from the site are separated from organic search.
