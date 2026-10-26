# Third-party components

## Stellar educational Groth16 verifier

Source: https://github.com/stellar/soroban-examples

Pinned commit: `03d42aa6b973dcf3a453a99d0c6a6e8d25a196e2`.

The baseline `contracts/groth16-verifier/src/lib.rs` and its Gnark proof/key fixtures come from `groth16_verifier/contracts/bn254_verifier` at that revision. The pairing verification algorithm is reused educational code. It is unaudited and is not an original Deal Passport contribution. The baseline contract accepts a caller-provided key solely to demonstrate the primitive. Deal qualification must use a pinned verification key and authenticated issuer/deal policy.

The issuer-bound eligibility circuit, policy contract, public-input validation, proof conversion scripts, tests and demo workflow are Deal Passport work created during this event.

Dependency licenses are specified by their published packages. Keep package-lock.json and Cargo.lock to identify the exact versions used.

## GPL proving dependencies

The installed versions of `snarkjs` (0.7.6), `circomlib` (2.0.5), `circomlibjs` (0.1.7), `circom2` (0.2.23) and `ffjavascript` (0.2.63) declare GPL-3.0. The browser prover currently bundles snarkjs and its proving dependencies. These are not proprietary Deal Passport inventions, and the root rights-reserved notice does not override their licenses or any applicable copyleft requirements. GPL text is preserved in `licenses/GPL-3.0.txt`.

The UI exchanges witness/proof messages with a dedicated prover Web Worker; that technical separation is not a legal conclusion that the entire current distribution can be licensed exclusively as proprietary. The source/licensing boundary needs review before a commercial proprietary distribution, or the affected components need replacement or appropriate separate licenses. No promise is made that every part of the current stack requires payment to reuse. Earlier repository versions were also published under MIT.

Primary upstream sources: https://github.com/iden3/snarkjs/blob/master/COPYING and https://github.com/iden3/circomlib/blob/master/package.json. Installed package manifests and lockfiles identify the actual versions.

## UI and fonts

The light visual style was requested during the event as a reference to Oleksiy's Empiro project: paper/stone/olive palette, square corners, Inter and Lora. The interface is newly written for Deal Passport. No Empiro component code, logo, photograph or customer data is included.

Inter and Lora are independently distributed by `@fontsource-variable/inter` and `@fontsource-variable/lora` under the SIL Open Font License. Their license copies are in `licenses/Inter-OFL.txt` and `licenses/Lora-OFL.txt`. Lucide supplies the interface icons under its published license. The small DP favicon is newly authored SVG text.
