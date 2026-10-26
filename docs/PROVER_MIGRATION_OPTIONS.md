# Non-GPL proving-stack options

Research and limited compatibility evaluation, 26 October 2026. No application dependencies, circuits or deployments were changed.

## Decision: deferred until after the MVP

On 26 October 2026, Oleksiy explicitly deferred non-GPL migration until after the MVP and asked that no further implementation time be spent on it now. Keep the current proving dependencies for MVP work. The options and existing compatibility result below are a post-MVP backlog item, not an active migration. Resume evaluation and implementation only when that work is requested again. Existing third-party license obligations and disclosures remain applicable.

## Recommended direction to evaluate

Move the eligibility constraints and Groth16 proving/setup into a native Rust Arkworks stack. This removes the Circom compiler and circuit-library requirement together. The existing BN254 Groth16 verification approach is the intended target; compatibility with Stellar and browser WebAssembly remains to be demonstrated with a real proof.

| Current package | Replacement candidate | Published license | Work required |
|---|---|---|---|
| snarkjs | ark-groth16 | MIT or Apache-2.0 | Replace proving, setup, key handling, proof serialization and browser integration |
| circomlibjs | poseidon-lite 0.3.0 for our current Poseidon-only use; alternatively Arkworks hashing exposed from Rust | MIT for poseidon-lite 0.3.0; MIT or Apache-2.0 for Arkworks primitives | Preserve exact hash parameters and test issuer/circuit consistency |
| circomlib | ark-r1cs-std and ark-crypto-primitives | MIT or Apache-2.0 | Reimplement eligibility constraints with range/comparison, Poseidon, Merkle membership, expiry and recipient/nullifier bindings |
| circom2 | ark-relations plus the Rust compiler/build pipeline | MIT or Apache-2.0 for Arkworks; Rust compiler license applies separately | Express and synthesize constraints directly in Rust, removing the need to compile Circom |

A full circuit migration needs a new matching setup, proving/verifying keys, issuer fixtures where applicable, deployed verification-key configuration and a rebuilt browser prover. Browser privacy must remain intact. Final pinned dependencies and generated artifacts must be audited; these candidates are not a completed proprietary-distribution clearance. Arkworks describes these libraries as academic prototypes, so this is a migration candidate rather than a production-security endorsement.

The Apache-2.0 gnark/gnark-crypto stack is another full-circuit option. Browser integration must likewise be established before selecting it for the current local-proving flow.

## Verified narrow result

The project imports only `buildPoseidon` from circomlibjs, in `scripts/credentials.mjs`. Its circuit uses two-input hashes for Merkle nodes/nullifiers/recipient binding and five-input hashes for credential leaves.

An isolated evaluation of the published **poseidon-lite 0.3.0** package found a declared **MIT** license and no runtime dependencies. Its two- and five-input hashes matched circomlibjs 0.1.7 on **200** cases covering zero, one, field-boundary, sequential and randomized inputs. This establishes hash-output compatibility for the tested functions; it does not establish a completed application migration or a side-channel/security review. Upstream notes that this BigInt implementation is unaudited and not constant-time.

Evidence: [poseidon-replacement-evaluation.json](evidence/poseidon-replacement-evaluation.json).

## Remaining GPL dependencies

A read-only reachability simulation over the current package-lock.json excluded the four direct packages snarkjs, circomlib, circomlibjs and circom2. No GPL-declared package remained reachable from the other direct project dependencies, including development dependencies. Therefore the seven other currently identified GPL package names can be removed with that migration, provided replacement packages do not reintroduce them. Removing imports alone does not prune the installation or lockfile; those must be regenerated and checked.

The LGPL-containing Sharp/libvips development dependencies through Wrangler/Miniflare remain independently reachable. Current Circom-derived circuit/prover artifacts also need rebuilding as part of the migration.

## Primary references

- [Arkworks Groth16 implementation and license](https://github.com/arkworks-rs/groth16)
- [Arkworks circuit gadgets and license](https://github.com/arkworks-rs/r1cs-std)
- [Arkworks native hashing and circuit hashing constraints](https://github.com/arkworks-rs/crypto-primitives/tree/main/crypto-primitives/src/sponge/poseidon)
- [Arkworks primitive-library license declaration](https://github.com/arkworks-rs/crypto-primitives/blob/main/Cargo.toml)
- [Arkworks constraint relations](https://github.com/arkworks-rs/snark/tree/master/relations)
- [poseidon-lite version-specific licensing and implementation notes](https://github.com/chancinald/poseidon-lite)
- [gnark proving systems, curves and license](https://github.com/Consensys-Incorporated/gnark)
