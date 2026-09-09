import test from 'node:test';
import assert from 'node:assert/strict';
import {PLACES} from '../src/book-world.mjs';
import {NPC_ROLE_STYLE,adoptNpcFlag,folderPath,inferPlaceId,inferRegionId,isGeneratedNpc,linksFromBio,itemTypeForCategory,npcCoverage,npcVisibility,placeIdFromFolderPath,regionIdFromFolderPath,resolveLinkTarget,stripTags} from '../src/npcs.mjs';

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

test('visibilidade de NPC depende do papel e da liberação',()=>{
  assert.equal(npcVisibility({role:'merchant',shared:true}),'shop');
  assert.equal(npcVisibility({role:'smith',shared:true,forge:{enabled:true}}),'forge');
  assert.equal(npcVisibility({role:'ally',shared:true}),'identity');
  assert.equal(npcVisibility({role:'extra',shared:true}),'identity');
  assert.equal(npcVisibility({role:'rival',shared:true}),'identity');
  assert.equal(npcVisibility({role:'merchant',shared:false}),false);
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
  assert.equal(fresh.role,'extra');assert.equal('active' in fresh,false);assert.equal(fresh.placeId,'kravokia');
  const manual={role:'ally',active:true,placeId:'foice',shop:{stock:[]}},actor={flags:{quedaco:{npc:manual}},name:'Talia de Mirmir'};
  assert.equal(adoptNpcFlag(actor),manual);
  assert.equal(adoptNpcFlag(actor).placeId,'foice');
});

test('stripTags remove marcação e decodifica entidades básicas',()=>{
  assert.equal(stripTags('<p>Vive em <em>Kravokia</em>.</p>'),'Vive em Kravokia.');
  assert.equal(stripTags('Sal &amp; pão&nbsp;quente'),'Sal & pão quente');
});

test('papéis de NPC têm rótulo, ícone e cor próprios',()=>{
  assert.equal(NPC_ROLE_STYLE.merchant.icon,'fa-coins');
  assert.equal(NPC_ROLE_STYLE.ally.label,'Aliado');
  assert.notEqual(NPC_ROLE_STYLE.rival.color,NPC_ROLE_STYLE.extra.color);
  assert.equal(NPC_ROLE_STYLE.smith.label,'Ferreiro');
});


test('NPC pode pertencer à região mesmo sem cidade',()=>{
  assert.equal(regionIdFromFolderPath(['🤖 NPCs por Região','Deserto de Mirmir']),'mirmir');
  assert.equal(inferRegionId({name:'Peregrino do Deserto de Mirmir'}),'mirmir');
  const flag=adoptNpcFlag({name:'Peregrino',type:'character',folder:{name:'Deserto de Mirmir',folder:{name:'🤖 NPCs por Região'}}});
  assert.equal(flag.regionId,'mirmir');assert.equal(flag.placeId,'');
});

test('bio sugere parentesco e nome repetido permanece ambíguo',()=>{
 const source={uuid:'Actor.a',name:'Ayla',system:{biography:'Ayla é filho de Barra Brasa-Fria e rival de Vozz.'}};
 const barra={uuid:'Actor.b',name:'Barra Brasa-Fria'},vozz1={uuid:'Actor.v1',name:'Vozz'},vozz2={uuid:'Actor.v2',name:'Vozz'};
 const links=linksFromBio(source,[source,barra,vozz1,vozz2]);
 assert.equal(links.find(link=>link.targetName==='Barra Brasa-Fria').type,'filho');
 assert.equal(links.find(link=>link.targetName==='Barra Brasa-Fria').to,'Actor.b');
 assert.equal(links.find(link=>link.targetName==='Vozz').ambiguous.length,2);
 assert.equal(resolveLinkTarget('Vozz',[vozz1,vozz2]).ambiguous.length,2);
});

test('cobertura regional aponta apenas arquétipos ausentes',()=>{
 const region={id:'mirmir',npcArchetypes:['alquimista','ferreiro']};
 const folder={name:'Deserto de Mirmir',folder:{name:'🤖 NPCs por Região'}};
 const actor={name:'Alquimista do deserto',type:'character',folder,flags:{}};
 assert.deepEqual(npcCoverage(region,[actor]).missing,['ferreiro']);
});
