# Malomo Engine Screening

**Status:** Architecture Baseline v0.1  
**Scope:** Screening Engine Architecture  
**Purpose:** Modular crypto futures screening and trade-decision architecture.  
**Important:** This document locks the system architecture only. Indicator formulas, thresholds, periods, scoring weights, and trading parameters are **not yet final** unless explicitly stated in later revisions.

---

## 1. Core Principle

Malomo Engine Screening is not designed as a single BUY/SELL indicator.

The engine separates market analysis into independent layers:

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

Each layer must be independently testable and replaceable without requiring changes to unrelated layers.

---

# 2. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                 DATA SOURCES                 │
│ Binance REST + WebSocket                    │
│ OHLCV • Volume • Funding • OI • Taker Flow │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│              MARKET DATA ENGINE              │
│ Candle Builder • Cache • Validation          │
│ 1H • 4H • 1D                                │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│               UNIVERSE SCANNER               │
│ Eligible USDT-M perpetual                    │
│ Liquidity / volume ranking                   │
│ Data quality check                           │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│             MARKET STATE ENGINE              │
│                                              │
│ Direction       → Bull / Bear / Neutral      │
│ Momentum        → Bull / Bear / Neutral      │
│ Participation   → Bull / Bear / Neutral      │
│ Volatility      → Expansion / Normal / Low   │
│ Location        → Favorable / Neutral / Poor │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│                SETUP ENGINE                  │
│ Trend Continuation                          │
│ Breakout / Breakdown                        │
│ Pullback / Retest                           │
│ Reversal Candidate                          │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│               TRIGGER ENGINE                 │
│ Objective Price Event                        │
│ Confirmed Candle Close                       │
│ Persistence Check                            │
│ Cooldown / Duplicate Suppression             │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│              DECISION ENGINE                 │
│                                              │
│ MANDATORY                                    │
│ Direction                                    │
│ Setup                                        │
│ Trigger                                      │
│                                              │
│ QUALITY EVIDENCE                             │
│ Momentum                                     │
│ Participation                                │
│ Volatility                                   │
│ Location                                     │
│                                              │
│ OUTPUT                                       │
│ LONG / SHORT / WAIT / NO TRADE               │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│                 RISK ENGINE                  │
│ Entry Zone                                   │
│ Structural / ATR Stop                        │
│ Position Sizing                              │
│ Exposure Limits                              │
│ Portfolio Drawdown Control                   │
│ Kill Switch                                  │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│             TRADE PLAN ENGINE                │
│ Symbol                                       │
│ Direction                                    │
│ Entry                                        │
│ Stop                                         │
│ Initial Risk                                 │
│ Exit Method                                  │
│ Invalidation                                 │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│            POSITION STATE MACHINE            │
│ WAITING ENTRY                                │
│ ACTIVE                                       │
│ PROTECTED                                    │
│ TRAILING                                     │
│ EXIT                                         │
│ INVALIDATED                                  │
└─────────────────────┬────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│          JOURNAL / AUDIT / ANALYTICS         │
│ Every Decision Saved                         │
│ Why LONG / SHORT / WAIT / NO TRADE           │
│ Feature State at Decision Time               │
│ Trade Outcome                                │
│ Backtest / Live Comparison                   │
└──────────────────────────────────────────────┘
```

---

# 3. Data Sources

Primary market data source:

- Binance USDⓈ-M Futures REST API
- Binance USDⓈ-M Futures WebSocket

Expected data classes:

- OHLCV / Klines
- Quote Volume
- Funding Rate
- Open Interest
- Taker Buy / Sell information
- Aggregate Trades when required
- Best Bid / Ask when required for execution

No trading decision may depend on unavailable future data.

---

# 4. Market Data Engine

Responsibilities:

1. Acquire raw market data.
2. Validate timestamps and continuity.
3. Detect missing candles or malformed records.
4. Build and maintain required timeframes.
5. Cache historical and live data.
6. Make standardized market data available to downstream modules.

Initial architectural timeframes:

- 1H
- 4H
- 1D

The timeframe role is not yet permanently assigned in this architecture document.

---

# 5. Universe Scanner

The Universe Scanner determines which markets are eligible for analysis.

It does **not** generate LONG or SHORT signals.

Responsibilities:

```text
Binance USDT-M Perpetual
        ↓
Contract Eligibility
        ↓
Trading Status Check
        ↓
Historical Data Sufficiency
        ↓
Liquidity / Quote Volume Ranking
        ↓
Data Quality Check
        ↓
Candidate Universe
```

Possible output states:

- ELIGIBLE
- NOT_ELIGIBLE
- DATA_INCOMPLETE
- LIQUIDITY_TOO_LOW

Exact universe size, update frequency, and liquidity thresholds remain to be tested and finalized.

---

# 6. Market State Engine

The Market State Engine converts raw indicators/features into interpretable market states.

Raw indicators must not directly produce the final trading decision.

## 6.1 Direction

Purpose:

> Determine the dominant directional condition of the market.

State model:

- BULLISH
- BEARISH
- NEUTRAL
- TRANSITION

Exact formula is not yet locked.

---

## 6.2 Momentum

Purpose:

> Determine whether current price movement supports bullish or bearish continuation.

State model:

- BULLISH
- BEARISH
- NEUTRAL

Momentum is treated as a market-quality dimension and must be tested for independent contribution before becoming a hard gate.

---

## 6.3 Participation

Purpose:

> Determine whether market participation supports the observed price movement.

Potential source data:

- Volume
- Open Interest change
- Taker Buy / Sell ratio
- Funding context

Possible state model:

- STRONG_BULL
- BULL
- NEUTRAL
- BEAR
- STRONG_BEAR

Exact aggregation logic remains open for research.

---

## 6.4 Volatility

Volatility is separated from directional analysis.

State model:

- LOW
- NORMAL
- EXPANDING
- EXTREME

Volatility is primarily context and risk information unless future testing demonstrates a justified hard gate.

---

## 6.5 Location

Purpose:

> Determine whether the current market price is located in an acceptable area for a potential trade.

Potential inputs:

- Structural swings
- Breakout / breakdown levels
- Retest zones
- Support / resistance
- Range position
- Liquidity areas

State model:

- FAVORABLE
- ACCEPTABLE
- POOR

Exact definition remains to be finalized through testing.

---

# 7. Setup Engine

Direction and setup are separate concepts.

A BULLISH market state does not automatically mean LONG.

The Setup Engine identifies the current structural trading condition.

Initial setup taxonomy:

- BREAKOUT
- BREAKDOWN
- PULLBACK
- RETEST
- CONTINUATION
- REVERSAL_CANDIDATE
- NO_SETUP

Each setup must eventually receive an objective definition that can be reproduced deterministically from historical data.

---

# 8. Trigger Engine

A setup is not an entry.

The Trigger Engine determines whether an objective entry event has occurred.

Architecture:

```text
SETUP FOUND
    ↓
TRIGGER CONDITION
    ↓
CANDLE CLOSE CONFIRMATION
    ↓
PERSISTENCE / VALIDITY CHECK
    ↓
COOLDOWN / DUPLICATE CHECK
    ↓
VALID TRIGGER
```

Responsibilities:

- Prevent intrabar look-ahead.
- Prevent duplicate signals.
- Prevent signal flickering.
- Distinguish setup formation from actual entry permission.

Persistence length and cooldown duration are not yet locked.

---

# 9. Decision Engine

This architecture explicitly rejects a universal rule requiring all indicators or all dimensions to agree simultaneously.

The Decision Engine uses two classes of evidence.

## 9.1 Mandatory Conditions

The structural core consists of:

- Direction
- Setup
- Trigger

If any mandatory component fails:

```text
NO TRADE
```

---

## 9.2 Quality Evidence

Quality evidence includes:

- Momentum
- Participation
- Volatility
- Location

Quality evidence should not automatically invalidate an otherwise structurally valid setup unless independent testing proves that doing so improves out-of-sample expectancy.

Potential quality states:

- VALID_HIGH_QUALITY
- VALID_NORMAL
- VALID_LOW_QUALITY
- WAIT
- NO_TRADE

The exact scoring or weighting mechanism is not yet locked.

---

# 10. Risk Engine

The Risk Engine is independent from the Signal / Decision Engine.

A valid signal may still be rejected by the Risk Engine.

Examples:

```text
DECISION ENGINE → LONG VALID
RISK ENGINE     → REJECT
```

Possible rejection reasons:

- Portfolio drawdown too large
- Exposure limit reached
- Stop distance unacceptable
- Market liquidity inadequate
- Excessive correlated exposure
- System kill switch active

Responsibilities:

- Position sizing
- Initial stop calculation
- Maximum trade risk
- Maximum pair exposure
- Maximum portfolio exposure
- Drawdown throttle
- Daily / weekly risk limits
- Kill switch

Exact risk parameters remain to be separately tested and finalized.

---

# 11. Trade Plan Engine

A trade plan is generated only after:

```text
DECISION = VALID
AND
RISK = PASS
```

Required output fields:

```text
SYMBOL
DIRECTION
MARKET STATE
SETUP
TRIGGER
ENTRY / ENTRY ZONE
STOP LOSS
INITIAL RISK
EXIT MODE
INVALIDATION
QUALITY STATE
RISK STATUS
```

Example logical representation:

```text
PAIR        : BTCUSDT
DIRECTION   : LONG
STATE       : VALID
SETUP       : BREAKOUT
ENTRY       : [calculated by entry module]
STOP        : [calculated by risk module]
RISK        : [calculated by sizing module]
EXIT MODE   : [position management policy]
INVALIDATE  : [structural invalidation]
QUALITY     : NORMAL
```

---

# 12. Position State Machine

Every setup and open trade must have an explicit state.

Main lifecycle:

```text
CANDIDATE
    ↓
WAITING_ENTRY
    ↓
ACTIVE
    ↓
PROTECTED
    ↓
TRAILING
    ↓
CLOSED
```

Alternative paths:

```text
WAITING_ENTRY
    ↓
INVALIDATED
```

```text
ACTIVE
    ↓
STOPPED
```

```text
ACTIVE
    ↓
MANUAL_OR_SYSTEM_EXIT
```

This state machine prevents the system from losing track of setups and positions.

---

# 13. Journal / Audit Engine

Every decision must be recorded, including decisions that do not create a trade.

Minimum journal scope:

- Timestamp
- Symbol
- Timeframe
- Direction state
- Momentum state
- Participation state
- Volatility state
- Location state
- Setup state
- Trigger state
- Decision
- Rejection reason
- Risk decision
- Trade plan if generated
- Position outcome

Example:

```text
BTCUSDT
Direction      : Bullish
Setup          : Breakout
Momentum       : Bullish
Participation  : Neutral
Volatility     : Normal
Location       : Favorable
Trigger        : Failed

Decision       : NO TRADE
Reason         : Trigger not confirmed
```

NO TRADE is a valid system output and must be auditable.

---

# 14. Research / Backtest Architecture

Research tools must be separated from the live execution engine but use the same deterministic strategy definitions.

Required research modules:

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

# 15. Proposed Backend Structure

```text
malomo-engine-screening/
│
├── core/
│   ├── market_data/
│   ├── universe/
│   ├── indicators/
│   ├── structure/
│   ├── direction/
│   ├── momentum/
│   ├── participation/
│   ├── volatility/
│   └── location/
│
├── strategy/
│   ├── setup_engine/
│   ├── trigger_engine/
│   └── decision_engine/
│
├── risk/
│   ├── position_sizing/
│   ├── exposure/
│   ├── drawdown/
│   └── kill_switch/
│
├── trading/
│   ├── trade_plan/
│   ├── position_manager/
│   └── execution/
│
├── research/
│   ├── backtest/
│   ├── walk_forward/
│   ├── ablation/
│   ├── monte_carlo/
│   └── holdout/
│
├── storage/
│   ├── market_data/
│   ├── decisions/
│   ├── setups/
│   ├── trades/
│   └── metrics/
│
├── api/
│   ├── scanner/
│   ├── candidates/
│   ├── tradeplans/
│   ├── positions/
│   └── analytics/
│
└── ui/
    ├── dashboard/
    ├── scanner/
    ├── pair_detail/
    ├── trade_plan/
    ├── journal/
    └── research/
```

---

# 16. Architectural Rules

The following rules are part of the architecture baseline:

1. **Scanner is not the strategy.**
2. **Direction is not an entry.**
3. **Setup is not a trigger.**
4. **Trigger must be causal and reproducible.**
5. **Raw indicators do not directly generate the final trade decision.**
6. **Market features are normalized into interpretable states first.**
7. **Mandatory structural conditions are separated from quality evidence.**
8. **Quality evidence must prove independent value before becoming a hard gate.**
9. **Risk Engine is independent from Decision Engine.**
10. **Risk Engine may reject a valid trading signal.**
11. **Every decision, including NO TRADE, must be journaled.**
12. **Live and backtest logic must share deterministic definitions.**
13. **No look-ahead data is permitted.**
14. **No parameter is considered final until separately validated.**
15. **No architecture change should silently alter a locked trading definition.**

---

# 17. Current Status

## Locked at architecture level

- Modular layered engine
- Market Data Engine
- Universe Scanner
- Market State Engine
- Direction / Momentum / Participation / Volatility / Location dimensions
- Setup Engine
- Trigger Engine
- Decision Engine
- Mandatory vs Quality Evidence separation
- Independent Risk Engine
- Trade Plan Engine
- Position State Machine
- Journal / Audit layer
- Independent Research / Validation layer

## Not yet locked

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

These items must be finalized module-by-module through objective testing.

---

# 18. System Philosophy

Malomo Engine Screening must operate as a **deterministic market decision engine**, not as a collection of indicators voting randomly for BUY or SELL.

The core design principle is:

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
```

The architecture is designed so that any individual market-state model, setup detector, trigger, or risk rule can be tested, replaced, or removed without rewriting the entire system.

---

**End of Architecture Baseline v0.1**