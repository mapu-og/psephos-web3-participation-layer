# Submission Checklist — Psephos (Alchemy University)

Follow this checklist before submitting the repository for Alchemy University certification.

1. Repository contents
   - [ ] `psephos/` directory present with:
     - `contracts/` (Solidity source)
     - `frontend/` (Next.js source)
     - `scripts/` (deployment and seed scripts)
     - `test/` (unit tests)
   - [ ] `README.md` at repository root (English)
   - [ ] `LICENSE` and `.gitignore` present

2. Secrets and builds
   - [ ] No `.env`, `.pem`, or secret files are committed
   - [ ] `.env.example` and `.env.local.example` exist to show required vars
   - [ ] `node_modules/`, `artifacts/`, `.next/` and build caches are ignored

3. How to run (for reviewer)
   - Backend (Hardhat)
     ```bash
     cd psephos
     npm install
     cp .env.example .env            # fill with your local test keys (do NOT commit)
     npm run compile
     npm run test
     npm run deploy:basesepolia      # optional, requires keys and RPC
     ```

   - Frontend (Next.js)
     ```bash
     cd psephos/frontend
     npm install
     cp .env.local.example .env.local
     npm run dev                      # http://localhost:3000
     npm run build && npm start       # build + start
     ```

4. What to check during review
   - Smart contract compiles and tests pass (Hardhat)
   - Frontend runs locally and interacts with the deployed contract address (documented in `README.md`)
   - No secret keys, private keys, or API secrets are visible in the repo or commit history
   - `psephos/frontend/.env.local.example` lists required vars (WalletConnect ID, IPFS/Pinata token, RPC URL)

5. Notes for submitter
   - Keep `private_docs/` for agent prompts and development notes (ignored by git)
   - If you have large binary files in history, use `git lfs` or clean history before final submission
   - Provide a live demo URL in `README.md` if deployed (Vercel recommended)

Good luck with your submission — ask me to run the frontend build or produce a final demo checklist if you want one.
