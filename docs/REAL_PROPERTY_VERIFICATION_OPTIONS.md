# Real seller/property verification: low-cost pilot options

Researched 26 October 2026 for the current Portugal-focused MVP. This is feasibility research; no provider account was created, no personal data was sent, and no live-verification integration was implemented.

## Conclusion

Free identity checks and free access to an already-issued property certificate can support a real pilot. No free production API was confirmed in the reviewed offers that establishes a specific Portuguese seller's authority to market a specific property end to end. Identity, property records and authority/mandate are separate evidence requirements. An identity verification or a property passport alone must not automatically grant the current `AUTHORIZED_TO_MARKET` claim.

## Services and limits

| Service | Published free access | What it could establish | Integration implication |
|---|---|---|---|
| Didit | 500 monthly checks per core feature in workflows: ID verification, passive liveness, face match and device/IP analysis | A verification result for the person; vendor lists Portuguese document support | Strong free-tier candidate for seller identity. Proof of address, AML, KYB, database queries and other modules have separate charges. Hosted workflow plus server-verified results; not property ownership or marketing authority. |
| Stripe Identity | First 50 identity verifications free | ID/selfie verification | Alternative identity provider, with account availability and live eligibility to confirm. Not a recurring free property-verification service. |
| Portugal Predial Online / certidão permanente predial | Consultation is free with an existing valid certificate access code; a new online certificate costs €15 and is valid for six months | Official registry information about the identified property, including current and pending records | Best direct property-evidence source for a Portugal pilot. No public automation API was confirmed in the reviewed official guidance. Plan reviewer consultation with permission to use the supplied code. |
| IntegraLayer | Public Testnet and passport launch are advertised; a free production property-authority verification API was not confirmed | Asset passports enriched by data and attestors such as lawyers, valuers and inspectors | Need confirmation of verified-property coverage, attestor assurance, data/API access and commercial terms. Testnet access does not establish a free real-world legal review. |
| MERKAO | No published free embeddable verification API confirmed in the reviewed pages | Vendor describes verified listings, identity checks and confidential deal workflows | Treat as a potential partnership; account access is not evidence of a reusable verification API. |
| RealOpen | Free crypto proof-of-funds letter is explicitly advertised | Buyer wallet control and reported funds | Relevant to the buyer side, rather than the seller/property-authority question. |
| Credas | Demo/sandbox exists; production checks are chargeable unless stated otherwise | API-based identity/document workflows | A sandbox integration would not by itself supply real production verification. |

These are published offers, not independently tested provider assurance or an exhaustive global-market claim. Didit's free allowances apply to the listed core modules through workflows; paid modules and direct standalone feature calls are outside those allowances. Confirm the live workflow's charges and account availability before enrolling real participants.

## Smallest useful real pilot

1. Bind a seller's authenticated account to a hosted identity-verification session. Verify provider-signed webhook/API results on the server; a browser callback alone cannot approve the person.
2. Collect the property reference and an existing valid registry-certificate access code privately. A trusted reviewer consults the official record and matches the verified person to the recorded owner or authorized representative. Review any marketing mandate, corporate representation or co-owner authority required for the specific claim.
3. A separately authenticated reviewer approves only the supported property-specific claim, with evidence provenance, expiry and revocation. Reuse the existing Stellar attestation mechanism with a controlled real-pilot issuer; keep raw documents, identity details and access codes offchain and out of public logs.
4. Enable the seller's passport only when identity and property-authority evidence both pass. Keep the synthetic public demo separate from the real pilot.

The existing public demo allows any visitor to switch personas and trigger the synthetic issuer; that path is unsuitable for real seller verification. The API also returns a fictional dossier and uses shared disposable Testnet personas. Real pilot work therefore includes seller authentication/account binding, reviewer access controls, private evidence/dossier handling and lifecycle changes, rather than merely adding an API key. The buyer ZK circuit does not need redesign solely to add a property-verification provider.

## Indicative effort and required inputs

Engineering estimates, assuming provider credentials/live access and a reviewer are available:

- Hosted identity proof of concept: approximately 1–2 working days, including server result validation and failure states. This establishes identity only.
- Controlled real-property pilot combining identity, registry review and the existing attestation mechanism: approximately 3–5 working days in total. A pilot is not production launch clearance.
- Fully automated, jurisdiction-spanning property and seller-authority verification: requires a suitable registry/data/review partner; timing and costs cannot be estimated from the currently published competitor offers.

Needed from Oleksiy before a real pilot: approval of the chosen provider and its account, API/webhook credentials through secrets, one willing seller and property with permission to use the evidence, a valid certificate code (or €15 for a new certificate), and a trusted property reviewer. No passport/ID document should be pasted into chat or the public repository. Real-person processing also requires an agreed consent, access and retention flow; hosted ID capture can keep raw ID/selfie collection with the provider.

## Primary sources checked

- [Didit free plan and exact included/excluded modules](https://help.didit.me/getting-started/free-plan)
- [Didit public pricing](https://didit.me/pricing/)
- [Didit Portugal coverage](https://didit.me/solutions/countries/portugal/)
- [Didit documentation](https://docs.didit.me/getting-started/introduction)
- [Stripe Identity offer](https://stripe.com/identity)
- [Portugal: consulting an existing property certificate](https://justica.gov.pt/Servicos/Consultar-certidao-permanente-predial)
- [Portugal: requesting a property certificate and fees](https://justica.gov.pt/Servicos/Pedir-certidao-permanente-predial)
- [IntegraLayer asset passports and attestors](https://integralayer.com/)
- [IntegraLayer public Testnet developer documentation](https://docs.integralayer.com/developers)
- [MERKAO published workflow](https://www.merkao.io/)
- [RealOpen free buyer proof-of-funds workflow](https://realopen.com/get-started)
- [Credas demo/production API terms](https://apisupport.credas.com/support/solutions/articles/44002476031-credas-api-overview-api)
