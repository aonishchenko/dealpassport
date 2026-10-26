import {
  Address,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  rpc,
  scValToNative,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import {
  u256,
  vec,
  bytes,
  proofScVal,
  FR_MODULUS,
} from "../scripts/encoding.mjs";
export { u256, vec, bytes, proofScVal };
export const address = (value: string) => new Address(value).toScVal();
export const u64 = (value: number) =>
  nativeToScVal(BigInt(value), { type: "u64" });
export const claim = (value = "AuthorizedToMarket") =>
  vec([xdr.ScVal.scvSymbol(value)]);
export const server = () =>
  new rpc.Server("https://soroban-testnet.stellar.org", { timeout: 15000 });
export async function fieldHash(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return (
    BigInt(
      "0x" +
        Array.from(new Uint8Array(hash), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join(""),
    ) % FR_MODULUS
  ).toString();
}
export async function ledgerTime() {
  const response = await fetch("https://soroban-testnet.stellar.org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger" }),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await response.json()) as { result?: { closeTime?: string } };
  if (!data.result?.closeTime)
    throw Error("Stellar Testnet is unavailable. Try again shortly.");
  return Number(data.result.closeTime);
}
export async function read(
  key: Keypair,
  contract: string,
  fn: string,
  args: xdr.ScVal[],
) {
  const node = server();
  const account = await node.getAccount(key.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeContractFunction({ contract, function: fn, args }),
    )
    .setTimeout(90)
    .build();
  const result = await node.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result) || !result.result)
    throw Error("Could not refresh the onchain policy. Try again.");
  return scValToNative(result.result.retval);
}
export class ChainRejection extends Error {
  constructor(
    public phase: string,
    public detail: string,
    public hash?: string,
  ) {
    super("The Stellar contract rejected this request.");
  }
}
export async function submit(
  key: Keypair,
  contract: string,
  fn: string,
  args: xdr.ScVal[],
) {
  const node = server();
  const account = await node.getAccount(key.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeContractFunction({ contract, function: fn, args }),
    )
    .setTimeout(90)
    .build();
  const simulation = await node.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation))
    throw new ChainRejection("simulation", simulation.error);
  const ready = rpc.assembleTransaction(tx, simulation).build();
  ready.sign(key);
  const sent = await node.sendTransaction(ready);
  if (sent.status === "ERROR")
    throw Error("Testnet did not accept the transaction. Try again.");
  for (let i = 0; i < 35; i++) {
    const result = await node.getTransaction(sent.hash);
    if (result.status === "SUCCESS")
      return {
        hash: sent.hash,
        ledger: result.ledger,
        explorer: `https://stellar.expert/explorer/testnet/tx/${sent.hash}`,
      };
    if (result.status === "FAILED")
      throw new ChainRejection("transaction", "Transaction failed", sent.hash);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw Error(
    `Testnet confirmation is delayed. Check transaction ${sent.hash} before trying again.`,
  );
}
