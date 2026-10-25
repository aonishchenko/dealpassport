import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {Address,nativeToScVal,xdr} from '@stellar/stellar-sdk';
import {proofScVal,u256,vec,bytes} from './encoding.mjs';
import {credentialSet,witness,prove,fieldHash,EPOCH_SECONDS} from './credentials.mjs';
import {relayer,deploy,invoke,readContract,ledgerTime,clean,explorer} from './testnet.mjs';

const address=k=>new Address(typeof k==='string'?k:k.publicKey()).toScVal();
const u64=n=>nativeToScVal(BigInt(n),{type:'u64'});
const claim=s=>vec([xdr.ScVal.scvSymbol(s)]);
const admin=await relayer();
const financial=await relayer('financial-issuer');
const propertyIssuer=await relayer('property-issuer');
const buyer=await relayer('demo-buyer');
const seller=await relayer('demo-seller');
const buyerGate=JSON.parse(await fs.readFile('docs/evidence/gate-b.json','utf8')).contractId;
const deployed=await deploy(admin,'target/wasm32v1-none/release/deal_gate.wasm','mutual DealGate',[address(admin),address(propertyIssuer),address(buyerGate)]);
let now=await ledgerTime();
while(now%EPOCH_SECONDS>190){
  console.log('Waiting briefly for the next proof epoch before the complete mutual-consent test.');
  await new Promise(r=>setTimeout(r,15000));now=await ledgerTime();
}
const epoch=Math.floor(now/EPOCH_SECONDS);
const set=credentialSet(epoch);
const dealId=fieldHash(`mutual-demo-${randomBytes(16).toString('hex')}`);
const proof=await prove(witness(set,0,{epoch,dealIdHash:dealId,recipientHash:fieldHash(buyer.publicKey())}));
const evidence={gate:'C',network:'Stellar Testnet',recordedAt:new Date().toISOString(),...deployed,buyerGate,dealId:dealId.toString(),checks:[]};
const save=()=>fs.writeFile('docs/evidence/gate-c.json',JSON.stringify(evidence,null,2)+'\n');
async function accepted(label,action){const result=await action();evidence.checks.push({...clean(result),outcome:'accepted'});await save();return result;}
async function denied(label,action,code){
  try {await action();throw Error(`${label}: unexpectedly accepted`);}
  catch(error){
    if(!['simulation','transaction'].includes(error.phase))throw error;
    if(code!==undefined&&!String(error.reason).includes(`Contract, #${code}`))throw error;
    evidence.checks.push({label,outcome:'rejected',phase:error.phase,...(error.transactionHash?{hash:error.transactionHash,explorer:explorer(error.transactionHash)}:{}),...(code!==undefined?{contractError:code}:{})});await save();
  }
}
const call=(who,fn,args,label)=>invoke(who,deployed.contractId,fn,args,label);
const status=()=>readContract(admin,deployed.contractId,'status',[u256(dealId),address(buyer)]);
const consent=(who,yes=true)=>call(who,'consent',[u256(dealId),address(buyer),address(who),nativeToScVal(yes)],`${who===buyer?'buyer':'seller'} consent ${yes}`);
await accepted('Financial root registered',()=>invoke(financial,buyerGate,'register_root',[u256(set.root),u64(now+86400)],'financial issuer registration'));
await accepted('Buyer policy created',()=>invoke(admin,buyerGate,'create_deal',[u256(dealId),u64(75000000),u64(now+86400)],'financial deal policy'));
await accepted('Specific property/deal policy created',()=>call(admin,'create_deal',[u256(dealId),address(seller),bytes(randomBytes(32)),claim('AuthorizedToMarket'),u64(now+86400)],'property deal policy'));
assert.equal((await status()).unlocked,false);
await denied('An unqualified party cannot preapprove disclosure',()=>consent(buyer),7);
await denied('Forged property issuer rejected',()=>call(buyer,'attest',[u256(dealId),claim('AuthorizedToMarket'),u64(now+3600)],'forged property attestation'));
assert.equal((await status()).property_valid,false);
await denied('Site control does not satisfy marketing-authority policy',()=>call(propertyIssuer,'attest',[u256(dealId),claim('SiteControlVerified'),u64(now+3600)],'wrong property claim'),4);
await denied('Expired property attestation rejected',()=>call(propertyIssuer,'attest',[u256(dealId),claim('AuthorizedToMarket'),u64(now-1)],'expired property claim'),5);
await accepted('Authorized property reviewer attests marketing authority',()=>call(propertyIssuer,'attest',[u256(dealId),claim('AuthorizedToMarket'),u64(now+3600)],'valid property attestation'));
assert.equal((await status()).unlocked,false);
await accepted('Real issuer-bound buyer qualification',()=>invoke(buyer,buyerGate,'qualify',[address(buyer),proofScVal(proof.proof),vec(proof.publicSignals.map(u256))],'buyer ZK qualification for mutual deal'));
const qualified=await status();assert.equal(qualified.buyer_valid,true);assert.equal(qualified.property_valid,true);assert.equal(qualified.unlocked,false);
await accepted('Buyer consents',()=>consent(buyer));
assert.equal((await status()).unlocked,false);
const unlocked=await accepted('Seller consents and mutual policy unlocks',()=>consent(seller));
assert.equal((await status()).unlocked,true);
await accepted('Buyer withdraws disclosure consent',()=>consent(buyer,false));
assert.equal((await status()).unlocked,false);
await accepted('Buyer consents again',()=>consent(buyer));
assert.equal((await status()).unlocked,true);
await accepted('Property reviewer revokes authority',()=>call(propertyIssuer,'revoke_property',[u256(dealId)],'revoke property attestation'));
assert.equal((await status()).unlocked,false);
evidence.successfulUnlock=clean(unlocked);evidence.status='passed';await save();
console.log('Gate C passed: both qualifications, both consents, withdrawal and revocation enforce room state.');
process.exit(0);
