# Psephos — On-Chain Surveys, Polls, and Votes

> A decentralized question platform where creators fund surveys, polls, and votes with ETH and participants earn rewards for responding. Built as the final project for the Alchemy University Ethereum Developer Bootcamp.

---

## Overview

Psephos lets anyone create a paid survey, poll, or vote by locking an ETH reward pool on-chain. The frontend packages metadata and responses as JSON, uploads them to IPFS automatically, and stores only the CID in the smart contract.

**User flow:**
1. **Creator** connects wallet → chooses `survey`, `poll`, or `vote` → fills in question, options when needed, reward, max responses, and deadline.
2. **Frontend** uploads structured metadata to IPFS and calls `createSurvey(...)` with the resulting CID.
3. **Participant** browses active questions → submits a text response or chooses one option → frontend uploads the response payload to IPFS → claims ETH reward.
4. **Creator** can close the item early and withdraw any remaining balance.

### Product model in this release
- `survey`: open-text response
- `poll`: single-choice response with predefined options
- `vote`: single-choice response with predefined options and optional `Blank Vote`
- Smart contract remains generic: it stores `title`, metadata CID, reward rules, and response CID, but does not enforce type or option validity on-chain.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20, OpenZeppelin (ReentrancyGuard, Ownable) |
| Development | Hardhat, TypeChain, ethers.js, TypeScript |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Web3 | wagmi v2, viem v2, RainbowKit v2 |
| Network | Base Sepolia testnet |

---

## Contract Deployment

| | |
|---|---|
| **Network** | Base Sepolia |
| **Address** | `0x6f48677A356F2e1Bce0910867f69299f89fB56b3` |
| **Sourcify** | [Verificado en Sourcify](https://repo.sourcify.dev/contracts/full_match/84532/0x6f48677A356F2e1Bce0910867f69299f89fB56b3/) |

---

## Running Locally

### Prerequisites
- Node.js 18+
- A funded Base Sepolia wallet (get testnet ETH from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- WalletConnect Project ID (free at https://cloud.walletconnect.com/)

### Backend (Hardhat)

```bash
cd alchemy-final
npm install

# Copy and fill in your env vars
cp .env.example .env
# PRIVATE_KEY=your_deployer_private_key
# BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Base Sepolia
npm run deploy:basesepolia
```

npm run dev

### Frontend (Next.js)

```bash
cd alchemy-final/frontend
npm install

# Copia y completa tus variables de entorno
cp .env.local.example .env.local
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_walletconnect_project_id
# IPFS_PINATA_JWT=tu_pinata_jwt
# IPFS_GATEWAY_BASE_URL=https://gateway.pinata.cloud/ipfs

# Ejecuta en desarrollo
npm run dev
# → http://localhost:3000

# Despliegue en Vercel
# 1. Conecta el repo a Vercel
# 2. Configura las mismas variables de entorno en el dashboard de Vercel
# 3. Elige la rama principal para producción
# 4. Obtén la URL pública: [URL_EN_VIVO_AQUÍ]
```
---

## Enlaces de entrega y demo

- **Repositorio GitHub:** [URL_DEL_REPO]
- **App en vivo:** [URL_EN_VIVO_AQUÍ]
- **Video demo:** [URL_VIDEO_DEMO]
- **Formulario de entrega AU:** [URL_FORMULARIO_AU]

---

---

## Project Structure

```
alchemy-final/
├── contracts/
│   └── SurveyPlatform.sol      # Main smart contract
├── scripts/
│   └── deploy.ts               # Hardhat deploy script
├── test/
│   └── SurveyPlatform.test.ts  # 25 unit tests (Hardhat + ethers.js)
├── typechain-types/             # Auto-generated TypeScript types
├── hardhat.config.ts
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       ├── app/api/ipfs/       # Server-side IPFS upload routes
│       ├── config/
│       │   └── contract.ts     # ABI + deployed address
│       ├── lib/                # Metadata, IPFS, and product helpers
│       └── providers/          # wagmi / RainbowKit providers
└── README.md
```

---

## Contract Functions

### Write Functions

| Function | Description |
|---|---|
| `createSurvey(title, ipfsHash, rewardPerResponse, maxResponses, deadline)` | Creates a survey and locks the ETH reward pool (`rewardPerResponse × maxResponses`) |
| `submitResponse(surveyId, answerHash)` | Submit an IPFS answer hash to an active survey |
| `claimReward(surveyId)` | Claim the ETH reward for a previously submitted response |
| `closeSurvey(surveyId)` | Deactivate a survey before its deadline (creator only) |
| `withdrawRemaining(surveyId)` | Withdraw unclaimed ETH balance from a closed or expired survey (creator only) |

### Read Functions

| Function | Description |
|---|---|
| `getSurvey(id)` | Returns full survey data struct by ID |
| `getSurveyCount()` | Returns the total number of surveys created |
| `getResponse(surveyId, respondent)` | Returns the response struct for a given respondent |
| `getActiveSurveys()` | Returns an array of IDs for all currently active, non-expired surveys |

---

## IPFS Notes

- Users no longer paste CIDs manually in the UI.
- Metadata and responses are uploaded automatically through Next.js server routes backed by Pinata.
- The detail page exposes a small `Proof / Technical details` block with metadata CID, gateway links, and the participant's response CID when available.
- Legacy surveys without structured metadata still render correctly and fall back to `survey` mode.

## Known Limitations

- Survey, poll, and vote types live in frontend metadata, not in the smart contract schema.
- Predefined options are validated in frontend/API metadata flow, not enforced on-chain.
- Response payloads are not encrypted; if the CID is known, the content is readable through IPFS.
- `getActiveSurveys()` and the rest of the contract API keep their original names for compatibility with the deployed contract.

---

## License

MIT

## Develop By MapuriteLabs