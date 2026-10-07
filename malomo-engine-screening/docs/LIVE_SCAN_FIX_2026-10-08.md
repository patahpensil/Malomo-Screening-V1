# Live scan validation repair — 8 October 2026 (WITA)

## Evidence

Production `POST /api/workspace` requests returned HTTP 400 around 03:30 WITA.
The deployed stack location maps to parsing the `symbols` array, before per-pair
processing. The old regex accepted only uppercase ASCII bases of length 2–24.
That excludes legitimate UTF-8 identifiers and one-character bases. The recorded
exception does not include the exact submitted symbols; no specific failing
pair is asserted from these logs.

An exception in a later three-pair batch aborted the client scan. Previously
completed rows remained visible, but chart assignment only happened after the
entire loop, leaving an indefinite skeleton.

## Changes

- Accept bounded Unicode letters, marks and numbers with an exact USDT suffix.
  Preserve symbol spelling and case. Keep parameterized database operations.
- Validate individual identifiers inside their per-pair error boundary.
- Preserve completed results and continue later batches after a failed batch.
- Populate the chart from a successful current-scan packet as batches complete.
- Report partial completion and show an explicit empty chart state after failure.
- Include input field paths in malformed-request diagnostics.

## Verification

Production build and TypeScript checks pass. All 27 isolated Worker/D1 integration
checks pass, including mixed ASCII/UTF-8/one-character live payloads, invalid-pair
isolation, UTF-8 watchlist round trips, stale-data rejection and existing paper
position behavior. Regression fixtures shift archived candle timestamps solely
inside the isolated test database; they are never shipped as live market data.

Binance confirms UTF-8 futures identifiers in its official announcement:
https://www.binance.com/en/support/announcement/detail/a6aeec228c6a403da616e873011317ea
