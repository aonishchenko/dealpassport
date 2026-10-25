#![no_std]

use soroban_sdk::{
    Address, Bytes, BytesN, Env, IntoVal, Symbol, U256, Vec, contract, contracterror,
    contractevent, contractimpl, contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
};

// Proof/key DTOs match the official educational Stellar BN254 verifier.
// See docs/THIRD_PARTY.md and licenses/stellar-soroban-examples-APACHE-2.0.txt.
#[contracttype]
#[derive(Clone)]
pub struct VerificationKey {
    pub alpha: Bn254G1Affine,
    pub beta: Bn254G2Affine,
    pub gamma: Bn254G2Affine,
    pub delta: Bn254G2Affine,
    pub ic: Vec<Bn254G1Affine>,
}

#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: Bn254G1Affine,
    pub b: Bn254G2Affine,
    pub c: Bn254G1Affine,
}

pub const EPOCH_SECONDS: u64 = 300;
const INPUT_COUNT: u32 = 8;
const FR_MODULUS: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29, 0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x28, 0x33, 0xe8, 0x48, 0x79, 0xb9, 0x70, 0x91, 0x43, 0xe1, 0xf5, 0x93, 0xf0, 0x00, 0x00, 0x01,
];

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum GateError {
    InvalidKey = 1,
    NoncanonicalInput = 2,
    InvalidPolicy = 3,
    UnknownDeal = 4,
    InvalidRoot = 5,
    ExpiredPolicy = 6,
    WrongThreshold = 7,
    WrongEpoch = 8,
    WrongVersion = 9,
    WrongRecipient = 10,
    ReplayedNullifier = 11,
    InvalidProof = 12,
    WrongInputCount = 13,
    DealAlreadyExists = 14,
    RootAlreadyExists = 15,
}

#[contracttype]
#[derive(Clone)]
struct Config {
    admin: Address,
    financial_issuer: Address,
    verifier: Address,
    verification_key: VerificationKey,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct DealPolicy {
    pub required_threshold_cents: u64,
    pub valid_until: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct CredentialRoot {
    pub issuer: Address,
    pub active: bool,
    pub valid_until: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Qualification {
    pub issuer_root: U256,
    pub nullifier: U256,
    pub proven_epoch: u64,
    pub valid_until: u64,
}

#[contractevent]
pub struct BuyerQualified {
    pub deal_id: U256,
    pub buyer: Address,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    Root(U256),
    Deal(U256),
    Used(U256, U256),
    Qualified(U256, Address),
}

fn modulus(env: &Env) -> U256 {
    U256::from_be_bytes(env, &Bytes::from_array(env, &FR_MODULUS))
}

fn canonical(env: &Env, value: &U256) -> Result<(), GateError> {
    if value >= &modulus(env) {
        return Err(GateError::NoncanonicalInput);
    }
    Ok(())
}

fn config(env: &Env) -> Config {
    env.storage().instance().get(&DataKey::Config).unwrap()
}

fn keep(env: &Env, key: &DataKey) {
    let ttl = env.storage().max_ttl();
    env.storage().persistent().extend_ttl(key, ttl / 2, ttl);
    env.storage().instance().extend_ttl(ttl / 2, ttl);
}

#[contract]
pub struct EligibilityGate;

#[contractimpl]
impl EligibilityGate {
    // The verifier address and circuit VK are pinned at deployment, with no
    // setter or caller-provided key in the qualification entrypoint.
    pub fn __constructor(
        env: Env,
        admin: Address,
        financial_issuer: Address,
        verifier: Address,
        verification_key: VerificationKey,
    ) -> Result<(), GateError> {
        if verification_key.ic.len() != INPUT_COUNT + 1 {
            return Err(GateError::InvalidKey);
        }
        env.storage().instance().set(
            &DataKey::Config,
            &Config {
                admin,
                financial_issuer,
                verifier,
                verification_key,
            },
        );
        Ok(())
    }

    pub fn register_root(env: Env, root: U256, valid_until: u64) -> Result<(), GateError> {
        canonical(&env, &root)?;
        let cfg = config(&env);
        cfg.financial_issuer.require_auth();
        if valid_until <= env.ledger().timestamp() || root == U256::from_u32(&env, 0) {
            return Err(GateError::InvalidPolicy);
        }
        let key = DataKey::Root(root);
        // Revoked roots cannot be reactivated under the same commitment.
        if env.storage().persistent().has(&key) {
            return Err(GateError::RootAlreadyExists);
        }
        env.storage().persistent().set(
            &key,
            &CredentialRoot {
                issuer: cfg.financial_issuer,
                active: true,
                valid_until,
            },
        );
        keep(&env, &key);
        Ok(())
    }

    pub fn revoke_root(env: Env, root: U256) -> Result<(), GateError> {
        config(&env).financial_issuer.require_auth();
        let key = DataKey::Root(root);
        let mut record: CredentialRoot = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(GateError::InvalidRoot)?;
        record.active = false;
        env.storage().persistent().set(&key, &record);
        keep(&env, &key);
        Ok(())
    }

    pub fn create_deal(
        env: Env,
        deal_id: U256,
        required_threshold_cents: u64,
        valid_until: u64,
    ) -> Result<(), GateError> {
        config(&env).admin.require_auth();
        canonical(&env, &deal_id)?;
        if deal_id == U256::from_u32(&env, 0)
            || required_threshold_cents == 0
            || valid_until <= env.ledger().timestamp()
        {
            return Err(GateError::InvalidPolicy);
        }
        let key = DataKey::Deal(deal_id);
        if env.storage().persistent().has(&key) {
            return Err(GateError::DealAlreadyExists);
        }
        env.storage().persistent().set(
            &key,
            &DealPolicy {
                required_threshold_cents,
                valid_until,
            },
        );
        keep(&env, &key);
        Ok(())
    }

    pub fn qualify(
        env: Env,
        buyer: Address,
        proof: Proof,
        public_inputs: Vec<U256>,
    ) -> Result<(), GateError> {
        buyer.require_auth();
        if public_inputs.len() != INPUT_COUNT {
            return Err(GateError::WrongInputCount);
        }
        for value in public_inputs.iter() {
            canonical(&env, &value)?;
        }
        let cfg = config(&env);
        let nullifier = public_inputs.get(0).unwrap();
        let root_value = public_inputs.get(2).unwrap();
        let deal_id = public_inputs.get(3).unwrap();
        let root_key = DataKey::Root(root_value.clone());
        let deal_key = DataKey::Deal(deal_id.clone());
        let root: CredentialRoot = env
            .storage()
            .persistent()
            .get(&root_key)
            .ok_or(GateError::InvalidRoot)?;
        let policy: DealPolicy = env
            .storage()
            .persistent()
            .get(&deal_key)
            .ok_or(GateError::UnknownDeal)?;
        let now = env.ledger().timestamp();
        if !root.active || root.issuer != cfg.financial_issuer {
            return Err(GateError::InvalidRoot);
        }
        if now > root.valid_until || now > policy.valid_until {
            return Err(GateError::ExpiredPolicy);
        }
        if public_inputs.get(4).unwrap()
            != U256::from_u128(&env, policy.required_threshold_cents as u128)
        {
            return Err(GateError::WrongThreshold);
        }
        let epoch = now / EPOCH_SECONDS;
        if public_inputs.get(5).unwrap() != U256::from_u128(&env, epoch as u128) {
            return Err(GateError::WrongEpoch);
        }
        if public_inputs.get(6).unwrap() != U256::from_u32(&env, 1) {
            return Err(GateError::WrongVersion);
        }
        let digest: BytesN<32> = env.crypto().sha256(&buyer.to_string().to_bytes()).into();
        let recipient = U256::from_be_bytes(&env, &digest.into()).rem_euclid(&modulus(&env));
        if public_inputs.get(7).unwrap() != recipient {
            return Err(GateError::WrongRecipient);
        }
        let used_key = DataKey::Used(deal_id.clone(), nullifier.clone());
        if env.storage().persistent().has(&used_key) {
            return Err(GateError::ReplayedNullifier);
        }
        let mut signals = Vec::<Bn254Fr>::new(&env);
        for value in public_inputs.iter() {
            signals.push_back(Bn254Fr::from_u256(value));
        }
        let verified: bool = env.invoke_contract(
            &cfg.verifier,
            &Symbol::new(&env, "verify_proof"),
            (cfg.verification_key, proof, signals).into_val(&env),
        );
        if !verified {
            return Err(GateError::InvalidProof);
        }
        let qualified_key = DataKey::Qualified(deal_id.clone(), buyer.clone());
        let valid_until = core::cmp::min(
            (epoch + 1) * EPOCH_SECONDS - 1,
            core::cmp::min(root.valid_until, policy.valid_until),
        );
        env.storage().persistent().set(&used_key, &true);
        env.storage().persistent().set(
            &qualified_key,
            &Qualification {
                issuer_root: root_value,
                nullifier,
                proven_epoch: epoch,
                valid_until,
            },
        );
        for key in [used_key, qualified_key, root_key, deal_key] {
            keep(&env, &key);
        }
        BuyerQualified { deal_id, buyer }.publish(&env);
        Ok(())
    }

    pub fn qualification(env: Env, deal_id: U256, buyer: Address) -> Option<Qualification> {
        let result: Qualification = env
            .storage()
            .persistent()
            .get(&DataKey::Qualified(deal_id.clone(), buyer))?;
        let root: CredentialRoot = env
            .storage()
            .persistent()
            .get(&DataKey::Root(result.issuer_root.clone()))?;
        let deal: DealPolicy = env.storage().persistent().get(&DataKey::Deal(deal_id))?;
        let now = env.ledger().timestamp();
        if !root.active
            || now > root.valid_until
            || now > deal.valid_until
            || now > result.valid_until
        {
            return None;
        }
        Some(result)
    }

    pub fn root(env: Env, root: U256) -> Option<CredentialRoot> {
        env.storage().persistent().get(&DataKey::Root(root))
    }

    pub fn deal(env: Env, deal_id: U256) -> Option<DealPolicy> {
        env.storage().persistent().get(&DataKey::Deal(deal_id))
    }
}
