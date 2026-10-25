#![no_std]

use soroban_sdk::{
    Address, BytesN, Env, IntoVal, Symbol, U256, contract, contracterror, contractimpl,
    contracttype,
};

#[contracttype]
#[derive(Clone)]
pub enum PropertyClaim {
    AuthorizedToMarket,
    SiteControlVerified,
}

#[contracttype]
#[derive(Clone)]
pub struct DealPolicy {
    pub seller: Address,
    pub property_commitment: BytesN<32>,
    pub required_claim: PropertyClaim,
    pub valid_until: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct PropertyAttestation {
    pub issuer: Address,
    pub claim: PropertyClaim,
    pub valid_until: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct BuyerQualification {
    pub issuer_root: U256,
    pub nullifier: U256,
    pub proven_epoch: u64,
    pub valid_until: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct DealStatus {
    pub buyer_valid: bool,
    pub property_valid: bool,
    pub buyer_consent: bool,
    pub seller_consent: bool,
    pub unlocked: bool,
}

#[contracttype]
#[derive(Clone)]
struct Config {
    admin: Address,
    property_issuer: Address,
    buyer_gate: Address,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Config,
    Deal(U256),
    Attestation(U256),
    Consent(U256, Address, Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum DealError {
    InvalidPolicy = 1,
    UnknownDeal = 2,
    DealAlreadyExists = 3,
    WrongClaim = 4,
    InvalidAttestation = 5,
    NotParticipant = 6,
    NotQualified = 7,
}

fn config(env: &Env) -> Config {
    env.storage().instance().get(&Key::Config).unwrap()
}
fn keep(env: &Env, key: &Key) {
    let ttl = env.storage().max_ttl();
    env.storage().persistent().extend_ttl(key, ttl / 2, ttl);
    env.storage().instance().extend_ttl(ttl / 2, ttl);
}

#[contract]
pub struct DealGate;

#[contractimpl]
impl DealGate {
    pub fn __constructor(env: Env, admin: Address, property_issuer: Address, buyer_gate: Address) {
        env.storage().instance().set(
            &Key::Config,
            &Config {
                admin,
                property_issuer,
                buyer_gate,
            },
        );
    }

    pub fn create_deal(
        env: Env,
        deal_id: U256,
        seller: Address,
        property_commitment: BytesN<32>,
        required_claim: PropertyClaim,
        valid_until: u64,
    ) -> Result<(), DealError> {
        config(&env).admin.require_auth();
        if valid_until <= env.ledger().timestamp() {
            return Err(DealError::InvalidPolicy);
        }
        let key = Key::Deal(deal_id);
        if env.storage().persistent().has(&key) {
            return Err(DealError::DealAlreadyExists);
        }
        env.storage().persistent().set(
            &key,
            &DealPolicy {
                seller,
                property_commitment,
                required_claim,
                valid_until,
            },
        );
        keep(&env, &key);
        Ok(())
    }

    pub fn attest(
        env: Env,
        deal_id: U256,
        claim: PropertyClaim,
        valid_until: u64,
    ) -> Result<(), DealError> {
        let cfg = config(&env);
        cfg.property_issuer.require_auth();
        let policy: DealPolicy = env
            .storage()
            .persistent()
            .get(&Key::Deal(deal_id.clone()))
            .ok_or(DealError::UnknownDeal)?;
        if valid_until <= env.ledger().timestamp() || valid_until > policy.valid_until {
            return Err(DealError::InvalidAttestation);
        }
        let matches = matches!(
            (&policy.required_claim, &claim),
            (
                PropertyClaim::AuthorizedToMarket,
                PropertyClaim::AuthorizedToMarket
            ) | (
                PropertyClaim::SiteControlVerified,
                PropertyClaim::SiteControlVerified
            )
        );
        if !matches {
            return Err(DealError::WrongClaim);
        }
        let key = Key::Attestation(deal_id);
        env.storage().persistent().set(
            &key,
            &PropertyAttestation {
                issuer: cfg.property_issuer,
                claim,
                valid_until,
                active: true,
            },
        );
        keep(&env, &key);
        Ok(())
    }

    pub fn revoke_property(env: Env, deal_id: U256) -> Result<(), DealError> {
        config(&env).property_issuer.require_auth();
        let key = Key::Attestation(deal_id);
        let mut attestation: PropertyAttestation = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(DealError::InvalidAttestation)?;
        attestation.active = false;
        env.storage().persistent().set(&key, &attestation);
        keep(&env, &key);
        Ok(())
    }

    pub fn consent(
        env: Env,
        deal_id: U256,
        buyer: Address,
        party: Address,
        accepted: bool,
    ) -> Result<(), DealError> {
        party.require_auth();
        let policy: DealPolicy = env
            .storage()
            .persistent()
            .get(&Key::Deal(deal_id.clone()))
            .ok_or(DealError::UnknownDeal)?;
        if party != buyer && party != policy.seller {
            return Err(DealError::NotParticipant);
        }
        if accepted {
            let status = Self::status(env.clone(), deal_id.clone(), buyer.clone())?;
            if !status.buyer_valid || !status.property_valid {
                return Err(DealError::NotQualified);
            }
        }
        let key = Key::Consent(deal_id, buyer, party);
        env.storage().persistent().set(&key, &accepted);
        keep(&env, &key);
        Ok(())
    }

    pub fn status(env: Env, deal_id: U256, buyer: Address) -> Result<DealStatus, DealError> {
        let cfg = config(&env);
        let policy: DealPolicy = env
            .storage()
            .persistent()
            .get(&Key::Deal(deal_id.clone()))
            .ok_or(DealError::UnknownDeal)?;
        let attestation: Option<PropertyAttestation> = env
            .storage()
            .persistent()
            .get(&Key::Attestation(deal_id.clone()));
        let now = env.ledger().timestamp();
        let property_valid = now <= policy.valid_until
            && attestation
                .map(|a| a.active && a.issuer == cfg.property_issuer && now <= a.valid_until)
                .unwrap_or(false);
        // A fresh cross-contract read rechecks root revocation and time. Cached
        // booleans and old transaction receipts cannot unlock a room.
        let qualified: Option<BuyerQualification> = env.invoke_contract(
            &cfg.buyer_gate,
            &Symbol::new(&env, "qualification"),
            (deal_id.clone(), buyer.clone()).into_val(&env),
        );
        let buyer_valid =
            buyer != policy.seller && now <= policy.valid_until && qualified.is_some();
        let buyer_consent = env
            .storage()
            .persistent()
            .get(&Key::Consent(deal_id.clone(), buyer.clone(), buyer.clone()))
            .unwrap_or(false);
        let seller_consent = env
            .storage()
            .persistent()
            .get(&Key::Consent(deal_id, buyer, policy.seller))
            .unwrap_or(false);
        Ok(DealStatus {
            buyer_valid,
            property_valid,
            buyer_consent,
            seller_consent,
            unlocked: buyer_valid && property_valid && buyer_consent && seller_consent,
        })
    }

    pub fn property(env: Env, deal_id: U256) -> Option<PropertyAttestation> {
        env.storage().persistent().get(&Key::Attestation(deal_id))
    }
}
