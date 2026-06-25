# Qullamaggie Pine Script pack (TradingView)

Pine Script **v6** implementations of the mechanical core of his method. **Educational only —
not financial advice.** Backtest results are not predictive; commissions/slippage are modeled but
real fills, borrow, and gaps differ.

## Files
| File | Type | Use on |
|---|---|---|
| `qullamaggie-breakout.pine` | `strategy` | Daily (or 1m/5m for ORH) |
| `qullamaggie-episodic-pivot.pine` | `strategy` | Daily (or 1m/5m for ORH) |
| `qullamaggie-parabolic-short.pine` | `strategy` | Daily (or 1m/5m for ORL/VWAP) |
| `qullamaggie-screener.pine` | `indicator` | Daily, in the **Pine Screener** |

## How to use
1. TradingView → **Pine Editor** → paste a file → **Add to chart**.
2. Strategies: open the **Strategy Tester** to see the backtest; tune inputs in the gear menu.
3. Screener: add `qullamaggie-screener.pine` to a chart, then go to the **Pine Screener**
   (screener.tradingview.com → Pine), select it, and **sort by "RS score"** and filter `Leader = 1`.

## What translates faithfully
- Regime gate (index 10/20 MA via `request.security`), ADR% stop sizing, **risk-based position
  size** (`shares = equity × risk% ÷ stopDist`), partial into strength, breakeven, **10/20 MA trail**.
- Entry = breakout above the consolidation / EP gap / parabolic first-crack, with the **LOD (or HOD)
  stop capped at 1× ADR — trades wider than 1 ADR are skipped**, exactly as he describes.

## What Pine canNOT do (read this before trusting a backtest)
1. **Universe ranking.** A `strategy` runs on ONE symbol and cannot pick the "top 1–2% gainers"
   across the market — the heart of his edge. The screener filters/sorts a watchlist you build; it
   does not rank the whole market. Do the cross-sectional ranking outside Pine (Finviz/TC2000, or the
   companion **Quant Spec** scanner).
2. **Opening-range entries are intraday.** On a daily chart the strategies enter on the daily close;
   for true 1-/5-minute ORH/ORL, run them on a 1m/5m chart (watch for repaint with `request.security`).
3. **EP catalyst quality.** Pine has no earnings-surprise/guidance feed, so the EP script approximates
   a pivot by **gap% + volume** only — it cannot tell a triple-digit-growth beat from a fluff gap.
4. **Shorting frictions.** The parabolic short ignores borrow availability, hard-to-borrow fees, and
   overnight gap risk. Treat its backtest as optimistic.

## Default inputs (starting points, not gospel)
Risk 0.4–0.5% per trade · ADR ≥ 5% (8% for shorts) · $ volume ≥ $20–50M · regime = SPY 10>20 rising ·
partial after 3–5 days / 2–3R · trail 10-EMA (fast) or 20 (slow). Tune per market and instrument.

See the companion **Playbook**, **Quant Spec**, and **Cheat Sheet** in the parent folder for the full
rationale behind every number.
