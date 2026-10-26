# Judge walkthrough

Live demo: https://dealpassport.aonishchenko33.workers.dev

All data and issuers are synthetic. All recorded contract transactions use Stellar Testnet. The service signs for disposable demo accounts; persona switching is intentional access within one's own session.

1. **Try the private deal.** Allow Testnet to confirm both immutable policies for a new unique deal.
2. **Seller → Verify marketing authority.** A configured synthetic reviewer attests `AUTHORIZED_TO_MARKET`. Address and documents remain private. This does not prove ownership or planning approval.
3. **Buyer → Prove eligibility.** Select the eligible synthetic credential. A browser Web Worker generates the proof, then the API submits it for actual Soroban verification. Inspect its explorer receipt.
4. **Give buyer consent**, then switch to **Seller → Give seller consent**. Both passport checks and both consents must be current.
5. **Open private dossier.** The backend rechecks contract state before returning the fictional address and authority document to the buyer. The exact buyer balance stays private.
6. **Judge → Negative tests.** Underfunded and expired credentials fail in the browser circuit. A forged issuer fails authorization. A used buyer proof fails replay protection; simulation rejection is labeled separately from submitted failed transactions.
7. **Withdraw or revoke.** Buyer/seller consent can be withdrawn. The issuer can revoke property authority. Subsequent dossier requests lock.

## Timing

A buyer proof lasts only its current five-minute ledger epoch. The interface shows its countdown. Complete the positive sequence promptly; use **Start a fresh demo** after expiry, since the same holder/deal nullifier cannot qualify twice. The browser waits for a new epoch if too little time remains to generate a valid proof.

A session lasts 20 minutes. The current synthetic issuer batch lasts 30 days. Testnet resets may require redeploying and reseeding.

## Evidence and recording

Public receipts and rejection phases are under `docs/evidence/`. The local walkthrough video is an edited tour of captured working MVP states with synthetic narration; it is not an uninterrupted real-time recording. It does not establish external bank/registry provenance or production security. Oleksiy reviews and uploads the video to YouTube/Vimeo for submission.
