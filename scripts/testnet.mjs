import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { Address, Keypair, Networks, Operation, TransactionBuilder, rpc, scValToNative } from '@stellar/stellar-sdk';

export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const server = new rpc.Server(RPC_URL, {timeout:20000});
export const explorer = hash => `https://stellar.expert/explorer/testnet/tx/${hash}`;

export async function relayer(name='testnet-relayer') {
  const network = await server.getNetwork();
  if (network.passphrase !== Networks.TESTNET) throw Error('Refusing a network other than Stellar Testnet');
  await fs.mkdir('.local', {recursive:true,mode:0o700});
  if(!/^[a-z-]+$/.test(name))throw Error('Invalid local account name');
  const file=`.local/${name}.json`;
  let key;
  try { key=Keypair.fromSecret(JSON.parse(await fs.readFile(file,'utf8')).secret); }
  catch(error) {
    if(error.code!=='ENOENT')throw error;
    key=Keypair.random();
    await fs.writeFile(file,JSON.stringify({secret:key.secret()}),{mode:0o600,flag:'wx'});
  }
  try { await server.getAccount(key.publicKey()); }
  catch {
    const response=await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(key.publicKey())}`,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error(`Testnet funding failed: ${response.status}`);
    await server.getAccount(key.publicKey());
  }
  return key;
}

export async function transaction(key, operation, label) {
  const account=await server.getAccount(key.publicKey());
  const tx=new TransactionBuilder(account,{fee:'100',networkPassphrase:Networks.TESTNET}).addOperation(operation).setTimeout(120).build();
  const simulation=await server.simulateTransaction(tx);
  if(rpc.Api.isSimulationError(simulation))throw Object.assign(Error(`${label}: ${simulation.error}`),{phase:'simulation',reason:simulation.error});
  const ready=rpc.assembleTransaction(tx,simulation).build();
  ready.sign(key);
  const sent=await server.sendTransaction(ready);
  if(sent.status==='ERROR')throw Error(`${label}: submission rejected ${sent.errorResult?.toXDR('base64') ?? ''}`);
  for(let i=0;i<60;i++){
    const result=await server.getTransaction(sent.hash);
    if(result.status==='SUCCESS'){
      const evidence={label,hash:sent.hash,ledger:result.ledger,explorer:explorer(sent.hash),value:scValToNative(result.returnValue)};
      console.log(JSON.stringify(evidence,(_,v)=>typeof v==='bigint'?v.toString():v));
      return {...evidence,returnValue:result.returnValue};
    }
    if(result.status==='FAILED')throw Object.assign(Error(`${label}: failed transaction ${sent.hash}`),{phase:'transaction',transactionHash:sent.hash,ledger:result.ledger});
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  throw Error(`${label}: transaction polling timed out: ${sent.hash}`);
}

export async function deploy(key,wasmPath,label,constructorArgs=[]){
  const wasm=await fs.readFile(wasmPath);
  const upload=await transaction(key,Operation.uploadContractWasm({wasm}),`${label}: upload`);
  const created=await transaction(key,Operation.createCustomContract({address:new Address(key.publicKey()),wasmHash:scValToNative(upload.returnValue),salt:randomBytes(32),constructorArgs}),`${label}: deploy`);
  return {contractId:scValToNative(created.returnValue),upload:clean(upload),deployment:clean(created)};
}

export const clean = ({returnValue,...rest})=>rest;
export const invoke = (key,contractId,fn,args,label=fn)=>transaction(key,Operation.invokeContractFunction({contract:contractId,function:fn,args}),label);

export async function readContract(key,contractId,fn,args){
  const account=await server.getAccount(key.publicKey());
  const tx=new TransactionBuilder(account,{fee:'100',networkPassphrase:Networks.TESTNET})
    .addOperation(Operation.invokeContractFunction({contract:contractId,function:fn,args})).setTimeout(60).build();
  const simulation=await server.simulateTransaction(tx);
  if(rpc.Api.isSimulationError(simulation))throw Error(`Read ${fn}: ${simulation.error}`);
  return scValToNative(simulation.result.retval);
}

export async function ledgerTime(){
  const response=await fetch(RPC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getLatestLedger'}),signal:AbortSignal.timeout(20000)});
  const data=await response.json();
  if(!data.result?.closeTime)throw Error('Could not read ledger close time');
  return Number(data.result.closeTime);
}
