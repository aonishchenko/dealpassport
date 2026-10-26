declare module 'snarkjs' {
 export const groth16:{fullProve(input:Record<string,unknown>,wasm:string,zkey:string,logger?:unknown,witnessOptions?:unknown,options?:{singleThread:boolean}):Promise<{proof:unknown;publicSignals:string[]}>};
}
