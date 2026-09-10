import test from 'node:test';
import assert from 'node:assert/strict';
import {overloadDice,applyOverloadHp} from '../src/arcane-overload.mjs';

test('overloadDice só dispara quando fragmentos + gastos passam do limite',()=>{
  assert.equal(overloadDice({fragments:3,value:0,max:5}),0);
  assert.equal(overloadDice({fragments:3,value:3,max:5}),3);
  assert.equal(overloadDice({fragments:6,value:0,max:5}),6);
  assert.equal(overloadDice({fragments:0,value:9,max:1}),0);
  assert.equal(overloadDice({fragments:2,value:4,max:6}),0);
});

test('applyOverloadHp consome PV temporário antes dos PV atuais',()=>{
  assert.deepEqual(applyOverloadHp({temp:5,value:30},3),{temp:2,value:30});
  assert.deepEqual(applyOverloadHp({temp:2,value:30},7),{temp:0,value:25});
  assert.deepEqual(applyOverloadHp({temp:0,value:12},4),{temp:0,value:8});
  assert.deepEqual(applyOverloadHp({value:10},15),{temp:0,value:-5});
});
