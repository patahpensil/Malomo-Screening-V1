# Malomo Screening V1 — PROJECT CONTEXT

**Status:** Active project context  
**Repository:** `patahpensil/Malomo-Screening-V1`  
**Role:** Single source of truth for continuity across ChatGPT sessions.

---

## 1. Project Identity

Project name: **Malomo Screening V1**

Purpose: build a deterministic, modular trading screening engine that can be researched, backtested, implemented, audited, and eventually deployed without relying on one monolithic indicator or opaque signal stack.

Official GitHub repository for this project:

```text
patahpensil/Malomo-Screening-V1
```

Do not use or modify other repositories for this project unless the user explicitly changes this rule.

---

## 2. Canonical Architecture File

The architecture baseline is stored in:

```text
Malomo Engine Screening.md
```

That file is the canonical architecture reference.

Core flow:

```text
DATA
  ↓
MARKET STATE
  ↓
SETUP
  ↓
TRIGGER
  ↓
DECISION
  ↓
RISK
  ↓
TRADE PLAN
  ↓
POSITION MANAGEMENT
  ↓
JOURNAL / AUDIT
```

---

## 3. Locked Architecture-Level Decisions

The following are locked at architecture level:

- Modular layered engine
- Market Data Engine
- Universe Scanner
- Market State Engine
- Direction dimension
- Momentum dimension
- Participation dimension
- Volatility dimension
- Location dimension
- Setup Engine
- Trigger Engine
- Decision Engine
- Separation of mandatory conditions from quality evidence
- Independent Risk Engine
- Trade Plan Engine
- Position State Machine
- Journal / Audit layer
- Independent Research / Validation layer

Mandatory decision core:

```text
Direction
Setup
Trigger
```

Quality evidence:

```text
Momentum
Participation
Volatility
Location
```

Quality evidence must not automatically become a hard gate unless independent testing proves out-of-sample value.

---

## 4. Current Architectural Principle

Malomo Screening V1 is intended to operate as a **deterministic market decision engine**, not as a collection of indicators that must all vote unanimously.

Key rules:

1. Scanner is not the strategy.
2. Direction is not an entry.
3. Setup is not a trigger.
4. Trigger must be causal and reproducible.
5. Raw indicators do not directly generate the final trade decision.
6. Market features are converted into interpretable states first.
7. Mandatory structural conditions are separated from quality evidence.
8. Risk Engine is independent from Decision Engine.
9. Risk Engine may reject a valid signal.
10. Every decision, including NO TRADE, must be auditable.
11. Live and backtest logic must share deterministic definitions.
12. No look-ahead data is permitted.
13. No parameter is final until separately validated.

---

## 5. Data / Market Scope — Current Baseline

Primary intended market source:

- Binance USDⓈ-M Futures REST API
- Binance USDⓈ-M Futures WebSocket

Expected data classes:

- OHLCV / Klines
- Quote Volume
- Funding Rate
- Open Interest
- Taker Buy / Sell information
- Aggregate Trades when required
- Best Bid / Ask when required

Initial architectural timeframes:

- 1H
- 4H
- 1D

The exact functional role of each timeframe is not yet locked.

---

## 6. Research Evidence Already Established

A prior architecture inspired by a TradingView Pine Script using unanimous multi-dimension consensus was tested on historical Binance USDⓈ-M data across BTC, ETH, SOL, BNB, XRP, and DOGE.

Important result:

### 1H closed-trade result

- 435 closed trades
- Win rate: 28.0%
- Profit Factor: 1.35
- Average net/trade: +0.69%
- 2× cost stress PF: 1.29
- Only 3 of 6 pairs net positive

Robustness warning:

- Removing the largest winner reduced PF to 1.18
- Removing the top 3 winners reduced PF to 0.98
- Removing the top 5 winners reduced PF to 0.85

Conclusion: positive sample result existed, but the edge was heavily dependent on a few outlier trades and was not considered robust enough for deployment.

### 4H closed-trade result

- 110 closed trades
- Win rate: 22.7%
- Profit Factor: 0.84
- Average net/trade: -0.65%
- 2× cost stress PF: 0.82

Conclusion: FAIL.

### Redundancy finding

Trend, Momentum, and DMI/ADX-derived directional states were highly correlated, indicating significant double-counting.

This is one of the reasons the current architecture separates:

```text
Mandatory:
Direction
Setup
Trigger

Quality:
Momentum
Participation
Volatility
Location
```

and rejects universal unanimous indicator gating.

---

## 7. Important Backtest Integrity Rule

A prior audit found that forced end-of-data closing of still-open positions materially inflated apparent results.

Therefore:

- Primary strategy evaluation should use clearly defined closed-trade logic.
- Forced end-of-data mark-to-market must be labeled separately.
- Any exit assumption not defined by the strategy must be explicitly documented.
- Backtests must never silently use favorable forced exits.

---

## 8. Research / Validation Standard

Required research progression:

```text
Historical Data
      ↓
Backtest
      ↓
Ablation Test
      ↓
Walk-Forward Validation
      ↓
Purged Validation / CPCV where appropriate
      ↓
Cost Stress Test
      ↓
Monte Carlo / Block Bootstrap
      ↓
Untouched Holdout
      ↓
Paper Trading
      ↓
Live Small Size
```

A component must not be promoted to mandatory status only because it improves in-sample performance.

---

## 9. Not Yet Locked

The following remain open and must be finalized module-by-module:

- Exact indicators
- Exact formulas
- Periods
- Thresholds
- Universe size
- Ranking formula
- Direction definition
- Setup definitions
- Trigger definitions
- Persistence duration
- Cooldown duration
- Quality scoring method
- Risk percentage
- Stop-loss formula
- Exit policy
- Position sizing formula
- Portfolio limits
- Kill-switch thresholds
- Exact deployment architecture

Do not invent these values merely to complete implementation.

---

## 10. Working Method

For material changes use this sequence:

```text
DISCUSS
  ↓
DECIDE
  ↓
DOCUMENT
  ↓
IMPLEMENT
  ↓
TEST
  ↓
COMMIT / PUSH
  ↓
DEPLOY
```

For each important decision:

1. Record the decision in project documentation.
2. Record what remains open.
3. Record any test evidence supporting the decision.
4. Do not silently overwrite prior locked definitions.
5. If new evidence contradicts an earlier decision, explicitly revise the decision and document why.

---

## 11. Session Continuity Rule

When a new ChatGPT session starts inside this project:

1. Read `PROJECT_CONTEXT.md`.
2. Read `Malomo Engine Screening.md`.
3. Inspect the current state of `patahpensil/Malomo-Screening-V1` if coding work is requested.
4. Continue from the latest documented state.
5. Do not reconstruct project rules from memory when the canonical files are available.

---

## 12. Current Next Step

The architecture is established, but formulas and parameters are intentionally not finalized.

Next development should proceed module-by-module, beginning with objective definitions and tests rather than immediate deployment.

---

**Last context baseline:** 2026-10-07
