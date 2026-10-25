import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {groth16,curves} from 'snarkjs';
import {Keypair} from '@stellar/stellar-sdk';
import {credentialSet,witness,prove,checkWitness,fieldHash,EPOCH_SECONDS,poseidonHash} from '../scripts/credentials.mjs';
import {FR_MODULUS} from '../scripts/encoding.mjs';

const epoch=Math.floor(Date.now()/1000/EPOCH_SECONDS);
const set=credentialSet(epoch);
const buyer=Keypair.random().publicKey();
const policy={epoch,dealIdHash:fieldHash('circuit-test-deal'),recipientHash:fieldHash(buyer)};
const valid=witness(set,0,policy);
after(async()=>{const curve=await curves.getCurveFromName('bn128');await curve.terminate();});

test('issuer-certified threshold proof verifies and survives proof randomization with the same nullifier',async()=>{
  const vk=JSON.parse(await fs.readFile('circuits/verification_key.json','utf8'));
  const one=await prove(valid);
  const two=await prove(valid);
  assert.equal(await groth16.verify(vk,one.publicSignals,one.proof),true);
  assert.equal(await groth16.verify(vk,two.publicSignals,two.proof),true);
  assert.equal(one.publicSignals[0],two.publicSignals[0]);
  assert.equal(one.publicSignals[0],poseidonHash([BigInt(valid.holderSecret),policy.dealIdHash]).toString());
  assert.notDeepEqual(one.proof,two.proof);
  for(const index of [2,3,4,5,6,7]){
    const changed=[...one.publicSignals];
    changed[index]=(BigInt(changed[index])+1n).toString();
    assert.equal(await groth16.verify(vk,changed,one.proof),false,`tampered signal ${index}`);
  }
  await fs.mkdir('.build/test-fixture',{recursive:true});
  await fs.writeFile('.build/test-fixture/valid.json',JSON.stringify({...one,buyer,epoch,recipientHash:policy.recipientHash.toString(),dealIdHash:policy.dealIdHash.toString()},null,2));
});

test('a genuine issuer-member with €400k cannot satisfy the €750k statement',async()=>{
  await assert.rejects(checkWitness(witness(set,1,policy)));
});

test('fabricated balance and false Merkle path cannot satisfy the issuer root',async()=>{
  await assert.rejects(checkWitness({...valid,eligibleBalanceCents:'990000000'}));
  const path=[...valid.pathElements];path[0]=(BigInt(path[0])+1n).toString();
  await assert.rejects(checkWitness({...valid,pathElements:path}));
});

test('expired issuer-member credential fails at the current epoch',async()=>{
  await assert.rejects(checkWitness(witness(set,2,policy)));
});

test('range, version and Merkle path index constraints reject malformed witnesses',async()=>{
  await assert.rejects(checkWitness({...valid,eligibleBalanceCents:(1n<<64n).toString()}));
  await assert.rejects(checkWitness({...valid,requiredThresholdCents:(FR_MODULUS-1n).toString()}));
  await assert.rejects(checkWitness({...valid,currentEpoch:(1n<<32n).toString()}));
  await assert.rejects(checkWitness({...valid,proofVersion:'2'}));
  await assert.rejects(checkWitness({...valid,holderSecret:'0'}));
  await assert.rejects(checkWitness({...valid,pathIndices:[2,0,0,0]}));
});
