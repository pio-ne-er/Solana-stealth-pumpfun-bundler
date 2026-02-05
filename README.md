# Pump.fun Token Launchpad Buy / Sell Bundler

CLI tool for launching and managing Pump.fun tokens with bundled buys, holder distribution, and SOL/token gathering across multiple bundler wallets. The docs describe a **stealth mode** / wallet-mixer style flow and **forking real bot activity** (Axiom, Bloom, Photon, Trojan, GMGN, etc.) for bypassing Bubblemap detection; the wallet mixer, stealth mode, and real bot activity parts are **not included** in this repo for privacy.

## Contact

Telegram: [Pioneer](https://t.me/hi_3333)

## Stealth mode & Bubblemap bypass (Axiom / GMGN)

Trading platforms like **Axiom** and **GMGN** use Bubblemap-style analysis to detect bundled buys, insider concentration, and wallet clustering. This tool implements a **stealth / wallet-mixer** approach to make ownership look more organic:

1. **Bundler wallets** — A small set of wallets perform the initial bundle buy (e.g. via Jito). On-chain this can look like coordinated buying.
2. **Holder wallets** — A larger set of separate wallets is created. After the buy, tokens are **distributed** from bundlers to these holders with randomized amounts and timing (`holderTokenAmountMin` / `holderTokenAmountMax`, `holderCreateInterval`, `holderTokenTransferInterval`).
3. **Effect** — Supply is spread across many unrelated-looking addresses. Bubblemap-style tools see many distinct holders with varied balances instead of a few heavy wallets, which can reduce flags on Axiom, GMGN, and similar dashboards.
4. **Gather** — When needed, you can gather tokens back from holder wallets to bundlers (or sell from bundlers) using the Token Holders and Gather menus.

**Forking real bot activity** — For each bundler wallet, buys are designed to **fork** (mimic) the on-chain behavior of real trading bots used by **Axiom**, **Bloom**, **Photon**, **Trojan**, **GMGN**, and similar platforms. So each bundler’s activity can look like normal bot flow from those services rather than coordinated bundling, which helps with detection bypass on their dashboards and Bubblemap-style analysis.

Use **Token Launch** → create & bundle buy, then **Token Holders** → distribute to holder wallets to engage this stealth flow. Tune `distNum`, `remaining_token_percent`, and holder amount ranges in `settings.ts` to shape the distribution.

> **Note:** This repository **does not include** the wallet mixer, stealth mode, or real bot activity implementation in the codebase. Those parts are omitted for **privacy**; the repo provides the bundler, token launch, holder distribution, and gather flows. You can implement or plug in your own mixer/stealth and bot-activity logic as needed.

## Sample token launch & Bubblemap testing

A test token was launched with this bundler (create & bundle buy, then distribute to holder wallets) to verify the flow and how it appears on Bubblemap-style analysis.

**Sample token (testing):**

| | |
|--|--|
| **Mint** | `EMRHBgbj9SgjPvcE8EA4EfVvDq8YrS7giahZgTsFpump` |
| **Pump.fun** | [pump.fun/coin/Gcvt4wcirTfC6wQGCEi42UUsUS1H3rNkHgqtw5oEpump](https://pump.fun/coin/Gcvt4wcirTfC6wQGCEi42UUsUS1H3rNkHgqtw5oEpump) |
| **Solscan** | [solscan.io token](https://solscan.io/token/Gcvt4wcirTfC6wQGCEi42UUsUS1H3rNkHgqtw5oEpump) |

**Bubblemap (post–holder distribution):**

After distribution to bundler wallets, Bubblemap shows many distinct holders and varied balances instead of a few concentrated wallets, illustrating the bypass effect.

![Bubblemap sample — testing token](docs/bubblemap.png)

## Features

- **Stealth mode / wallet mixer** — Distribute tokens to many holder wallets to reduce Bubblemap-style detection on Axiom, GMGN, and similar platforms (see section above)
- **Fork real bot activity** — (Docs only; code not in repo for privacy.) Each bundler wallet’s buys can mimic real bot behavior of Axiom, Bloom, Photon, Trojan, GMGN, etc.
- **Token launch** — Create token & pool, then bundle-buy across multiple wallets in one flow
- **Presimulate** — Run simulation before launching to validate setup
- **Token sell & buy** — Manual sell from each bundler
- **Token holders** — Distribute tokens to holder wallets; gather selected or all tokens back to bundlers
- **Gather** — Collect SOL from all or one bundler; distribute SOL to bundler wallets
- **Balances** — View SOL and token balances for all bundler wallets

## Requirements

- Node.js (v18+)
- Solana RPC (and optional WebSocket)
- Jito block engine URL (for bundle execution)
- Wallets: LP wallet (liquidity/token creation), bundler provider wallet (batch buys)

## Setup

### 1. Install dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment variables

Create a `.env` file in the project root with:

| Variable | Description |
|----------|-------------|
| `RPC_ENDPOINT` | Solana RPC HTTP URL |
| `RPC_WEBSOCKET_ENDPOINT` | Solana WebSocket URL |
| `BLOCKENGINE_URL` | Jito block engine URL |
| `LILJITO_RPC_ENDPOINT` | Lil Jito RPC endpoint |
| `COMPUTE_UNIT_PRICE` | Compute unit price for transactions |
| `JITO_FEE` | Jito tip amount (in SOL) |
| `PRIORITY_FEE` | Set in `settings.ts` (optional override) |

### 3. Settings

Copy `settings.example.ts` to `settings.ts` and fill in:

- **Token metadata** — `token` (mint, name, symbol, description, socials, image path)
- **LP wallet** — `LP_wallet_private_key` / `LP_wallet_keypair` (for creating token/pool)
- **Bundler provider** — `Bundler_provider_private_key` / `Bundler_provider_wallet_keypair` (for bundle buys)
- **Bundling** — `batchSize`, `bundleWalletNum`, `bundlerHoldingPercent`
- **Intervals** — `walletCreateInterval`, `walletTransferInterval`, `holderTokenTransferInterval`, `holderCreateInterval`
- **Holders** — `holderTokenAmountMin` / `holderTokenAmountMax`, `distNum`, `remaining_token_percent`
- **Wallet files** — `bundlerWalletName`, `holderWalletName` (e.g. `"bundlers"` → `wallets/bundlers.json`)
- **Fees & rent** — `PRIORITY_FEE`, `extra_sol_amount`

Ensure `wallets/` exists and any referenced JSON files (e.g. `bundlers.json`, `mint.json`) are present as needed.

## Usage

Start the interactive CLI:

```bash
npm start
# or
yarn start
# or
npx ts-node index.ts
```

### Main menu

| Option | Action |
|--------|--------|
| 1 | **Token Launch** — Presimulate, then create token & pool and run bundle buy |
| 2 | **Token Sell & Buy** — Sell from each bundler (manual each sell) |
| 3 | **Gather** — Gather SOL from bundlers or distribute SOL to them |
| 4 | **Balances** — Show bundler SOL and token balances |
| 5 | Exit |

### Token Launch submenu

- **Presimulate** — Simulate before creating token and buying
- **Create Token & Pool and BundleBuy** — Full launch + bundled buy
- Back / Exit

### Token Holders (from layout)

- Distribute token to holder wallets
- Gather selected token to bundler wallets
- Gather all token to bundler wallets

### Gather submenu

- Gather SOL from all bundler wallets
- Gather SOL from one bundler wallet
- Distribute SOL to bundler wallets

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start / dev | `npm start` / `npm run dev` | Run main CLI (`index.ts`) |
| Close LUT | `npm run close` | Run `closeLut.ts` |
| Gather | `npm run gather` | Run `gather.ts` |

## Project structure

```
├── index.ts              # Entry point & main menu
├── config.ts             # RPC, Jito, env config
├── closeLut.ts           # LUT close utility
├── layout/               # Token launch, holders, gather, balances
├── menu/                 # CLI menus & readline
├── src/                  # Pump.fun SDK, logging, utils, types
│   ├── pumpfun/          # Pump.fun IDL & bonding curve logic
│   └── ...
├── executor/             # Jito, legacy, lilJito executors
├── constants/            # Pump.fun constants
├── utils/                # Logger & helpers
├── wallets/              # bundlers.json, mint.json, etc.
└── settings.example.ts   # Copy to settings.ts
```

## License

ISC
