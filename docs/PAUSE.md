# Pause

A calm place inside UNTIL for when time feels like too much. A button on Home opens the **Pause hub**: a one-tap quick calm, a handful of evidence-informed practices, and a gentle record of the calm minutes you have given yourself.

UNTIL's whole premise is that time is finite and visible: the life grid, the ticking seconds, "don't waste another week". For some people that motivates. For people already prone to time anxiety it can be the trigger. Pause is the counterweight inside the same app: the same time, held kindly.

## What it is not

- **Not a treatment, and it never says it is.** No app erases anxiety. Pause is a calming tool: slow breathing and grounding can settle the body for a few minutes, and that is all it claims. The words are "a minute to settle", never "cure" or "reduce anxiety". Medical claims also invite store review problems. The closing step always points to real help ([Safety](#safety)).
- **Not a place to collect data.** See [Privacy](#privacy).
- **Not a streak machine.** The gamification is deliberately gentle ([Progress](#progress-gently-gamified)): nothing is locked, nothing is lost by missing a day, nothing nags.

## The hub

```
greeting by time of day
[ I need calm now ]            one tap, 60 s, starts breathing at once
For right now                  one practice picked for the hour
Today ring + level + week      calm minutes, no streak
All practices                  each card shows its breath curve and how good the evidence is
Milestones                     six permanent medals
```

- **Quick calm** starts the best-evidenced practice (cyclic sighing) for one minute with no choices. A stressed mind cannot decide.
- **For right now** suggests by hour: coherent breathing in the morning, box at midday, long exhale in the evening, 4-7-8 at night. It is a suggestion, not a gate.
- Everything is available all the time. Nothing has to be earned: a calming tool behind a progress wall is no use to someone in a bad moment.

## The practices

Evidence is shown on every card, honestly. The labels are "Best evidence", "Good evidence", "Early evidence", "Popular, little research", "Plausible, indirect evidence". The research summary below is from reviews and secondary sources; it has not been re-checked against the primary papers, so treat the wording as a fair summary rather than a citation.

| Practice | Rhythm | Evidence label | Why it is here |
|----------|--------|----------------|----------------|
| Quick calm (cyclic sighing) | two short in-breaths through the nose, one long breath out; 1 min | Best evidence | A small randomized trial (Balban et al., *Cell Reports Medicine*, 2023) found a few minutes a day of cyclic sighing lifted mood and lowered breathing rate more than mindfulness meditation. The only practice here with a randomized comparison. |
| Slow breathing (coherent) | about 5.5 breaths a minute, 5.5 s in and 5.5 s out | Good evidence | Resonance-frequency breathing steadies heart-rate variability; reviews and meta-analyses link slow breathing to lower stress and anxiety scores. |
| Box breathing | 4 in, 4 hold, 4 out, 4 rest | Early evidence | Widely used for focus and composure under pressure; direct trials are few. |
| Long exhale | 4 in, 6 out | Good evidence | A longer out-breath than in-breath is the part most associated with the calming (parasympathetic) response. |
| Wind down (4-7-8) | 4 in, 7 hold, 8 out | Popular, little research | Very popular for sleep; almost no direct research. Shown honestly so nobody over-trusts it. Long holds can feel uncomfortable, so it is not the default for anyone. |
| Ground yourself (5-4-3-2-1) | name 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste | Plausible, indirect evidence | A grounding technique used in therapy to pull attention to the present; the evidence is indirect. Good when breathing makes someone feel worse. |

Every breath practice runs on a pure, phase-based engine (`domain/breathing.ts`): each technique is a list of phases (inhale, hold, exhale, rest) with a duration and a start and end fullness. The ring, the orb and the on-screen word are all drawn from `breathAt(elapsedMs, id)`, so the same code drives the rhythm for every practice and is fully unit-tested on a fake clock. Sessions round up to a whole number of breaths so a session never stops mid-inhale.

Lengths: 1, 3 or 5 minutes for breathing, 2 minutes for grounding.

## One session

```
ready  ->  practise  ->  check in  ->  what feels heavy?  ->  one small step  ->  close
```

| Step | What happens | Why |
|------|--------------|-----|
| Ready | Practice name, an honest evidence pill, a length (1/3/5 min), Start. **Skipped for Quick calm**, which starts breathing at once. | One decision at most. |
| Practise | A ring that fills as the session goes, a glowing orb that swells and settles with each phase, one word ("In", "Hold", "Out") and the seconds left of that phase. "Continue" appears after one full breath, so leaving early is always possible. | The phase is shown three ways (shape, word, number) so it works with the screen half-seen. |
| Check in | "How is it now?" A bit calmer, About the same, Still tight. | One question, three answers. |
| (Still tight) | One more, gentler round (box and the others switch to slow breathing; slow breathing switches to the long exhale). Still tight after that: moves on, and the closing step points to real help. | Never a loop. Never a dead end. |
| What feels heavy | Too much to do, Time is running out, Something is coming up, I can't switch off tonight, Not sure. Or Skip. | Only now does it ask about the cause. |
| One small step | **Too much to do**: pick one of today's open tasks, "give it ten minutes". The other four: say the feeling back kindly, one thing to do with it. | The cure for a pile is one thing. Only UNTIL knows the person's tasks. |
| Close | "That's enough for now." The calm minutes just earned, any new milestone, the chosen task said back. A small "talk to someone" line is always there; after two tight rounds it becomes a full card. | Ends quietly. |

The logic is pure and tested: `domain/breathing.ts` (rhythm), `domain/practices.ts` (the catalogue and which suits the hour), `domain/pauseFlow.ts` (steps).

## Progress, gently gamified

All of this is computed from **counts** (seconds, a day key, which practices were tried). Nothing about how someone felt is ever stored.

- **Calm minutes.** Seconds actually practised, shown as minutes (rounded to the nearest minute, at least 1 if anything was done). Sessions under 20 s are ignored.
- **Today ring.** A daily goal of 3 calm minutes. When the *displayed* minutes reach the goal the ring turns gold; the number and the ring always agree.
- **Levels** from total calm minutes: Settling (0), Steady (10), Still (30), Deep (75), Tranquil (150). A level only ever goes **up**.
- **Week dots.** Monday-first dots for the days practised this week. Not a streak: a missed day just means an empty dot, and the card says so ("No streaks. Miss a day and nothing is lost.").
- **Six permanent milestones**, shown as medals: First breath, Five sessions, Ten sessions, Explorer (tried every practice), Three days this week, Night calm (a session after 9 pm or before 5 am). Earned once, kept forever, never taken away.
- Deliberately absent: streaks, lost progress, leaderboards, countdowns, locked content, push nagging, confetti.

The logic is `domain/pauseProgress.ts`: `recordSession`, `levelFor`, `weekDays`, `secondsToday`, `newMilestones`, `calmMinutes`, `goalReached`, `sanitizeProgress`. It only keeps the last 120 days of per-day seconds.

## Privacy

- **What is stored, on this phone only:** one JSON value (`pause.progress` in MMKV, see `shared/persistence/schema.ts`) holding per-day practised seconds, total seconds, the session count, which practices were tried, and which milestones were earned. It is never sent anywhere. Uninstalling the app removes it.
- **What is never stored or sent:** how the person said they felt, what felt heavy, which task they picked, the round. These live only in the screen's memory and are gone when it closes. Do not add them to storage or to analytics: that would be health-adjacent data, and the point of the screen is that it is safe to be honest on it.
- **Two anonymous analytics events:** `pause_started` and `pause_completed`, with no parameters.
- The closing line says so: "Your answers here aren't saved or shared. Only your calm minutes stay on this phone." Keep that true.
- The stored shape is read tolerantly (`sanitizeProgress`): a corrupt or old value falls back to empty progress instead of crashing.

## Safety

- "If this feels bigger than stress, talk to someone" is always on the last step. After two rounds of "still tight" it becomes a full card with a button.
- It opens https://findahelpline.com/ (`config/helpDirectory.ts`), a directory that finds the right helpline for the country. **We do not list phone numbers ourselves**: they differ by country and change. Check that address, and that it serves your users' countries, before each release.
- The copy is written in 11 languages. It is a sensitive screen: have a native speaker read all of it, especially the Hindi and Marathi, before this reaches a wide audience.
- Breath holds (box, 4-7-8) show their evidence level on the card and on the ready step, and "Continue" is available after one full breath. The close button is always on screen, so anyone who feels uncomfortable can leave at once. There is no on-screen "breathe normally if lightheaded" line yet; adding one (and having it reviewed in every language) is a sensible follow-up.

## Accessibility

- **Reduce Motion**: the orb stays still; the progress ring and the words carry the rhythm.
- Screen readers hear each phase word as it changes.
- Every button has a label; the radio list of tasks has radio roles and selected state; the "pick one first" message is a live region.
- Large type, one instruction at a time, tap targets of at least 44 points. The evidence level is written as text, never colour alone. Contrast of the calm palette has not been measured with a tool; do that before a wide release.

## Keeping the screen on

A breathing exercise is useless if the phone locks 30 seconds in. While a practice is running, the screen is held on, through the existing native bridge (`WidgetBridge.setKeepScreenAwake`): Android sets the window's keep-screen-on flag, iOS turns off the idle timer. It is released as soon as the practice step ends or the screen closes. A build without the native method simply does nothing, and the screen times out as usual.

## Where it is

- Home header, first button (wind icon). Accessibility label: "Pause. A minute to settle."
- Deep links: `until://open/Pause` opens the hub; `until://open/PauseNow` skips the hub and starts the one-minute quick calm (see [One tap from outside the app](#one-tap-from-outside-the-app)). `PauseSession` (practice, optional `instant`) is the session route; it is not deep-linkable.
- Code: `src/features/pause/` (`domain` pure, `data` MMKV repository, `hooks`, `ui`). Composition root: `src/app/di/pause.ts`. It reads today's open tasks through `useOpenTasksToday` from the `tasks` feature (the only dependency; see ARCHITECTURE.md).
- Copy: `pause` namespace in `src/shared/i18n/locales/<code>/pause.json` (all 11 languages).
- The calm colours are local to the feature (`ui/calmPalette.ts`) and do not follow light/dark mode: the hub is always the same dark teal, on purpose, so it feels like a different room.

## One tap from outside the app

A bad moment is not the time to find an app. Three entry points all open `until://open/PauseNow`, which the app turns into the quick calm (cyclic sighing, one minute, no ready step). A second tap while a session is already on screen does not restart it.

| Where | What |
|-------|------|
| Android home screen | "Breathe" widget (3x1, `UNTILPauseWidgetProvider`) |
| Android app icon | Long-press shortcut "Breathe" (`res/xml/shortcuts.xml`) |
| iPhone Lock Screen and Home Screen | "Breathe" widget (`PauseWidget` in `UNTILWidgets.swift`): circular, rectangular, inline and small |

- **Nothing private on the widget.** It carries no minutes, no progress and no feelings, and reads no stored data, so there is nothing to refresh and nothing to leak on a Lock Screen.
- **The name is plain on purpose.** "Breathe", not "Anxiety" or "Panic", so it is fine to leave where other people can see the screen.
- A widget cannot animate; it is only the doorway. The breathing happens in the app.
- The widget text is English only, like the other widgets in the app.
- Not done: iPhone Home Screen quick actions (long-press the icon). They need AppDelegate code and are a sensible follow-up.

## Not in this version, on purpose

- **Haptic pacing.** iOS cannot pace the built-in `Vibration` API; it needs a small native library. Android pulses alone would make the two platforms feel different.
- **Sound.** Needs an audio library and assets, and many people use the app where they cannot play sound.
- **Gentle mode** (hide the ticking seconds, switch reflections to the "Quiet" tone). It touches other screens and deserves its own change.
- **Night mode** (hide every clock until morning), the Apple Watch.
- **A countdown hiding option** for "something is coming up". It needs the countdowns feature and a decision about what "hidden" means for widgets.
- **A year-in-review card** of calm minutes (counts only).

## How to check it

```bash
npx jest __tests__/pauseBreathing.test.ts __tests__/pausePractices.test.ts \
  __tests__/pauseFlow.test.ts __tests__/pauseProgress.test.ts \
  __tests__/pauseProgressStorage.test.ts __tests__/useBreathing.test.tsx \
  __tests__/PauseHubScreen.test.tsx __tests__/PauseSessionScreen.test.tsx \
  __tests__/wavePath.test.ts __tests__/practiceIcon.test.ts __tests__/keepAwake.test.ts
```

On a device: open the Home header button; tap **I need calm now**; breathe for a few seconds; tap Continue; try each answer; open each practice from the hub and check its rhythm (box has holds, 4-7-8 has a 7-second hold); finish a session and check the Today ring and level move; turn on Reduce Motion (Android: set the animation scales to 0; iOS: Settings, Accessibility, Motion); check the screen does not lock during a practice.
