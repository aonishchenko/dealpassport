# Third-party components

## Stellar educational Groth16 verifier

Source: https://github.com/stellar/soroban-examples

Pinned commit: `03d42aa6b973dcf3a453a99d0c6a6e8d25a196e2`.

The baseline `contracts/groth16-verifier/src/lib.rs` and its Gnark proof/key fixtures come from `groth16_verifier/contracts/bn254_verifier` at that revision. The pairing verification algorithm is reused educational code. It is unaudited and is not an original Deal Passport contribution. The baseline contract accepts a caller-provided key solely to demonstrate the primitive. Deal qualification must use a pinned verification key and authenticated issuer/deal policy.

The issuer-bound eligibility circuit, policy contract, public-input validation, proof conversion scripts, tests and demo workflow are Deal Passport work created during this event.

Dependency licenses are specified by their published packages. Keep package-lock.json and Cargo.lock to identify the exact versions used.
