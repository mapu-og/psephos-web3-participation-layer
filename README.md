# Psephos — Web3 Participation Layer (Surveys, Polls, Votes)

Psephos is an on-chain participation app where creators publish surveys, polls, and votes funded with ETH rewards. Participants respond through a Base Sepolia-connected frontend, metadata is stored on IPFS, and payouts are claimed on-chain.

This repository is prepared for the Alchemy University Ethereum Developer Bootcamp certification and keeps the product code under the `psephos/` folder.

Short summary:

- Smart contract: `psephos/contracts/SurveyPlatform.sol`
- Frontend: `psephos/frontend` (Next.js 14, App Router)
- Deployment and seed scripts: `psephos/scripts`
- Tests: `psephos/test`

## Current deployment

- Network: Base Sepolia
- Contract address: `0x6f48677A356F2e1Bce0910867f69299f89fB56b3`
- Live project URL: pending final Vercel production deployment

## Quick start

Prerequisites:

- Node.js 18+
- An ETH testnet wallet for Base Sepolia and testnet funds
- WalletConnect project ID
- Pinata JWT for IPFS-backed metadata uploads

Install and run locally (from repository root):

```bash
# Install dependencies for the backend (Hardhat)
cd psephos
npm install

# Copy example env files and fill secrets (DO NOT commit .env files)
cp .env.example .env

# Compile and test
npm run compile
npm run test

# Deploy to Base Sepolia (configure .env before running)
npm run deploy:basesepolia

# Seed one survey, one poll, and one vote with real IPFS metadata
npm run seed:basesepolia
```

Frontend (in another terminal):

```bash
cd psephos/frontend
npm install
cp .env.local.example .env.local
npm run dev
# Visit http://localhost:3000
```

Production-style frontend validation:

```bash
cd psephos/frontend
npm run build
npm start
```

## Deployment notes

The intended public deployment target is Vercel with the project root set to:

```bash
psephos/frontend
```

Required production environment variables:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `IPFS_PINATA_JWT`
- `IPFS_GATEWAY_BASE_URL`

Required backend/seeding environment variables:

- `PRIVATE_KEY`
- `BASE_SEPOLIA_RPC_URL`
- `IPFS_PINATA_JWT`

## Demo state

The intended certification/demo environment is:

- a clean Base Sepolia contract deployment
- 3 seeded examples visible on the home page:
  - `1 survey`
  - `1 poll`
  - `1 vote`
- seeded items left at `0 responses` so the interaction flow can be demonstrated live

## Notes

- IPFS response content is not encrypted. If someone knows a CID, the stored JSON can be read.
- No secret keys, private keys, or `.env` files should ever be committed.

---
