# Pause

A minute to settle when time feels like too much. A button on Home opens a breathing circle; afterwards, and only if the person wants it, one small step that fits what feels heavy.

UNTIL's whole premise is that time is finite and visible: the life grid, the ticking seconds, "don't waste another week". For some people that motivates. For people already prone to time anxiety it can be the trigger. Pause is the counterweight inside the same app: the same time, held kindly.

## What it is not

- Not a treatment, and it never says it is. The words are "a minute to settle", not "reduce anxiety". Medical claims also invite store review problems.
- Not a place to collect data. See [Privacy](#privacy).
- Not gamified: no streak, no confetti, no timer, no upsell, no rating prompt. A countdown is the thing we are trying to take away.

## The flow

```
breathe  ->  check in  ->  what feels heavy?  ->  one small step  ->  close
```

| Step | What happens | Why |
|------|--------------|-----|
| Breathe | Starts on its own. A circle swells (4 s in) and settles (6 s out) for one minute. Nothing to choose. "Continue" appears after one full breath. | A stressed mind cannot decide. A long out-breath is what settles the body; 4 in and 6 out is about six breaths a minute. |
| Check in | "How is it now?" A bit calmer, About the same, Still tight. | One question, three answers. |
| (Still tight) | One more round, slower (5 in, 7 out). Still tight after that: moves on, and the last step points to real help. | Never a loop. Never a dead end. |
| What feels heavy | Too much to do, Time is running out, Something is coming up, I can't switch off tonight, Not sure. Or Skip. | Only now does it ask about the cause. |
| One small step | **Too much to do**: pick one of today's open tasks, "give it ten minutes". The other four: say the feeling back kindly, one thing to do with it. | The cure for a pile is one thing. Only UNTIL knows the person's tasks. |
| Close | "That's enough for now." Says the chosen task back. A small line: "If this feels bigger than stress, talk to someone". | Ends quietly. |

The logic is pure and tested: `domain/breathing.ts` (rhythm), `domain/pauseFlow.ts` (steps).

## Privacy

- **Nothing is stored.** The feature has no storage keys. What someone picked and how they said they felt exist only in the screen's memory and are gone when it closes.
- **Two anonymous events are logged**: `pause_started` and `pause_completed`. They carry no parameters. Do not add the feeling, the weight, the task or the round to them: that would be health-adjacent data, and the point of the screen is that it is safe to be honest on it.
- The closing line says so: "What you picked here isn't saved or shared." Keep that true.

## Safety

- "If this feels bigger than stress, talk to someone" is always on the last step. After two rounds of "still tight" it becomes a full card with a button.
- It opens https://findahelpline.com/ (`config/helpDirectory.ts`), a directory that finds the right helpline for the country. **We do not list phone numbers ourselves**: they differ by country and change. Check that address, and that it serves your users' countries, before each release.
- The copy is written in 11 languages. It is a sensitive screen: have a native speaker read the Hindi and Marathi (and the other languages) before this reaches a wide audience.

## Accessibility

- **Reduce Motion**: the orb stays still and a thin line shows the position in the breath; the words carry the rhythm.
- Screen readers hear each "Breathe in" and "Breathe out" as it changes.
- Every button has a label; the radio list of tasks has radio roles and selected state; the "pick one first" message is a live region.
- Large type, one instruction at a time, tap targets of at least 44 points.

## Keeping the screen on

A breathing exercise is useless if the phone locks 30 seconds in. While the breathing step is showing, the screen is held on, through the existing native bridge (`WidgetBridge.setKeepScreenAwake`): Android sets the window's keep-screen-on flag, iOS turns off the idle timer. It is released when the step ends or the screen closes. A build without the native method simply does nothing, and the screen times out as usual.

## Where it is

- Home header, first button (two rings icon). Accessibility label: "Pause. A minute to settle."
- Deep link: `until://open/Pause`.
- Code: `src/features/pause/`. It reads today's open tasks through `useOpenTasksToday` from the `tasks` feature (the only dependency; see ARCHITECTURE.md).
- Copy: `pause` namespace in `src/shared/i18n/locales/<code>/pause.json`.

## Not in this version, on purpose

- **Haptic pacing.** iOS cannot pace the built-in `Vibration` API; it needs a small native library. Android pulses alone would make the two platforms feel different.
- **Sound.** Needs an audio library and assets, and many people use the app where they cannot play sound.
- **Gentle mode** (hide the ticking seconds, switch reflections to the "Quiet" tone). It touches other screens and deserves its own change.
- **Night mode** (hide every clock until morning), widget and shortcut entry points, the Apple Watch.
- **A countdown hiding option** for "something is coming up". It needs the countdowns feature and a decision about what "hidden" means for widgets.

## How to check it

```bash
npx jest __tests__/pauseBreathing.test.ts __tests__/pauseFlow.test.ts \
  __tests__/useBreathing.test.tsx __tests__/PauseScreen.test.tsx __tests__/keepAwake.test.ts
```

On a device: open the Home header button; breathe for a few seconds; tap Continue; try each answer; turn on Reduce Motion (Android: set the animation scales to 0; iOS: Settings, Accessibility, Motion); switch to dark mode; check the screen does not lock during the breathing step.
