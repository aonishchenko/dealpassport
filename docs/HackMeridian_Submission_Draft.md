# Deal Passport — HackMeridian submission draft

Prepared on 25 October 2026 for EasyAI and Oleksiy Onishchenko.

**Working draft for the intended MVP.** The implementation-dependent text below describes the target product. It must be reconciled with the working application and evidence before submission. The application, circuits, contracts, live demo and acceptance tests have not been implemented at the time this draft was prepared. Oleksiy will review, correct and submit the final materials.

Deadline supplied by the organizer: **26 October 2026, 12:00 WET / Lisbon local time**.

## Project title

Deal Passport

## Tagline

Two strangers qualify for one property deal without sharing private financial or property evidence.

## Description

Deal Passport is a confidential qualification layer for off-market real-estate platforms and licensed intermediaries. Its intended MVP lets two strangers prove that they meet the requirements of the same property deal before either shares sensitive evidence.

A seller wants to know that a buyer meets a €750,000 qualification threshold. The buyer wants to know that the seller has verified authority to market the property. Neither wants to send bank statements, identity details or the complete property dossier to an unqualified counterparty.

### Buyer Passport

A clearly labeled synthetic financial issuer certifies a private eligible balance and expiry, bound to the holder's secret. A Circom circuit proves that the certified balance meets the deal threshold and belongs to an authorized issuer root. The statement also binds the proof to the specific deal, validity period and a holder/deal nullifier.

A Soroban contract verifies the Groth16 proof using Stellar's native BN254 primitives. The seller receives a qualification result rather than the exact balance or bank documents. The contract must compare public inputs with its stored policy and reject expired, unauthorized or replayed statements.

### Property Passport

A second synthetic issuer authenticates a specific claim, such as AUTHORIZED_TO_MARKET, for the property/deal commitment. The claim is time-bounded and issuer-authorized. It does not imply verified ownership, transferable title or planning approval. The property address and supporting documents stay offchain.

### Deal Passport

The deal policy requires both financial qualification and an accepted property claim. The backend checks current chain state and both parties' consent before releasing a synthetic dossier. A direct document request must fail while those requirements remain unmet.

### Intended judge experience

Judges can switch between buyer and seller personas and inspect five cases: a valid €900,000 buyer, an underfunded €400,000 buyer, a forged property credential, an expired credential and a replay attempt. Successful verification must expose a real Stellar Testnet explorer link tied to the deployed contract. These cases are acceptance targets until implemented and tested.

All financial and property examples are synthetic. A real cryptographic verification is the technical target, while bank and property-review issuers are simulated. Public ledger activity remains linkable to its submitter. Qualification does not reserve funds, guarantee financing or establish legal title.

The original contribution is the issuer-bound private threshold statement, property-specific mutual qualification policy and consent-controlled disclosure workflow. Educational verifier code and standard cryptographic libraries will be attributed separately. Bank connections, government registries, payments, escrow and a full marketplace are outside the MVP.

EasyAI is a solo project by Oleksiy Onishchenko, responsible for the idea, implementation and demo with AI assistance. His background includes 25+ years in software, fintech engineering leadership and sole-engineer delivery of production marketplaces.

## Problem solved

Private property negotiations create a disclosure deadlock. A seller wants proof that a buyer meets the financial threshold before sharing a confidential dossier. The buyer wants evidence of the seller's authority before sharing financial information. Repeated document exchanges expose more data and require counterparties to trust each other's verification process.

Deal Passport targets that deadlock with independently checkable qualification for the same deal and explicit mutual consent before disclosure. Initial customers would be off-market platforms and licensed intermediaries. Demand, willingness to pay and savings remain hypotheses to validate.

## Challenges

The central engineering challenge is making the private financial proof meaningful: the balance must belong to an authorized issuer commitment, rather than an arbitrary number entered by the user. The circuit must also constrain monetary ranges and expiry and derive the holder/deal nullifier inside the proved relation.

Other critical work includes converting proof and verification-key encodings for Soroban BN254 verification, validating public inputs against stored deal policy, authenticating property claims, rejecting stale credentials and replay, and enforcing disclosure through the backend after fresh chain reads.

Before submission, replace this prospective account with the actual challenges encountered, their resolutions and links to tests or commits. Do not claim an untested security property or completed integration.

## What's next

Validate the workflow with a Portuguese licensed broker or off-market platform, measuring repeated document requests and qualification time. Test the unvalidated pricing hypothesis of €49–€299/month plus verification fees.

Evaluate qualified financial and property attestors, issuer governance and revocation procedures. Review cryptography, key handling and privacy before considering real data. Develop an integration API for existing platforms and assess Empiro as a possible integration context. No pilot, integration or partnership is claimed as secured.

## Repository link

https://github.com/aonishchenko/dealpassport

The repository is public. It currently contains its initial license commit. Source, setup instructions, tests and the event build log must be published as the MVP is built.

## Project website link

Pending deployment. The intended host is the Cloudflare account associated with aonishchenko33@gmail.com. Existing OAuth access has been verified, including Workers and D1 permissions. No API key needs to be sent in chat.

Add the deployed HTTPS URL after checking the public demo. Publish llms.txt, robots.txt and sitemap.xml with public routes only. Exclude private deal-room data, proof witnesses, credentials, issuer secrets and dossier content from those files.

## Demo video link

Pending a working MVP recording and publication to **YouTube or Vimeo**. A local video file or another hosting provider does not satisfy the stated submission requirement. Oleksiy can supply the published link, or later authorize a specific upload workflow.

## Deck file

`output/presentation/Deal_Passport_HackMeridian_Pitch_MVP_Target.pptx`

Five slides following the supplied template: cover, The Solution, PMF, Technical Workflow and The Team. Current slides identify implementation-dependent behavior as an MVP target. Finalize those labels and notes only after verified build results support the claims. The upload must remain below 20 MiB.

## Builder track

Genesis

## Thematic track

Stellar Unlocked

This is the intended track for genuine native BN254 verification that controls the deal workflow. If the delivered MVP instead uses only signed credentials, revise the description and track rationale to match the actual implementation.

## Tech stack

React, TypeScript, Vite, Cloudflare Workers, Cloudflare D1, Rust, Soroban, Stellar Testnet, Circom, snarkjs, BN254, Groth16, Poseidon

Thirteen planned entries, below the limit of 25. Remove unused technologies and add only technologies actually used.

## Prior work disclosure

**Confirmed by Oleksiy:** no Deal Passport code, designs or assets existed before the event. No code or assets will be reused from Empiro.

Known context: Empiro and Gleamit are prior products described in the participant's CV. They are experience and possible future integration context, not implemented integrations in this project. The supplied pitch design is the organizer's template. The intended implementation may adapt the official educational Soroban Groth16 verifier and use standard Circom/snarkjs libraries. Record actual sources, licenses and modifications in the README/build log. The underlying cryptographic primitives and reused libraries are not original Deal Passport inventions.

Current form text:

“No Deal Passport code, designs or assets existed before the event. No Empiro code or assets are reused. The pitch deck uses the organizer's template. The implementation reuses the official educational Soroban BN254 Groth16 verifier and standard cryptographic libraries, with attribution and pinned revisions in the repository. The Deal Passport eligibility circuit, issuer/deal policy, application and tests are event work as recorded in the build log.”

Update the exact imported components and completed event work against the final build log before submitting.

## AI tooling note

Current factual draft:

“ChatGPT supported concept research, product positioning, architecture and the build specification. Codex connected the local Git repository, reviewed the specification and supplied context, verified Cloudflare access, and prepared the pitch deck and submission draft using the organizer's template and participant-supplied CV. Oleksiy Onishchenko owns the product decisions, factual review, corrections and final submission.”

After the build, append Codex's actual coding, debugging, test and deployment contributions from the build log. List any additional tools only if used. AI-generated text and code remain subject to the participant's review. Do not imply a completed human review before Oleksiy performs it.

## Completion map

| Submission field | Ready now | What remains |
|---|---|---|
| Title and tagline | Yes | Oleksiy's editorial review |
| Description, problem, challenges, next steps | Draft | Reconcile with actual MVP and test results |
| Repository URL | Yes | Publish source, README and evidence |
| Website URL | Hosting access verified | Implement, deploy and inspect public demo |
| YouTube/Vimeo URL | No | Record, publish and add link |
| Deck | MVP-target version | Review and update with verified outcomes |
| Genesis / Stellar Unlocked | Intended selection | Check actual build supports track claim |
| Tech stack | Planned list | Reconcile with implementation |
| Prior work | Confirmed: none before event, no Empiro reuse | Keep open-source attribution current |
| AI tooling | Current contribution record | Update after build |

## Evidence needed before finalizing

- Actual contract IDs, verification transaction hashes and resolving explorer URLs.
- Observed results for the positive flow, negative cases and direct API access tests.
- Current screenshots, a tested public URL and a 2–3 minute demo.
- README with exact proven claims, limitations, setup and tests, plus third-party attribution and a dated event build log.
- Definitive prior-work and AI-tooling disclosures reviewed by Oleksiy.

Do not invent proof timing, fee figures, test outcomes, customer interviews, pilots or revenue. Include measurements only after collecting them.

## Sources

- `Deal_Passport_HackMeridian_Build_Spec.md` in this project.
- User-provided submission requirements and team details.
- `Oleksiy_Onishchenko_AI_EM_CV.pdf`, used only for the team summary. Raw CV and contact details are excluded from Git by `.gitignore`.
- Shared planning context: https://chatgpt.com/share/6ade81eb-caf0-83ed-9549-280c99929b07
- Official deadline and submission overview: https://www.hackmeridian.com/
- DGE reporting INE, 24 March 2026, for the deck's Portugal 2025 home-sales totals: https://estatistica.dgeconomia.gov.pt/indice-de-precos-da-habitacao-ine-18/
- Stellar cryptographic primitives: https://developers.stellar.org/docs/build/apps/zk
