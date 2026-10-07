# CTI Dimension-Consensus Architecture — Independent Backtest

## Scope
- Source rules: supplied Pine indicator, exact defaults.
- Data: Binance USD-M futures, BTC/ETH/SOL/BNB/XRP/DOGE, Jan-Nov 2024.
- Timeframes: 1H and 4H.
- Signal: exact unanimous consensus of enabled dimensions, persistence=2 bars, cooldown=10 bars.
- Entry: next-bar open after signal close (causal).
- Initial stop: fixed 3x ATR(14), from source.
- Source does not define a full strategy exit. For testability, opposite signal exits/reverses at next-bar open; this is an explicit derived assumption from the script state switch.
- Base cost: 0.05% per side = 0.04% fee + 0.01% slippage. 2x stress: 0.10% per side.
- Funding not modeled (not available in supplied archive).

## Verdict-first results — closed trades only

| TF | Trades | Win | PF | Avg net/trade | Avg R | Jan-Aug PF | Sep-Nov PF | PF excl DOGE+XRP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1h | 435 | 28.0% | 1.35 | 0.69% | 0.359R | 1.16 | 2.16 | 1.26 |
| 4h | 110 | 22.7% | 0.84 | -0.65% | 0.121R | 1.09 | 0.11 | 0.86 |

### Cost stress
- 1H exact, closed only: base PF 1.35; 2x-cost PF 1.29.
- 4H exact, closed only: base PF 0.84; 2x-cost PF 0.82.

## End-of-dataset distortion
If positions still open on 30 Nov are forcibly marked to market, apparent PF jumps to 1.69 (1H) and 2.19 (4H). This is misleading for robustness assessment. The largest unresolved positions were XRP/DOGE November longs. Therefore the main verdict uses closed trades only.

## Outlier sensitivity
| timeframe   |   drop_top |   trades |       pf |   avg_net_pct |   total_net_pct |      avg_R |   total_R |
|:------------|-----------:|---------:|---------:|--------------:|----------------:|-----------:|----------:|
| 1h          |          0 |      435 | 1.35403  |     0.690067  |        300.179  |  0.359317  |  156.303  |
| 1h          |          1 |      434 | 1.17818  |     0.348101  |        151.076  |  0.298694  |  129.633  |
| 1h          |          3 |      432 | 0.983517 |    -0.0323509 |        -13.9756 |  0.0673058 |   29.0761 |
| 1h          |          5 |      430 | 0.848256 |    -0.299219  |       -128.664  | -0.0756614 |  -32.5344 |
| 1h          |         10 |      425 | 0.673975 |    -0.650442  |       -276.438  | -0.171082  |  -72.7098 |
| 4h          |          0 |      110 | 0.841404 |    -0.64702   |        -71.1723 |  0.121387  |   13.3526 |
| 4h          |          1 |      109 | 0.68501  |    -1.29685   |       -141.356  | -0.097357  |  -10.6119 |
| 4h          |          3 |      107 | 0.457494 |    -2.27531   |       -243.458  | -0.351987  |  -37.6626 |
| 4h          |          5 |      105 | 0.294028 |    -3.01729   |       -316.815  | -0.497487  |  -52.2361 |
| 4h          |         10 |      100 | 0.143514 |    -3.84361   |       -384.361  | -0.619745  |  -61.9745 |

1H becomes negative after removing its five largest completed winners. 4H drops below PF 1 after removing only a few largest winners. The architecture is right-tail dependent.

## Dimension dependence / double counting
| timeframe   | dim1       | dim2        |   spearman |   same_dir |   overlap |
|:------------|:-----------|:------------|-----------:|-----------:|----------:|
| 1h          | trend      | momentum    |   0.420688 |   0.996904 |      9366 |
| 1h          | trend      | volatility  |   0.669554 |   0.983316 |     19780 |
| 1h          | trend      | volume_vote |   0.353728 |   0.745161 |     25110 |
| 1h          | momentum   | volatility  |   0.322445 |   0.835474 |     12144 |
| 1h          | momentum   | volume_vote |   0.487572 |   0.884888 |     19355 |
| 1h          | volatility | volume_vote |   0.264562 |   0.658462 |     33355 |
| 4h          | trend      | momentum    |   0.400058 |   0.996729 |      2140 |
| 4h          | trend      | volatility  |   0.661782 |   0.979326 |      4837 |
| 4h          | trend      | volume_vote |   0.347657 |   0.741689 |      6016 |
| 4h          | momentum   | volatility  |   0.349293 |   0.861589 |      3020 |
| 4h          | momentum   | volume_vote |   0.505537 |   0.905872 |      4632 |
| 4h          | volatility | volume_vote |   0.296005 |   0.675447 |      8618 |

When Trend and Momentum are both non-neutral, they point the same way ~99.7% of the time; Trend and ADX/DMI ~98%. These are not independent confirmations.

## Ablation / relaxed consensus (same 2024 sample; research only)
| timeframe   | variant        |   trades |   win_rate |       pf |   avg_net_pct |     avg_R |   pf_jan_aug |   pf_sep_nov |
|:------------|:---------------|---------:|-----------:|---------:|--------------:|----------:|-------------:|-------------:|
| 1h          | exact_4D       |      435 |    28.046  | 1.35403  |     0.690067  | 0.359317  |     1.15756  |    2.16492   |
| 1h          | no_momentum    |      490 |    27.9592 | 1.24053  |     0.461003  | 0.183671  |     0.986354 |    2.52936   |
| 1h          | no_persistence |      522 |    28.5441 | 1.22271  |     0.429871  | 0.282063  |     0.98208  |    2.35605   |
| 1h          | no_trend       |      868 |    33.871  | 1.10815  |     0.191057  | 0.0886746 |     0.906483 |    1.82195   |
| 1h          | no_volatility  |      498 |    27.1084 | 1.40392  |     0.723094  | 0.337731  |     1.22761  |    2.09582   |
| 1h          | no_volume      |      452 |    28.3186 | 1.32728  |     0.626941  | 0.270933  |     1.11994  |    2.18251   |
| 1h          | three_of_four  |      968 |    31.8182 | 1.05784  |     0.0981285 | 0.0377594 |     0.850436 |    1.81325   |
| 4h          | exact_4D       |      110 |    22.7273 | 0.841404 |    -0.64702   | 0.121387  |     1.08676  |    0.107043  |
| 4h          | no_momentum    |      120 |    28.3333 | 0.846641 |    -0.620226  | 0.182977  |     1.12382  |    0.0570054 |
| 4h          | no_persistence |      126 |    25.3968 | 0.868169 |    -0.514396  | 0.186973  |     1.07096  |    0.193026  |
| 4h          | no_trend       |      227 |    36.5639 | 1.40832  |     1.32152   | 0.261935  |     1.06628  |    2.51213   |
| 4h          | no_volatility  |      122 |    27.0492 | 0.917513 |    -0.305486  | 0.192098  |     1.14058  |    0.18649   |
| 4h          | no_volume      |      115 |    23.4783 | 0.785267 |    -0.871155  | 0.121491  |     1.00049  |    0.107043  |
| 4h          | three_of_four  |      246 |    36.5854 | 1.65383  |     1.89701   | 0.421165  |     1.32845  |    2.7007    |

Notable: removing the ADX/DMI "Volatility" layer improves 1H PF slightly. On 4H, relaxing unanimity to 3-of-4 produces better results than exact unanimity. Because these variants are inspected on the same dataset, they are hypotheses only, not validated improvements.

## Final assessment
The market-dimension architecture is useful as software/decision structure, but the exact two-tier unanimous consensus is not a robust trading strategy across 1H and 4H. 1H shows a plausible positive edge in this 2024 sample after costs, while 4H fails on completed trades. Strong agreement between dimensions confirms substantial double counting. A next research version should keep dimension states but separate mandatory conditions from quality evidence rather than requiring every dimension to agree. That new rule must then be frozen and tested on new unseen data.