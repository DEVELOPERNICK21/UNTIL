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

The old set (see the audit) repeats two headlines, repeats a slide, uses stickers that have nothing to do with the app, and leads with the tasks screen. The new set is one idea per slide, in this order:

| # | Headline | Shows |
|---|----------|-------|
| 1 | Your life in weeks | The Life grid |
| 2 | Day, year and life on your Home Screen | The widgets |
| 3 | On your Lock Screen | Lock Screen widgets |
| 4 | Countdowns to what matters | Deadlines |
| 5 | Tap to count anything | Counters |
| 6 | Today's % on your wrist | Apple Watch |
| 7 | Free to start. 5-day Premium preview | The Premium screen |

How they are made, and how to redo them, is in [`scripts/store-listing/README.md`](../scripts/store-listing/README.md) (App Store section). They are real captures from the iOS Simulator at 1320×2868 (the iPhone 17 Pro Max, Apple's 6.9-inch size), with no real name, e-mail or birth date on screen. Apple scales them down for smaller iPhones, so one size is enough.

Also worth doing, in this order: an **app preview video** (15 to 30 seconds: the widgets arriving on a Home Screen, then the Lock Screen, then the Life grid), then **Product Page Optimization** to test the first two screenshots against each other.

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
| [ ] | New screenshots uploaded, old ones removed | App Store Connect |
| [ ] | Provider token pasted into `APP_STORE_PROVIDER_TOKEN` and `appStoreCtaUrl` | code, 2 files |
| [ ] | New Year event submitted | mid-December |
| [ ] | Featuring nomination sent | App Store Connect |
| [ ] | Custom product pages and Product Page Optimization test set up | App Store Connect |
| [ ] | Promoted in-app purchase set to the yearly plan | App Store Connect |
| [ ] | First 20 ratings | you |
| [ ] | Ranking check on 15 December and 15 January | code |
