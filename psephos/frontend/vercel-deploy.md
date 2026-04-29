# Vercel Deployment Guide — psephos/frontend

Quick steps to deploy `psephos/frontend` on Vercel.

1) Create a new Vercel project and point its repository root to:

   `psephos/frontend`

2) Build settings (defaults work for Next.js):

- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: (leave empty — Next.js App Router)

3) Environment Variables (set these in Vercel dashboard -> Project -> Settings -> Environment Variables):

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect Project ID (for connecting wallets)
- `IPFS_PINATA_JWT` — Pinata JWT used by server routes to pin JSON to IPFS
- `IPFS_GATEWAY_BASE_URL` — Optional; default: `https://gateway.pinata.cloud/ipfs`

4) Notes
- Do NOT commit secrets to the repo. Use Vercel's env var UI for production values.
- If you deploy a backend (Hardhat scripts / contracts), deploy them separately and add deployed contract addresses to Vercel env vars (e.g., `NEXT_PUBLIC_SURVEY_CONTRACT_ADDRESS`) if your frontend expects them.

5) Local verification commands

```bash
cd psephos/frontend
npm ci
npm run build
npm run start
```

If you want, I can also add a short `vercel.json` or a CI step, but Vercel handles Next.js automatically when you point the project root to `psephos/frontend`.
