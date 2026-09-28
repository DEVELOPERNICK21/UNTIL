# UNTIL monetization strategy (SSOT)

India-first pricing for Android (Play Billing). **Code copy and fallbacks:** `src/config/monetization.ts`. **Play setup:** `docs/PLAY_BILLING.md`.

When changing prices, paywall text, or what is free vs Premium, update **this file**, `monetization.ts`, and Play Console together.

---

## Plans we sell (Android)

| Plan | Price (INR) | Product ID | Role | Paywall |
|------|-------------|------------|------|---------|
| **Yearly** | **₹499/year** | `yearly_subscription` | Best value (~70% target) | Card |
| **Monthly** | **₹149/month** | `monthly_subscription` | Flexible | Card |
| **Weekly** | **₹49/week** | `weekly_subscription` | Low-risk try | Card |
| **Lifetime** | **₹1,999 once** | `lifetime_unlock` | Decoy + high ARPU; **≥3× yearly** | Secondary CTA |
| **Student yearly** | **₹249/year** | `yearly_subscription_student` | Accessible (flag `studentPlanEnabled`) | Behind email verify |

**Preview:** 5-day in-app preview (`TRIAL_DURATION_MS`) — same Premium as paid; **not** a Google Play billing trial. Start is synced server-side per device (clearing app storage does not restart). Subscriptions bill at the store price when the user subscribes.

**Paywall rule:** show **3 cards only** (yearly · monthly · weekly). Lifetime and student stay off the card grid so choice stays clear.

**Social proof:** `PAYWALL_SOCIAL_PROOF.verifiedActiveWatchers` in `monetization.ts` — set only from a verified Play/analytics count; line hidden while `null`.

---

## Free forever (trust guarantee — do not paywall)

- Today / **Day** widget + detail
- This year / **Year** widget + detail  
- **Share** snapshots  
- Custom counters, deadlines, hour calculation screens (app UI; widget variants may be V2)

---

## Premium (yearly & lifetime — identical features)

- **Month** & **Life** home screen widgets  
- **Full Life** progress screen + Life block on Home (after birth date)  
- **Floating overlay** — month & life modes (Android)  
- **Dynamic Island / Live Activity** — month & life (iOS)  
- **Activity intervention** alerts (nothing-time limits)  
- **5-day free app preview** (in-app only; server-backed; do not imply a Play billing trial unless Console offers one)

---

## Pricing psychology (implemented in app)

1. **Yearly = Best value** — badge only on yearly.  
2. **Per-day framing** — “Less than ₹1.37/day” on yearly.  
3. **Loss framing vs monthly** — “Save ₹1,289/year vs monthly” (₹149×12 − ₹499).  
4. **Lifetime decoy** — ₹1,999 makes ₹499/year the smart choice; lifetime as secondary CTA.  
5. **Weekly as try** — ₹49/week for low commitment; not the primary upsell.  
6. **Emotional paywall** — “Your life is passing. Start watching it.” (not “Unlock Premium”).  
7. **24h Life preview → paywall** — modal when preview ends (`LifeUnlockEndedModal`).  
8. **48h paywall cooldown** — after dismissing interstitial (`paywallPrompt.ts`).

---

## Play Console checklist

- [ ] Payments profile complete  
- [ ] `weekly_subscription` — weekly base plan **₹49**, Active  
- [ ] `monthly_subscription` — monthly base plan **₹149**, Active  
- [ ] `yearly_subscription` — yearly base plan **₹499**, Active  
- [ ] `lifetime_unlock` — one-time **₹1,999**, Active  
- [ ] Internal testing AAB + license testers  
- [ ] Store listing: privacy policy, subscription terms, “cancel in Play”

---

## Ethical rules (non-negotiable)

- No fake countdown timers  
- No hiding cancellation (link: Play → Subscriptions)  
- Max one interstitial paywall per session; **48h** after dismiss unless user opens Premium  
- **Do not** remove Day/Year/Share from free tier  
- Honest urgency copy (no exploitative “you’re losing X days”)  
- Remind before yearly renewal (future: push/email 14 days before)

---

## Upgrade moments (priority)

| Rank | Moment | Implementation |
|------|--------|----------------|
| 1 | 24h Life unlock ends | `LifeUnlockEndedModal` on Life screen |
| 2 | Birth date set | Future: inline prompt on Home |
| 3 | Add Life/Month widget | Future: widget picker gate |
| 4 | Trial day 13 | Future: notification |
| 5 | After share snapshot | Future: soft prompt |

---

## Roadmap (remaining)

- Play subscription trial without card (Console base-plan config)  
- Trial-end **remote** push via FCM (local notifications implemented with Notifee)  
- Student email verification before student SKU purchase
  (soft `.edu` / `.ac.*` check; gates `yearly_subscription_student`)  
- Cancellation “what you’ll lose” screen  
- Monthly → annual upsell at month 2  

---

## Targets (from audit)

| Metric | Direction |
|--------|-----------|
| Trial → paid | 35–45% (with full funnel) |
| Pay mix | ~70% yearly, ~15% lifetime, ~15% monthly/weekly |
| Lifetime price | ₹1,999 while yearly is ₹499 (≥3×) |
