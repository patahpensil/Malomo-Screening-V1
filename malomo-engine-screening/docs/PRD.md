# Malomo Screening V1 — PRD 1.0

Status: operational research release. Software contracts validated; strategy NOT VALIDATED.
Authority: PROJECT_CONTEXT.md, Malomo Engine Screening.md, SOURCES.md. User authorization 2026-10-07: choose implementation autonomously, test point by point, document, implement, commit/push and deploy only Malomo-Screening-V1.

## Product
Private crypto futures research workspace: scanner, inspectable pair chart and states, research candidates, risk review, paper position tracking, durable journal, reproducible research and configuration. No real-money order execution. A live website and a profitable strategy are separate release criteria. Failed strategy evidence remains visible. No simulated/random data is presented as market data.

## Tested candidate and adoption status
Candidate `malomo-research-1.0.0` is a research-only formula, not a newly locked profitable Malomo rule. Technical calculation rules below passed module tests. Six fixed Binance UM pairs, 91,872 hourly candles, Jan 2025–Sep 2026. 71 closed trades, PF 0.9303, mean -0.0481R; OOS PF 0.9761; holdout PF 0.9706 on 30 trades; double costs PF 0.9035. Two unresolved positions excluded from closed results. Funding omitted; no live trading authorization. No optimization was performed after viewing results.

### 1. Data
Binance USD-M perpetual, USDT quote/margin, status TRADING. REST normal official endpoints for exchangeInfo, ticker/24hr, klines. Browser WebSocket public ticker feed for price display only. Closed bars alone drive decisions. REST fetch is authoritative after disconnect; no synthetic candle insertion. Live stale/malformed/gapped data rejects analysis. Every snapshot records source, mode and as-of. HTTP 451 or other failures are visible and never trigger a covert endpoint bypass. Public archives are explicitly HISTORICAL, not live fallback. UTC aggregation, Asia/Makassar display.

### 2. Universe
Live: eligible contracts sorted descending numeric quoteVolume24h, alphabetical tie break. Default top 50 (operational bounded workload; no alpha claim), choices 25/50/100/250. Refresh on scan; concurrency 3 pairs. Archive: six fixed research pairs ranked by their archived trailing 24H quote volume, with fixed-universe label. Watchlist is persistent and independent of scanner eligibility.

### 3. Timeframes / states
1D structural direction; 4H structural direction and setup; 1H closed-bar trigger. Minimum 60 daily / 80 four-hour / 80 hourly candles. Strict 5-bar swing: center high greater than all four neighbors / low less than all four, available only at second right candle close; equal pivots not selected. Last two highs and lows both rising => bullish, both falling => bearish. Close past latest protected opposite swing => transition. Mixed structure => transition; insufficient swings => neutral. Live and research use identical functions.

### 4. Setup
1D/4H direction must agree in this research candidate. 4H close crosses last prior confirmed high/low, previous close on other side; LONG/SHORT mirror. Setup holds original structural stop (last opposite confirmed 4H swing) and event extremes. Valid for 12 hours (research parameter, not optimized), replaced by a newer break. Candidate setup taxonomy implemented for breakout/breakdown/retest. Other families in architecture remain research backlog, not hidden active rules.

### 5. Trigger / persistence
After setup candle closes, a 1H close crosses event high/low OR touches break level and closes back through it and previous 1H extreme (retest). Wick alone never confirms a break. Close past stop invalidates. While a valid aligned setup is waiting, the pair detail shows conditional breakout and retest thresholds, structural stop and expiry. A pre-trigger entry price is unknown; the reference entry is the confirming 1H close and the paper fill is the next available 1H open. These preview levels never create an order or trade plan. Setup ID suppresses duplicate paper plans; no arbitrary universal 10-bar cooldown. One closed-candle event confirmation is the current persistence rule; multi-bar persistence is unvalidated.

### 6. Decision and quality
Mandatory Direction + Setup + Trigger. Quality never vetoes or weights that decision. Momentum = sign of three-hour close change. Participation = taker buy quote / total quote, accompanied by RVOL versus preceding 20 hourly bars. Volatility = current normalized H-L range percentile against previous 79 hourly ranges (quartile/95th percentile descriptive bands). Location = upper/middle/lower fifth of trailing 20 hourly range. These descriptive parameters are not predictive claims or adopted CTI settings. OI/funding are not manufactured where absent.

### 7. Risk / plan
Independent paper-only risk engine, default virtual equity 10,000 USDT, risk 0.5% per position, aggregate planned risk <=1.5%, max 3 concurrent positions, per-position notional <= virtual equity, kill switch. Inputs bounded; server validates. Stops structural; research target 2R, no fixed ATR×3 rule. Paper entry next available 1H open, gap invalidation supported; target recomputed from actual fill. Fee+slippage modeled 0.05% per side, 2× research stress. Funding absent and disclosed. These are simulation controls, not recommendations for user money.

### 8. Position management
WAITING_ENTRY -> ACTIVE -> TARGET/STOPPED/CLOSED, or WAITING_ENTRY -> INVALIDATED/CANCELLED. Conservative stop-first when both stop and target touched in an hourly candle; adverse gaps fill at open. Pending orders count toward risk. No untested breakeven/trailing feature. Tracking reconciles during scans/replay while app is active; no claim of unattended execution. Missing tracking candles freeze updates with a visible error.

### 9. Journal
Every successfully evaluated scan decision including WAIT/NO_TRADE stored by version, symbol, as-of, mode; repeated scans idempotent. Data failures also logged. Store features, reason, risk status and plan. Persist watchlist, settings and paper positions in D1. Exports CSV/JSON from actual records; notes bounded and saved server-side. No browser-only authoritative state.

### 10. Research
Expose per-pair, development Jan-Jun 2025, OOS Jul-Dec 2025, consumed holdout Jan-Sep 2026, cost stress, largest-winner exclusion, seeded block bootstrap (5-trade blocks; not portfolio simulation), open positions separately. Holdout pass threshold fixed: >=100 closed trades, PF>1, lower 95% bootstrap mean >0 and >=4/6 pairs positive, with funding/data limitations still applying. Current candidate fails. Re-run reproduces stored results with identical engine. No end-of-data forced closes in primary results.

### 11. UI/UX acceptance specification
GitHub references: satnaing/shadcn-admin (navigation, responsive density), shadcn-ui/ui (accessible primitives). Custom charcoal/slate palette, lime accent, numeric typography, clearly separated green/red directions. Working scanner as first view, no marketing hero. Sidebar: Overview, Scanner, Watchlist, Trade Plans, Journal, Research, Settings. Pair panel contains real OHLC chart 1H/4H/1D, market states, pipeline checklist and risk review. Search, filter, sort, favorite, refresh, export, replay, save paper plan, position refresh/cancel/close, notes, settings save all have actual handlers and success/error feedback. Mobile navigation, keyboard focus, dialog focus trap, escape close, labeled controls, readable contrast. No dead buttons. UX status becomes verified only after rendered interaction checks; record failures in VALIDATION.md.

## Release gates
- Module tests, prefix causality check, historical reproducibility, TypeScript, build, API persistence and negative validation.
- Render and interaction QA when supported, with limitations explicit.
- Commit/push to permitted GitHub repo, publish private Site, verify successful deployment.
- Real-time service availability reported separately from publication status.
