import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {curves,powersOfTau,zKey} from 'snarkjs';

await fs.mkdir('.build/eligibility',{recursive:true});
const built=spawnSync(process.execPath,['node_modules/circom2/cli.js','circuits/BalanceEligibility.circom','--r1cs','--wasm','--sym','-l','node_modules','-o','.build/eligibility'],{stdio:'inherit'});
if(built.status!==0)process.exit(built.status??1);
const dir='.build/eligibility';
try { await fs.access(`${dir}/eligibility_final.zkey`); console.log('Existing demo proving key preserved.'); }
catch {
  console.log('Creating a SINGLE-PARTY DEMO-ONLY trusted setup. Production requires an appropriate reviewed ceremony.');
  const curve=await curves.getCurveFromName('bn128');
  await powersOfTau.newAccumulator(curve,13,`${dir}/pot13_0.ptau`);
  await powersOfTau.contribute(`${dir}/pot13_0.ptau`,`${dir}/pot13_1.ptau`,'Deal Passport synthetic demo',randomBytes(64).toString('hex'));
  await powersOfTau.preparePhase2(`${dir}/pot13_1.ptau`,`${dir}/pot13_final.ptau`);
  const setup=await zKey.newZKey(`${dir}/BalanceEligibility.r1cs`,`${dir}/pot13_final.ptau`,`${dir}/eligibility_0.zkey`);
  if(setup===-1)throw Error('Circuit exceeds setup capacity or setup initialization failed');
  await zKey.contribute(`${dir}/eligibility_0.zkey`,`${dir}/eligibility_final.zkey`,'Deal Passport synthetic demo',randomBytes(64).toString('hex'));
  if(!await zKey.verifyFromR1cs(`${dir}/BalanceEligibility.r1cs`,`${dir}/pot13_final.ptau`,`${dir}/eligibility_final.zkey`))throw Error('Setup consistency verification failed');
}
const vk=await zKey.exportVerificationKey(`${dir}/eligibility_final.zkey`);
await fs.writeFile('circuits/verification_key.json',JSON.stringify(vk,null,2)+'\n');
const sha256=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
await fs.writeFile(`${dir}/manifest.json`,JSON.stringify({circuitSha256:await sha256('circuits/BalanceEligibility.circom'),r1csSha256:await sha256(`${dir}/BalanceEligibility.r1cs`),zkeySha256:await sha256(`${dir}/eligibility_final.zkey`),verificationKeySha256:await sha256('circuits/verification_key.json'),ceremony:'Single-party demo only. Not production trust.'},null,2)+'\n');
console.log('Eligibility circuit and verification key ready.');
process.exit(0);
