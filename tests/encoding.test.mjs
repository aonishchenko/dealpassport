import test from 'node:test';
import assert from 'node:assert/strict';
import {scValToNative} from '@stellar/stellar-sdk';
import {fieldBytes,FR_MODULUS,FQ_MODULUS,u256,g2} from '../scripts/encoding.mjs';

test('reject noncanonical field values before SDK modular reduction',()=>{
  for(const value of [-1n,FR_MODULUS,FR_MODULUS+1n])assert.throws(()=>u256(value),RangeError);
  assert.throws(()=>fieldBytes(FQ_MODULUS),RangeError);
  assert.equal(fieldBytes(1).length,32);
});

test('G2 encoding reverses each snarkjs Fq2 coordinate',()=>{
  const encoded=Buffer.from(scValToNative(g2([['1','2'],['3','4'],['1','0']])));
  assert.equal(encoded.length,128);
  assert.equal(encoded.subarray(0,32).toString('hex'),fieldBytes(2).toString('hex'));
  assert.equal(encoded.subarray(32,64).toString('hex'),fieldBytes(1).toString('hex'));
});
