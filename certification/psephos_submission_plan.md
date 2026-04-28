# Psephos Submission Plan

## Objective

Prepare `Psephos` as a clean, public, portfolio-ready final project for the Alchemy University Ethereum Bootcamp certification.

The final deliverable should include:

- a working public GitHub repository
- a live project URL
- a clean Base Sepolia deployment
- seeded demo content
- a reviewed README
- a short demo video aligned with AU guidelines
- a security pass to avoid leaking sensitive data

---

## Current State

### What is already working

- Smart contract is implemented and tested.
- Frontend is implemented in Next.js.
- `survey`, `poll`, and `vote` flows are working.
- IPFS integration is working through Pinata-backed server routes.
- Detail pages correctly render response UI for each item type.
- UX/UI is already good enough for a `v1` course submission.

### What is still missing for submission quality

- Git history and repo organization are not clean yet.
- Most project work is still not reflected properly in Git.
- README is not fully aligned with the latest deployed contract address and final state.
- Live project URL is not yet formalized.
- Demo seed content should be curated for reviewers.
- Sensitive-data review should be completed before publishing the repo.

---

## Submission Strategy

### 1. GitHub

Use the existing GitHub remote as the canonical public repository.

Target state:

- public repo
- clean structure
- no local junk
- no secrets committed
- enough documentation for a reviewer to understand and run the app

Actions:

1. Review tracked vs untracked files.
2. Keep only project-relevant files in the public repo.
3. Exclude local-only files and artifacts.
4. Stage the real project source, tests, scripts, frontend, and docs.
5. Create a clean commit sequence that reflects the actual delivered product.
6. Push to the existing public GitHub repo.

Expected outcome:

- reviewers can open GitHub and immediately understand the project
- repo is portfolio-appropriate
- repo can be used directly in the AU submission form

---

## Live Project URL

### Target

Deploy the frontend to **Vercel**.

Why Vercel:

- best fit for Next.js App Router
- easy env var management
- simple setup for server routes
- professional URL for submission and portfolio

### Required environment variables

Frontend production env vars:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `IPFS_PINATA_JWT`
- `IPFS_GATEWAY_BASE_URL`

### Deployment requirements

- app must load correctly in production
- wallet connection must work
- server-side IPFS routes must work in production
- create/respond/claim flow must be usable on Base Sepolia

### Deliverable

- one stable Vercel URL to place in:
  - README
  - AU submission form
  - video/demo script

---

## Clean Redeploy Plan

### Decision

Use a **new clean Base Sepolia deployment** for the submission.

Reason:

- avoids stale or confusing previous state
- avoids legacy seeded items with invalid CIDs
- gives a clean demo environment
- makes the project look more intentional and professional

### Redeploy goals

- new contract address
- updated frontend config
- updated deployment block
- updated README references
- updated live app references

### Deliverable

The final frontend should point only to the clean final contract.

---

## Seeded Demo Content

### Approved seed set

Seed exactly these 3 examples:

- `1 survey`
- `1 poll`
- `1 vote`

All 3 should be:

- active
- funded
- with future deadlines
- visible on the home page
- at `0 responses` to allow live demo interaction

### Approved content categories

- `survey`: UX feedback
- `poll`: Favorite L2
- `vote`: Fund next feature

### Seed design rules

- use real IPFS metadata, not placeholder hashes
- keep copy short and easy to understand in a video
- make all 3 feel visually and functionally distinct
- avoid ambiguous or overly political/corporate wording

### Why empty items are better

- easier to demonstrate the full flow live
- clearer to reviewers
- avoids fake activity
- lets you show `respond -> claim reward` in real time

---

## Security and Sensitive-Data Review

### Main goal

Make sure the public repo and the live app do not expose sensitive operational data.

### Secrets to protect

- deployer private key
- Pinata JWT
- RPC URLs with credentials
- local env files
- any copied token/API credentials

### Required checks

1. Confirm `.env` is ignored.
2. Confirm `frontend/.env.local` is ignored.
3. Confirm no secrets appear in tracked files.
4. Confirm no secrets appear in docs or screenshots.
5. Confirm server-side env vars are not exposed to the client.
6. Confirm Pinata JWT is used only in server routes.

### Product honesty checks

The public materials must clearly match the real behavior:

- responses stored through IPFS are readable if the CID is known
- the app is not a privacy-preserving system
- it is an on-chain participation product, not full governance

---

## README and Documentation

### README goals

The README should reflect the **final shipped state**, not a previous snapshot.

It should include:

- project name
- short value proposition
- what the app does
- architecture summary
- deployed contract address
- live project URL
- GitHub URL
- setup instructions
- test instructions
- demo flow summary

### Required corrections

- update the contract address to the final deployed one
- align descriptions with current UI and IPFS behavior
- avoid outdated references
- ensure the live URL is included once available

### Tone

Keep it:

- direct
- technical but understandable
- credible for reviewers and employers

---

## AU Submission Form Preparation

The certification folder should eventually provide final copy for:

- **Project Name**
- **Project GitHub URL**
- **Project Description**
- **Live Project URL**
- **Project Demo Video**

### Description goal

The project description should explain:

- what Psephos is
- what interaction it enables
- that it writes to and reads from an EVM chain
- that it uses IPFS for metadata and responses
- that it is deployed on Base Sepolia

---

## Demo Video Plan

### Constraints

- max 5 minutes
- mp4 preferred
- should work as a portfolio artifact, not just a course requirement

### Structure based on AU guidance and example

#### 1. Cover

- project name
- your name / identity
- optional GitHub or handle

#### 2. Elevator pitch

Very short explanation of the product.

Example direction:

`Psephos is an on-chain question platform where anyone can create surveys, polls, and votes funded with ETH rewards, and participants can respond transparently through Base Sepolia and IPFS-backed metadata.`

#### 3. Solution

Focus on:

- what the app enables
- why the architecture matters
- how it works in a practical way

Avoid a long traditional “problem statement” section.

#### 4. Demo

This should be the core of the video.

Recommended live sequence:

1. Open home page and show seeded `survey`, `poll`, and `vote`.
2. Open one item and show metadata / proof area.
3. Create one new item or use one seeded item to demonstrate response flow.
4. Respond with a connected wallet.
5. Show reward claim flow.
6. Open metadata/response links to show IPFS proof.
7. Mention Base Sepolia contract deployment.

#### 5. Close

Short final section:

- next steps
- what could be improved later
- thank you

---

## Suggested Next Steps Section for the Video

Keep it small and realistic.

Examples:

- improve governance rules in future versions
- add stronger privacy options for responses
- add richer creator analytics
- deploy broader production-ready infrastructure later

Do not overpromise features that are far outside current scope.

---

## Testing and Validation Checklist

### Local validation

- contract compiles
- tests pass
- frontend builds
- create `survey` works
- create `poll` works
- create `vote` works
- respond flow works for all item types
- claim reward works
- metadata and response links resolve correctly

### Post-redeploy validation

- frontend points to new contract address
- 3 seeded examples appear correctly
- seeded items show correct type labels
- deadlines and rewards render correctly
- response UI matches item type

### Production validation

- Vercel app loads
- server-side IPFS routes work in production
- create/respond works from live URL
- no stale contract references remain

### Submission validation

- GitHub repo is public and clean
- README is accurate
- live URL works
- video is under 5 minutes
- submission form fields are ready

---

## Order of Execution

Recommended order:

1. Clean repo structure and confirm ignored secrets.
2. Review and update README/documentation.
3. Redeploy clean contract to Base Sepolia.
4. Update frontend config to new deployment.
5. Seed `survey`, `poll`, and `vote` examples with valid IPFS metadata.
6. Validate full local and deployed flow.
7. Deploy frontend to Vercel.
8. Re-test live URL.
9. Finalize GitHub public state.
10. Prepare AU submission copy and record the demo video.

---

## Final Expected Outcome

At the end of this plan, `Psephos` should be:

- a public GitHub project
- a live web3 app on Vercel
- deployed on Base Sepolia
- seeded with clear demo examples
- technically honest
- free of exposed secrets
- ready for Alchemy University certification submission
- strong enough to use as a portfolio project
