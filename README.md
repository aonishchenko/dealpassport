# Deal Passport

Private qualification for a specific real-estate deal, using issuer-bound Groth16 proofs on Stellar Testnet. EasyAI, by Oleksiy Onishchenko, for HackMeridian 2026 Genesis / Stellar Unlocked.

**Copyright and reuse:** original Deal Passport work is all rights reserved, with limited HackMeridian jury evaluation permission. Reuse requires a separate written commercial license from Oleksiy Onishchenko. Public visibility is for review, not general permission to reuse. Third-party components keep their own licenses. Earlier MIT grants for earlier published versions are not revoked. See [LICENSE](LICENSE).

## Implemented and verified

- **Gate A:** deployed the official educational BN254 Groth16 verifier. A genuine Gnark proof returns `true`; changing its public input returns `false`. Both were submitted as real Testnet transactions.
- **Gate B:** implemented a Circom financial eligibility circuit and a Soroban gate with an immutable verification key, an authorized synthetic financial issuer, registered credential roots, stored deal thresholds, ledger-time checks and holder/deal replay protection.
- A genuine synthetic issuer-certified €900k credential qualifies for a €750k deal on Testnet. A genuine €400k member credential and an expired member credential cannot satisfy the circuit. Fabricated balances and false membership paths fail.
- Testnet rejects wrong thresholds, stale epochs, noncanonical field aliases, copied proofs redirected to another account, altered deal IDs, altered proof outputs, and both identical and freshly randomized replays. Revoking a root invalidates a fresh qualification read.
- **Gate C:** property-specific authenticated marketing-authority attestation and mutual consent. Both valid passports remain locked until both participants consent; withdrawal or property revocation locks fresh reads.
- **Gate D:** Cloudflare Worker/D1 protected dossier API passed 17 integration checks against Testnet. Direct access, actor mismatch, forged issuer, changed deal, missing consents, replay and revoked access are rejected. See [API evidence](docs/evidence/gate-d.json).

The light responsive application and browser prover are implemented and build successfully. Browser verification, public deployment and demo video are still in progress at this checkpoint.

## Evidence

- [Gate A transaction record](docs/evidence/gate-a.json)
- [Gate B transaction and rejection record](docs/evidence/gate-b.json)
- [Gate C mutual-consent transaction record](docs/evidence/gate-c.json)
- [Gate D API authorization and disclosure checks](docs/evidence/gate-d.json)
- [Genuine issuer-bound qualification](https://stellar.expert/explorer/testnet/tx/623f433fe8fe01c94ab242b70ada08ac0725378eda1658c7974ebecffd2f0936)
- [Baseline proof verification](https://stellar.expert/explorer/testnet/tx/c7f8e7291b50c6d08fad38d472251c2f9241d2ca25c175ce26f3dc7020971038)
- [Baseline tampered-input verification](https://stellar.expert/explorer/testnet/tx/72697c646c7b43d339b6dc458b90a1e4209bfde059aba3a0d058917a747e8f91)

Baseline verifier: `CAIS42T3EWMLDN3PUW2AWXRQMKKHPB5W7DWUHUODD7C6WHEUEMJBQGKX`.

Eligibility gate: `CAVXDBDAGR3S5BNHSZFNOJIC4IUMVRSQPWABQYODMW26LS5V6DVWHHPB`.

Mutual deal gate: `CCJYMPW6AIZNIR3ACK6IK2MMLDTLVGPJL2OHSKGZMYM3YWBDYYFGKKKZ`.

The verification script deliberately revokes its test root at the end. The successful receipt remains evidence, while a fresh eligibility read correctly returns no active qualification afterward. Re-running generates a new synthetic root/deal.

## Setup and verification

Prerequisites: Node.js 22.12+, npm, Rust 1.92+ with `wasm32v1-none`, and Stellar CLI 25.2+ (tested with 28.1.0). Normal Rust setup:

```sh
rustup target add wasm32v1-none
npm ci
npm run setup:circuit
npm run build:contracts
npm test
```

The local build script also supports this machine's Homebrew Rust with installed Rust sources and `wasm-ld`. It uses Cargo's build-std compatibility path only when rustup is absent. The local official CLI binary lives in ignored `.toolchain/bin/stellar`; a normal installation on PATH also works.

`setup:circuit` compiles the circuit, creates a **single-party demo-only** trusted setup, verifies its consistency and exports the public verification key. It may take several minutes. Proving artifacts stay in `.build/eligibility/`; changing the circuit requires a new matching setup and a newly deployed gate.

```sh
npm run verify:testnet:baseline
npm run verify:testnet:eligibility
npm run verify:testnet:mutual
```

These scripts use only the fixed Stellar Testnet RPC and verify the network passphrase before proceeding. They generate disposable local accounts and fund them through Testnet Friendbot. Private keys are stored with restricted permissions under ignored `.local/`. No production wallet, paid account, private bank data or API key is required. The scripts write public, selected evidence to `docs/evidence/` and do not print account secrets or witnesses.

Baseline verification must run before eligibility verification because Gate B uses its deployed verifier address. Gate B requires the compiled eligibility circuit and its matching setup. Proofs use a five-minute ledger epoch, so run the full scenario early in an epoch if the script reports insufficient time remaining.

There are no required environment variables for these scripts. Network and example financial inputs are explicit in the source.

### Run the demo application

After deploying the three matching contracts above, prepare a private synthetic issuer bundle and the public proving artifacts:

```sh
node scripts/prepare-demo.mjs
npx wrangler d1 migrations apply dealpassport-demo --local
npm run build
npm run dev
# In another terminal:
DEMO_URL=http://127.0.0.1:8973 npm run verify:api
```

Open `http://127.0.0.1:8973`. `prepare-demo` writes ignored `.dev.vars` and `.local/worker-secrets.json`; never publish them. The browser receives only the selected synthetic buyer witness when that session's buyer/judge requests it. Public WASM/zkey proving artifacts do not contain credential witnesses. A fresh checkout's newly generated proving key requires newly deployed matching contracts; do not mix it with the historical deployed verifier key.

For an independent deployment, replace the Cloudflare account/database IDs in `wrangler.jsonc` with your own, create/apply the D1 migration remotely, upload `DEMO_BUNDLE` using `wrangler secret bulk .local/worker-secrets.json`, then deploy. The seeded issuer batch lasts 30 days; republish and upload a new bundle before expiry or after a Testnet reset. Session policies last 20 minutes, but buyer proofs last only the current five-minute epoch. Use **Start a fresh demo** after expiry.

## Statement and boundaries

The private witness contains the certified balance in euro cents, holder secret, salt, inclusive credential-expiry epoch and a four-level Merkle membership path. The issuer's authenticated root commits to all these credential fields.

Public signals, in order:

1. `nullifier = Poseidon(holderSecret, dealIdHash)`
2. `recipientBinding = Poseidon(holderSecret, recipientHash)`
3. `issuerRoot`
4. `dealIdHash`
5. `requiredThresholdCents`
6. `currentEpoch`
7. `proofVersion` (1)
8. `recipientHash = SHA256(pseudonymous account StrKey) mod Fr`

Balance and threshold have 64-bit range constraints. Epochs have 32-bit range constraints. Expiry means the last inclusive five-minute epoch in which the credential may prove. The contract requires the current ledger epoch exactly. A qualification lasts only through that epoch's end, and may expire earlier with the root or deal. This prevents old proofs from extending credential lifetime. A holder/deal nullifier can qualify only once; a replayable demo run creates a new deal.

The receiving account must authorize the transaction and match the public recipient hash. Changing the recipient requires a new proof and retains the same holder/deal nullifier. Public scalar inputs are checked for canonical representation before SDK field conversion.

The account, public threshold, deal identifier, roots, nullifier and proof are publicly visible. Exact balances and holder secrets are absent from transaction arguments and events. Stellar base-layer transactions are public. The baseline accepts a caller-provided key to demonstrate the primitive; the eligibility gate pins its key and verifier address at deployment.

The issuer is synthetic. ZK does not establish bank provenance without a genuine evidence issuer. The demo setup and educational verifier are unaudited and unsuitable for production claims. Nothing here guarantees available financing, reserves funds or proves legal title.

The dependency checkpoint resolved all reported high/moderate advisories with compatible transitive patches. Fifteen low-severity transitive advisories remain. See [local verification record](docs/evidence/local-checks.json). This is a demo toolchain, not a production security assessment.

## Origins and event work

Oleksiy confirmed no pre-event Deal Passport code, design or asset. During the event he subsequently requested Empiro's light palette and visual style as a reference. The new interface follows its warm paper/stone/olive palette, square controls and Inter/Lora typography. No Empiro application code, logo, photographs or customer data is imported. Inter and Lora are independently supplied by the openly licensed Fontsource packages.

The baseline pairing verifier and Gnark fixtures reuse Stellar Development Foundation educational examples under Apache 2.0. See [third-party attribution](docs/THIRD_PARTY.md), [upstream license](licenses/stellar-soroban-examples-APACHE-2.0.txt), and [build log](docs/BUILD_LOG.md). Circom, circomlib, snarkjs, circomlibjs and the Stellar SDK are third-party tools/libraries, not original cryptographic inventions.

New event work includes the eligibility circuit, account binding, root/deal policy, serialization boundary, verification scripts and tests. ChatGPT assisted research/specification. Codex assists coding, debugging, verification and artifact preparation. Oleksiy owns product decisions, review, corrections and submission.

The current pitch deck is `output/presentation/Deal_Passport_HackMeridian_Pitch_v2.pptx`. Its PMF section uses the unvalidated €89/month **or** per-verification model and continues with a competitor comparison. Sources and claim boundaries are in [market context](docs/COMPETITOR_CONTEXT.md). Update implementation-dependent claims against the evidence files before submitting.
