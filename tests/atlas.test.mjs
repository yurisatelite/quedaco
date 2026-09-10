import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHiddenPlaces,placeLayer,regionDossier} from '../src/atlas.mjs';

test('placeLayer separa assentamentos, marcos e Quedas',()=>{
  for(const kind of ['Capital','Cidade','Vila','Cidade-fortaleza','Cidade costeira','Porto','Distrito','Cidade soterrada','Cidades históricas','Capital em ruínas','Ilha','Fazenda','Mercado'])assert.equal(placeLayer(kind),'cidade',kind);
  assert.equal(placeLayer('Queda'),'queda');
  for(const kind of ['Vulcão','Bosques','Ruínas','Pântano','Fronteira','Fortalezas','Floresta','Castelo','Lagoa','Terras mágicas','Cordilheira','Mar'])assert.equal(placeLayer(kind),'marco',kind);
});

test('Quedas começam ocultas sem esconder outros lugares',()=>{
  const hidden=defaultHiddenPlaces([{id:'cidade',kind:'Capital'},{id:'q1',kind:'Queda'},{id:'q2',kind:'Queda'}]);
  assert.deepEqual([...hidden],['q1','q2']);
});

test('regionDossier monta oito blocos pelas tags e aceita blocos vazios',()=>{
  const regions=[{id:'r1',name:'Região Um',fauna:['Bysens']}],places=[{id:'p1',regionId:'r1',name:'Porto Azul',kind:'Porto'}];
  const result=regionDossier('r1',{regions,places,npcs:[{id:'n1',placeId:'p1'},{id:'n2',regionId:'r1',placeId:''}],monsters:[{id:'m1'}],monsterHabitats:{m1:['r1']},quests:[{id:'q1',status:'active',location:'Porto Azul'}],rumors:{r1:[{id:'x',text:'Algo ocorreu',shared:true}]}});
  assert.equal(result.region.id,'r1');
  assert.equal(Object.keys(result.blocks).length,8);
  assert.deepEqual(result.blocks.places.cidade.map(p=>p.id),['p1']);
  assert.deepEqual(result.blocks.threats.map(m=>m.id),['m1']);
  assert.deepEqual(result.blocks.quests.map(q=>q.id),['q1']);
  assert.deepEqual(result.blocks.knownNpcs.map(n=>n.id),['n1']);
  assert.deepEqual(result.blocks.territoryNpcs.map(n=>n.id),['n2']);
  assert.deepEqual(regionDossier('ausente').blocks.fauna,[]);
});
