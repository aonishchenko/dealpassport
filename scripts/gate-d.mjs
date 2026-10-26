import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {prove} from './credentials.mjs';
const base=process.env.DEMO_URL??'http://127.0.0.1:8787';
let cookie='',csrf='';const checks=[];
async function request(path,input,expected=200,headers={}){
 const response=await fetch(base+path,{method:input?'POST':'GET',headers:{Cookie:cookie,...(input?{'Content-Type':'application/json',Origin:base,'X-Demo-CSRF':csrf}:{}),...headers},...(input?{body:JSON.stringify(input)}:{})});
 const value=await response.json();
 assert.equal(response.status,expected,`${path}: ${JSON.stringify(value)}`);
 if(response.headers.get('Set-Cookie'))cookie=response.headers.get('Set-Cookie').split(';')[0];
 if(value.csrf)csrf=value.csrf;
 return value;
}
const pass=label=>{checks.push({label,passed:true});console.log(label)};
await request('/api/dossier',undefined,401);pass('Unauthenticated dossier request denied');
await request('/api/session',{},403,{Origin:'https://outside.example'});pass('Cross-origin session mutation denied');
let state=await request('/api/session',{},201);const id=state.sessionId;
await request('/api/prepare',{},403,{'X-Demo-CSRF':'wrong'});pass('Missing or forged CSRF nonce denied');
await request('/api/dossier',undefined,403);pass('Authenticated but unqualified dossier request denied');
state=await request('/api/prepare',{});assert.equal(state.prepared,true);pass('Fresh immutable Testnet policies created');
await request('/api/persona',{role:'judge'});
const forged=await request('/api/attack',{scenario:'forged'});assert.equal(forged.rejected,true);pass('Forged property issuer rejected by the contract');
for(const scenario of ['underfunded','expired']){
 const payload=await request('/api/credential',{scenario});
 await assert.rejects(()=>prove(payload.witness));pass(`${scenario} synthetic credential cannot produce a valid witness`);
}
await request('/api/persona',{role:'seller'});
await request('/api/credential',{scenario:'valid'},403);pass('Seller persona cannot request buyer private witness');
await request('/api/property',{});
await request('/api/persona',{role:'buyer'});
let credential=await request('/api/credential',{scenario:'valid'});
while(credential.secondsRemaining<110){await new Promise(r=>setTimeout(r,10000));credential=await request('/api/credential',{scenario:'valid'})}
const proof=await prove(credential.witness);
await request('/api/qualify',{...proof,publicSignals:proof.publicSignals.map((x,i)=>i===3?'1':x)},409);pass('Proof for a different deal rejected before submission');
state=await request('/api/qualify',proof);assert.equal(state.status.buyer_valid,true);pass('Genuine buyer proof verified through the Worker');
await request('/api/dossier',undefined,403);pass('Both valid passports alone do not disclose');
await request('/api/consent',{accepted:true});await request('/api/dossier',undefined,403);pass('One consent alone does not disclose');
await request('/api/persona',{role:'seller'});state=await request('/api/consent',{accepted:true});assert.equal(state.status.unlocked,true);
await request('/api/dossier',undefined,403);pass('Seller cannot fetch the buyer disclosure endpoint');
await request('/api/persona',{role:'buyer'});const dossier=await request('/api/dossier');assert.equal(dossier.synthetic,true);pass('Qualified consenting buyer receives the protected synthetic dossier');
await request('/api/persona',{role:'judge'});const replay=await request('/api/attack',{scenario:'replay'});assert.equal(replay.rejected,true);assert.equal(replay.contractCode,'11');pass('Used holder/deal nullifier replay rejected by contract error 11');
await request('/api/persona',{role:'buyer'});await request('/api/consent',{accepted:false});await request('/api/dossier',undefined,403);pass('Fresh chain read denies the dossier after consent withdrawal');
await request('/api/consent',{accepted:true});await request('/api/persona',{role:'issuer'});await request('/api/revoke',{});await request('/api/persona',{role:'buyer'});await request('/api/dossier',undefined,403);pass('Fresh chain read denies the dossier after property revocation');
state=await request('/api/status');
await fs.writeFile('docs/evidence/gate-d.json',JSON.stringify({gate:'D',status:'passed',network:'Stellar Testnet',api:base,recordedAt:new Date().toISOString(),sessionId:id,checks,receipts:state.events},null,2)+'\n');
console.log('Gate D passed: API authorization, proof orchestration and live protected disclosure.');process.exit(0);
