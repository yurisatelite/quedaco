import test from 'node:test';
import assert from 'node:assert/strict';
import {SHEET_V2_LABEL,SYSTEM_SHEET_ID,createSheetV2,findSystemCharacterSheet,registerSheetV2} from '../src/sheet-v2.mjs';

class SystemSheet{static DEFAULT_OPTIONS={classes:['skyfallV13','character']};}

test('acha a ficha do sistema pelo registro do Foundry',()=>{
  const config={Actor:{sheetClasses:{character:{[SYSTEM_SHEET_ID]:{cls:SystemSheet}}}}};
  assert.equal(findSystemCharacterSheet(config),SystemSheet);
  assert.equal(findSystemCharacterSheet({Actor:{sheetClasses:{character:{}}}}),null);
  assert.equal(findSystemCharacterSheet({}),null);
});

test('a V2 herda tudo da ficha do sistema',()=>{
  const Sheet=createSheetV2(SystemSheet);
  assert.ok(Sheet.prototype instanceof SystemSheet);
  assert.deepEqual(Sheet.DEFAULT_OPTIONS,SystemSheet.DEFAULT_OPTIONS);
});

test('registra só para personagem, como padrão, com rótulo próprio',()=>{
  const calls=[];
  const config={Actor:{sheetClasses:{character:{[SYSTEM_SHEET_ID]:{cls:SystemSheet}}}}};
  const sheet=registerSheetV2('quedaco',{config,sheets:{registerSheet:(...args)=>calls.push(args)},ActorClass:class Actor{}});
  assert.equal(calls.length,1);
  const [,scope,cls,options]=calls[0];
  assert.equal(scope,'quedaco');assert.equal(cls,sheet);
  assert.deepEqual(options,{types:['character'],makeDefault:true,label:SHEET_V2_LABEL});
});

test('sem a ficha do sistema não registra nada e não quebra',()=>{
  const calls=[];
  assert.equal(registerSheetV2('quedaco',{config:{},sheets:{registerSheet:(...a)=>calls.push(a)},ActorClass:class{}}),null);
  assert.equal(calls.length,0);
});
