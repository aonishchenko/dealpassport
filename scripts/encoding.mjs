import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

export const FR_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export const FQ_MODULUS = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

export function fieldBytes(value, modulus = FQ_MODULUS) {
  const n = BigInt(value);
  if (n < 0n || n >= modulus) throw new RangeError('Noncanonical field element');
  return Buffer.from(n.toString(16).padStart(64, '0'), 'hex');
}

export const bytes = value => nativeToScVal(value, {type:'bytes'});
export const u256 = value => {
  fieldBytes(value, FR_MODULUS);
  return nativeToScVal(BigInt(value), {type:'u256'});
};
export const vec = values => xdr.ScVal.scvVec(values);
export const map = values => xdr.ScVal.scvMap(Object.entries(values).sort(([a],[b])=>a.localeCompare(b)).map(([key,val])=>new xdr.ScMapEntry({key:xdr.ScVal.scvSymbol(key),val})));

export function g1(point) {
  if (point.length !== 3 || BigInt(point[2]) !== 1n) throw Error('Expected an affine G1 point');
  return bytes(Buffer.concat([fieldBytes(point[0]),fieldBytes(point[1])]));
}

export function g2(point) {
  if (point.length !== 3 || BigInt(point[2][0]) !== 1n || BigInt(point[2][1]) !== 0n) throw Error('Expected an affine G2 point');
  // snarkjs uses [c0,c1]; the Soroban host serializes each Fq2 as c1 || c0.
  return bytes(Buffer.concat([fieldBytes(point[0][1]),fieldBytes(point[0][0]),fieldBytes(point[1][1]),fieldBytes(point[1][0])]));
}

export const proofScVal = proof => map({a:g1(proof.pi_a),b:g2(proof.pi_b),c:g1(proof.pi_c)});
export const keyScVal = key => map({alpha:g1(key.vk_alpha_1),beta:g2(key.vk_beta_2),gamma:g2(key.vk_gamma_2),delta:g2(key.vk_delta_2),ic:vec(key.IC.map(g1))});
