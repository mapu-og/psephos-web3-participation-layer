
<p align="center">
  <img src="assets/psephos-logo-title.svg" alt="Psephos logo and title" width="320" />
  <br />
  <img src="assets/by-mapuritelabs.svg" alt="by MapuriteLabs" height="18" />
</p>

<p align="center">
  <a href="https://psephos-web3.vercel.app/">Live App</a>
  ·
  <a href="mailto:mapu.kushy@gmail.com">Contact</a>
</p>

Psephos is a Web3 participation layer for on-chain surveys, polls, and votes. Smart contract state and reward logic live on Base Sepolia, giving the platform transparent, auditable, and tamper-resistant behavior, while IPFS is used to store survey metadata and response payloads as verifiable content-addressed records. This architecture makes participation flows more immutable, traceable, and trustworthy than a traditional Web2 form system.

Live app: [https://psephos-web3.vercel.app/](https://psephos-web3.vercel.app/)

## Live App

- Live URL: [https://psephos-web3.vercel.app](https://psephos-web3.vercel.app)
- Network: `Base Sepolia`
- Contract address: `0x14d69D3A89c1197b16632658A31dF1624f7971D3`
- Deployment block: `40856378`
- Built by: `MapuriteLabs`
- Contact: [mapu.kushy@gmail.com](mailto:mapu.kushy@gmail.com)

## What Psephos Does

- Creates on-chain `survey`, `poll`, and `vote` items from a single application flow.
- Stores survey metadata and response payloads on IPFS.
- Funds participation with ETH at creation time.
- Lets respondents claim rewards directly from the smart contract.
- Exposes a live frontend for browsing active questions and submitting responses.

## How It Works

1. A creator publishes a question and funds a reward pool in ETH.
2. The frontend uploads structured metadata to IPFS.
3. The smart contract stores the metadata CID and reward parameters on Base Sepolia.
4. A participant submits a response, which is also stored on IPFS.
5. The participant claims the reward on-chain after responding.

## Repository Structure

- `psephos/contracts` — Solidity smart contract source
- `psephos/test` — Hardhat test suite
- `psephos/scripts` — deployment and seed scripts
- `psephos/deployments` — deployment metadata by network
- `psephos/frontend` — Next.js application

## Stack

- Solidity + Hardhat
- Next.js 14 App Router
- Wagmi + RainbowKit
- IPFS via Pinata
- Base Sepolia
- Vercel

## Local Development

If you only want to understand the project, the live app is enough. Local setup is only needed if you want to run, modify, or redeploy the code yourself.

Prerequisites:

- Node.js 18+
- A funded Base Sepolia wallet
- WalletConnect project ID
- Pinata JWT

If you want to test the live app or run transactions on Base Sepolia, your wallet needs testnet ETH. One example faucet is:

- [https://console.optimism.io/faucet](https://console.optimism.io/faucet)

Backend and contract workspace:

```bash
cd psephos
npm install
cp .env.example .env
npm run compile
npm run test
```

Useful contract commands:

```bash
# Deploy a fresh contract to Base Sepolia
npm run deploy:basesepolia

# Seed one survey, one poll, and one vote with real IPFS metadata
npm run seed:basesepolia
```

Frontend:

```bash
cd psephos/frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Production-style frontend verification:

```bash
cd psephos/frontend
npm run build
npm start
```

## Environment Variables

Frontend:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `IPFS_PINATA_JWT`
- `IPFS_GATEWAY_BASE_URL`

Backend and scripts:

- `PRIVATE_KEY`
- `BASE_SEPOLIA_RPC_URL`
- `IPFS_PINATA_JWT`

## Current Demo State

The current live deployment includes a clean seeded state with:

- `1 survey`
- `1 poll`
- `1 vote`

These examples were created to make the full interaction flow easy to review in a live environment.

## Notes

- IPFS response content is not encrypted. If someone knows a CID, the stored JSON can be read.
- `.env` files, private keys, and secret tokens should never be committed.

## Roadmap

The next phase of the project is a roadmap implementation pass focused on expanding the product beyond the current MVP. That phase is intended to build on the current contract and frontend foundation rather than replace it.

## Intellectual Property

Psephos and its associated product materials are the intellectual property of MapuriteLabs.
