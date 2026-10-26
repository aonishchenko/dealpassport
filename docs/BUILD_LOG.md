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
- At Oleksiy's request, verified that application code, styles and generated assets contain no references to the separate prior product. Removed its name from the internal styling brief as well; retained accurate provenance in the build history and third-party disclosure.
- Replaced the original MIT notice with an all-rights-reserved notice and limited HackMeridian evaluation permission, matching Oleksiy's requirement for separately licensed paid reuse. Third-party licenses and previously granted MIT rights for earlier versions remain unaffected. Reviewed the organizer's published terms, section 6, which retains participant IP subject to component licenses and includes an event operation/judging/promotion grant.

## Public MVP checkpoint

- Deployed the Cloudflare Worker, D1 API and responsive light interface to https://dealpassport.aonishchenko33.workers.dev in the confirmed account.
- Gate E passed in the public browser: real local Groth16 generation (2.4s and 2.6s observed), real buyer qualification, property attestation, both consents and server-protected dossier disclosure. Underfunded/expired witnesses failed; replay was rejected in simulation; a forged issuer produced a failed Testnet transaction with an explorer receipt. See `docs/evidence/gate-e.json`.
- Inspected 1440px desktop and 390px mobile layouts, visible keyboard focus and Enter activation. Mobile pointer controls worked. Actual touch-event emulation was unavailable in the in-app browser.
- Expanded visual review found one disclosure-label inconsistency: the open dossier sidebar still showed locked fields. Corrected it so disclosed fields say Disclosed while the exact buyer balance stays Always private.
- Published robots.txt, sitemap.xml, llms.txt and a public proof-artifact hash manifest. Verified all return 200, security headers are present, and an unauthenticated dossier request returns 401.
- The licensing inventory identified GPL-3.0 proving dependencies, including browser-bundled snarkjs. Explicitly documented that the rights-reserved notice does not override GPL permissions/copy-left requirements or make the whole stack pay-only. A long-term proprietary packaging/replacement decision remains with Oleksiy.
- Updated the organizer-template pitch with actual MVP observations. Pricing remains the unvalidated €89/month or per-verification hypothesis; the Step 02 competitor comparison remains.
- The visual reviewer scored the disclosure-indicator correction resolved in both room sizes and a locked state. Recorded the shipped tokens and components in DESIGN.md and the design sidecar; source/style/design scans contain no prior-product name.
- Prepared a local 1920×1080 H.264/AAC walkthrough, 2m55s and approximately 7.8 MB, with synthetic narration and captions over captured MVP states. Checked representative frames, duration and non-silent audio. The video and refreshed one-time submission draft remain ignored local artifacts; Oleksiy must review and upload the video, then submit.

## Demo visibility and session recovery — 26 October 2026

Added a session-private operation history with server-recorded simulation, submission, confirmation and failure steps. Negative browser circuit results are allowlisted reports marked **Browser-reported**; they persist through refresh, never create a transaction receipt, and contain no witness, balance, salt or secret. The endpoint requires the existing HttpOnly session and CSRF protection. Logs are bounded to the latest 100 records and cleaned after a day. `scripts/verify-activity.mjs` passed authentication, CSRF, input restrictions, persistence and live pending-progress checks with two genuine Testnet transactions (`b84bcaec0b367857f3a5110d5c1961d5ed3f2385c59c8de264c4e4c927b6ae00`, `8e7282b23375cefc5847a36d274799d41c4e3a182a0c6a92f4762104c93ce16c`). Backend checkpoint: `9dd6a7c`.

The interface now uses large white-on-blue/green/crimson notifications, a visible session countdown, a direct restart action after expiry, and retry for incomplete deal preparation. The operation history opens during work and can be expanded afterward. Buyer proof access ends at the current five-minute epoch boundary (possibly sooner with root/deal expiry); seller authority expires with the demo deal (up to 20 minutes). The short proof policy is unchanged. Seller expiry is now visible. `snarkjs` calculates the witness and generates the buyer's Groth16 proof in a browser worker; Stellar verifies the submitted proof and the Worker separately checks disclosure authorization.

Rendered verification passed at 1440px desktop and 390px mobile. A real underfunded browser witness was rejected and remained in the session history after refresh. A valid browser Groth16 proof took 1.6 seconds and verified in Testnet transaction `4dc6110f84009ca9bf8e4d0d6cd7542fbbe9ddcca70cf5de88d5868384b74bd2`. Expiring only a disposable local D1 session cleared stale UI automatically; its recovery button worked with Enter and prepared a new deal. The scoped independent Impeccable review returned **ship**, with no material findings in notifications, history, recovery or expiry copy. The additive activity migration was also applied remotely to the existing demo database.

Deployed UI checkpoint `ea45aa5` as Worker version `97cfded5-a3b5-4068-ab9f-060255d81a64`. The deployed API passed the same session/privacy/live-progress integration checks, including two new confirmed Testnet policy transactions. Machine-readable evidence: `docs/evidence/demo-feedback.json`.

## Rejection notification correction — 26 October 2026

Underfunded and expired circuit results now display **Credential rejected** with an X icon on the existing crimson feedback fill (`#8c2432`). Rejected contract-policy checks use **Action rejected** in crimson. Successful outcomes remain green, and each new operation resets the outcome kind. Both negative credentials were exercised through the real browser prover; computed feedback color was `rgb(140, 36, 50)` for both. Desktop/mobile rendering and keyboard dismissal passed; the 390px layout has no horizontal overflow and retains a 44px dismiss control. Build/type checking passed. No proof or credential timing policy changed.

Correction checkpoint `00f6acf` deployed as Worker version `e974c0b3-225a-4597-b3b9-aa6f15ec2230`. The live JavaScript bundle exactly matches the browser-verified local build (SHA-256 `9ee7b04bb873c7cbb32c35d618e09e05a871df81d4b5992447ea6d5607800b09`).

## Complete declared-license inventory — 26 October 2026

Audited npm lockfile entries against installed package manifests and directly included circuit headers. Found 11 distinct GPL-3.0 package names (13 name/version pairs, 15 lock locations), plus LGPL-bearing optional development image-tool packages. Corrected the earlier incomplete five-package summary in `docs/THIRD_PARTY.md`. Checked all 214 locked Rust registry packages using 184 local manifests and exact-version crates.io metadata for the remaining 30; no GPL-family expression found. Evidence and scope are recorded in `docs/evidence/license-inventory.json`. The permanent holder/deal nullifier replay key and UI `state.qualified` guard explain the current fresh-deal-only renewal restriction; no contract or interface behavior changed during this audit.
