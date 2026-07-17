# Play Store ASO — listing copy (paste into Console)

**App title (live):** Until: Days left  
**Positioning:** Catch the day before it disappears into nothing — time awareness on your home screen.

Character limits (Play Console):
- **Title:** 30 characters
- **Short description:** 80 characters
- **Full description:** 4000 characters

---

## Title options (≤30 chars)

| Option | Chars | Notes |
|--------|------:|-------|
| `Until: Days left` *(current)* | 16 | Keep unless experimenting |
| `Until — Life Weeks Widget` | 26 | Strong keyword play |
| `Until: Time Left Widget` | 23 | Broader “widget” intent |

**Recommendation:** Keep `Until: Days left` as primary. Run a **store listing experiment** with `Until — Life Weeks Widget` as variant if installs stay low.

---

## Short description (≤80 chars) — pick one

**A — widgets + awareness (recommended)**
```
Life weeks & day widgets. See time left — catch the day before it’s gone.
```
(79 chars)

**B — memento / urgency**
```
Memento mori on your home screen. Day, year & life progress widgets.
```
(70 chars)

**C — preview lead**
```
Home screen time widgets. 5-day free Premium preview. Day & year stay free.
```
(78 chars)

---

## Full description (paste-ready)

```
Until: Days left makes time visible — so you spend it on purpose.

See how much of today, this month, this year, and your life has already passed. Put that reality on your home screen as widgets. Glance once. Live the rest.

WHAT YOU GET (FREE FOREVER)
• Day widget & detail — hours, minutes, seconds left today
• Year widget & detail — how much of the year is gone
• Share snapshots — a quiet image of remaining time
• Custom counters & countdowns

PREMIUM (optional)
• Month & Life home screen widgets
• Full life progress & life weeks view
• Floating overlay (Android) / Dynamic Island (iOS) for month & life
• Lost-time intervention alerts — nudge when wasted hours cross your limit
• Widget accent colors
• 5-day free in-app Premium preview (no Google Play charge during preview)

WHY PEOPLE USE UNTIL
• Time awareness without noisy productivity apps
• Life weeks / memento mori — finite life, made glanceable
• Home screen widgets that whisper instead of shout
• Built for India-first pricing with honest cancel in Google Play

HOW IT WORKS
1. Answer a short quiz about where your time goes
2. See your life weeks map
3. Add a Day or Year widget to your home screen
4. Optionally try Premium for 5 days — Month, Life, overlay, and alerts

Privacy-first: no account required for core time tracking. Your birth date and progress stay on your device.

Download Until: Days left — watch your time, don’t waste it.
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

Play does **not** have a separate keyword field like iOS — relevance comes from **title, short description, full description, and screenshots**.

---

## Screenshot caption order (suggested)

1. **Day widget** — “Today is still yours”
2. **Life weeks** — “Your life in weeks”
3. **Year** — “How much of the year is gone”
4. **Intervention** — “When lost time crosses the line”
5. **Share** — “built with UNTIL”
6. **Premium** — “Month & Life on your home screen”

Feature graphic: dark background, Ember + day % ring, wordmark **UNTIL**, line: “Catch the day before it’s gone.”

---

## What’s new (next release — paste into Console)

```
• Psychology onboarding — quiz → your time map
• Lost-time alerts — track wasted hours, red nudge at your limit
• Weekly reflection + personalized Ember tips
• Premium widget accent colors (Ocean, Forest, Plum…)
• Student yearly — verify with school email
• Share images say “built with UNTIL”
• Native Month/Life widgets lock correctly after preview
```

---

## Social proof (manual — needs your number)

When you have a **verified** count (Play Console active devices / PostHog MAU — not vanity):

1. Open `src/config/monetization.ts`
2. Set `PAYWALL_SOCIAL_PROOF.verifiedActiveWatchers` to that integer (e.g. `1200`)
3. Ship a release — paywall shows the social proof line automatically

Leave `null` until the number is real.

---

## After pasting

1. Play Console → **Grow users** → **Store listing** → save
2. Optional: **Store listing experiment** — short description A vs B for 14 days
3. Cross-check [`PLAY_STORE_GROWTH_CHECKLIST.md`](PLAY_STORE_GROWTH_CHECKLIST.md)
