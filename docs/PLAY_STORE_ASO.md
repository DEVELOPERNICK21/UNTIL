# Play Store ASO · listing copy (paste into Console)

**App title (live):** UNTIL : Countdown & Time Left  
**Positioning:** Catch the day before it disappears. Time awareness on your home screen.

Character limits (Play Console):
- **Title:** 30 characters
- **Short description:** 80 characters
- **Full description:** 4000 characters

---

## Title options (≤30 chars)

| Option | Chars | Notes |
|--------|------:|-------|
| `UNTIL : Countdown & Time Left` *(current)* | 29 | Live title |
| `Until: Days left` | 16 | Previous title |
| `Until: Time Left Widget` | 23 | Broader “widget” intent |

**Recommendation:** Keep `UNTIL : Countdown & Time Left` as primary.

---

## Short description (≤80 chars) · pick one

**A · widgets + awareness (recommended)**
```
Life weeks & day widgets. See time left. Catch the day before it’s gone.
```
(73 chars)

**B · memento / urgency**
```
Memento mori on your home screen. Day, year & life progress widgets.
```
(70 chars)

**C · preview lead**
```
Home screen time widgets. 5-day free Premium preview. Day & year stay free.
```
(78 chars)

---

## Full description (paste-ready)

```
Until: Countdown & Time Left shows how much time you have left.

Track how much of today, this month, this year, and your life has passed. Add home screen widgets and Wear OS so progress stays on your phone and wrist.

KEY FEATURES

• Day Progress Widget: Hours, minutes, and % left today, updating in real time.

• Year & Month Tracker: See how much of the month and year is already gone.

• Life Weeks Grid: Your life laid out in weeks.

• Home Screen Widgets: Clean widgets for a quick look at progress.

• Wear OS Time Hub: Open UNTIL on your watch and swipe Day, Month, Year, and Life. Day, Month, and Year run on the watch clock. Life uses your birth date synced from the phone.

• Wear OS Day Tile: UNTIL Day tile shows today’s %. Tap it to open the Time Hub.

• Wear OS Complication: Add UNTIL Day to your watch face for today’s % (short text or ranged value).

• Custom Countdowns: Days left until goals, birthdays, or events.

• Floating Overlay (Android): A small progress bar over your screen.

FREE FEATURES

Day & Year progress views

Basic home screen widgets

Wear OS Time Hub, Day tile, and Day complication

Custom countdown creation

Shareable time progress snapshots

PREMIUM UNLOCKS

Life in Weeks on phone

Month progress & overlay widgets

Full home screen widget customization

Floating ambient time bar

5-day free Premium trial included

WHY VISUALIZE TIME?

See progress on your phone and Wear OS watch without another noisy productivity app.

Use life weeks as a plain daily reminder that time is limited.

Keep day % on a tile or complication so you don’t have to open the app every time.

Download Until: Countdown & Time Left and make remaining time visible.
```

---

## Keyword / search strategy

Primary intents (weave into short + full description, not keyword stuffing):

| Keyword / phrase | Where |
|------------------|--------|
| life weeks widget | Short desc, full, screenshot captions |
| memento mori | Full description, one screenshot |
| time awareness | Full description |
| days left widget | Full + title experiment |
| life progress | Full |
| home screen widget | Short + full |
| year progress | Full |

Play does **not** have a separate keyword field like iOS. Relevance comes from **title, short description, full description, and screenshots**.

---

## Screenshot caption order (suggested)

1. **Day widget:** “Today is still yours”
2. **Life weeks:** “Your life in weeks”
3. **Year:** “How much of the year is gone”
4. **Intervention:** “When lost time crosses the line”
5. **Share:** “built with UNTIL”
6. **Premium:** “Month & Life on your home screen”

Feature graphic: dark background, Ember + day % ring, wordmark **UNTIL**, line: “Catch the day before it’s gone.”

---

## What’s new (next release · paste into Console)

```
• Psychology onboarding: quiz → your time map
• Lost-time alerts: track wasted hours, red nudge at your limit
• Weekly reflection + personalized Ember tips
• Premium widget accent colors (Ocean, Forest, Plum…)
• Student yearly: verify with school email
• Share images say “built with UNTIL”
• Native Month/Life widgets lock correctly after preview
```

---

## Social proof (manual · needs your number)

When you have a **verified** count (Play Console active devices / PostHog MAU, not vanity):

1. Open `src/config/monetization.ts`
2. Set `PAYWALL_SOCIAL_PROOF.verifiedActiveWatchers` to that integer (e.g. `1200`)
3. Ship a release. Paywall shows the social proof line automatically.

Leave `null` until the number is real.

---

## After pasting

1. Play Console → **Grow users** → **Store listing** → save
2. Optional: **Store listing experiment** · short description A vs B for 14 days
3. Cross-check [`PLAY_STORE_GROWTH_CHECKLIST.md`](PLAY_STORE_GROWTH_CHECKLIST.md)
