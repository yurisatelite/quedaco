import test from 'node:test';
import assert from 'node:assert/strict';
import {PLACES} from '../src/book-world.mjs';
import {adoptNpcFlag,folderPath,inferPlaceId,isGeneratedNpc,itemTypeForCategory,npcVisibility,placeIdFromFolderPath,stripTags} from '../src/npcs.mjs';

test('pasta regional da macro resolve a capital do índice do QUEDAÇO',()=>{
  assert.equal(placeIdFromFolderPath(['🤖 NPCs por Região','Deserto de Mirmir','Kravokia'],PLACES),'kravokia');
  assert.equal(placeIdFromFolderPath(['🤖 NPCs por Região','Lugar desconhecido'],PLACES),null);
  assert.equal(placeIdFromFolderPath(['Outra raiz','Kravokia'],PLACES),null);
  const root={id:'1',name:'🤖 NPCs por Região'},region={id:'2',name:'Deserto de Mirmir',folder:root},city={id:'3',name:'Kravokia',folder:region};
  assert.deepEqual(folderPath({folder:city}),['🤖 NPCs por Região','Deserto de Mirmir','Kravokia']);
});

test('categoria do livro vira um tipo de Item do Skyfall',()=>{
  assert.equal(itemTypeForCategory('Armas marciais'),'weapon');
  assert.equal(itemTypeForCategory('Armaduras e escudos'),'armor');
  assert.equal(itemTypeForCategory('Vestimentas'),'clothing');
  assert.equal(itemTypeForCategory('Consumíveis'),'consumable');
  assert.equal(itemTypeForCategory('Sigilos'),'loot');
});

test('pastas da macro distinguem NPC character de monstro npc',()=>{
  const root={id:'root',name:'🤖 Criados pela IA'},npcs={id:'npcs',name:'NPCs',folder:root},monsters={id:'monsters',name:'Monstros',folder:root};
  assert.equal(isGeneratedNpc({type:'character',folder:npcs}),true);
  assert.equal(isGeneratedNpc({type:'npc',folder:monsters}),false);
  assert.equal(isGeneratedNpc({type:'character',folder:monsters}),false);
  const regional={id:'regional',name:'🤖 NPCs por Região'},region={id:'region',name:'Deserto de Mirmir',folder:regional},city={id:'city',name:'Kravokia',folder:region};
  assert.equal(isGeneratedNpc({type:'character',folder:city}),true);
});

test('visibilidade de NPC respeita papel, atividade e liberação',()=>{
  assert.equal(npcVisibility({role:'merchant',active:true,shared:true}),'shop');
  assert.equal(npcVisibility({role:'ally',active:true,shared:true}),'identity');
  assert.equal(npcVisibility({role:'extra',active:true,shared:true}),'identity');
  assert.equal(npcVisibility({role:'rival',active:true,shared:true}),'identity');
  assert.equal(npcVisibility({role:'merchant',active:false,shared:true}),false);
  assert.equal(npcVisibility({role:'merchant',active:true,shared:false}),false);
});

test('inferência de local usa pasta, descrição, nome e limites de palavra',()=>{
  const root={id:'root',name:'🤖 NPCs por Região'},region={id:'region',name:'Norvak',folder:root},city={id:'city',name:'Kravokia',folder:region};
  assert.equal(inferPlaceId({folder:city}),'kravokia');
  assert.equal(inferPlaceId({system:{details:{description:'<p>Mora em <strong>Kravokia</strong> desde criança.</p>'}}}),'kravokia');
  assert.equal(inferPlaceId({name:'Talia de Mirmir'}),'kravokia');
  assert.equal(inferPlaceId({name:'Pessoa sem pista',system:{biography:'Viajante desconhecida.'}}),null);
  assert.equal(inferPlaceId({name:'Murmúrio'},[{id:'ur',name:'Ur'}]),null);
});

test('adoção infere o local sem substituir flag manual existente',()=>{
  const fresh=adoptNpcFlag({name:'Talia de Mirmir'});
  assert.equal(fresh.role,'extra');assert.equal(fresh.active,false);assert.equal(fresh.placeId,'kravokia');
  const manual={role:'ally',active:true,placeId:'foice',shop:{stock:[]}},actor={flags:{quedaco:{npc:manual}},name:'Talia de Mirmir'};
  assert.equal(adoptNpcFlag(actor),manual);
  assert.equal(adoptNpcFlag(actor).placeId,'foice');
});

test('stripTags remove marcação e decodifica entidades básicas',()=>{
  assert.equal(stripTags('<p>Vive em <em>Kravokia</em>.</p>'),'Vive em Kravokia.');
  assert.equal(stripTags('Sal &amp; pão&nbsp;quente'),'Sal & pão quente');
});
