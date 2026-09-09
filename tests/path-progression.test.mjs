import test from 'node:test';
import assert from 'node:assert/strict';
import {finalizePathProgression} from '../src/adapter.mjs';

const item=(id,source,origin=[])=>({id,type:'path',_stats:{compendiumSource:source},system:{origin}});

test('trilhas mantêm path-01 e path-02 no mesmo Item quando avançadas',async()=>{
  const updates=[];
  const actor={items:[item('a','path-a',['feature-origin','path-01'])],async updateEmbeddedDocuments(_type,entries){updates.push(...entries);}};
  await finalizePathProgression(actor,[{entry:{type:'path',uuid:'path-a'}},{entry:{type:'path',uuid:'path-a'}}]);
  assert.deepEqual(updates,[{_id:'a','system.origin':['feature-origin','path-01','path-02']}]);
});

test('segunda trilha recebe path-02 sem remover a primeira',async()=>{
  const updates=[];
  const actor={items:[item('a','path-a',['path-01']),item('b','path-b',['path-01'])],async updateEmbeddedDocuments(_type,entries){updates.push(...entries);}};
  await finalizePathProgression(actor,[{entry:{type:'path',uuid:'path-a'}},{entry:{type:'path',uuid:'path-b'}}]);
  assert.deepEqual(updates,[{_id:'b','system.origin':['path-02']}]);
});
