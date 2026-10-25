import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {Address,nativeToScVal} from '@stellar/stellar-sdk';
import {groth16,curves} from 'snarkjs';
import {keyScVal,proofScVal,u256,vec,FR_MODULUS} from './encoding.mjs';
import {credentialSet,witness,prove,checkWitness,fieldHash,EPOCH_SECONDS} from './credentials.mjs';
import {relayer,deploy,invoke,clean,readContract,ledgerTime,RPC_URL,explorer} from './testnet.mjs';

const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';
const u64=value=>nativeToScVal(BigInt(value),{type:'u64'});
const address=key=>new Address(typeof key==='string'?key:key.publicKey()).toScVal();
const admin=await relayer();
const issuer=await relayer('financial-issuer');
const buyer=await relayer('demo-buyer');
const vk=JSON.parse(await fs.readFile('circuits/verification_key.json','utf8'));
const baseline=JSON.parse(await fs.readFile('docs/evidence/gate-a.json','utf8'));
const deployed=await deploy(admin,'target/wasm32v1-none/release/eligibility_gate.wasm','issuer-bound eligibility gate',[address(admin),address(issuer),address(baseline.contractId),keyScVal(vk)]);
let now=await ledgerTime();
const epoch=Math.floor(now/EPOCH_SECONDS);
if(now%EPOCH_SECONDS>200)throw Error('Run again early in a five-minute epoch to leave enough time for the complete test sequence.');
const set=credentialSet(epoch);
const dealId=fieldHash(`Deal Passport sample ${randomBytes(16).toString('hex')}`);
const secondDealId=fieldHash(`Deal Passport second ${randomBytes(16).toString('hex')}`);
const policy={epoch,dealIdHash:dealId,recipientHash:fieldHash(buyer.publicKey())};
const input=witness(set,0,policy);
const valid=await prove(input);
assert.equal(await groth16.verify(vk,valid.publicSignals,valid.proof),true);
const evidence={gate:'B',network:'Stellar Testnet',rpc:RPC_URL,recordedAt:new Date().toISOString(),...deployed,verifierContract:baseline.contractId,issuer:issuer.publicKey(),buyer:buyer.publicKey(),dealId:dealId.toString(),issuerRoot:set.root.toString(),epoch,epochSeconds:EPOCH_SECONDS,setup:JSON.parse(await fs.readFile('.build/eligibility/manifest.json','utf8')),checks:[]};
const save=()=>fs.writeFile('docs/evidence/gate-b.json',json(evidence));
await save();
const call=(who,fn,args,label)=>invoke(who,deployed.contractId,fn,args,label);
const qualify=(who,proof,signals,label)=>call(who,'qualify',[address(who),proofScVal(proof),vec(signals.map(s=>nativeToScVal(BigInt(s),{type:'u256'})))],label);
async function rejected(label,action,expectedCode){
  try {await action();throw Error(`${label}: unexpectedly accepted`);}
  catch(error){
    if(!['simulation','transaction'].includes(error.phase))throw error;
    if(expectedCode!==undefined && !String(error.reason).includes(`Contract, #${expectedCode}`))throw error;
    const entry={label,outcome:'rejected',phase:error.phase,...(error.transactionHash?{hash:error.transactionHash,ledger:error.ledger,explorer:explorer(error.transactionHash)}:{}),...(expectedCode!==undefined?{contractError:expectedCode}:{})};
    evidence.checks.push(entry);console.log(json(entry));await save();
  }
}
async function accepted(label,action){const result=await action();evidence.checks.push({...clean(result),outcome:'accepted'});await save();return result;}

await rejected('Unauthorized buyer cannot publish an issuer root',()=>call(buyer,'register_root',[u256(set.root),u64(now+86400)],'unauthorized root registration'));
assert.equal(await readContract(admin,deployed.contractId,'root',[u256(set.root)]),null);
await accepted('Authorized issuer root registration',()=>call(issuer,'register_root',[u256(set.root),u64(now+86400)],'authorized root registration'));
await accepted('Stored €750k deal policy',()=>call(admin,'create_deal',[u256(dealId),u64(75000000),u64(now+86400)],'create sample deal'));
await accepted('Second policy for cross-deal tampering test',()=>call(admin,'create_deal',[u256(secondDealId),u64(75000000),u64(now+86400)],'create second deal'));

await rejected('Wrong threshold cannot override stored deal policy',()=>{const x=[...valid.publicSignals];x[4]='1';return qualify(buyer,valid.proof,x,'wrong threshold');},7);
await rejected('Stale proof epoch fails ledger-time validation',()=>{const x=[...valid.publicSignals];x[5]=String(epoch-1);return qualify(buyer,valid.proof,x,'stale epoch');},8);
await rejected('Noncanonical scalar alias cannot bypass policy',()=>{const x=[...valid.publicSignals];x[2]=(BigInt(x[2])+FR_MODULUS).toString();return qualify(buyer,valid.proof,x,'noncanonical root');},2);
await rejected('Copied proof cannot qualify another account',()=>qualify(admin,valid.proof,valid.publicSignals,'wrong receiving account'),10);
await rejected('Changed known deal cannot reuse the proof',()=>{const x=[...valid.publicSignals];x[3]=secondDealId.toString();return qualify(buyer,valid.proof,x,'changed deal');},12);
await rejected('Tampered recipient-binding output fails cryptographic verification',()=>{const x=[...valid.publicSignals];x[1]=(BigInt(x[1])+1n).toString();return qualify(buyer,valid.proof,x,'tampered binding');},12);

for(const [index,label] of [[1,'Issuer-certified €400k cannot prove the €750k threshold'],[2,'Expired issuer-member credential cannot prove at current epoch']]){
  await assert.rejects(checkWitness(witness(set,index,policy)));
  evidence.checks.push({label,outcome:'witness rejected'});
}
await assert.rejects(checkWitness({...input,eligibleBalanceCents:'999000000'}));
evidence.checks.push({label:'Fabricated balance outside certified issuer commitment fails',outcome:'witness rejected'});
await save();

const success=await accepted('Issuer-certified €900k buyer qualifies',()=>qualify(buyer,valid.proof,valid.publicSignals,'issuer-bound financial qualification'));
assert.ok(await readContract(admin,deployed.contractId,'qualification',[u256(dealId),address(buyer)]));
await rejected('Replaying the same proof cannot qualify twice',()=>qualify(buyer,valid.proof,valid.publicSignals,'proof replay'),11);
const randomized=await prove(input);
assert.equal(randomized.publicSignals[0],valid.publicSignals[0]);
assert.notDeepEqual(randomized.proof,valid.proof);
await rejected('Fresh randomized proof retains the used holder/deal nullifier',()=>qualify(buyer,randomized.proof,randomized.publicSignals,'randomized proof replay'),11);
await accepted('Issuer revokes the credential root',()=>call(issuer,'revoke_root',[u256(set.root)],'revoke financial root'));
assert.equal(await readContract(admin,deployed.contractId,'qualification',[u256(dealId),address(buyer)]),null);
evidence.checks.push({label:'Fresh qualification read becomes invalid after issuer revocation',outcome:'passed'});
await rejected('Revoked root cannot qualify',()=>qualify(buyer,valid.proof,valid.publicSignals,'revoked root'),5);
evidence.successfulQualification=clean(success);
evidence.status='passed';
await save();
console.log('Gate B passed: genuine issuer-bound proof, policy checks, replay rejection and revocation.');
const curve=await curves.getCurveFromName('bn128');await curve.terminate();
process.exit(0);
