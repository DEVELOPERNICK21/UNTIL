# UNTIL monetization strategy (SSOT)

India-first pricing for Android (Play Billing). **Code copy and fallbacks:** `src/config/monetization.ts`. **Play setup:** `docs/PLAY_BILLING.md`.

When changing prices, paywall text, or what is free vs Premium, update **this file**, `monetization.ts`, and Play Console together.

---

## Plans we sell (Android)

| Plan | Price (INR) | Play product ID | Role |
|------|-------------|-----------------|------|
| **Yearly** | **₹499/year** | `yearly_subscription` | Primary conversion (~70% target mix) |
| **Monthly** | **₹99/month** | `monthly_subscription` | Impulse / low commitment |
| **Lifetime** | **₹1,499 once** | `lifetime_unlock` | Decoy + high ARPU (~15% mix); **≥3× yearly** |
| **Student yearly** | **₹249/year** | `yearly_subscription_student` | Optional (flag `studentPlanEnabled`) |

**Preview:** 14-day in-app preview (`TRIAL_DURATION_MS`) — same Premium as paid; **not** a Google Play billing trial. Subscriptions bill at the Play price when the user subscribes.

**Not sold:** Monthly on paywall (optional later per audit; user chose yearly + lifetime only).

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
- **14-day free app preview** (in-app only; do not imply a Play billing trial unless Console offers one)

---

## Pricing psychology (implemented in app)

1. **Yearly = Best value** — badge only on yearly.  
2. **Per-day framing** — “Less than ₹1.37/day” on yearly.  
3. **Loss framing vs monthly reference** — “Save ₹692/year vs monthly” (₹99×12 − ₹499); monthly not sold but anchors yearly.  
4. **Lifetime decoy** — ₹1,499 makes ₹499/year the “smart” choice; lifetime for anti-subscription users.  
5. **Emotional paywall** — “Your life is passing. Start watching it.” (not “Unlock Premium”).  
6. **24h Life preview → paywall** — modal when preview ends (`LifeUnlockEndedModal`).  
7. **48h paywall cooldown** — after dismissing interstitial (`paywallPrompt.ts`).

---

## Play Console checklist

- [ ] Payments profile complete  
- [ ] `yearly_subscription` — yearly base plan **₹499**, Active  
- [ ] `lifetime_unlock` — one-time **₹1,499**, Active  
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
- Cancellation “what you’ll lose” screen  
- Monthly → annual upsell at month 2  

---

## Targets (from audit)

| Metric | Direction |
|--------|-----------|
| Trial → paid | 35–45% (with full funnel) |
| Pay mix | ~70% yearly, ~15% lifetime, ~15% monthly if added later |
| Lifetime price | ₹1,499 minimum while yearly is ₹499 |
