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

AI assistance: ChatGPT supported idea research and the specification. Codex performs repository setup, implementation, debugging, testing and preparation of presentation/submission artifacts. Oleksiy owns product decisions, review, corrections and final submission.
