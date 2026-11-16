# App Store listing · paste-ready copy and launch plan

The audit (what is wrong now and why) is in [`APP_STORE_ASO.md`](APP_STORE_ASO.md). This file is the fix: the exact text to paste into App Store Connect, in 11 languages, the order to do things in, and what to measure. The Play Store counterpart is [`PLAY_STORE_ASO.md`](PLAY_STORE_ASO.md).

**The text lives in files, one per field:** [`store-listing/app-store/metadata/<locale>/`](store-listing/app-store/metadata/) with `name.txt`, `subtitle.txt`, `keywords.txt`, `promotional_text.txt`, `description.txt` and `release_notes.txt`. Open the file, copy, paste. The folder names are the ones fastlane `deliver` uses, if you ever want to upload instead of paste.

Check the limits any time you edit a file:

```bash
python3 scripts/store-listing/check_app_store_copy.py
```

It checks Apple's limits (name 30, subtitle 30, keywords 100, promotional text 170, description 4000), that no keyword repeats a word from the name or subtitle, that every description has the Terms and Privacy links, and that nothing claims what the app cannot back up.

---

## Do this first: dates matter

| When | What | Why |
|------|------|-----|
| **This week** | Paste the promotional text (any time, no review). Submit **version 1.0.1** with the new name, subtitle and keywords, and the localized listings below | Name, subtitle and keywords only change with a new version. Review takes about a day |
| **By 1 December** | 1.0.1 live | Search ranking needs about two weeks to settle after a keyword change |
| **Mid-December** | Submit the **New Year in-app event** (below) | Events are reviewed like an app. The year-progress searches peak between Christmas and mid-January, and UNTIL is a year-progress app |
| **26 December** | Switch the promotional text to the New Year line | Not indexed, but it is the first thing a visitor reads |
| **15 December and 15 January** | Re-run the ranking check | See "What to measure" |

---

## The fields (English, primary language)

| Field | Text | Chars |
|-------|------|------:|
| Name | `UNTIL: Life Weeks & Time Left` | 29 / 30 |
| Subtitle | `Year progress widgets & watch` | 29 / 30 |
| Keywords | `countdown,days,memento,mori,calendar,percent,lock,screen,birthday,events,goals,tasks,counter,tracker` | 100 / 100 |
| Promotional text (now) | `See how much of today, this year and your life is left, on your Home Screen, Lock Screen and Apple Watch. Free to start.` | 120 / 170 |
| Promotional text (from 26 Dec) | `The year is a number. See how much of it is left, on your Home Screen, Lock Screen and Apple Watch. Free to start.` | 113 / 170 |
| Description | `…/en-US/description.txt` | 2,032 / 4,000 |
| What's new (1.0.1) | `…/en-US/release_notes.txt` | |

Why these words: the title carries the phrases people type where the leaders are weak ("life weeks", "time left"); the subtitle adds year, progress, widgets and watch; the keyword field holds what is left. Apple joins the three fields, so "countdown widget", "life calendar" and "year progress" are all matched. "Countdown" is in the keyword field on purpose: the first results for it have 700 to 192,000 ratings, and a title slot is better spent where UNTIL can reach page one. If you would rather keep it visible, the alternative in the audit doc is `UNTIL: Countdown & Life Weeks`.

**Check the release notes against the build before you submit.** The draft lists the new sign-in screen, the devices list in Account and the refreshed Home with Ember. Edit it to match what 1.0.1 actually contains.

### How the description is built

The first three lines are what people see before "more", so they carry the whole pitch: the question, then the answer, then where it lives. Then widgets (the reason to keep the app), life in weeks (the hook), the watch, free versus Premium, and the 5-day preview with the renewal terms. The Terms and Privacy links are at the bottom, as Apple needs for subscriptions.

**Claims we can back up.** Everything in the text was checked against the app:
- Widgets: Day, Month, Year, Life, Deadline, Counter, Hour timer, Tasks and Next deadlines (`ios/UNTILWidgets/UNTILWidgets.swift`). Day, Month, Year and Life also run on the Lock Screen.
- Free is one deadline and one counter (`FREE_ITEM_LIMIT = 1`); Premium is up to 20 (`PREMIUM_ITEM_LIMIT = 20`) and the Next deadlines widget says "Premium" in the widget gallery.
- The preview is 5 days (`MONETIZATION_TRIAL_DAYS`).
- "No ads": there is no ad SDK in `package.json`, the Podfile or Gradle. **Delete this sentence if an ad SDK is ever added.**
- No prices in the text: they differ by country.
- No user, rating or download counts: there is nothing to quote yet, and the checker blocks them. Add a real number the day there is one.

---

## How it will look: search result and product page header

`docs/store-listing/previews/search-result.png` and `product-header.png` show the live listing next to the new one. Rebuild them after any copy or screenshot change:

```bash
python3 scripts/store-listing/preview_ios.py --before <folder with the live icon.jpg and shot1.jpg … shot3.jpg>
```

Without `--before` it draws only the new column. They are mock-ups: Inter stands in for Apple's font, so truncation is close to, not exactly, what iOS shows.

What the previews show:
- **In search, only the first part of the name is visible.** `UNTIL: Life Weeks & Tim…` against `UNTIL : Countdown & Ti…` now. The words that matter most are the first two after the colon, which is why "Life Weeks" comes first. The full name shows on the product page.
- **The subtitle shows in full in both**, so it is the best place for a second message. The new one adds year, progress, widgets and watch; the old one repeated the app name.
- **Search shows only the first three screenshots**, so slides 1 to 3 do the selling before anyone opens the page: the life grid, the Home Screen widgets, and Home. The old first three had two copies of "Track Your Progress", with a bell and a dartboard that say nothing about the app.
- **The product page leads with the promotional text** (until "more"), which is the line you can change any time without a new version.

---

## Languages

Add these localizations in App Store Connect → the version → the language menu. Each one gets its own name, subtitle and 100-character keyword field, which is extra searchable text in that storefront.

| Priority | Locale | Name | Subtitle |
|:--------:|--------|------|----------|
| 1 | `hi` Hindi | `UNTIL: जीवन के हफ़्ते` | `बचा समय, साल की प्रगति` |
| 1 | `mr` Marathi | `UNTIL: आयुष्याचे आठवडे` | `उरलेला वेळ, वर्षाची प्रगती` |
| 2 | `es-MX` Spanish | `UNTIL: Tu vida en semanas` | `Tiempo restante y widgets` |
| 2 | `de-DE` German | `UNTIL: Dein Leben in Wochen` | `Restzeit, Jahr und Widgets` |
| 2 | `ja` Japanese | `UNTIL: 人生の週と残り時間` | `年の進み具合をウィジェットとWatchで` |
| 2 | `pt-BR` Portuguese | `UNTIL: Vida em Semanas` | `Tempo restante e widgets` |
| 3 | `fr-FR` French | `UNTIL: Vie en semaines` | `Temps restant et widgets` |
| 3 | `ru` Russian | `UNTIL: Жизнь в неделях` | `Остаток времени и виджеты` |
| 3 | `tr` Turkish | `UNTIL: Hayat Haftalarla` | `Kalan zaman ve widget'lar` |
| 3 | `id` Indonesian | `UNTIL: Hidup dalam Minggu` | `Sisa waktu, tahun, widget` |

Notes:
- **Have a native speaker read each one before you paste it.** I wrote them to match the English line by line and checked the limits, but a store page with an awkward phrase converts worse than none. Hindi and Marathi first: India is about half your users. If a language has no reader, skip it; a missing locale simply shows the English page.
- Apple counts characters; Hindi, Marathi and Japanese can count differently from the checker. App Store Connect shows the live count when you paste. The Hindi name and subtitle are short on purpose, so they will fit.
- The Spanish listing is `es-MX` because the US storefront also reads Spanish (Mexico), so it adds searchable text for US Spanish speakers.
- The Hindi and Marathi keyword fields also carry a few English words (`countdown`, `widget`), because many people in India search in English letters.
- Marathi may not appear in App Store Connect's language list; if it does not, the Hindi listing is the one to ship.
- Release notes in the other languages are one line ("Fixes and improvements"). App Store Connect asks for them in every language; replace them if 1.0.1 has something worth saying.
- Apple does not publish which storefront reads which language. Judge by the rank check below, not by assumption.

---

## Screenshots

The old set (see the audit) repeats two headlines, repeats a slide, uses stickers that have nothing to do with the app, and leads with the tasks screen. The new set is one idea per slide, real iOS captures, the app's own dark look.

**Which file goes in which slot.** App Store Connect has one upload slot per device size, and a file of the wrong size is refused with "File dimensions are invalid". That is what happened when the 1320×2868 files went into the medium-display slot. (An earlier version of this doc said one size was enough because Apple scales the 6.9-inch set down. That is wrong for the required medium slot.) Sizes are from Apple's [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/); no alpha channel is allowed in any of them, and all files here are RGB.

| App Store Connect slot | Folder | Size | Needed? |
|------------------------|--------|------|---------|
| iPhone with Dynamic Island (medium display) | `screenshots-ios/1206x2622/` | 1206×2622 (1179×2556 also works) | **Yes.** This is the one iPhone slot App Store Connect requires |
| iPhone with Dynamic Island (large display) | `screenshots-ios/1320x2868/` | 1320×2868 (1260×2736 and 1290×2796 also work) | Optional |
| Apple Watch Series 12 | `screenshots-watch/416x496/` | 416×496 | **Yes**, because the app has a watch app. One size covers Series 12, 11 and 10 |
| iPhone Duo | none yet | 1398×2034 outer, 2007×2853 inner | Not yet. Apple will require them from April 2027 for apps built with the iOS 27.1 SDK or later; they add a "made for iPhone Duo" badge. It needs a layout and a simulator for Duo first |
| iPad 13" display | none | 2064×2752 | Only if the app runs natively on iPad. UNTIL is an iPhone app, so leave it empty |

The paths above are all under `docs/store-listing/`.

**iPhone slides** (4, each in the two iPhone sizes above):

| # | Headline | Shows |
|---|----------|-------|
| 1 | Your *life* in weeks | The Life grid (1,663 of 4,174 weeks) |
| 2 | Time left, on your *Home Screen* | The large Day widget (day, month, year, life) and the small Day widget |
| 3 | Day, year and *life* | Home: today, month, year and life, with today's tasks |
| 4 | *Show up* daily | Streaks and badges ("a missed day is forgiven") |

They come from the iOS Simulator with demo data only (the app's default birth date, no name or e-mail on screen). Rebuild them with `python3 scripts/store-listing/build_ios.py`; how to retake the captures is in [`scripts/store-listing/README.md`](../scripts/store-listing/README.md).

**Apple Watch slides** (4, real captures from a Series 11 46mm simulator, no frame; Apple wants the real watch screen):

| # | Shows |
|---|-------|
| 1 | Today: "9h 52m left today" on the sun arc |
| 2 | November: "14 days left" with the month's dots |
| 3 | 2026: "45 days left" on the year ring |
| 4 | Your life: "48.1 years left of 80" |

Rebuild with `python3 scripts/store-listing/build_watch.py`. The times in the corner differ by a minute or two between captures; Apple does not mind. Retake all four at once if you want them identical.

**Still to capture** (these were planned and could not be taken from the simulator in this pass):

| Slide | Why it is missing | What to do |
|-------|-------------------|------------|
| Lock Screen widgets (and Dynamic Island) | The simulator would not open the Lock Screen editor | Capture on a real iPhone: long-press the Lock Screen, add the Day widget, screenshot. Dynamic Island needs a Live Activity running on a real iPhone 14 Pro or later |
| Countdowns, Counters | The simulator would not focus the text fields, so no demo deadline could be added | Add a deadline ("Product launch") and a counter ("Water") by hand, then capture `Countdowns` and `CustomCounters` |
| Free to start, 5-day preview | The paywall needs the RevenueCat key and App Store products; the simulator has neither | Capture on a real iPhone with a TestFlight build |

Four strong slides are better than seven repeated ones. Add the missing ones to `SHOTS` in `build_ios.py` when the captures exist; the order to aim for is life, Home Screen, Lock Screen, countdowns, free-to-start.

Also worth doing, in this order: an **app preview video** (15 to 30 seconds: the widgets arriving on a Home Screen, then the Life grid), then **Product Page Optimization** to test the first two screenshots against each other.

---

## Header and Search Results assets (App Store Connect > Product Page Information > Header and Search Results)

This tab takes creative assets that sit on top of the product page (header) and in search results. They are not screenshots. Spec from Apple's [creative assets specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications): no transparency in any of them, and key art must stay inside the art safe area.

| File (`docs/store-listing/header-search/`) | Size | Ratio | Where it goes | Art safe area |
|------|------|:-----:|---------------|---------------|
| `universal.png` | 5244×2950, PNG | 16:9 | **Header**, and tick the option to use it in search results too | 1402×962 at (1921, 660) |
| `universal-notext.png` | 5244×2950, PNG | 16:9 | Same, for languages whose headline is not translated yet | same |
| `header.png` | 3840×1646 | 21:9 | Header only, if you want a tighter crop than the universal one | 1646×661 at (1097, 493) |
| `search.png` | 3840×2560 | 3:2 | Search results only | 2168×1030 at (836, 765) |

**Recommended:** upload `universal.png` to Header and use it for search results as well. Apple suggests one universal image to build brand recognition. Then press Preview in App Store Connect to check the crop on every device and in Dark Mode before you submit.

What it shows: one idea, "Your life in weeks". The life grid (lived weeks in orange, the rest dim) runs across the whole canvas, and the real Day widget (day, month, year and life left) sits in the safe area under the headline. It is a real capture of the widget, not a drawing.

Rules from Apple's [asset best practices](https://developer.apple.com/app-store/asset-best-practices/) that the image follows, and that any change should keep:
- One clear idea, a short phrase that adds to the picture, nothing busy.
- No prices or discounts, web addresses, copyright marks, awards, Apple recognitions such as "Editor's Choice", or logos of other platforms.
- The artwork must be fine for a 4+ age rating.
- Localize the words, or use the text-free file.

Notes:
- The headline is English. Use `universal-notext.png` for other languages until each has its own text (Inter has no Hindi, Marathi or Japanese glyphs, so those need a different font).
- If you do not upload a search results asset, search shows your in-app events, app previews and screenshots instead.
- The widget shows the day it was captured ("Mon, 16 Nov", a one-day streak). That is fine for launch; retake `captures-ios/02-home-widgets.png` and rerun `python3 scripts/store-listing/build_header_ios.py` for the New Year version ("Your year in weeks").
- Test it: Product Page Optimization can run the text version against the text-free one.

---

## Free ways to get seen

### In-app event: "New Year, in weeks"
Events show on the product page and in search, and Apple surfaces them in Today. This one fits the app and the season.

| Field | Text | Limit |
|-------|------|------:|
| Name | `New Year, in weeks` | 30 |
| Short description | `See how much of 2027 is already behind you` | 50 |
| Long description | `Set your birth date, see your life in weeks, and put the year's progress on your Home Screen. Free to start.` | 120 |
| Badge | Special Event | |
| Start / end | 26 December 2026 / 10 January 2027 | |
| Image | 1920×1080, the life grid with the year highlighted | |

### Featuring nomination (App Store Connect → Featuring Nominations)
Free, and Apple reads them. Suggested text:

> UNTIL turns time into something you can see: how much of today, this year and your life is left. It puts that on the Home Screen, the Lock Screen, Apple Watch and the Dynamic Island, and shows a life as a grid of weeks. It uses WidgetKit, Live Activities and watchOS. No ads, free to start with a 5-day preview of Premium. It supports 11 languages and launched on 13 November 2026.

Nominate for the New Year window (search "Year progress"), and again for any big update.

### Custom product pages
Two pages, each with its own link, so each audience sees its own first screenshots:
1. **Life in weeks**: screenshots 1, 4, 6 first. Link it from Reddit posts about memento mori and life calendars (`ct=reddit_life`).
2. **Widgets**: screenshots 2, 3 first. Link it from widget and home-screen communities (`ct=widgets`).

Links are built with `appStoreCampaignUrl` in `src/config/storeUrls.ts`.

### Promoted in-app purchase
Promote the yearly plan: it shows on the product page and in search results.

### Ratings
The listing has one rating, in India. A page with stars and a count converts better, and Apple's search results show them. The in-app prompt is `StoreReviewAdapter`; after the next release, ask your first 20 users in person or by message, and reply to every review. Never ask on a count of app opens; ask after a good moment (a badge, a finished countdown).

---

## What to measure

App Store Connect → Analytics: impressions → product page views → downloads (conversion), by source (search, browse, web referrer, campaign). Ratings count and average.

Ranking check (`itunes.apple.com/search`, India and US), on 15 December and 15 January: `time left`, `life in weeks`, `year progress`, `memento mori`, `life progress`, `day progress`, `countdown widget`. Baseline from 15 November is in the audit.

Change one thing at a time. Name and keywords together are one change; screenshots are the next; read each for two weeks before the following one.

---

## Checklist

| Done | Item | Where |
|:----:|------|-------|
| [ ] | Promotional text pasted | App Store Connect, now |
| [ ] | 1.0.1 submitted with name, subtitle, keywords and the `hi` + `mr` listings | App Store Connect, this week |
| [ ] | A native reader checked `hi`, `mr`, `es-MX`, `de-DE`, `ja`, `pt-BR` | you, before pasting |
| [ ] | New iPhone screenshots uploaded to the medium-display slot (`1206x2622`), optionally the large slot (`1320x2868`); old ones removed | App Store Connect |
| [ ] | Apple Watch screenshots uploaded to the Series 12 slot (`screenshots-watch/416x496`) | App Store Connect |
| [ ] | Lock Screen, countdowns and free-to-start slides captured and added | design, real iPhone |
| [ ] | Header and Search Results: `header-search/universal.png` uploaded, Preview checked on every device and in Dark Mode | App Store Connect |
| [ ] | Provider token pasted into `APP_STORE_PROVIDER_TOKEN` and `appStoreCtaUrl` | code, 2 files |
| [ ] | New Year event submitted | mid-December |
| [ ] | Featuring nomination sent | App Store Connect |
| [ ] | Custom product pages and Product Page Optimization test set up | App Store Connect |
| [ ] | Promoted in-app purchase set to the yearly plan | App Store Connect |
| [ ] | First 20 ratings | you |
| [ ] | Ranking check on 15 December and 15 January | code |
