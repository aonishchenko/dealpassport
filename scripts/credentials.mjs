import {createHash,randomBytes} from 'node:crypto';
import {buildPoseidon} from 'circomlibjs';
import {groth16,wtns} from 'snarkjs';
import {FR_MODULUS} from './encoding.mjs';

export const EPOCH_SECONDS=300;
export const fieldHash=value=>BigInt(`0x${createHash('sha256').update(value).digest('hex')}`)%FR_MODULUS;
export const randomField=()=>BigInt(`0x${randomBytes(32).toString('hex')}`)%(FR_MODULUS-1n)+1n;
const poseidon=await buildPoseidon();
export const poseidonHash=values=>poseidon.F.toObject(poseidon(values));
export const leaf=c=>poseidonHash([c.eligibleBalanceCents,c.holderSecret,c.credentialSalt,c.credentialExpiry,1]);

export function credentialSet(epoch,validForEpochs=288) {
  const credentials=[90000000n,40000000n,90000000n].map((eligibleBalanceCents,i)=>({
    eligibleBalanceCents,holderSecret:randomField(),credentialSalt:randomField(),
    credentialExpiry:BigInt(i===2?epoch-1:epoch+validForEpochs),
  }));
  const levels=[Array.from({length:16},(_,i)=>i<credentials.length?leaf(credentials[i]):0n)];
  for(let d=0;d<4;d++){
    const next=[];
    for(let i=0;i<levels[d].length;i+=2)next.push(poseidonHash([levels[d][i],levels[d][i+1]]));
    levels.push(next);
  }
  return {credentials,root:levels[4][0],paths:credentials.map((_,index)=>({
    pathElements:Array.from({length:4},(_,d)=>levels[d][(index>>d)^1]),
    pathIndices:Array.from({length:4},(_,d)=>(index>>d)&1),
  }))};
}

export function witness(set,index,{dealIdHash,recipientHash,epoch,threshold=75000000n}) {
  const input={...set.credentials[index],...set.paths[index],issuerRoot:set.root,dealIdHash,requiredThresholdCents:threshold,currentEpoch:BigInt(epoch),proofVersion:1,recipientHash};
  return JSON.parse(JSON.stringify(input,(_,v)=>typeof v==='bigint'?v.toString():v));
}

export const WASM='.build/eligibility/BalanceEligibility_js/BalanceEligibility.wasm';
export const ZKEY='.build/eligibility/eligibility_final.zkey';
export const prove=input=>groth16.fullProve(input,WASM,ZKEY,undefined,undefined,{singleThread:true});
export const checkWitness=input=>wtns.calculate(input,WASM,{type:'mem'});
