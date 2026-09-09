import test from 'node:test';
import assert from 'node:assert/strict';
import {PLACES} from '../src/book-world.mjs';
import {folderPath,isGeneratedNpc,itemTypeForCategory,npcVisibility,placeIdFromFolderPath} from '../src/npcs.mjs';

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
