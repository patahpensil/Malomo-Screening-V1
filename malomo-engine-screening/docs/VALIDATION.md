# Validation record — 2026-10-07

Scope: `malomo-research-1.0.0`, operational research release. Passing software checks does not validate trading profitability.

| Gate | Result | Evidence |
|---|---|---|
| Data validation and full UTC aggregation | PASS | `research/module-tests.ts`: unclosed, malformed, gap/duplicate rejection |
| Scanner eligibility/ranking | PASS | Numeric volume, eligible perpetuals, deterministic ties |
| Swing timing, independent quality, mandatory gates, long/short symmetry | PASS | Module tests; confirmed swings require two right closes |
| Risk, conservative exit, paper state lifecycle | PASS | Kill switch/limits, stop-first/gap, next-open, idempotency tests |
| Future leakage regression | PASS | `research/causality-tests.ts`: BTC full run vs three historical prefixes; all six replay setups reconstructed from prefixes |
| Module total | PASS | 16 tests, 0 failures; `research/module-test.log` |
| Historical reproduction | PASS | 91,872 hourly candles; six pairs; same 71 trades and PF 0.9303150619269429 after rerun |
| Built Worker + D1 integration | PASS | 22 checks, 0 failures; `research/api-tests.mjs`, `research/api-test.log` |
| TypeScript | PASS | `tsc --noEmit` |
| Production Worker build | PASS | Vinext/Cloudflare Worker build |
| Trading edge | FAIL / NOT_VALIDATED | Full PF 0.9303; OOS PF 0.9761; holdout PF 0.9706 on 30 trades; funding absent |

API checks use an isolated database, apply actual SQL migrations and dispatch HTTP requests to the compiled Worker. They cover origin rejection, invalid risk inputs, watchlist add/remove, all six archive decisions, scan idempotency, notes, canonical replay, kill switch, duplicate paper plans, next-open entry, no rewind on older replay, manual close/net P&L, terminal-state persistence, cancellation, stale LIVE rejection and error audit, 96-candle tracking and replay bounds. Position updates use payload compare-and-swap to avoid overwriting concurrent terminal state.

## Rendered interaction checks

Desktop Chrome at 1348×926. Visually inspected charcoal/lime overview, chart and state hierarchy. Verified through rendered controls:

- Navigation to Overview, Scanner, Watchlist, Trade plans, Journal, Research and Settings.
- Watchlist add and retained selection across navigation and hot reload.
- Pair detail sheet and close; explicit mandatory/quality evidence.
- Chart 1H / 4H / 1D and zoom changes (48/72 candle windows).
- Search SOL plus aligned-direction filter produced exactly one matching row; alphabetical sort changed first row to BNB.
- Actual browser downloads from scanner CSV and research JSON export.
- BTC historical replay produced a valid SHORT; saved WAITING_ENTRY; second save rejected; next candle became ACTIVE with actual next-open fill; manual close removed active risk.
- Journal note saved and retained after reload; repeated scans kept the same decision count.
- Risk form cancel restored original equity; kill switch persisted, then restored to off.
- Research “Verifikasi ulang” completed and visibly reported matching results.
- Live REST failure surfaced with empty current data; WebSocket showed connected. No archived quote was shown as live. The final error wording was clarified and unavailable prices render as a dash.

Fixes from QA: clear prior mode data during source transitions; keep replay navigation hash consistent; add accessible watchlist column label; display closed-candle as-of for live packets; avoid zero-valued placeholder quotes; protect position writes from stale updates.

## Explicit limits

- Successful real-time REST scanning could not be verified: official endpoints returned HTTP 451 in the server environment and fetch failure in the browser. No bypass attempted. Live mode remains conditional on normal access to Binance.
- Mobile responsive CSS and sidebar primitives are included; a resized mobile viewport was not rendered in this browser API, so mobile visual QA is not claimed complete.
- Optional WebMCP registration is feature-detected; this browser exposed no registered tools. It is not required for any user-facing feature.
- Browser export was verified by a completed download event; no independent spreadsheet compatibility certification is claimed.
- Development preview initially loaded slowly; subsequent interactions completed normally. Production deployment verification is recorded by the publishing service separately.

## Research interpretation

No optimization followed the negative results. The current numerical candidate remains experimental. OOS/holdout results, cost stress, bootstrap intervals, winner-removal stress and open-at-end positions are visible. Do not promote any tested calculation parameter to a profitable locked rule. The original source-adoption boundaries remain authoritative.
