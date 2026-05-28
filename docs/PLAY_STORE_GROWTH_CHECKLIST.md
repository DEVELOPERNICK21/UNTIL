# Play Store growth checklist (manual)

Use with Play Console **Grow users** dashboard. At low volume (~30–50 installs/month), treat trends as directional until you have 100+ installs.

## Store listing experiments

1. Play Console → **Grow users** → **Store listing experiments** → **Create experiment**.
2. Test one variable at a time:
   - Screenshot #1: Day/Year progress on home screen (instant value).
   - Short description: mention **5-day free app preview** and **home screen widgets**.
   - Feature graphic: widget + life motif.
3. Run at least 2 weeks before concluding.

## Listing copy (align with app)

- 5-day **in-app preview** (not a Play billing trial unless you add one in Console).
- Yearly **₹499**, lifetime **₹1,499** — see [`MONETIZATION_STRATEGY.md`](MONETIZATION_STRATEGY.md).

## Vitals & quality

- **Android vitals** → fix crash rate / ANRs on latest version.
- Reply to reviews mentioning crashes or billing confusion.

## After each app release

- Update **What’s new** with widget coach, shorter onboarding, or policy fixes.
- Check **First opens** vs **Acquisitions** 7 days post-release.

## Metrics to watch

| Metric | Goal |
|--------|------|
| First opens / acquisitions | > 50% |
| 7-day retention | > 0%, then improving |
| Store conversion | Maintain ~15–25% while testing creatives |

Firebase funnel (see [`FIREBASE_ANALYTICS.md`](FIREBASE_ANALYTICS.md)): `onboarding_complete`, `widget_add_tapped`, `premium_viewed`.
