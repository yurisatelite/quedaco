import test from 'node:test';
import assert from 'node:assert/strict';
import {countRevealedHexes,explorationScene,sceneRevealedHexes,worldExplorerActive} from '../src/world-explorer.mjs';

test('World Explorer (T15): só ativo quando o módulo está ativo, e nunca lança erro',()=>{
  assert.equal(worldExplorerActive({modules:{get:id=>id==='world-explorer'?{active:true}:null}}),true);
  assert.equal(worldExplorerActive({modules:{get:()=>({active:false})}}),false);
  assert.equal(worldExplorerActive({modules:{get:()=>{throw Error('boom');}}}),false);
  assert.equal(worldExplorerActive(undefined),false);
});

test('contagem de hexágonos é blindada: formato estranho vira null, não erro',()=>{
  assert.deepEqual(countRevealedHexes({a:{offset:{i:0,j:0},reveal:true},b:{offset:{i:0,j:1},reveal:'partial'},c:{offset:{i:1,j:1},reveal:false}}),{revealed:1,partial:1});
  assert.deepEqual(countRevealedHexes({}),{revealed:0,partial:0});
  for(const estranho of [undefined,null,'x',42,[[1,2]],{a:1,b:'x'},{a:{reveal:'talvez'}}])assert.equal(countRevealedHexes(estranho),null);
  const armadilha={};Object.defineProperty(armadilha,'x',{enumerable:true,get(){throw Error('boom');}});
  assert.equal(countRevealedHexes(armadilha),null);
  assert.equal(sceneRevealedHexes({flags:{}}),null);
  assert.equal(sceneRevealedHexes(null),null);
});

test('cena de exploração: prefere a principal da região, senão a primeira com dado do módulo',()=>{
  const com=id=>({id,flags:{'world-explorer':{gridData:{}}}}),sem=id=>({id,flags:{}});
  assert.equal(explorationScene([sem('a'),com('b'),com('c')],'c').id,'c');
  assert.equal(explorationScene([sem('a'),com('b')],'a').id,'b');
  assert.equal(explorationScene([sem('a')],''),null);
  assert.equal(explorationScene(null),null);
});
