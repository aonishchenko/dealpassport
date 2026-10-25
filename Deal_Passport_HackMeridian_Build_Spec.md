# Deal Passport — HackMeridian 2026 Genesis / Stellar Unlocked

## Product and judge-facing claim
**Pitch:** "Two anonymous strangers can prove they're qualified for the same real-estate deal without revealing bank balances, identities, or property evidence to one another. Deal Passport enforces that mutual trust using a real zero-knowledge verification on Stellar."

**Product, not four startups:** Buyer Passport (issuer-backed financial qualification), Property Passport (independently attested property authority), and Deal Passport (deal-scoped mutual qualification, selective disclosure and audit receipts). PrivateDeal is a demo frontend or integration into an existing off-market marketplace, **not a new marketplace**.

**Track:** Genesis / Stellar Unlocked, with Soroban-native BN254 Groth16 verification as the load-bearing technical novelty. Reusing ecosystem libraries is encouraged; the unique contribution is the two-sided, property-specific credential policy and proof-bound disclosure workflow.

**Deadline:** Monday, 26 October 2026, 12:00 Lisbon local. Official: https://www.hackmeridian.com/ . All project and data examples synthetic. Clearly disclose prior work and software reused.

## 1. Scope freeze
### Must ship before submission (P0)
1. **Issuer console:** Two preapproved demo issuers: synthetic financial attestor and synthetic property-document reviewer. Authorized issuer publishes current credential commitment/Merkle root to Soroban. The public UI labels both synthetic.
2. **Buyer Passport:** Synthetic issuer certifies private eligible balance and expiry, bound to the credential holder's secret. A Circom circuit proves `balance >= deal.requiredAmount` plus membership in an issuer-authenticated commitment root; exact balance and identity remain private. Proof is verified by a real Soroban contract and is bound to this deal.
3. **Property Passport:** Synthetic property verifier authenticates a specific claim (e.g., `AUTHORIZED_TO_MARKET` or `SITE_CONTROL_VERIFIED`) for one private property. Soroban checks/records issuer-authorized attestation or authenticates a signed verification status, without storing addresses or documents. The UI clearly separates verified site control from unapproved development plans.
4. **Deal policy:** One deal with a financial threshold, allowed financial issuer, allowed property issuer, property proof type, validity rules and mutually consented unlock. Backend rechecks onchain qualification; frontend-only gating is prohibited.
5. **Deal room:** Two demo personas. Lock until both are valid, then selectively reveal one synthetic document or information field only after both sides consent. No real PII.
6. **Judge demo mode:** One-click personas and seed data; valid buyer, underfunded buyer, forged property credential, expired credential and replay scenario. A real Testnet transaction explorer link from each successful onchain proof.
7. **Operational evidence:** Public live URL, public GitHub repository, README with install/env/setup/demo, architecture diagram, contract IDs, transaction hashes, test instructions, 2–3 minute video, pitch slides and explicit new work log.

### Worthwhile if P0 done (P1)
- Pre-launch developer teaser with a second Property Passport showing `SITE_CONTROL_VERIFIED` and `PLANNED_UNITS: SELF_REPORTED`. Offer nonbinding expression-of-interest, not sales or approval claims.
- Cryptographically deal-specific nullifier and credential revocation negative tests.
- Measured proof generation time, onchain execution budget/fee and saved confidential fields.
- A simple B2B integration API/SDK (`POST /qualification-requests`, `GET /deals/{id}/eligibility`).

### Do not build for this hackathon (P2)
- Real bank or land registry connections; full ACTA/Reclaim/Fairblock integrations unless proven trivial; cryptocurrency escrow or transfers; property tokens; title transfer; multilingual commercial onboarding; insurance; legal closing; bid auctions; mortgage underwriting; marketplace search engine.

## 2. Seven-criterion scoring strategy
| Criterion | Weight | Max-score evidence | Acceptance |
|---|---:|---|---|
| Thematic Track Execution | 20% | Real BN254 Groth16 verification on Soroban, deal-threshold proof with committed certified balance; proof controls the deal state | Show success & failure transaction traces and contract code; bypassing the verifier fails |
| Technical Execution | 15% | Compiled circuit, Rust contract, TS proof flow, issuer auth, onchain reads, backend access rules, tests | Integration run on Stellar Testnet; exact failing cases; no fake verification statuses |
| User Value & Problem | 20% | Seller and buyer mutually qualify without revealing bank balance/property identity; real estate example and pain quantified | Before/after demo; buyer sees seller validated, seller sees buyer qualified, neither sees sensitive raw data |
| Hackathon Progress | 10% | Timestamped commits + build log distinguishing imported components from newly written work | Git diff, README change log, actual event commits, live deployed app |
| Innovation | 15% | Two-sided credential gating, deal-bound private ZK threshold, staged disclosure; differentiated vs Propy/RealOpen/ACTA | Comparison table and own policy/circuit/UX; explain what the existing libraries did and what is new |
| Market & Ecosystem Potential | 10% | B2B trust API for marketplaces and real estate brokers; credible Portuguese pilot; reused Stellar infra | Target ICP, paid workflow hypothesis, post-hackathon milestone, explicit regulatory dependencies |
| Product Design & UX | 10% | Intuitive responsive experience, clearly labeled synthetic vs verified, one-click replayable demo | User can complete buyer + seller flows and find onchain evidence without setup |

## 3. Demo narrative: what judges should experience
1. **Problem (0:00–0:20):** Seller offers €750k off-market property but will not share identity or exact address. Buyer won't send bank statements to unknown seller. Neither trusts the other.
2. **Property Passport (0:20–0:45):** Open seller card; click "Verify authority". Issuer-attested `AUTHORIZED_TO_MARKET` turns valid. Document and seller identity remain hidden. State exactly that a synthetic legal verifier issued it.
3. **Buyer Passport (0:45–1:20):** Anonymous buyer's synthetic credential contains €900k. Buyer clicks "Prove eligibility"; Circom + Groth16 proof generated (locally if feasible; otherwise secure demo prover with synthetic input). Soroban BN254 verifier validates. Show explorer transaction, threshold €750k, and absence of exact balance.
4. **Moment of delight (1:20–1:40):** Deal policy turns green; room unlocks. Two consent clicks reveal a synthetic property dossier to the qualified buyer only.
5. **Attack theater (1:40–2:10):** Switch to €400k buyer → can't prove. A forged/expired property attestation → can't qualify. Replay a used nullifier for the same deal → blocked.
6. **Market / scale (2:10–2:30):** Real estate first, API/SDK can later serve brokers and off-market platforms. No legal sale or official verification claimed.

## 4. Technical architecture
```text
React + TypeScript / responsive public Demo Mode
    ├── Seller view: hidden listing, Property Passport, disclosure policy
    ├── Buyer view: qualification wizard, Buyer Passport, ZK proof
    └── Judge view: positive/negative cases, ledger explorer links
                  │
Cloudflare Worker API (or equivalent)
    ├── Deal/session state and offchain synthetic property data (D1/Postgres)
    ├── Rule engine / issuer allowlist mirror / access policy
    ├── Proof orchestration to Groth16 prover (only synthetic inputs in demo)
    └── Enforce room/doc authorization server-side by fresh chain state
                  │
Stellar Testnet (Rust Soroban)
    ├── CredentialRootRegistry (authorized issuers publish/revoke roots)
    ├── Groth16Verifier (reuse audited? NO — educational/example, test thoroughly)
    └── DealGate (deal ID, threshold, accepted root, expiration, used nullifiers,
                  buyer-qualified + property-qualified status)
                  │
Circom + snarkjs / BN254
    └── `BalanceEligibility` circuit: private balance + holder secret +
        issuer-root membership, public deal-id hash + threshold + expiry + nullifier
```

Recommended proof references:
- https://github.com/stellar/soroban-examples/tree/main/groth16_verifier (official educational example; explicitly unaudited)
- https://github.com/stellar-zk/stellar-zk (community CLI/proof pipeline; verify locally before relying on it)
- https://developers.stellar.org/docs/build/apps/zk (official current cryptographic host capabilities)
- https://acta.build and https://reclaimprotocol.org (credential/proof infrastructure — optional integrations, not required for first MVP)

### Contract/public-statement design
**Private witness:** eligibleBalanceCents, holderSecret, credentialSalt, credentialExpiry, issuer membership path.

**Public statement:** `issuerRoot`, `dealIdHash`, `requiredThresholdCents`, `currentEpoch`, `nullifier`, `proofVersion` (and optionally allowed issuer ID). Validate these against the actual DealGate storage; never trust caller-provided matching values without checking.

**Circuit:** bound `eligibleBalanceCents` and credential expiry to an issuer-registered Poseidon commitment; prove membership in issuer root; range-check monetary values; prove balance >= required threshold; prove current epoch <= expiry; derive `nullifier = Poseidon(holderSecret, dealIdHash)` inside the circuit. Contract validates root authorized and active, threshold identical to stored policy, deal ID known, expiry/current epoch valid, nullifier unused, proof against correct VK. Cryptographic statement must not accept arbitrary user-supplied balance with no issuer link.

**Issuer trust model:** An issuer uses Soroban `require_auth` or another authenticated mechanism to register root/version and validity. Bank/property reviewer is **simulated**, clearly labeled. An actual bank attestation or registry check remains a future integration.

**Property claim:** `AUTHORIZED_TO_MARKET` for a salted property/deal commitment; issuer credential authenticated, time-bounded and optionally revocable. Distinguish actual ownership vs legal authority vs developer site control vs proposed floor-area. No private address onchain.

**Onchain privacy:** Submit from a demo relayer or pseudonymous account; acknowledge the onchain submitter remains publicly linkable. Do not print underlying amount, buyer identity or property address in public inputs, events, logs, or explorer links. Do not imply Stellar provides private base-layer transactions.

**Important anti-replay caveat:** `SHA256(proof || public_inputs)` is NOT a safe holder/deal-specific nullifier if a fresh randomized valid proof can be generated again. The nullifier must be derived *inside the proved relation* from the holder's issuer-bound secret and deal ID, then checked against contract state.

## 5. Public application screens
- `/` — branded, compelling 30-second story + "Try buyer" / "Try seller" / "Judge demo".
- `/deal/sample` — anonymous property teaser, public deal rules (€750k minimum), masked owner/address, progress badges.
- `/buyer/passport` — synthetic credential and "Prove eligibility"; no actual bank data and not "bank verified".
- `/seller/passport` — issuer-signed site-control or owner marketing-authority claim, status and evidence type.
- `/deal/sample/room` — server-enforced locked/unlocked state, mutual information disclosure, no raw PII.
- `/judge` — valid case, underfunded case, forged attestation, expired/invalidated root, replay; explorer links and proof technical explanation.

## 6. Functional acceptance tests
Contract/circuit:
- [ ] Certified €900k >= €750k: `true`, `DealGate` marks buyer qualified on Testnet.
- [ ] Certified €400k < €750k: proof cannot establish eligibility; buyer stays unqualified.
- [ ] Fake €900k witness outside a trusted issuer root: proof fails.
- [ ] Modified deal ID/threshold/public root: proof fails.
- [ ] Expired issuer credential or deactivated issuer root: fails (with real time validation).
- [ ] Reusing a verified deal-nullifier: transaction fails/does not grant second qualification.
- [ ] Property verifier unauthorized: property qualification fails.
- [ ] `PLANNING_APPROVED` is not silently granted by a `SITE_CONTROL_VERIFIED` credential.
- [ ] No raw balance, legal owner name, bank document, exact address or personal identifier appears in transaction args/events.
Application:
- [ ] Room cannot load raw document with a direct API request until both checks and disclosure consent pass.
- [ ] One party's approval alone does not reveal the other party's document.
- [ ] Refresh and new browser session do not bypass access state.
- [ ] Demo mode works on mobile, has understandable errors and reasonable response behavior.
- [ ] Public Testnet transaction explorer link resolves and is tied to our deployed contract.

## 7. Recommended build order (critical path)
**Gate A: Cryptography first.** Confirm Rust+CLI toolchain, compile official BN254 Groth16 example, submit one genuine Testnet verification. Exit criterion: valid and tampered proofs behave correctly. Do not first build an elaborate frontend.

**Gate B: Trustworthy statement.** Implement issuer-authorized private amount commitment + bound threshold and deal-id circuit. Exit criterion: real issuer-backed €900k proof succeeds; a fabricated €900k and a genuine €400k fail. This is the most technically valuable work.

**Gate C: Seller credential + policy.** Register authenticated property claim; code DealGate mutual qualification. Exit criterion: room eligibility flips only on both verified facts.

**Gate D: End-to-end UI.** Build responsive demo with curated samples and server-side protected synthetic dossier. Exit criterion: outsider cannot fetch the data through API or URL and the happy path is clickable.

**Gate E: Submission evidence.** Testnet explorer links; tests; deploy public URL; rehearse recordable 2–3 minute demo; fill deck; README/docs; no placeholders.

**Fallback policy:** If Gate B fails, ship a fully working signed-credential + Stellar authorization MVP, accurately reframe it as a verifiable-credentials demo; **do not** claim ZK-protected private balance if only an offchain flag or stub verifies it. A narrower authentic ZK verification is worth more than a wide but simulated application.

## 8. Submission package and the supplied pitch template
Pitch template sections: The Solution, PMF, Technical Workflow, The Team.
- **Solution:** "Two anonymous strangers prove they're qualified for the same deal without exchanging private evidence." Visual of two passport cards -> deal room.
- **PMF:** Off-market property trust friction, Portugal 2025 approximately 169,812 home sales / €41.2B transaction value (all home sales, not TAM). Paid buyers: licensed intermediaries, off-market property platforms, developers. Hypothesis €49–€299/month for pilots plus per-verification fees; explicitly unvalidated, not revenue achieved.
- **Technical Workflow:** External/synthetic attestor -> issuer-backed commitment -> private Circom proof -> Soroban BN254 verifier/DealGate -> private room consent. Show contract/transaction identifiers.
- **Team:** Actual roles and skill alignment, source ownership, who built what in the hack. No invented biography or photos.

README must include quickstart, prerequisites, setup, environment variable names (never values), test scripts, deployment instructions, contract addresses, exact claims proven, confidential fields protected, current limitations, origins/licenses of reused code, judge-mode workflow and hackathon build log.

## 9. Commercial feasibility, safety and honesty
- Portugal recorded **169,812 completed home sales totaling €41.2B in 2025** (INE/DGE): market scale illustration only, not target customer count, not addressable volume for this service. Source: https://estatistica.dgeconomia.gov.pt/indice-de-precos-da-habitacao-ine-18/.
- Comparable providers include Propy, RealOpen, Coadjute and traditional private-broker networks; credential primitives include ACTA, Reclaim and idOS. The novel claim is two-sided credential policy and staged disclosure, not "first-ever onchain real estate".
- Qualified buyer != unconditional financing or guaranteed ability to close. Seller authority != legally transferable property title. Land/site control != approved building plan. Synthetic issued credentials != real bank/registry verification.
- Operating real-estate mediation in Portugal can require IMPIC licensing. Start as technology for licensed professionals, no actual deals, no regulated services in demo. Source: https://www.gov.pt/servicos/mediacao-imobiliaria-licenca-para-o-exercicio-da-atividade.
- Personal evidence and private negotiations remain offchain. Any onchain identifiers are pseudonymized and disclosure-minimized; a hash by itself is not automatically anonymous under privacy law.

## 10. Definition of done
The product is ready for judging when a new visitor can open the live URL; switch buyer and seller personas; inspect synthetic credential sources; verify a real, issuer-backed ZK proof on Stellar Testnet; observe a failed underfunded proof and a rejected untrusted property verifier; enter the room only after both sides pass; inspect an explorer link; and reproduce it locally using the public README and code.

**Status:** This file is the proposed build specification, *not* a claim that the code, contracts, integrations, production issuer vetting, deployment, test suite or video have been implemented.
