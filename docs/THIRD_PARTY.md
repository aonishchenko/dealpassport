# Third-party components

## Stellar educational Groth16 verifier

Source: https://github.com/stellar/soroban-examples

Pinned commit: `03d42aa6b973dcf3a453a99d0c6a6e8d25a196e2`.

The baseline `contracts/groth16-verifier/src/lib.rs` and its Gnark proof/key fixtures come from `groth16_verifier/contracts/bn254_verifier` at that revision. The pairing verification algorithm is reused educational code. It is unaudited and is not an original Deal Passport contribution. The baseline contract accepts a caller-provided key solely to demonstrate the primitive. Deal qualification must use a pinned verification key and authenticated issuer/deal policy.

The issuer-bound eligibility circuit, policy contract, public-input validation, proof conversion scripts, tests and demo workflow are Deal Passport work created during this event.

Dependency licenses are specified by their published packages. Keep package-lock.json and Cargo.lock to identify the exact versions used.

## GPL proving dependencies

The complete package audit on 26 October 2026 found **11 distinct GPL-3.0 package names**, covering 13 name/version pairs and 15 lockfile locations. This replaces the earlier incomplete five-package summary. Declared licenses match installed manifests. The browser prover bundles snarkjs and relevant proving dependencies; the table also includes setup and compiler dependencies, which are not all browser code.

| Package | Locked version(s) | Use / dependency path |
|---|---|---|
| snarkjs | 0.7.6 | Browser Groth16 prover; circuit setup and test tools |
| circomlibjs | 0.1.7 | Synthetic issuer credentials, Poseidon hashes and Merkle tree generation |
| circomlib | 2.0.5 | Poseidon, comparison and bit-decomposition circuit sources included by our circuit |
| circom2 | 0.2.23 | Circom compiler used by the circuit build script |
| ffjavascript | 0.2.63, 0.3.0, 0.3.1 | Finite-field arithmetic through circomlibjs, snarkjs and their dependencies |
| wasmcurves | 0.2.2 | Curve arithmetic through ffjavascript |
| wasmbuilder | 0.0.16 | WebAssembly construction through ffjavascript / wasmcurves |
| fastfile | 0.0.20 | Proving/setup file access through snarkjs / binary-file utilities |
| @iden3/binfileutils | 0.0.12 | Binary proving-key and circuit file utilities through snarkjs / r1csfile |
| r1csfile | 0.0.48 | Constraint-system files through snarkjs |
| @iden3/bigarray | 0.0.2 | Large arrays through r1csfile |

All rows above declare **GPL-3.0** in package metadata. `circomlib` comparison/bit-decomposition source headers also explicitly carry GPL terms. Build-time compiler use, included circuit source and distributed prover code are different uses; this inventory does not treat their legal consequences as identical. These are not proprietary Deal Passport inventions, and the root rights-reserved notice does not override their licenses or any applicable copyleft requirements. GPL text is preserved in `licenses/GPL-3.0.txt`.

The UI exchanges witness/proof messages with a dedicated prover Web Worker; that technical separation is not a legal conclusion that the entire current distribution can be licensed exclusively as proprietary. The source/licensing boundary needs review before a commercial proprietary distribution, or the affected components need replacement or appropriate separate licenses. No promise is made that every part of the current stack requires payment to reuse. Earlier repository versions were also published under MIT.

Primary upstream sources: https://github.com/iden3/snarkjs/blob/master/COPYING and https://github.com/iden3/circomlib/blob/master/package.json. Installed package manifests and lockfiles identify the actual versions.

## LGPL development dependencies and audit scope

`wrangler → miniflare → sharp` brings platform-specific native image tooling with LGPL components. The current Darwin x64 installation contains `@img/sharp-libvips-darwin-x64` **1.3.4** (`LGPL-3.0-or-later`) and the optional `@img/sharp-wasm32` **0.35.5** (`Apache-2.0 AND LGPL-3.0-or-later AND MIT`). The lockfile also contains other platform alternatives; these are not separate application features. The libvips package matches the current development platform; presence of the optional WASM package is not a claim that the native execution path loads it. These dependencies are development tooling, and are not imported by the Deal Passport interface or Worker.

No AGPL declaration was found in the npm package inventory. All **214** registry packages in Cargo.lock were checked: **184** local Cargo manifests plus exact-version crates.io metadata for **30** uncached packages. No GPL/LGPL/AGPL license expression was found in that Rust inventory. The reused Stellar verifier retains its Apache-2.0 provenance above.

Machine-readable evidence, exact installed/locked paths, optional-platform distinctions, lockfile hash and Rust metadata sources: [license-inventory.json](evidence/license-inventory.json). This is an audit of declared package licenses and directly included circuit sources, not a source-by-source legal opinion or an inventory of general-purpose operating-system tools and every embedded native-library feature.

## UI and fonts

The light visual style was requested during the event as a reference to Oleksiy's Empiro project: paper/stone/olive palette, square corners, Inter and Lora. The interface is newly written for Deal Passport. No Empiro component code, logo, photograph or customer data is included.

Inter and Lora are independently distributed by `@fontsource-variable/inter` and `@fontsource-variable/lora` under the SIL Open Font License. Their license copies are in `licenses/Inter-OFL.txt` and `licenses/Lora-OFL.txt`. Lucide supplies the interface icons under its published license. The small DP favicon is newly authored SVG text.
