# HackMeridian build log

## 25 October 2026

- Oleksiy Onishchenko confirmed that there is no pre-event Deal Passport code, design or asset, and no planned reuse from Empiro.
- Connected the project folder to its public GitHub repository and preserved the initial MIT license commit.
- Prepared an MVP-target pitch deck from the organizer's supplied template and a submission draft. These artifacts do not claim an implemented MVP.
- Confirmed deployment access to the intended Cloudflare account without copying credentials from another project.
- Began Gate A: reuse the official educational BN254 Groth16 verifier, pin its upstream revision and establish real Stellar Testnet verification before building an interface.
- Gate A passed: deployed a 3,777-byte BN254 verifier, submitted the genuine Gnark fixture with result `true`, and submitted the altered public input with result `false`. Receipts: `docs/evidence/gate-a.json`.
- Gate B passed: compiled the issuer-bound Circom circuit and 10,490-byte eligibility gate. The certified €900k credential qualified on Testnet for a stored €750k threshold. Rejected unauthorized issuer registration, policy/input tampering, recipient redirection, identical/randomized replay and revoked roots. A fresh eligibility read became invalid after revocation. Receipts: `docs/evidence/gate-b.json`.
- Seven local tests passed, covering real proof generation/verification, randomized-proof nullifier stability, underfunded/expired/fabricated credentials, Merkle path constraints, numeric ranges and proof encoding. Expected witness-constraint errors are rejection evidence.
- At Oleksiy's request, commit/push each verified milestone to origin. The first cryptographic milestone is commit `45f815d`.
- Updated the pitch to six slides: €89/month or per-verification fees on PMF, then a native editable competitor comparison continuing Step 02. Checked published RealOpen, IntegraLayer and MERKAO offers and labeled adoption data as vendor-reported. The deck also records the completed buyer proof and distinguishes the remaining seller/disclosure work.
- The verified deck and pricing/market context were pushed in commit `da68702`.
- Patched transitive WebSocket and Underscore dependencies without forced major changes. The audit now reports no critical, high or moderate findings and 15 low findings. Recompiled the circuit against its preserved matching setup and reran all seven local tests successfully. Added a mismatch guard so a changed circuit cannot silently reuse the previous proving key, and verified that mismatched metadata is rejected. See `docs/evidence/local-checks.json`.

AI assistance: ChatGPT supported idea research and the specification. Codex performs repository setup, implementation, debugging, testing and preparation of presentation/submission artifacts. Oleksiy owns product decisions, review, corrections and final submission.

## Mutual qualification checkpoint

- Gate C passed on Stellar Testnet: deployed DealGate with a pinned financial gate and property issuer. A property-specific `AUTHORIZED_TO_MARKET` attestation and a genuine buyer proof remained locked until both account-authenticated consents were present. Withdrawal and property revocation immediately locked a fresh status read. Rejected a forged issuer, wrong claim, expired attestation and premature consent. Public receipts: `docs/evidence/gate-c.json`.
- On 25 October, Oleksiy requested Empiro's light palette and visual style as the UI reference: warm paper, stone, olive, square corners, Inter/Lora and editorial rules. Deal Passport's implementation is written for this event; this later design-reference request supersedes the earlier plan to use no Empiro reference. No Empiro application code, logo, photographs or customer data is imported.

## 26 October 2026 — protected disclosure checkpoint

- Gate D passed: local Cloudflare Worker/D1 API against real Stellar Testnet. Seventeen checks cover unauthenticated/direct dossier access, same-origin mutation and CSRF requirements, actor separation, underfunded/expired witnesses, forged issuer, changed-deal proof rejection, real positive qualification, both consent requirements, nullifier replay, consent withdrawal and property revocation. Receipts: `docs/evidence/gate-d.json`.
- API sessions use random HttpOnly cookie credentials, hashed tokens in D1, per-session immutable deal IDs, bounded request bodies, no-store responses and fresh cross-contract authorization reads. A D1 lease serializes shared disposable Testnet signers. Demo persona switching intentionally grants access to synthetic roles within one's own session; this is not production identity authentication.
- Implemented the first responsive light interface and browser Web Worker prover; TypeScript and production asset build passed. Browser end-to-end verification and public deployment are the next checkpoint.
- Patched the new development toolchain's compatible Undici version. The dependency audit again reports only the previously disclosed 15 low findings.
