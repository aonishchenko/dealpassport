import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {keyScVal,proofScVal,u256,vec} from './encoding.mjs';
import {relayer,deploy,invoke,clean,RPC_URL} from './testnet.mjs';

const key=await relayer();
const deployment=await deploy(key,'target/wasm32v1-none/release/groth16_verifier.wasm','baseline Groth16 verifier');
const vk=JSON.parse(await fs.readFile('contracts/groth16-verifier/tests/data/gnark/verification_key.json','utf8'));
const proof=JSON.parse(await fs.readFile('contracts/groth16-verifier/tests/data/gnark/proof.json','utf8'));
const valid=await invoke(key,deployment.contractId,'verify_proof',[keyScVal(vk),proofScVal(proof),vec(proof.publicSignals.map(u256))],'Gate A: valid Gnark proof');
assert.equal(valid.value,true);
const tampered=await invoke(key,deployment.contractId,'verify_proof',[keyScVal(vk),proofScVal(proof),vec([u256(36)])],'Gate A: tampered public input');
assert.equal(tampered.value,false);
const evidence={gate:'A',network:'Stellar Testnet',rpc:RPC_URL,recordedAt:new Date().toISOString(),...deployment,fixtureSource:'stellar/soroban-examples@03d42aa6b973dcf3a453a99d0c6a6e8d25a196e2',valid:clean(valid),tampered:clean(tampered),limitation:'Educational stateless verifier accepts a caller-provided key. This baseline alone does not establish issuer-backed financial eligibility.'};
await fs.writeFile('docs/evidence/gate-a.json',JSON.stringify(evidence,null,2)+'\n');
