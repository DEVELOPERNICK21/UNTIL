# Website Ember + Wear OS Copy Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Until marketing site copy so it reflects Ember on Day/Tasks widgets and Wear OS Day %, without redesigning the landing page.

**Architecture:** All marketing strings live in `website/src/domain/copy.ts` (SSOT). The home page and cinematic hero already consume `LANDING_COPY`. This plan only edits copy + meta + one hardcoded blurb moved into SSOT. No new components.

**Tech Stack:** Next.js 14 App Router, TypeScript, existing `LANDING_COPY` domain export

**Spec:** `docs/superpowers/specs/2026-07-14-website-ember-wear-copy-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `website/src/domain/copy.ts` | SSOT for landing/marketing strings |
| `website/src/app/layout.tsx` | Site metadata / Open Graph |
| `website/src/app/page.tsx` | Home page; currently hardcodes screenshots blurb — move to copy SSOT |
| `website/src/components/ui/cinematic-hero.tsx` | Reads `cinematicHero` from copy — **do not edit** unless it ignores SSOT (verify only) |

**Do not modify:** `config.ts` pricing, legal, Header/Footer structure, screenshot assets, `api/update-config`.

---

### Task 1: Refresh feature cards + hero weave in `copy.ts`

**Files:**
- Modify: `website/src/domain/copy.ts`

- [ ] **Step 1: Update `hero.subtitle` and `cinematicHero` descriptions**

Replace these string values in `LANDING_COPY` (keep titles/headlines/taglines unchanged):

```ts
  hero: {
    title: 'See your time.',
    headline: 'Day, month, year, and life - always visible.',
    subtitle:
      'Track progress with Ember, home widgets, Wear OS Day %, deadlines, tasks, and shareable snapshots — glanceable without opening the app.',
    cta: 'Get the app',
  },

  cinematicHero: {
    tagline1: 'See your time,',
    tagline2: 'not just the clock.',
    brandName: 'UNTIL',
    cardHeading: 'Time awareness, redefined.',
    cardDescription:
      'Until shows day, month, year, and life progress with Ember on widgets, Wear OS Day %, deadlines, counters, and daily tasks — always visible when you need a glance.',
    metricValue: 247,
    metricLabel: 'Days Left',
    ctaHeading: 'Start seeing time clearly.',
    ctaDescription:
      'Available on Android now. iOS coming soon. Widgets, Ember, and Wear OS Day % without opening the app.',
  },
```

- [ ] **Step 2: Replace `features` array with six cards**

Exact array:

```ts
  features: [
    {
      category: 'Core',
      title: 'Live day, month, year, life progress',
      description:
        'Real-time progress with left vs passed view so you always know where your time is going.',
    },
    {
      category: 'Widgets',
      title: 'Home + lock screen widgets',
      description:
        'Today, month, year, life, deadlines, tasks, counters, and hour timer — with Ember on Day and Daily Tasks widgets.',
    },
    {
      category: 'Companion',
      title: 'Meet Ember',
      description:
        'A calm companion in the app and on widgets. Ember’s mood follows your day progress — soft presence, not another notification.',
    },
    {
      category: 'Wrist',
      title: 'Day % on Wear OS',
      description:
        'Glance Day % from a Wear OS tile or complication on Android watches. Synced from your phone after you open UNTIL.',
    },
    {
      category: 'Focus',
      title: 'Deadlines, counters, and daily tasks',
      description:
        'Countdown to important dates, tap-to-increment custom counters, and track daily tasks with reports.',
    },
    {
      category: 'Sharing',
      title: 'Share snapshot',
      description:
        'Generate a clean story-style image of your progress to post or send in one tap.',
    },
  ],
```

- [ ] **Step 3: Verify TypeScript still compiles for this file**

Run from repo root:

```bash
cd website && npx tsc --noEmit -p tsconfig.json 2>&1 | head -40
```

Expected: no errors from `copy.ts` (exit 0, or unrelated pre-existing noise only).

- [ ] **Step 4: Commit**

```bash
git add website/src/domain/copy.ts
git commit -m "$(cat <<'EOF'
feat(website): add Ember and Wear OS feature cards

EOF
)"
```

---

### Task 2: Update whyChoose, FAQ, and screenshots blurb SSOT

**Files:**
- Modify: `website/src/domain/copy.ts`
- Modify: `website/src/app/page.tsx`

- [ ] **Step 1: Update `whyChoose` “Built for surfaces” item**

```ts
      {
        title: 'Built for surfaces',
        description:
          'Widgets first (with Ember on Day and Tasks), Wear OS Day % on Android watches, Dynamic Island on iOS, and floating overlay on Android.',
      },
```

Leave the other three `whyChoose.items` unchanged.

- [ ] **Step 2: Update FAQ widgets answer + insert Wear OS question**

Replace the widgets FAQ answer:

```ts
      {
        question: 'What can I put on widgets?',
        answer:
          'You can show day, month, year, life, deadlines, daily task progress, custom counters, and hour timer state. Day and Daily Tasks widgets also show Ember, whose mood follows day progress. Widget options vary by device and platform.',
      },
```

Insert this new FAQ item **after** the widgets question and **before** “Who is Until for?”:

```ts
      {
        question: 'Does Until work on Wear OS?',
        answer:
          'Yes. On Android, UNTIL syncs Day % to Wear OS so you can add a tile or complication on a compatible watch. Open the phone app so Day data stays fresh. iOS (and Apple Watch) are coming soon.',
      },
```

Leave free/paid and get-started answers Android-first / iOS coming soon as they already are.

- [ ] **Step 3: Add `screenshotsBlurb` to `LANDING_COPY` and wire `page.tsx`**

In `copy.ts`, add after `features` (or next to `hero`):

```ts
  /** Blurb above the screenshot gallery on the home page */
  screenshotsBlurb:
    'Day, month, year, and life progress — widgets with Ember, countdowns, counters, and Wear OS Day % on Android.',
```

In `website/src/app/page.tsx`:

1. Destructure `screenshotsBlurb` from `LANDING_COPY` alongside the other keys.
2. Replace the hardcoded paragraph under “See the app”:

```tsx
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
          }}
        >
          {screenshotsBlurb}
        </p>
```

- [ ] **Step 4: Grep verification**

Run:

```bash
rg -n "Ember|Wear OS" website/src/domain/copy.ts website/src/app/page.tsx
rg -n "Apple Watch marketing|coming soon" website/src/domain/copy.ts
```

Expected:
- `copy.ts` mentions Ember and Wear OS in features, whyChoose, FAQ, hero, cinematicHero, screenshotsBlurb
- `page.tsx` uses `{screenshotsBlurb}` (no hardcoded Ember/Wear required)
- iOS still says “coming soon” in cinematic CTA / final CTA
- No internal phrase “no Apple Watch marketing”

- [ ] **Step 5: Commit**

```bash
git add website/src/domain/copy.ts website/src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat(website): weave Ember and Wear into FAQ and screenshots blurb

EOF
)"
```

---

### Task 3: Update SEO meta in `layout.tsx`

**Files:**
- Modify: `website/src/app/layout.tsx`

- [ ] **Step 1: Update `metadata.description` and `openGraph.description`**

```ts
export const metadata: Metadata = {
  title: `${SITE_CONFIG.appName} — ${SITE_CONFIG.tagline}`,
  description:
    'See your time across day, month, year, and life. Ember companion, home widgets, Wear OS Day %, deadlines, tasks, and share snapshots.',
  openGraph: {
    title: SITE_CONFIG.appName,
    description:
      'Time awareness with Ember, widgets, Wear OS Day %, deadlines, counters, tasks, and shareable snapshots.',
  },
};
```

- [ ] **Step 2: Confirm cinematic hero still reads from SSOT**

Run:

```bash
rg -n "cardDescription|LANDING_COPY|cinematicHero" website/src/components
```

Expected: cinematic hero imports `LANDING_COPY` / `cinematicHero` fields — **no hardcoded “home screen” only strings that override SSOT**. If a duplicate hardcoded paragraph exists in `cinematic-hero.tsx`, replace it with the SSOT field (do not invent new copy).

- [ ] **Step 3: Build the website**

```bash
cd website && yarn build
```

Expected: Next.js build succeeds (exit 0).

- [ ] **Step 4: Manual spot-check (dev server)**

If `yarn dev` is already running, open the home page and confirm:
- “What you get” shows 6 cards including Companion + Wrist
- FAQ has Wear OS question
- iOS CTAs still say Coming soon
- Pricing / legal pages unchanged

- [ ] **Step 5: Commit**

```bash
git add website/src/app/layout.tsx
# include cinematic-hero.tsx only if Step 2 required a SSOT fix
git commit -m "$(cat <<'EOF'
feat(website): mention Ember and Wear OS in SEO meta

EOF
)"
```

---

### Task 4: Spec success-criteria checkbox pass

**Files:**
- Modify: `docs/superpowers/specs/2026-07-14-website-ember-wear-copy-design.md` (checkboxes only)

- [ ] **Step 1: Mark success criteria done**

Set all success-criteria checkboxes to `[x]` in the spec if verification passed.

- [ ] **Step 2: Final grep for forbidden oversell**

```bash
rg -ni "apple watch|watchOS" website/src/domain/copy.ts website/src/app
```

Expected: at most the FAQ soft line that iOS/Apple Watch are coming soon — **not** a Wear-parity claim for Apple Watch.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-14-website-ember-wear-copy-design.md
git commit -m "$(cat <<'EOF'
docs: mark website Ember/Wear copy refresh criteria done

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| 6 feature cards (Ember Companion + Wear Wrist) | Task 1 |
| Widgets copy mentions Ember on Day & Tasks | Task 1 |
| Hero + cinematic light weave | Task 1 |
| whyChoose surfaces update | Task 2 |
| FAQ Ember + Wear OS | Task 2 |
| screenshots blurb → SSOT | Task 2 |
| layout meta | Task 3 |
| iOS remains coming soon | Tasks 1–3 (preserve existing strings) |
| No new components / no cinematic redesign | All tasks |
| No Apple Watch oversell | Task 4 grep |

## Out of scope (do not implement)

- App Store live buttons
- New Wear strip section
- Pricing / legal / update-config changes
- New screenshot art
