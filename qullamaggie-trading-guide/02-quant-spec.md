# The Qullamaggie Quant Spec

### Turning the method into mechanical rules — and where a bot hits its limits

*Companion to **The Qullamaggie Playbook**. This document answers the question you raised directly:
**is he a human or a quant bot?** Short answer: a **human discretionary trader running a heavily
rule-based process.** Below is exactly which parts are mechanical (automatable), which require
judgement, the concrete screeners and pseudocode to encode the mechanical core, position-sizing
math, and a backtest design — plus an honest estimate of the gap between a pure bot and his live
results. Educational only; not financial advice.*

---

## 1. Human or bot? The mechanical-vs-discretionary map

He **executes manually** and streams it live; he does **not** run an automated system. But the
process is unusually systematic, so it decomposes cleanly:

| Component | Mechanical (a bot can do it) | Discretionary (needs a human) |
|---|---|---|
| Universe / relative-strength ranking | ✅ Top 1–2% gainers over 1/3/6m, ADR%, liquidity | — |
| Consolidation detection | ✅ Range contraction, higher lows, volume dry-up | ⚠️ "Cleanliness"/orderliness of the base |
| Breakout entry (ORH) | ✅ Break of 1/5/60-min opening-range high + volume | — |
| Stop & size | ✅ LOD, ≤1×ADR, fixed-risk position sizing | — |
| Partial sells / MA trail | ✅ Sell 1/3–1/2 at 3–5d or 2–3R, trail 10/20-MA | — |
| **Episodic Pivot catalyst** | ⚠️ Gap% + volume are mechanical | ❗ *Is the catalyst meaningful?* (earnings quality, durability) |
| **Market regime** | ✅ Index 10/20-MA slope is mechanical | ⚠️ Reading whether breakouts are "holding" |
| **Conviction sizing** | partly (liquidity is mechanical) | ❗ How hard to press a given trade |
| **Parabolic short timing** | ⚠️ Exhaustion heuristics | ❗ Tape reading, "feel" for the blow-off top |

**Rough split: ~70% mechanical screening + rules, ~30% discretion.** The screening, entries, stops,
sizing, and exits are fully codifiable. The *alpha* concentrates in the discretionary 30% —
catalyst quality, regime nuance, and conviction. A faithful bot can replicate the **process** and a
large part of the **breakout** edge; it will under-replicate the **EP** and **parabolic short** edge
that lean on judgement.

---

## 2. Universe & data requirements

- **Universe:** US common stocks (NYSE/NASDAQ/AMEX). Exclude OTC/pink. He leans toward
  NASDAQ growth/tech/biotech leaders.
- **Bars:** daily OHLCV for scanning/management; **1-minute & 5-minute** intraday for ORH entries;
  intraday for VWAP (shorts).
- **Fundamental/event feed:** an **earnings calendar + surprise/guidance** feed for EPs.
- **Survivorship-bias warning:** backtests **must** include delisted/dead tickers and point-in-time
  index membership, or breakout results will be badly inflated.

### 2.1 Core derived indicators

```text
SMA(n)      = simple moving average of close over n days        # use 10, 20, 50, 200
ADR%(20)    = 100 * ( average over last 20 days of (High/Low) - 1 )   # Qullamaggie-style ADR
# (equivalently ~ average of (High-Low)/Close * 100; either is fine if applied consistently)
DollarVol   = close * volume                                    # liquidity proxy
RVOL(n)     = volume / SMA(volume, n)                           # relative volume, n=20 or 50
RS_1m/3m/6m = percent return over ~21 / ~63 / ~126 trading days # relative strength
```

---

## 3. Screeners (copy-paste-ish)

### 3.1 Finviz — relative-strength leaders (the funnel's top)

Use Finviz Elite screener filters (URL-buildable). Representative leader screens:

- **Performance:** Month **+30%** (or **+50%** aggressive), Quarter **+50%**, Half-year **+100%**,
  Week **+20%**.
- **Average Volume:** **over 300K**.
- **Price:** typically **over $5–$10** (avoid sub-$ junk).
- **Optional:** Market-cap **Small+** or **+**, exclude funds.

A tight leaders screen should return **< ~60 names.** Carry them to a charting scan.

### 3.2 TC2000 — daily breakout / continuation scan

His publicly-circulated breakout condition (TC2000 syntax):

```text
c/c1 > 1.03
AND c > h1 AND c > h2
AND ( (h - l) > 0.5 * (avgh5 - avgl5) )
AND ( (c - l) < (avgh20 - avgl20) * 1.5 )
```

Reading it: up **>3%** today; closing **above the prior two days' highs** (breaking out); today's
**range is large** vs the 5-day average (expansion); but the **close-to-low distance is contained**
vs the 20-day range (not a blow-off — still room). Layer on relative-strength + ADR% + liquidity:

```text
AND ADR%(20) >= 5
AND c * v >= 100000000          # ~$100M dollar volume
AND ( RS_1m in top 2%  OR  RS_3m in top 2%  OR  RS_6m in top 2% )
AND ( |c - SMA10|/c <= 0.10  OR  |c - SMA20|/c <= 0.10 )   # near the 10/20-day MA it's surfing
```

### 3.3 Episodic Pivot pre-open scan

```text
gap_pct = open / prev_close - 1
WHERE gap_pct >= 0.10                       # +10% gap
  AND has_catalyst (earnings beat / raised guidance / major news today)
  AND ret_prior_3_6_months <= ~0.30         # NOT already extended -> the news is a real "surprise"
  AND open > resistance_of_prior_base       # gapping above the range
  AND open > SMA50
  AND first15min_volume >= 2 * SMA(volume,20)   # volume exploding early
# Earnings-EP quality (discretionary): mid/high or triple-digit EPS+revenue growth, big beat,
# and it is the FORWARD guidance that matters, not the trailing quarter.
```

### 3.4 Parabolic-short candidate scan

```text
WHERE up_days_in_a_row >= 3
  AND ( (large_cap AND ret_10d >= 0.50) OR (small_cap AND ret_10d >= 3.0) )
  AND extension_above_SMA10 = (c - SMA10)/SMA10 >= 0.30   # stretched far from the 10-MA
  AND ADR%(20) >= 8
  AND volume_making_new_highs_is_declining = TRUE         # exhaustion tell (heuristic)
```

---

## 4. Entry / exit state machines (pseudocode)

### 4.1 Breakout & Episodic Pivot (long) — identical management

```python
# Preconditions: ticker passed the daily scan (breakout) or EP pre-open scan, AND risk-on regime:
def market_regime_is_risk_on(index):                      # "green light"
    return ( SMA(index,10) > SMA(index,20)                # 10 above 20
             and slope(SMA(index,10)) > 0                 # both sloping up
             and slope(SMA(index,20)) > 0
             and slope(SMA(index,100)) >= 0 )             # slower backdrop not rolling over
# One MA sloping down = yellow (cut size); 10 crossing below 20 = red (no new longs).
# Note: post-2021 he weights EP entries far more heavily than breakouts (regime-driven choice).

def on_market_open(stock):
    or1_high = high_of_first_n_minute_bar(stock, n=1)     # also track n=5, n=60
    arm_stop_buy(stock, trigger=or1_high)                 # fall back to 5m/60m ORH if 1m fails

def on_entry_filled(stock, entry):
    stop = low_of_day(stock)
    if (entry - stop) > 1.0 * ADR_points(stock):          # ADR% converted to $ at entry
        exit_immediately(stock); return                   # too loose -> skip/abort
    risk_dollars = account_equity * RISK_PCT              # RISK_PCT in [0.0025, 0.01]
    shares = floor(risk_dollars / (entry - stop))
    shares = cap_by_liquidity_and_max_position(shares)    # <=~25% equity; <=~30% overnight
    place_hard_stop(stock, stop)

def on_manage(stock):                                     # evaluated daily / intraday
    if days_held >= 3 and (open_R(stock) >= 2 or days_held >= 5):
        if not took_partial(stock):
            sell_fraction(stock, frac=0.5)                # 1/3..1/2 into strength
            move_stop_to_breakeven(stock)
    # Exception: explosive same-day movers (e.g. +100-300% in 1-2 days). A daily MA trail gives the
    # whole move back, so scale out into strength and/or trail an INTRADAY average instead.
    if same_day_parabolic(stock):                         # e.g. up >> 1 day, far above 60m VWAP
        scale_out_into_strength(stock)
        trail = EMA_60min(stock, 10)                      # 10/20 EMA on the 60-minute, not daily
    else:
        trail = SMA(stock, 10) if is_fast_mover(stock) else SMA(stock, 20)
    if close(stock) < trail:                              # daily close, or 60m close for the fast case
        exit_remainder(stock)
```

### 4.2 Parabolic short (advanced)

```python
def short_trigger(stock):
    return ( breaks_below(opening_range_low(stock, n=1 or 5))
             or vwap_fail(stock)              # first red 1/5-min candle rejecting VWAP
             or lower_high_after_bounce(stock) )

def on_short_filled(stock, entry):
    stop = max(high_of_day(stock), vwap_reclaim_level(stock))   # tight
    if (stop - entry) > 1.0 * ADR_points(stock): exit_immediately(stock); return
    size_small(stock)                                            # smaller than longs
    place_hard_stop(stock, stop)

def on_short_manage(stock):
    if price_near(stock, SMA(stock, 10)):    # first bounce zone
        cover_fraction(stock, 0.5)
    trail_short_lower(stock)                  # trail down; respect overnight gap risk
```

---

## 5. Position sizing math (worked example)

```text
shares = floor( (account_equity * risk_pct) / (entry - stop) )
stop_distance_constraint:  (entry - stop) <= ADR$  where  ADR$ = entry * ADR%/100
```

Example: equity **$100,000**, risk **0.5% = $500**, entry **$50.00**, ADR% **6%** → ADR$ = $3.00,
so the stop must be within **$3.00**. Say LOD = **$47.50** (entry−stop = $2.50 ≤ $3.00 ✓).
`shares = 500 / 2.50 = 200`. Notional = **$10,000 = 10% of equity** ✓ (under caps). If LOD were
**$46.00** (distance $4.00 > $3.00 ADR$) → **skip the trade.**

This is why **ADR simultaneously sets the stop and the size**: high-ADR names get fewer shares but
the same dollar risk.

---

## 6. Backtest design (do this before trusting any of it)

- **Data:** point-in-time universe **including delisted tickers**; daily + at least 5-min intraday
  for ORH; corporate-action-adjusted prices; an earnings/catalyst feed for EPs.
- **Entry model:** simulate the **1-min/5-min ORH** fill with realistic slippage; don't assume the
  exact high.
- **Costs:** commissions + **slippage that scales with size/ADR**; borrow fees + hard-to-borrow +
  overnight gap risk for shorts.
- **Regime filter:** gate longs on index 10>20-MA-up; test with and without it (it should cut
  drawdowns materially).
- **Risk model:** fixed fractional (0.25–1%), ADR-capped stop, partial at 3–5d/2–3R, 10/20-MA trail.
- **Metrics to report:** win rate (**expect ~25–35%**), **average win R vs average loss R**,
  **expectancy per trade**, profit factor, max drawdown, exposure/time-in-market, and the
  distribution of R (the tail of big winners is the whole edge — plot it).
- **Robustness:** walk-forward across regimes (2013–2019 vs 2020–2021 vs **2022 bear**), parameter
  sensitivity (ADR threshold, trail length), and a **survivorship-on vs off** comparison.

### 6.1 Reference scanner sketch (Python/pandas, illustrative)

```python
import pandas as pd, numpy as np

def adr_pct(df, n=20):
    return (df['high']/df['low']).rolling(n).mean().sub(1).mul(100)

def breakout_candidates(df):
    df = df.copy()
    df['sma10'] = df['close'].rolling(10).mean()
    df['sma20'] = df['close'].rolling(20).mean()
    df['adr']   = adr_pct(df)
    rng         = df['high'] - df['low']
    avg5        = (df['high'].rolling(5).mean() - df['low'].rolling(5).mean())
    avg20       = (df['high'].rolling(20).mean() - df['low'].rolling(20).mean())
    cond = ( (df['close']/df['close'].shift(1) > 1.03)
           & (df['close'] > df['high'].shift(1)) & (df['close'] > df['high'].shift(2))
           & (rng > 0.5*avg5) & ((df['close']-df['low']) < 1.5*avg20)
           & (df['adr'] >= 5) & (df['close']*df['volume'] >= 1e8)
           & ((df['close']-df['sma10']).abs()/df['close'] <= 0.10) )
    return df[cond]

def size(equity, risk_pct, entry, stop, adr_pct_val, max_pos_pct=0.25):
    if (entry-stop) > entry*adr_pct_val/100: return 0            # ADR constraint -> skip
    shares = int((equity*risk_pct)//(entry-stop))
    return min(shares, int(equity*max_pos_pct//entry))           # liquidity/size cap
```

*(Add relative-strength ranking, the regime gate, and the intraday ORH fill model to make it real.)*

### 6.2 TradingView / Pine Script pack

A runnable **Pine v6** implementation ships alongside this guide in `pine/` — backtestable
`strategy()` scripts for the **breakout**, **episodic pivot**, and **parabolic short**, plus a
**screener** indicator. It encodes the regime gate, the ADR-capped LOD/HOD stop, risk-based sizing,
partial-into-strength, and the 10/20-MA trail. Honest limits carry over: a Pine *strategy* is
single-symbol (no cross-sectional "top 1-2%" ranking), opening-range entries require an intraday
chart, and the EP script approximates the catalyst by gap%+volume (no earnings-quality feed). See
`pine/README.md`.

---

## 7. Expected bot-vs-human gap (set expectations)

- A disciplined bot can likely **reproduce the breakout process** and most of its mechanical edge,
  **with the index regime filter doing a lot of the work.**
- It will **under-perform on Episodic Pivots** (it can't judge catalyst quality) and on **parabolic
  shorts** (no tape feel) — expect more false triggers there.
- It will not replicate his **conviction sizing**, which concentrated capital in his best ideas
  during the 2020–2021 melt-up — a meaningful chunk of his headline returns.
- **Net:** automate the breakout for consistency and screening leverage; keep a **human in the loop**
  for EP catalyst selection, regime judgement, and how hard to press. And remember the whole edge is
  **regime-dependent** — size down or stand aside when momentum isn't being rewarded.

---

*See **Sources & Coverage** for references and an honest note on what could and couldn't be ingested
in this build.*
