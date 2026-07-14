# Marketing website — Ember + Wear OS copy refresh

**Date:** 2026-07-14  
**Status:** Approved design  
**Approach:** Option B / #1 — copy-grid only (SSOT + light meta/blurb)

## Goal

Update the public marketing site so it reflects the new Android Play release: Ember on Day & Daily Tasks widgets, and Wear OS Day %. Keep iOS as “coming soon.” No landing redesign.

## Non-goals

- App Store live CTAs or Apple Watch marketing
- New page sections / components (no Wear strip)
- Cinematic hero GSAP / layout redesign
- Pricing, monetization, or legal page rewrites
- Changes to `api/update-config` version policy

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | Copy + light layout blurb/meta only |
| iOS | Still “coming soon”; Android primary CTA |
| Wear | Feature Wear OS Day % (Android watches); not Apple Watch |
| Ember | Feature card + why/FAQ (not hero brand rewrite) |
| Layout approach | Copy-grid only — extend existing feature cards |

## Changes

### Primary SSOT — `website/src/domain/copy.ts`

**Feature grid (“What you get”) — six cards**

1. **Core** — keep: live day/month/year/life progress  
2. **Widgets** — refresh: mention Ember on Day + Daily Tasks  
3. **Companion** *(new)* — Ember: calm presence in-app and on widgets; mood follows day progress  
4. **Wrist** *(new)* — Wear OS Day % tile/complication on Android watches; synced from phone  
5. **Focus** — keep: deadlines, counters, daily tasks  
6. **Sharing** — keep: share snapshot  

**Also update (light weave, same files):**

- Hero subtitle and cinematic `cardDescription` / CTA description — mention Ember and/or Wear without changing brand headline (“See your time”)
- `whyChoose` — at least one item covers Ember + Wear (or “Built for surfaces” expands to widgets, overlay, Wear)
- FAQ — widgets answer mentions Ember; add Wear OS Day % Q&A; free/paid and “how to get started” stay Android-first / iOS not live

### Light touch elsewhere

- `website/src/app/layout.tsx` — meta / Open Graph descriptions include Ember or Wear glance where natural
- `website/src/app/page.tsx` — only if a hardcoded screenshot blurb still omits new surfaces; prefer moving that string into `copy.ts` if touched

### Unchanged

- `SITE_CONFIG` pricing, play/app store URLs, intro offer framing
- Header / Footer structure
- Legal (`privacy.ts`, `terms.ts`)
- Phone mockup / screenshot assets (no new art required for this pass)
- iOS coming-soon badges and CTAs

## Success criteria

- [x] Landing feature grid shows Ember (Companion) and Wear OS (Wrist)
- [x] Widgets / why / FAQ copy accurately describe Ember on Day & Tasks and Wear Day %
- [x] iOS still reads as coming soon; Android remains the install CTA
- [x] No new components or cinematic hero restructure
- [x] Copy remains in domain SSOT (`copy.ts`); no duplicated marketing strings reinvented in components

## Risks

- Over-selling Apple Watch if copy says “watch” generically — always say **Wear OS** / Android watches
- Over-naming Ember in every block — keep to feature card + why/FAQ + light hero weave
