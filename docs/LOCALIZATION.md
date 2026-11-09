# UNTIL — Localization

The app speaks 11 languages: English (source), Hindi, Marathi, Spanish, German, French, Brazilian Portuguese, Indonesian, Russian, Turkish and Japanese. Code lives in `src/shared/i18n/`.

## How the language is chosen

1. The language saved from **Settings → Language** (`STORAGE_KEYS.SETTINGS_LANGUAGE`, owned by `languagePreference.ts`).
2. Otherwise the phone's language list: `Settings.get('AppleLanguages')` on iOS, `I18nManager` locale on Android, then `Intl` (`deviceLocale.ts`). The first language we ship wins; any Portuguese maps to `pt-BR`.
3. Otherwise English.

`initI18n()` runs in the root `App.tsx` before the first render. "Match phone language" is a saved choice too (`system`), so it keeps following the phone.

## Using it

```tsx
import { useTranslation } from '../../../shared/i18n/useTranslation';

const { t, formatNumber, formatDate } = useTranslation();
<Text>{t('settings.profile.lifeComplete', { percent: 42 })}</Text>
```

- **Components** call `useTranslation()` (it re-renders them when the language changes) and use the returned `t`. `t`, `formatNumber` and `formatDate` from the hook get a new identity per language, so list them in the deps of a `useMemo` / `useCallback` that builds translated text; otherwise it keeps the old language.
- **Domain, services and anything the desktop app imports** use `import { t } from '.../shared/i18n/translate'`. That module is pure: no React, no storage, no packages, so it passes the domain-purity and desktop-boundary tests. Do not import the `shared/i18n` folder index there; it loads MMKV and React Native.
- Never build a sentence out of translated pieces when a word order could differ; give the whole sentence a key with placeholders.
- A sentence with tappable phrases marks them with square brackets in the message (`Use [monthly goals] to repeat tasks.`). Components read them with `parseLinkedText()` (several phrases, e.g. the terms and privacy line) or `splitLinkedText()` (exactly one) from `linkedText.ts`; `stripLinkMarkers()` gives the plain text for an accessibility label. The locale test fails if a translation drops or adds brackets.
- Module-level label tables (task categories) and copy constants (`accountCopy.ts`) are functions, never constants built at import time.
- Paywall sentences that mix words with store prices or dates are built in `src/config/paywallCopy.ts` from `premium.*` messages. Store prices are passed in as `{{price}}` exactly as the store formatted them; never translate or reformat them. A sentence that contains a day count has its own plural keys (Russian needs different endings per sentence), so do not share a "3 days" fragment between sentences.
- Notification text is built when the reminder is scheduled, so it holds the language active then. `src/app/notificationLanguageSync.ts` (started from the root `App.tsx`) schedules retention, task and deadline, presence-streak and day-2 reminders again when the language changes; the trial reminders do the same in `useTrialEndingReminder`. Scheduled reminders carry fixed ids so the new text replaces the old. Android notification channel names are translated too.
- Error messages thrown from domain or data code (`mapAuthError`, `AgeGateError`) call `t()` where the error is created, so they use the language active at that moment.
- Text that must follow the active language cannot sit in a module-level constant. Make it a function (see `quizContent.ts`).
- A badge is defined by message keys, not text: `titleKey`, `descriptionKey` and optional `descriptionParams` in `badgeCatalog.ts` point at `badges.items.<id>.title` / `.description`. Resolve them with `badgeTitle()` / `badgeDescription()` from `ui/badgeLabels.ts`, passing the component's `t`. Progress ("5 of 7 days") uses plural keys keyed on the target, so Russian gets the right case after "из".
- Format numbers and dates with `formatNumber` / `formatDate`, not `toLocaleString()`. They use the active language and force Latin digits (Marathi and Hindi would otherwise print Devanagari numerals).

## Messages

Flat JSON in `src/shared/i18n/locales/<code>/<namespace>.json`, namespaces `common`, `nav`, `home`, `settings`, `onboarding`, `tasks`, `account`, `premium`, `notifications`, `countdowns`, `counters`, `badges`, `widgets`, `share`, `system` (the update sheet and the crash screen), `ember` (Ember's tips, time-left lines and screen reader text), `reflections` (the Home time coach card and its daily and weekly messages), `detail` (the Today, This month, This year and Your life screens, plus the tasks preview), `engagement` (the feature tour and morning reminder prompts), `activity` (the lost-time card). Keys are `namespace.group.name` and are typed from the English files, so a misspelled key fails `tsc`.

- Placeholders: `{{name}}`. A numeric `count` is grouped by the language (`14,220`).
- Plurals: pass `count` and write `key_one`, `key_other`, plus `_few` / `_many` where the language needs them (Russian). Which forms each language needs is `PLURAL_CATEGORIES` in `plural.ts`.
- A key missing from a language falls back to English; a key missing everywhere prints the key.

`__tests__/i18nLocales.test.ts` fails if any language lacks a key or plural form, has an extra key, has an empty message, or changes the placeholders.

## Adding a string

1. Add the key to `locales/en/<namespace>.json`.
2. Add it to every other language's file. `tsc` and the parity test tell you what is missing.
3. Use `t('your.key')`.

A new namespace is one more JSON per language plus one `import` and one spread line in each `locales/<code>/index.ts`. Keep it that way: `resources.ts` stays small and under the file-length limit.

## Adding a language

1. Add it to `SUPPORTED_LANGUAGES` (`languages.ts`) with its name in its own script, and to `PLURAL_CATEGORIES` (`plural.ts`) with a `pluralCategory` case.
2. Create `locales/<code>/{common,nav,home,settings,onboarding,tasks,account,premium,notifications,countdowns,counters,badges,widgets,share,system,ember,reflections,detail,engagement,activity}.json`, list them in `locales/<code>/index.ts` (copy another language's) and register that index in `resources.ts`.
3. Add the code to `CFBundleLocalizations` in `ios/UNTIL/Info.plist`. Without it iOS keeps native UI (date pickers, share sheet) in English and hides the language from the per-app language setting.
4. Right-to-left languages (Arabic, Hebrew, Urdu) also need layout work (`I18nManager.forceRTL`, start/end styles); the current screens use left/right styles.

## Not translated yet

Settings, Home (tiles, hero, tab/header titles), the onboarding quiz, demos, results and life-weeks screens, the tasks area (today's tasks, move sheet, monthly goals, goal detail, task report), the countdowns and counters area (deadlines screen, Home countdown card, "N days left" labels, custom counters screen with its counter cards, reset and remove dialogs, and the free-plan upgrade prompt shown when the limit is reached), the account area (account screen, sign-in prompt, email form, device list, identity setup, auth error messages, age check and the terms/privacy line), the premium area (paywall, plan cards, renewal and cancellation terms, preview/trial modals, student verification, restore and purchase alerts), the badges area (badge names and descriptions, badges screen, Home badge shelf, unlock overlay, today's quests and their progress labels) and the widgets area (Widgets screen, add-to-home-screen rows, widget customization and its Premium alerts, widget preview, Dynamic Island / Live Island screen and its status messages, hour calculation screen and its reset dialog, the widget coach modal and the "add it by hand" alert), the share area (Share snapshot screen with its alerts, the share caption, the "Your countdown reached today" prompt) and the system messages (the update sheet, the iOS store update dialog, the crash screen), Ember (the tip pools for every screen, streak lines, the personalized tips from the quiz, the "time left today" lines and Ember's screen reader label) the reflections (the Home time coach card, the daily and weekly messages and the birth date prompt) and the last screens (the Today, This month, This year and Your life screens, the splash screen, the feature tour and morning reminder prompts, the lost-time card, the "UNTIL on Mac & Windows" offer, the tasks preview screen and Ember's tap hint) are done. Still English: the native widgets, Live Activity, Wear OS and watch targets. Store listings are separate.

Convert a whole screen at a time, including its `Alert` dialogs; a screen that is half translated reads worse than one that is all English.

Translations were written without a native reviewer; have a speaker read them before a release, Marathi and Hindi first.

Firebase's own error text (for codes the app does not map) and the internal "did not return a user / token" errors stay English.
The RevenueCat setup hints shown when plans fail to load ("Rebuild the app after setting REVENUECAT_API_KEY_*…") and the license-check codes are developer diagnostics and stay English. The native RevenueCat paywall and the store's own purchase sheet follow the phone's language, not the in-app choice. A day-2 nudge or trial reminder scheduled by an app version from before this change has no id, so a language change does not rewrite the day-2 one (the trial ones are found by their channel and replaced).

Countdown and counter dates now use the language's own format (`11 Nov 2026`, `11 नव॰ 2026`) instead of `2026-11-11`; the stored value is still `YYYY-MM-DD`. The iOS date picker is given the app language as its `locale` (not checked on a device); Android's picker always follows the phone. The widget install hints (`counters.hint.*`) keep the English widget names `Counter` and `Until`, because the native widget labels are still English; change them together once the widgets are localized.
Widgets and badges, things to know:

- Eyebrow labels (`widgets.section.*`, `widgets.custom.section.*`) are stored in capitals and shown as written; `__tests__/i18nWidgetBadgeCopy.test.tsx` fails if a cased language stores one in lower case. Hindi, Marathi and Japanese have no case.
- The long-press steps (`widgets.hint.*`, `widgets.hour.hint.*`, `widgets.coach.hintAndroid`) keep the English native widget names (`Until`, `Hour calculation`, `Day`) because the widget gallery labels are still English; change them together once the native widgets are localized. "Dynamic Island", "Live Island" and "AMOLED" stay in Latin script everywhere.
- Preset widget messages (`widgets.custom.preset.*`) are copied into the widget as plain text. A preset chosen in one language is therefore not highlighted after the language changes, and the widget keeps showing the saved text.
- The hour timer's default title `Hour timer` is stored by `data/WidgetSync.ts` (and read by the native widget), so it stays English there; the screen only uses `widgets.hour.defaultTitle` when the user saves an empty title. The widget preview now shows `42% of time used` (the `%` was missing before).
- Badge dates use the language's own format (`formatEarnedDate`, Latin digits). The task-count helpers moved to `features/badges/domain/badgeStats.ts` to keep `badgeCatalog.ts` small.

Share and updates, things to know:

- **The share image is drawn with the bundled Inter font, which has no Devanagari or Japanese.** `shareImageLanguage()` (`features/share/ui/`) therefore draws the image, and the preview card that shows it, in English for Hindi, Marathi and Japanese; every other language is drawn in its own language (Latin and Cyrillic are covered). The buttons, alerts and the plain-text caption that goes with the image always follow the app language. `__tests__/i18nShareUpdateCopy.test.tsx` reads the font's glyph table and fails if any image string needs a character the font lacks. To lift the fallback, bundle a font with those scripts, use it in `ShareSnapshotScreen`, and add the codes to `IMAGE_LANGUAGES`.
- `tIn(language, key, params)` (`translate.ts`) translates into a chosen language instead of the active one; the share image uses it.
- The image sentences are whole sentences per period (`share.quote.day`, `.month`, `.year`, `.life`) because the grammar changes with the noun. Turkish writes "%42 kadarı" to avoid number-dependent suffixes; French, German, Spanish and Russian keep a no-break space before `%`.
- The "built with" line above the logo on the image is a lead-in (`share.watermark`); the preview and the caption use the full phrase (`share.branding`, `share.caption`).
- The update sheet (`UpdateSheet`) is worded by the `system.updateSheet.*` messages; the release notes inside it come from remote config and are shown as written, so they are not translated. The iOS store dialog takes its words when the check runs; Android's flexible update shows Google's own screen.
- The crash screen (`CrashErrorBoundary`) renders a small function component so it follows the language like other screens.

Ember, things to know:

- A tip is translated when its pool is built (`emberInsights.ts`), so a bubble that is already on screen keeps its language until the next tip. Screen reader text and the time-left label are built on render and follow a language change.
- Tip keys are `ember.<Route>.<n>.eyebrow` and `.body`, in the same order as the pools. A few eyebrows are shared (`ember.eyebrow.glance`, `.noRush`, `.stillHere`, `.streak`). `ember.DayDetail.1.body` takes the day-band sentence as `{{line}}`. The unused second sentence of each day band was dropped.
- Streak lines use plural keys with `count` (Russian needs four forms; "Day N" uses `{{day}}` because it has no noun). The size of the streak still picks the wording: 2 to 4, 5 to 13, 14 and up.
- The personalized tips are a whole sentence per quiz answer (`ember.personal.map.*`, `.leak.*`, `.lifeGrid.*`) instead of an answer label dropped into an English sentence, because the grammar around the answer changes between languages. The deep-focus sentence still says "before X% of today is gone" with X the share of the day that is left, as it did before.
- `timeLeftLabel` phrases carry no final full stop, because the screen reader label appends its own sentence after them (German uses `h` and `min` for that reason; `__tests__/i18nEmberCopy.test.tsx` caught a "Std.." there). The mood word in the label (`ember.mood.*`) is spoken, so it is translated; before it said "dawn mood" with the raw band name.
- Ember's name, "UNTIL" and "Island" stay in Latin script. The tips were not checked in the bubble on a device, so Hindi, Marathi and Russian lines that wrap to a third line in the fixed-width bubble are unverified.

Reflections, things to know:

- The daily reflection is saved for the day, so what is saved is not only its text but what the text is made of (`ReflectionCopy`: category, tone, the percent, and for the weekly one the life grid percent and the quiz priority). `GetDailyReflectionUseCase` writes the title and message again in the active language every time it is read, and `useDailyReflection` refreshes when the language changes, so the card follows a language change without making a new reflection (same id, same numbers). A reflection saved by an older version has no `copy` and keeps its saved English text until the next day.
- Each period has a whole sentence for "N% of today has passed" (`reflections.percent.*`, with the message inside as `{{message}}`), because the words around the number change between languages. Turkish writes "%42 kadarı" to avoid number-dependent suffixes.
- The weekly reflection adds up to two sentences from the quiz (`reflections.weekly.lifeGrid`, one `reflections.weekly.protect.*` per answer). They are joined with a space, except in Japanese, which does not use one (`weeklyReflectionMessage`).
- The title is one line and the message two lines on the Home card, so a translation that is much longer than the English is cut off with an ellipsis. Not checked on a device.

The last screens, things to know:

- The live clock on the Today screen (`detail.clock`, "5h 59m 59s") uses short unit letters per language so it fits the half-width cards, and `activity.duration.*` do the same for the lost-time card. Japanese, Hindi and Marathi units take more room; unchecked on a device.
- The morning reminder prompt says "8 am" as text (`engagement.reminder.body`). If the hour in the code changes, change every language's message.
- The splash lines (`system.splash.*`) are stored in capitals for the languages that have them. "Live Island" and "Dynamic Island" (navigator titles) stay in Latin script.
- The Today screen's "Coming soon" alert only appears when `GOALS_FEATURE_ENABLED` is false; it and the tasks preview screen are translated but not shown today.
- Text that comes from a service stays as the service writes it: Firebase's and RevenueCat's own error messages, the RevenueCat setup hints, and the internal fallbacks in the premium data adapters ("Network error", "Purchase failed", "License key is required"). The "Sign-in was cancelled" and "Purchase was cancelled" defaults are never shown, because a cancel is silent.

Paywall text carries billing terms. A native speaker should check `premium.renewal.*`, `premium.disclosure.*` and `premium.preview.*` before release.
