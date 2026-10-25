pragma circom 2.2.3;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

// Demo v1. An issuer commits to a private 64-bit balance and an inclusive
// expiry epoch. Epochs are five-minute intervals, checked against ledger time.
template BalanceEligibility(depth) {
    signal input eligibleBalanceCents;
    signal input holderSecret;
    signal input credentialSalt;
    signal input credentialExpiry;
    signal input pathElements[depth];
    signal input pathIndices[depth];

    signal input issuerRoot;
    signal input dealIdHash;
    signal input requiredThresholdCents;
    signal input currentEpoch;
    signal input proofVersion;
    signal input recipientHash;

    signal output nullifier;
    signal output recipientBinding;

    component balanceRange = Num2Bits(64);
    component thresholdRange = Num2Bits(64);
    component expiryRange = Num2Bits(32);
    component epochRange = Num2Bits(32);
    balanceRange.in <== eligibleBalanceCents;
    thresholdRange.in <== requiredThresholdCents;
    expiryRange.in <== credentialExpiry;
    epochRange.in <== currentEpoch;
    proofVersion === 1;

    component secretIsZero = IsZero();
    secretIsZero.in <== holderSecret;
    secretIsZero.out === 0;

    component sufficient = GreaterEqThan(64);
    sufficient.in[0] <== eligibleBalanceCents;
    sufficient.in[1] <== requiredThresholdCents;
    sufficient.out === 1;

    component unexpired = LessEqThan(32);
    unexpired.in[0] <== currentEpoch;
    unexpired.in[1] <== credentialExpiry;
    unexpired.out === 1;

    component leaf = Poseidon(5);
    leaf.inputs[0] <== eligibleBalanceCents;
    leaf.inputs[1] <== holderSecret;
    leaf.inputs[2] <== credentialSalt;
    leaf.inputs[3] <== credentialExpiry;
    leaf.inputs[4] <== 1; // Financial credential domain/version.

    signal nodes[depth+1];
    signal left[depth];
    signal right[depth];
    component hashes[depth];
    nodes[0] <== leaf.out;
    for (var i=0; i<depth; i++) {
        pathIndices[i] * (pathIndices[i]-1) === 0;
        left[i] <== nodes[i] + pathIndices[i]*(pathElements[i]-nodes[i]);
        right[i] <== pathElements[i] + pathIndices[i]*(nodes[i]-pathElements[i]);
        hashes[i] = Poseidon(2);
        hashes[i].inputs[0] <== left[i];
        hashes[i].inputs[1] <== right[i];
        nodes[i+1] <== hashes[i].out;
    }
    nodes[depth] === issuerRoot;

    component scopedNullifier = Poseidon(2);
    scopedNullifier.inputs[0] <== holderSecret;
    scopedNullifier.inputs[1] <== dealIdHash;
    nullifier <== scopedNullifier.out;

    // Constrain the public receiving account without changing the stable
    // holder/deal nullifier. Copying a proof cannot redirect qualification.
    component recipientAuth = Poseidon(2);
    recipientAuth.inputs[0] <== holderSecret;
    recipientAuth.inputs[1] <== recipientHash;
    recipientBinding <== recipientAuth.out;
}

// Public signal order: nullifier, recipientBinding, issuerRoot, dealIdHash,
// requiredThresholdCents, currentEpoch, proofVersion, recipientHash.
component main {public [issuerRoot, dealIdHash, requiredThresholdCents, currentEpoch, proofVersion, recipientHash]} = BalanceEligibility(4);
