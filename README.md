# Psephos — Web3 Participation Layer (Surveys, Polls, Votes)

A decentralized survey, poll, and voting platform with on-chain rewards. This repository contains the product code in the `psephos/` folder.

Short summary:

- Smart contract: `psephos/contracts/SurveyPlatform.sol`
- Frontend: `psephos/frontend` (Next.js 14, App Router)
- Deployment: Hardhat scripts in `psephos/scripts`

This repository is prepared for the Alchemy University Ethereum Developer Bootcamp certification.

## Quick start

Prerequisites:

- Node.js 18+
- An ETH testnet wallet for Base Sepolia and testnet funds
- WalletConnect project id (if running full frontend integration)

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
```

Frontend (in another terminal):

```bash
cd psephos/frontend
npm install
cp .env.local.example .env.local
npm run dev
# Visit http://localhost:3000
```

## What to include in the public repo for certification

- `psephos/` (source code for contract, frontend, scripts and tests)
- `README.md` (this file) and `LICENSE`
- `.gitignore` and `.env.example` (no secrets committed)

## Notes

- Development-only or agent prompt files have been moved to `private_docs/` and are ignored from the public repo.
- If you are a reviewer, follow the Quick start steps above to run the project locally.

---

See `psephos/README.md` for a short product-specific README and links.
