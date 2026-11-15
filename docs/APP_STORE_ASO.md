# App Store audit and ASO plan — 2026-11-15

What the live listing says today, how it ranks, who it competes with, and what to change. The Google Play counterpart is [`PLAY_STORE_ASO.md`](PLAY_STORE_ASO.md). The paste-ready copy, languages and launch plan that fix this audit are in [`APP_STORE_LISTING.md`](APP_STORE_LISTING.md).

Sources: Apple's public lookup and search endpoints (`itunes.apple.com`, India, US, UK, Germany, Canada, Australia), the public App Store page, the 7 live screenshots, the repo, and the live website. Rankings are a snapshot from Apple's search endpoint, not from inside the App Store app, and the app is two days old, so treat positions as a baseline, not a verdict.

## The listing today

| Field | Live value | Note |
|-------|-----------|------|
| App | UNTIL : Countdown & Time Left, id `6813366004`, bundle `com.developernick.until` | Live since 13 Nov 2026, version 1.0 |
| Seller | Nikhil Kubde | Individual account |
| Category | Productivity (primary), Lifestyle | |
| Price | Free, with in-app purchases | |
| Title | `UNTIL : Countdown & Time Left` (29/30) | Targets "countdown", the hardest keyword in the category |
| Subtitle | `UNTIL Track day, life progress` (30/30) | Repeats the app name, so 6 of 30 characters are wasted |
| Ratings | 1 in India (5 stars), 0 in every other storefront | |
| Screenshots | 7 iPhone, none for iPad. The page says "Designed for iPhone" | No app preview video |
| Languages declared | 11 (EN, FR, DE, HI, ID, JA, MR, PT, RU, ES, TR) | The app is translated; the store text I can see is English only |
| Description | 1,207 characters, no ratings or proof | Not indexed for search on iOS; it only has to convert |

## How it ranks (top 200, Apple search endpoint)

| Search | India | US |
|--------|:-----:|:--:|
| time left | 47 | not in top 200 |
| memento mori | 76 | not in top 200 |
| until | 129 | not in top 200 |
| year progress | 151 | not in top 200 |
| life progress | 181 | not in top 200 |
| day progress | 183 | not in top 200 |
| countdown, countdown widget, days until, days left, event countdown, birthday countdown | not in top 200 | not in top 200 |
| life in weeks, life calendar, time widget, lock screen widget, time awareness | not in top 200 | not in top 200 |

## Who it competes with

- **"countdown" is closed.** The first results have 700 to 192,000 ratings (Countdown: 192,000; Countdown@: 41,000; Countdown Buddy: 26,000). A new app with one rating will not move up there.
- **The niche is open.** For "life in weeks", "year progress", "memento mori" and "time left" the leaders have between 0 and 260 ratings, for example Time Left • Be Present (256 in the US), Left: Widgets for Time Left (258 in India), Life Widget - Time Progress (30). This is where UNTIL's Life view, Apple Watch and Dynamic Island are ahead of what is there.
- The category mix is Lifestyle, Productivity and Utilities. Widgetsmith (780,000 ratings) shows that people do search for widgets by name.

So: stop spending the title on "countdown", own "life / weeks / year / time left / widgets", and keep "countdown" in the hidden keyword field.

## What to change

### 1. Name, subtitle and keywords (needs a new app version to take effect)

| Field | Proposed | Length |
|-------|----------|-------:|
| Title | `UNTIL: Life Weeks & Time Left` | 29 |
| Subtitle | `Year progress widgets & watch` | 29 |
| Keywords | `countdown,days,memento,mori,calendar,percent,lock,screen,birthday,events,goals,tasks,counter,tracker` | 100 |

Why: the title now carries the low-competition phrases people use (life weeks, time left); the subtitle adds year, progress, widgets and watch without repeating a title word; the keyword field holds what is left, with no word repeated from the title or subtitle and no spaces after commas. Apple builds phrases from the title, subtitle and keyword field together, so "countdown widget" and "life calendar" are still matched.

If you would rather keep "Countdown" visible in the title: `UNTIL: Countdown & Life Weeks` (29), and move `time left` into the subtitle: `Time left on your Home Screen` (29). That gives up "weeks" and "widgets" in the visible text and keeps you in the hardest search.

Promotional text (170 characters) can be changed any time without a new version, and is not indexed. Use it for the launch line, for example: `Your life in weeks, on your Home Screen, Lock Screen and Apple Watch. Free to start, with a 5-day Premium preview.`

### 2. Screenshots (the first three decide most installs)

What is wrong now: two slides say "Track Your Progress." and two say "See Your Time."; slide 7 is slide 5 again; stickers (bell, dart, rocket, tick, heart, flame) have nothing to do with the app; slide 1 leads with the tasks screen instead of the main idea; the text is small and low contrast; no iPad set; no video.

Proposed order, one idea per slide, large white text, no stickers:

1. **Your life in weeks.** The life grid.
2. **Day, year and life on your Home Screen.** The widgets.
3. **Lock Screen and Dynamic Island.** (Premium)
4. **Apple Watch: today's % on your wrist.**
5. **Share a snapshot.**
6. **Countdowns to what matters.**
7. **Free to start. 5-day Premium preview.**

Also: add a 15 to 30 second app preview video (the widgets arriving on a Home Screen, then the Lock Screen), and either add iPad screenshots or mark the app iPhone only, so the page stops saying "Designed for iPhone" if iPad is supported.

### 3. Ratings (the single biggest trust signal)

One rating in India, none elsewhere. Search results show stars and counts, and a page with none converts worse.
- In the app: set `IOS_APP_STORE_ID = '6813366004'` in `src/config/storeUrls.ts` (it is empty, so "Rate on the App Store" does nothing on iPhone), open `https://apps.apple.com/app/id6813366004?action=write-review` from Settings, and ask for a review after a good moment (a badge, a finished countdown), never on app-open count.
- Ask TestFlight testers and friends in the first week. Reply to every review.

### 4. Translate the store page

The app already has 10 other languages; the store text is English only. India is about half your users, so Hindi (and Marathi) first, then Spanish, German and Japanese. Each language gets its own title, subtitle and 100-character keyword field, which is extra searchable text for each storefront.

### 5. The website sends iPhone visitors nowhere

- The home page says **"App Store · Coming soon"** with no link, two days after launch. Replace it with a real button to `https://apps.apple.com/app/id6813366004`.
- `SITE_CONFIG.appStoreUrl` in `website/src/domain/config.ts` is a placeholder (`…/id000000000`, which answers 404).
- No Smart App Banner. Add `<meta name="apple-itunes-app" content="app-id=6813366004">` so iPhone Safari offers the app at the top of the page.
- No `sitemap.xml` or `robots.txt` (both 404), no social preview image, and the page description mentions Wear OS but not iPhone or Apple Watch.

### 6. Tracking where downloads come from

Use App Store campaign links (`?pt=<provider token>&ct=<campaign>&mt=8`) per channel, and read them in App Store Connect → Analytics → Campaigns. The shared-snapshot link on iPhone currently goes to the website; once the button above exists, point it to the App Store link with `ct=share`. Details are in [`ATTRIBUTION.md`](ATTRIBUTION.md).

### 7. Free ways to get seen

- **Featuring nomination** in App Store Connect (free): Apple Watch, widgets, Lock Screen and Dynamic Island are the things Apple features.
- **Promoted in-app purchase**: show the yearly plan on the product page and in search.
- **Product Page Optimization**: A/B test the icon and the first screenshots (up to three variants).
- **Custom Product Pages**: one page for "life in weeks" visitors and one for "widgets" visitors, each with its own link for the right channel.
- **Apple Search Ads Basic**: pay per install with a monthly cap. Try it only on the niche phrases above, with a small budget, and read the cost per install before spending more.

### 8. Launch week

The first week sets the ranking baseline. Post where the audience already is (r/getdisciplined, r/lifehacks, Product Hunt, short videos of the life grid and the widgets), each with a tagged link, and ask for a rating from everyone who likes it.

## Checklist

| Done | Item | Who |
|:----:|------|-----|
| [x] | Replace "App Store · Coming soon" on the website with the real link; fix `appStoreUrl`; add Smart App Banner, sitemap, robots, preview image | code (done) |
| [x] | Set `IOS_APP_STORE_ID`; Settings "Rate" opens the write-review link; iPhone share link uses the App Store link with `ct=share` | code (done) |
| [ ] | Paste the App Store provider token into `APP_STORE_PROVIDER_TOKEN` (`src/config/storeUrls.ts`) and `appStoreCtaUrl` (`website/src/domain/config.ts`) so Connect groups downloads by campaign | you, then code |
| [ ] | New title, subtitle and keywords in the next app version (1.0.1) | App Store Connect |
| [ ] | Promotional text (any time) | App Store Connect |
| [ ] | Rebuild the 7 screenshots in the new order; add video; iPad set or iPhone-only | design |
| [ ] | Hindi and Marathi store listing, then Spanish, German, Japanese | App Store Connect |
| [ ] | Promoted in-app purchase, featuring nomination, Product Page Optimization test | App Store Connect |
| [ ] | First 20 ratings from testers and friends; reply to every review | you |
| [ ] | Re-run the ranking check 2 weeks after the title change | code |

## What to measure

App Store Connect → Analytics: impressions → product page views → downloads (conversion), by source (search, browse, web referrer, campaign); ratings count and average; Search rank for `time left`, `life in weeks`, `year progress`, `memento mori`, `life progress`, `countdown widget` on the 1st and 15th of each month.
