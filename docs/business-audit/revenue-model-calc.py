#!/usr/bin/env python3
"""
UNTIL revenue scenario model (supports docs/business-audit/09-revenue-projection-model.md).

Every input below is an ASSUMPTION or a published BENCHMARK, not measured UNTIL data.
Replace the inputs with real numbers from RevenueCat / store exports (see DATA_REQUESTS.md),
then re-run:  python3 revenue-model-calc.py

No dependencies beyond the Python 3 standard library.
"""
from copy import deepcopy

INR_PER_USD = 90.0  # ASSUMPTION (the 2026-10-21 audit also used ~90)

# Gross price per plan, USD-equivalent, by payer geography.
# "current" = INR price converted by the store (yearly 499, monthly 149, weekly 49, lifetime 1999).
# "tiered"  = the pricing experiment in 03-revenue-and-monetization-audit.md.
PRICES = {
    "current": {
        "IN":    dict(yearly=499/INR_PER_USD, monthly=149/INR_PER_USD, weekly=49/INR_PER_USD, lifetime=1999/INR_PER_USD),
        "HIGH":  dict(yearly=499/INR_PER_USD, monthly=149/INR_PER_USD, weekly=49/INR_PER_USD, lifetime=1999/INR_PER_USD),
        "OTHER": dict(yearly=499/INR_PER_USD, monthly=149/INR_PER_USD, weekly=49/INR_PER_USD, lifetime=1999/INR_PER_USD),
    },
    "tiered": {
        "IN":    dict(yearly=499/INR_PER_USD, monthly=149/INR_PER_USD, weekly=49/INR_PER_USD, lifetime=1999/INR_PER_USD),
        "HIGH":  dict(yearly=14.99, monthly=2.99, weekly=0.99, lifetime=39.99),
        "OTHER": dict(yearly=7.99,  monthly=1.99, weekly=0.69, lifetime=24.99),
    },
}

BASE = dict(
    installs_m1=155,            # observed ~5.2/day in the 2026-10-21 audit (REPORTED)
    install_growth=0.15,        # monthly growth of installs
    conv=0.015,                 # install -> paid within ~35 days
    payer_geo=dict(IN=0.40, HIGH=0.40, OTHER=0.20),   # ASSUMPTION: payers skew to high-price markets
    mix=dict(yearly=0.60, monthly=0.15, weekly=0.10, lifetime=0.15),
    monthly_months_paid=3.5,    # average paid months per monthly subscriber
    weekly_weeks_paid=3.0,      # average paid weeks per weekly subscriber
    yearly_renewal=0.30,        # share of yearly payers who renew at month 12
    store_fee=0.15,             # ASSUMPTION: 15% small-business / subscription rate (verify per store)
    refund=0.04,                # ASSUMPTION: share of gross refunded
    price_set="tiered",
    high_conv_penalty=0.0,      # relative conversion drop in HIGH markets caused by higher prices
    months=12,
)

SCENARIOS = {
    "conservative": dict(install_growth=0.05, conv=0.005, mix=dict(yearly=0.50, monthly=0.20, weekly=0.15, lifetime=0.15),
                         monthly_months_paid=2.5, weekly_weeks_paid=2.0, yearly_renewal=0.20, refund=0.06, price_set="current"),
    "realistic":    dict(install_growth=0.15, conv=0.015, price_set="tiered"),
    "aggressive":   dict(install_growth=0.25, conv=0.025, mix=dict(yearly=0.60, monthly=0.12, weekly=0.08, lifetime=0.20),
                         monthly_months_paid=5.0, weekly_weeks_paid=4.0, yearly_renewal=0.40, refund=0.03, price_set="tiered"),
}


def blended_price(p, plan):
    g = p["payer_geo"]
    pr = PRICES[p["price_set"]]
    return sum(g[k] * pr[k][plan] for k in g)


def net(x, p):
    return x * (1 - p["refund"]) * (1 - p["store_fee"])


def payer_value_24m(p):
    """Expected net revenue per payer over 24 months, blended across plan mix."""
    m = p["mix"]
    v = 0.0
    v += m["yearly"] * net(blended_price(p, "yearly") * (1 + p["yearly_renewal"]), p)
    v += m["monthly"] * net(blended_price(p, "monthly") * p["monthly_months_paid"], p)
    v += m["weekly"] * net(blended_price(p, "weekly") * p["weekly_weeks_paid"], p)
    v += m["lifetime"] * net(blended_price(p, "lifetime"), p)
    return v


def apply_high_penalty(p):
    """If higher prices cost payers in HIGH markets only, shrink the HIGH weight, keep the other
    geographies' payer counts, and re-normalise the geography mix. Returns an adjusted copy."""
    pen = p["high_conv_penalty"] if p["price_set"] == "tiered" else 0.0
    if pen <= 0:
        return p
    q = deepcopy(p)
    w = dict(p["payer_geo"])
    w["HIGH"] = w["HIGH"] * (1 - pen)
    total = sum(w.values())
    q["payer_geo"] = {k: v / total for k, v in w.items()}
    q["conv"] = p["conv"] * total
    q["high_conv_penalty"] = 0.0
    return q


def effective_conv(p):
    return p["conv"]


def simulate(p):
    """Monthly net cash and normalized MRR for p['months'] months."""
    p = apply_high_penalty(p)
    m = p["mix"]
    rows = []
    # active subscriber stocks
    yearly_cohorts, monthly_cohorts, weekly_cohorts = [], [], []
    cum = 0.0
    for t in range(1, p["months"] + 1):
        installs = p["installs_m1"] * (1 + p["install_growth"]) ** (t - 1)
        payers = installs * effective_conv(p)
        n = {k: payers * m[k] for k in m}
        yearly_cohorts.append((t, n["yearly"]))
        monthly_cohorts.append((t, n["monthly"]))
        weekly_cohorts.append((t, n["weekly"]))
        cash = 0.0
        cash += net(n["yearly"] * blended_price(p, "yearly"), p)
        cash += net(n["lifetime"] * blended_price(p, "lifetime"), p)
        # monthly subs: geometric survival so average months paid = monthly_months_paid
        # monthly_months_paid = 1/(1-s)  -> s = 1 - 1/months
        s = 1 - 1 / p["monthly_months_paid"]
        active_monthly = sum(c * (s ** (t - ts)) for ts, c in monthly_cohorts)
        cash += net(active_monthly * blended_price(p, "monthly"), p)
        # weekly: ~4.33 weeks per month, same survival idea per week
        sw = 1 - 1 / p["weekly_weeks_paid"]
        # convert weekly survival to monthly average billed weeks per active-in-month
        wk_cash = 0.0
        for ts, c in weekly_cohorts:
            age_m = t - ts
            # expected billed weeks in that month for a cohort member
            wk = sum(sw ** (age_m * 4.33 + k) for k in range(4)) if age_m * 4.33 < 60 else 0.0
            wk_cash += c * wk
        cash += net(wk_cash * blended_price(p, "weekly"), p)
        # normalized MRR: yearly/12 for those paid within last 12 months + monthly active + weekly*4.33
        yearly_active = sum(c for ts, c in yearly_cohorts if t - ts < 12)
        mrr = net(yearly_active * blended_price(p, "yearly") / 12, p)
        mrr += net(active_monthly * blended_price(p, "monthly"), p)
        # MRR excludes weekly plans (too volatile) and lifetime purchases (one-off cash).
        cum += cash
        rows.append(dict(t=t, installs=installs, payers=payers, cash=cash, mrr=mrr, cum=cum))
    return rows


def summarize(name, p):
    p = apply_high_penalty(p)
    rows = simulate(p)
    last = rows[-1]
    return dict(
        name=name,
        installs_m12=last["installs"],
        installs_total=sum(r["installs"] for r in rows),
        payers_total=sum(r["payers"] for r in rows),
        net_12m=last["cum"],
        net_m12=last["cash"],
        mrr_m12=last["mrr"],
        arr_m12=last["mrr"] * 12,
        value_per_payer_24m=payer_value_24m(p),
        net_per_install_24m=payer_value_24m(p) * effective_conv(p),
    )


def with_over(base, over):
    p = deepcopy(base)
    p.update(deepcopy(over))
    return p


def run_scenarios():
    out = []
    for name, over in SCENARIOS.items():
        out.append(summarize(name, with_over(BASE, over)))
    return out


def sensitivity(scn="realistic"):
    base = with_over(BASE, SCENARIOS[scn])
    b = summarize(scn, base)["net_12m"]
    tests = []

    def t(label, mut):
        p = deepcopy(base)
        mut(p)
        tests.append((label, summarize(label, p)["net_12m"] / b - 1))

    t("installs +25% (every month)", lambda p: p.__setitem__("installs_m1", p["installs_m1"] * 1.25))
    t("install growth 15% -> 20%/mo", lambda p: p.__setitem__("install_growth", 0.20))
    t("conversion 1.5% -> 2.0%", lambda p: p.__setitem__("conv", 0.02))
    t("conversion 1.5% -> 1.0%", lambda p: p.__setitem__("conv", 0.01))
    t("price set tiered -> current", lambda p: p.__setitem__("price_set", "current"))
    t("tiered + 30% fewer HIGH-market payers", lambda p: p.__setitem__("high_conv_penalty", 0.30))
    t("yearly share 60% -> 45% (to monthly)", lambda p: p.__setitem__("mix", dict(yearly=0.45, monthly=0.30, weekly=0.10, lifetime=0.15)))
    t("lifetime share 15% -> 25% (from yearly)", lambda p: p.__setitem__("mix", dict(yearly=0.50, monthly=0.15, weekly=0.10, lifetime=0.25)))
    t("drop weekly (its payers go to monthly)", lambda p: p.__setitem__("mix", dict(yearly=0.60, monthly=0.25, weekly=0.0, lifetime=0.15)))
    t("yearly renewal 30% -> 45% (24m LTV only)", lambda p: p.__setitem__("yearly_renewal", 0.45))
    t("store fee 15% -> 30%", lambda p: p.__setitem__("store_fee", 0.30))
    t("refund 4% -> 10%", lambda p: p.__setitem__("refund", 0.10))
    return tests


def grid(scn="realistic"):
    """Conversion x installs-growth grid of 12-month net revenue."""
    base = with_over(BASE, SCENARIOS[scn])
    convs = [0.005, 0.010, 0.015, 0.020, 0.030]
    growths = [0.05, 0.10, 0.15, 0.20, 0.25]
    table = {}
    for c in convs:
        for g in growths:
            p = deepcopy(base)
            p["conv"], p["install_growth"] = c, g
            table[(c, g)] = summarize("g", p)["net_12m"]
    return convs, growths, table


def breakeven_high_penalty(scn="realistic"):
    """Largest relative loss of HIGH-market payers at which tiered pricing still equals current pricing."""
    base = with_over(BASE, SCENARIOS[scn])
    cur = summarize("c", with_over(base, dict(price_set="current")))["net_12m"]
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        t = summarize("t", with_over(base, dict(price_set="tiered", high_conv_penalty=mid)))["net_12m"]
        if t > cur:
            lo = mid
        else:
            hi = mid
    return lo


def installs_needed_cash(target_net_per_month, scn="realistic"):
    """Steady-state monthly installs needed for a target NET CASH per month (all plans incl. lifetime)."""
    p = with_over(BASE, SCENARIOS[scn])
    p["install_growth"] = 0.0
    p["installs_m1"] = 1000.0
    r = simulate(dict(p, months=24))[-1]["cash"]
    return 1000.0 * target_net_per_month / r


def installs_needed(target_mrr, scn="realistic"):
    """Steady-state monthly installs needed so that normalized MRR (yearly/12 + monthly) hits target."""
    p = with_over(BASE, SCENARIOS[scn])
    p["install_growth"] = 0.0
    p["installs_m1"] = 1000.0
    r = simulate(dict(p, months=24))[-1]["mrr"]
    return 1000.0 * target_mrr / r


if __name__ == "__main__":
    print("== Price points (blended across payer geography, gross USD) ==")
    for ps in ("current", "tiered"):
        p = with_over(BASE, dict(price_set=ps))
        print(ps, {k: round(blended_price(p, k), 2) for k in ("yearly", "monthly", "weekly", "lifetime")})
    print("\n== Scenarios ==")
    for s in run_scenarios():
        print({k: (round(v, 2) if isinstance(v, float) else v) for k, v in s.items()})
    print("\n== Sensitivity on Realistic (12-month net revenue change) ==")
    for label, d in sensitivity():
        print(f"{label:48s} {d:+.0%}")
    print("\nBreak-even HIGH-market payer loss (tiered = current pricing):", f"{breakeven_high_penalty():.0%}")
    print("\n== Grid: 12-month net revenue, Realistic, conversion (rows) x install growth (cols) ==")
    convs, growths, table = grid()
    print("conv\\growth " + " ".join(f"{g:>8.0%}" for g in growths))
    for c in convs:
        print(f"{c:>10.1%} " + " ".join(f"{table[(c,g)]:>8.0f}" for g in growths))
    print("\n== Steady-state installs/month needed for MRR targets (Realistic assumptions, 24m steady state) ==")
    for tgt in (500, 1000, 2000, 5000):
        print(tgt, round(installs_needed(tgt)))
    print("\n== Steady-state installs/month needed for NET CASH per month (all plans) ==")
    for scn in ("conservative", "realistic", "aggressive"):
        print(scn, {tgt: round(installs_needed_cash(tgt, scn)) for tgt in (500, 1000, 2000, 5000)})
