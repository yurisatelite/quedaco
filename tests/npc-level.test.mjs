import test from 'node:test';
import assert from 'node:assert/strict';
import {rollLevel} from '../src/npc-level.mjs';

test('rollLevel clamps the range to levels 1 through 12',()=>{
  assert.equal(rollLevel(-4,99,()=>0),1);
  assert.equal(rollLevel(-4,99,()=>0.999999),12);
  assert.equal(rollLevel(8,3,()=>0.5),8);
});

test('rollLevel returns every integer in the requested inclusive range',()=>{
  assert.deepEqual([0,0.2,0.4,0.6,0.8,0.999].map(r=>rollLevel(3,7,()=>r)),[3,4,5,6,7,7]);
});
