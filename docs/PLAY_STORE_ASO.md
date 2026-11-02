# Play Store listing · paste-ready copy and creative plan

**Title (live):** UNTIL : Countdown & Time Left  
**Positioning:** How much of today, this year and your life is left, on your home screen.

Character limits (Play Console): **title 30 · short description 80 · full description 4000 · what's new 500**.

Assets that go with this copy are in [`docs/store-listing/`](store-listing/): `feature-graphic.png` (1024×500) and `screenshots/01.png … 08.png` (1080×1920), in upload order. They are built from real captures of the app by `scripts/store-listing/` (see the README there). Raw captures are in `docs/store-listing/captures/`.

---

## What was wrong with the old listing (2026-11-01)

| Problem | Why it costs installs |
|---------|----------------------|
| The feature graphic was yellow, the screenshots red and the icon dark. Three colour stories. | The listing looks unfinished, and the first image people see (the graphic) does not match the rest. |
| The graphic's phone was small and cropped; its text could not be read at phone size. | The graphic is the first thing in the listing. If it says nothing, the screenshots never get a look. |
| Screenshot headlines were abstract ("Time, Made Visible") and mixed upper and sentence case. | People decide in about three seconds. A benefit they can picture ("Time left, on your home screen") beats a slogan. |
| The widgets, which are the reason to keep the app installed, were in one screenshot, and small. | Widgets are what bring people back every day. They should lead. |
| Nothing said what is free and what Premium adds, or that there is a free preview. | People who would pay stay away because they cannot tell what they would be buying. |
| The text described features that have since changed (what is free, deadlines, counters, Premium). | A listing that promises what the app does not do earns one-star reviews. |

The old text is in git history (`git log -p -- docs/PLAY_STORE_ASO.md`) in case a store listing experiment wants it back.

---

## Title (≤30)

| Option | Chars | Notes |
|--------|------:|-------|
| `UNTIL: Countdown & Time Left` **(recommended)** | 28 | Same words as today, minus the stray space before the colon. Keeps both search terms. |
| `UNTIL : Countdown & Time Left` *(live)* | 29 | |

---

## Short description (≤80) · pick one

**A · benefit first (recommended)**
```
See how much of today, this year and your life is left. Widgets + countdowns.
```
(77)

**B · trust**
```
Countdown widgets for your day, year and life. Free to start. No ads.
```
(69) — "No ads" is true today (no ad SDK in the app); drop it if that ever changes.

**C · plain**
```
Day, year & life widgets plus countdowns. See your time left. Free to start.
```
(76)

Run A against B as a **store listing experiment** (Grow users → Store listing experiments), 2 weeks, one change at a time.

---

## Full description (≤4000) · paste-ready

```
How much of today is left? Of this year? Of your life?

UNTIL puts the answer on your home screen, so you see it every time you pick up your phone, without opening an app.

HOME SCREEN WIDGETS
• Day: the hours, minutes and % of today that are left, live
• Year: every day of the year as a dot, so you see how far in you are
• Deadline: the days left until the date that matters
• Counter: tap the widget to add +1. Water, pages, workouts, anything
• Tasks: today's list and what is still to do
• Hour timer: tap to start and stop, for work, study or practice
Tap a Day, Year, Deadline or Tasks widget and it opens the matching screen in the app.

COUNTDOWNS THAT KEEP YOU HONEST
Add a deadline (an exam, a launch, a trip, a birthday) and watch the days go down. The widget always shows the one that is nearest. When a date passes, it says so, instead of showing "Today" for ever.

YOUR LIFE IN WEEKS
Set your birth date and see your whole life as a grid of weeks. A calm, plain reminder that time is limited, and that today counts.

MAKE TODAY COUNT
• Daily tasks, with optional reminders when a deadline is close
• Ember, a small companion that reacts to your day
• Streaks and badges for showing up
• A short daily reflection on how much of the day is left
• Share your progress as a picture

FREE
• Day and Year widgets
• Your first deadline and your first counter, with their widgets
• Daily tasks, hour timer, Ember, streaks, badges and sharing

UNTIL PREMIUM
• Month and Life widgets, and the full Life in weeks screen
• Up to 20 deadlines and 20 counters, and a Next deadlines widget that lists the nearest three
• Live Island (Android): a slim floating progress pill over your screen
• Lost-time alerts: a nudge when wasted hours cross your limit
• Widget colours
Try all of it free for 5 days. No payment is taken for the preview, and it does not renew by itself. After that, Premium is a yearly, monthly or weekly subscription, or a one-time purchase. Subscriptions renew until you cancel; cancel any time in Google Play.

Make the time you have left visible. Download UNTIL.
```

Notes before pasting:
- The Wear OS lines were removed from the body. Add them back only if the Wear OS app is live on the Play listing today: *"Wear OS: a Day tile and a watch-face complication show today's % on your wrist."*
- Do not add prices to the text; they differ by country and change.
- The Mac and Windows companion is free. If you want it in the listing, add one line at the end of MAKE TODAY COUNT: *"Also free on Mac and Windows."* (the download page is on the website).

---

## Screenshots · order and headlines

One headline style: **sentence case, five words or fewer**, a benefit, never a slogan. Small line underneath, eight words or fewer. Same background and phone frame on all eight.

| # | Headline | Line under it | Shows |
|---|----------|---------------|-------|
| 1 | Time left, on your home screen | Day, month and your next deadlines | The home screen with three real widgets |
| 2 | See your life in weeks | One calm grid. Every week counts | Life screen |
| 3 | Count down to what matters | Deadlines and a widget for the nearest | Deadlines screen |
| 4 | Your day at a glance | How much of today is left, live | Home |
| 5 | Tap to count anything | Water, pages, workouts. +1 from the widget | Counters screen |
| 6 | Plan today, finish it | Tick them off. See how the day went | Today's tasks |
| 7 | Show up every day | Streaks and badges. A missed day is forgiven | Badges |
| 8 | Try Premium free for 5 days | Month, Life, more deadlines. Cancel any time | Premium: what you keep, free vs Premium |

The first two screenshots carry most of the weight: they are the only ones many people see without scrolling.

**Feature graphic (1024×500):** one idea, readable at thumbnail size: *"How much time is left?"* with *Day · Month · Year · Life* and real widgets. Same warm background as the screenshots.

### Feature graphic experiment: red vs dark

Two graphics with the same words and the same widgets. Only the colour differs, so the result says something about colour and nothing else.

| | File | Look |
|---|------|------|
| A (control) | `feature-graphic.png` | Red-to-orange gradient, white text. Matches the eight screenshots. |
| B | `feature-graphic-dark.png` | The app's own look: near-black `#0E0E10` with the orange accent `#E87C20`. Matches the app, the icon and the website. |

Run it in Play Console → **Grow users** → **Store listing experiments** → **Graphics** (feature graphic). Run it on its own, not at the same time as the short-description experiment, so you know which change did what. Let it run at least two weeks and wait for Play to say the result is statistically significant (about 90% confidence) before switching.

Two honest limits: with 500+ installs and a small number of daily visitors, a small difference will not reach significance. And it measures taps on Install, not how much people use the app afterwards. If B wins, also keep an eye on day-1 and day-7 retention in Play Console.

---

## Search terms to weave in (not stuff)

Play has no keyword field. Relevance comes from the title, the short and full description, and the screenshot text.

| Phrase | Where |
|--------|-------|
| countdown, days left | Title, short description, deadlines |
| time left | Title, first line |
| life in weeks / life calendar | Life section, screenshot 2 |
| year progress | Widgets list |
| home screen widget | First paragraph, screenshot 1 |
| deadline countdown | Countdowns section |

---

## What's new (≤500) · next release

```
• Widgets open the matching screen in the app
• Premium: up to 20 deadlines and counters, plus a Next deadlines widget
• Counters: undo a tap, reset, and choose which one your widget shows
• Hour timer: reset it from the app
• Deadlines count the right number of days when the clocks change
• A new "update available" sheet
```

---

## Social proof (manual · needs your number)

When you have a **verified** count (Play Console active devices, not vanity):

1. Open `src/config/monetization.ts`.
2. Set `PAYWALL_SOCIAL_PROOF.verifiedActiveWatchers` to that integer.
3. Ship a release. The paywall shows the line automatically.

Leave `null` until the number is real. The store rating (5.0 from 9 reviews today) is real and worth keeping: ask for reviews at a good moment in the app (a badge, a finished countdown), never on app open.

---

## After pasting

1. Play Console → **Grow users** → **Store listing** → save.
2. Upload the feature graphic and the eight screenshots from `docs/store-listing/`, in order.
3. Optional: **Store listing experiment**, short description A vs B, 14 days.
4. Cross-check [`PLAY_STORE_GROWTH_CHECKLIST.md`](PLAY_STORE_GROWTH_CHECKLIST.md).

---

## Old listing text (before 2026-11-01)

The previous title options, short descriptions and full description are in git history: `git log -p -- docs/PLAY_STORE_ASO.md`.
