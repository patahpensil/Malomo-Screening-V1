# Malomo Screening V1

Private research workspace for Binance USD-M perpetual screening. The implemented research candidate is **NOT_VALIDATED**: 71 closed trades, PF 0.9303, expectancy -0.0481R. This release supports transparent analysis and paper trading only.

## Product

Overview with OHLC charts and independent state dimensions; scanner with search, decision filter and sorting; persistent watchlist; inspectable paper plans; position lifecycle; durable decision journal and notes; research evidence, historical replay and in-browser backtest reproduction; configurable paper risk controls.

Three data modes are explicitly separated:

- **ARCHIVE**: six fixed pairs through September 2026, official Binance monthly archives, never represented as current prices.
- **REPLAY**: a real historical setup, advanced one closed hourly candle at a time.
- **LIVE**: normal official Binance REST plus WebSocket ticker. Availability depends on the visitor's network/location. Failure is visible; there is no alternate endpoint bypass. Tickers do not drive closed-bar decisions.

Read [PRD](docs/PRD.md), [validation evidence](docs/VALIDATION.md), [research protocol](research/PROTOCOL.md), and the repository's root `SOURCES.md` / `PROJECT_CONTEXT.md` before changing trading rules.

## Development and reproducibility

Node >=22.13, pnpm using the committed lockfile. This app uses React/TypeScript, Vinext, shadcn/ui and a Cloudflare Worker with D1. The Site is private to its owner; the database belongs to that workspace. There are no exchange API keys or order endpoints.

```sh
npm run install:ci
npm test
npm run typecheck
npm run build
npm run test:api
npm run research
```

`test:api` runs the built Worker and migrations against an isolated disposable D1 database through Miniflare. Build first. `research` reruns all six committed hourly datasets and rewrites results/snapshots/engine hashes; timestamps will change, numeric results should not. `research/make-replays.ts` regenerates the historical setup packets.

For raw archive provenance, see `research/DATA_MANIFEST.json`. Optional re-download:

```sh
MALOMO_HISTORY_DIR=work/history python research/download_history.py
MALOMO_HISTORY_DIR=work/history npm run research
```

Development: `npm run dev`. In the managed editing environment use its supervised preview. For a conventional local D1 preview, build then apply `drizzle/0000_condemned_iron_fist.sql` using Wrangler's local DB before starting the Worker. `npm run db:generate` generates migrations after schema changes.

## Deployment

`.openai/hosting.json` identifies the existing private Site. Reuse it; never register a replacement. Build, push the exact source state to the Site source repository, package output and publish using the Sites workflow. D1 migrations are included in the deployment package. Keep runtime credentials outside git. The app's canonical user repository is only `patahpensil/Malomo-Screening-V1`.

GitHub source is stored under `malomo-engine-screening/`. Local D1 preview data, dependencies and build output are excluded from source control. A new production database starts with default paper settings, not QA trades.

## Operational limits

Research results omit funding and use six surviving pairs, with no portfolio-return model. The holdout is consumed. New strategy revisions require a new preregistered protocol and fresh holdout. Paper positions reconcile during scans/replay while the app is open; there is no unattended trading or execution guarantee. Live payloads are validated structurally but originate in the owner-controlled browser. Do not broaden audience or treat the owner-private data model as multi-tenant without a separate design.

UI references: shadcn/ui accessible primitives and satnaing/shadcn-admin navigation/density patterns. The chart is a custom SVG OHLC renderer. Existing third-party licenses in the starter are preserved.

## Pasang di layar utama HP

Buka URL aplikasi di Chrome Android, masuk dengan akun pemilik, lalu pilih
menu **⋮ → Tambahkan ke layar utama / Instal aplikasi**. Tombol **Pasang di HP**
di sidebar menyediakan panduan dan prompt pemasangan jika browser mendukungnya.
Pada iPhone, gunakan Safari → Bagikan → Tambah ke Layar Utama.

Manifest menyediakan ikon 192/512 px, ikon maskable, ikon Apple dan mode standalone.
Service worker hanya memberi halaman koneksi terputus; tidak menyimpan respons API,
harga, jurnal atau halaman akun dalam cache. Data live dan jurnal memerlukan internet.
Pemindaian tetap bergantung pada aplikasi aktif; shortcut bukan layanan latar belakang.
Akses privat situs tetap berlaku setelah pemasangan.
