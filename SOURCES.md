# Malomo Screening V1 — Adoption Sources

This file lists only the sources that materially shaped the current Malomo Screening V1 architecture. It intentionally separates **adopted concepts**, **rejected concepts**, and **internal evidence** so future agents do not treat every source rule as a final Malomo rule.

## 1. Cryptoday / ARMADA public methodology

Primary public links:

- https://www.cryptoday.id/
- https://www.cryptoday.id/lab.html#rumus

Adopted at concept level:

- modular pipeline rather than one monolithic BUY/SELL indicator;
- separation of scanning, market/regime state, setup/confirmation, trade plan, risk, position management, and audit/journal;
- explicit reasoning for decisions;
- risk management as an independent layer;
- research lifecycle based on testing rather than trusting a signal.

Not adopted:

- any hidden or non-public formula;
- any exact regime classifier formula;
- any exact "3-layer confirmation" formula;
- any exact Donchian period or proprietary key-level rule;
- any parameter that was not publicly specified.

Rule: Cryptoday is used as an **architecture/process inspiration**, not as a copied trading strategy.

## 2. Claude TradingView Indicator Code [ATP]

Agent-readable raw source:

https://raw.githubusercontent.com/patahpensil/Malomo-Screening-V1/main/references/Claude%20TradingView%20Indicator%20Code%20%5BATP%5D.txt

Adopted at concept level:

- represent market information as separate dimensions/states;
- keep Direction/Trend-like state separate from Momentum;
- use Participation/Volume-like evidence as a separate state;
- persistence concept to prevent one-bar flicker;
- cooldown / duplicate-signal suppression concept;
- deterministic state calculation.

Explicitly rejected as final Malomo rules:

- two-tier unanimous consensus as the final trading rule;
- requirement that all enabled dimensions agree;
- ADX/DMI directional vote being treated as a true volatility model;
- fixed ATR(14) × 3 stop as a final rule;
- CTI indicator periods as final Malomo parameters.

Rule: CTI contributes the **state abstraction and signal-stability concepts**, not its exact strategy.

## 3. Independent CTI architecture backtest

Full report:

https://raw.githubusercontent.com/patahpensil/Malomo-Screening-V1/main/research/CTI_ARCHITECTURE_BACKTEST_REPORT.md

Summary data:

https://raw.githubusercontent.com/patahpensil/Malomo-Screening-V1/main/research/CTI_BACKTEST_SUMMARY.csv

Ablation data:

https://raw.githubusercontent.com/patahpensil/Malomo-Screening-V1/main/research/CTI_CLOSED_TRADE_ABLATION.csv

This research is the direct evidence behind several architecture decisions:

- unanimous 4-dimension consensus was not robust enough to adopt as the final decision model;
- Trend, Momentum, and DMI directional states showed substantial double counting;
- 4H exact consensus failed on closed trades;
- 1H performance was highly dependent on a small number of outlier winners;
- therefore the architecture keeps market-state dimensions but separates:
  - **Mandatory:** Direction, Setup, Trigger
  - **Quality Evidence:** Momentum, Participation, Volatility, Location
- end-of-dataset forced closes must not silently inflate strategy results;
- ablation findings on the same dataset are treated as hypotheses, not validated improvements.

## 4. Canonical Malomo documents

Project context:

https://raw.githubusercontent.com/patahpensil/Malomo-Screening-V1/main/PROJECT_CONTEXT.md

Architecture baseline:

https://raw.githubusercontent.com/patahpensil/Malomo-Screening-V1/main/Malomo%20Engine%20Screening.md

These two files are not external inspiration sources. They are the current canonical interpretation of the adopted concepts and evidence above.

## 5. Source hierarchy for future agents

When sources conflict, use this order:

1. PROJECT_CONTEXT.md — current project decisions and continuity.
2. Malomo Engine Screening.md — current architecture baseline.
3. CTI backtest report/results — empirical evidence.
4. Original CTI Pine source — source behavior only.
5. Cryptoday public pages — architecture/process inspiration only.

Do not promote any external parameter into a final Malomo rule unless it is explicitly documented as locked in the canonical project files.


## 6. Research implementation and UI references — 2026-10-07

- `malomo-engine-screening/docs/PRD.md`: operational research hypothesis, software contracts and explicit unvalidated parameters.
- `malomo-engine-screening/research/RESULTS.json`: actual six-pair research outcome, **NOT_VALIDATED**.
- `malomo-engine-screening/research/DATA_MANIFEST.json`: official Binance public archive URLs and SHA-256 provenance (https://data.binance.vision/).
- https://github.com/satnaing/shadcn-admin: UI navigation and dashboard density inspiration; no trading logic adopted and no claim of an objectively “best” UI.
- https://github.com/shadcn-ui/ui: accessible interface primitives used by the React application; preserve dependency/vendor licenses.
- Charts are custom SVG OHLC rendering, not TradingView or Cryptoday components.

The exact ATR×3 stop is **not adopted**; this does not reject researching an ATR-based risk hypothesis later. Hidden Cryptoday formulas remain excluded. Direction/Setup/Trigger remain mandatory, while Momentum/Participation/Volatility/Location remain descriptive evidence rather than unanimous votes. The negative candidate results do not change those source-attribution boundaries or establish predictive validity.
