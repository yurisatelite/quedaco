import test from 'node:test';
import assert from 'node:assert/strict';
import {parseContentPackage} from '../src/catalog-content.mjs';
import {planAmbientContent,createWorldCatalogService,buildWorldCatalog,updateCatalogRecord} from '../src/world-catalog.mjs';
import {createNpcModelService,CREATOR_ID} from '../src/npc-models.mjs';
const packet=records=>({format:'quedaco-ambientacao',schemaVersion:1,id:'teste',title:'Teste',records});
const environment={id:'posto',name:'Posto',placeId:'alberich',regionId:'thurthur',organizationId:'dips',sections:[{id:'rotina',title:'Rotina',text:'Troca de plantão.'}]};
const model={name:'Agente de teste',legacy:'Anuro',heritage:'Bufonin',characterClass:'Combatente',background:'Militar',level:1,cash:20,attributes:{str:3,dex:1,con:2,int:0,wis:2,cha:-1},inventory:[{name:'Lança',quantity:1}]};

test('pacote organiza referências do mesmo lote; preview não altera dados, repetir não muda revisão',()=>{
  const data=packet({environments:[{...environment,organizationId:'nova'}],organizations:[{id:'nova',name:'Nova',regionIds:['thurthur'],placeIds:['alberich']}]});
  const stored={revision:9},before=structuredClone(stored),plan=planAmbientContent(stored,data);
  assert.deepEqual(stored,before);assert.equal(plan.changes.length,2);assert.equal(plan.next.revision,10);
  const repeated=planAmbientContent(plan.next,data);assert.equal(repeated.changes.length,0);assert.equal(repeated.next.revision,10);
  assert.equal(buildWorldCatalog(plan.next).organizations.find(row=>row.id==='nova').name,'Nova');
});
test('texto simples cria ficha de ambiente; HTML permanece texto e seções usam IDs',()=>{
  const input='QUEDACO-AMBIENTACAO 1\r\nid: posto\r\nname: Posto de campo\r\nplaceId: alberich\r\n---\r\n# Sons\r\n<script>não executar</script>';
  const parsed=parseContentPackage(input),row=planAmbientContent({},input).changes[0].after;
  assert.equal(parsed.records.environments[0].name,'Posto de campo');
  assert.match(row.sections[0].text,/<script>/);
  assert.throws(()=>planAmbientContent({},'alert(1)'),/cabeçalho/);
});
test('erros em referências, ciclos, campos desconhecidos e protótipos rejeitam o lote todo',()=>{
  assert.throws(()=>planAmbientContent({},packet({environments:[{...environment,placeId:'inexistente'}]})),/localidade/);
  assert.throws(()=>planAmbientContent({},packet({environments:[{...environment,parentEnvironmentId:'posto'}]})),/ciclos/);
  assert.throws(()=>planAmbientContent({},packet({environments:[{...environment,command:'Actor.create()'}]})),/não aceito/);
  assert.throws(()=>planAmbientContent({},'{"format":"quedaco-ambientacao","schemaVersion":1,"id":"teste","records":{"__proto__":[]}}'),/inválida/);
  assert.throws(()=>planAmbientContent({},packet({environments:[environment,environment]})),/repetido/);
});
test('API aplica uma gravação, rejeita prévia velha, exporta e conserva NPCs fora do Actor',async()=>{
  let stored={};let writes=0;
  const game={user:{isGM:true},actors:[],settings:{get:()=>stored,set:async(_m,_k,value)=>{stored=value;writes++;}}};
  const api=createWorldCatalogService(game),data=packet({environments:[environment],npcModels:[{id:'agente',name:model.name,organizationId:'dips',environmentId:'posto',model}]});
  const preview=api.previewAmbientContent(data);assert.equal(writes,0);
  await api.importAmbientContent(data,{expectedRevision:preview.expectedRevision});assert.equal(writes,1);assert.equal(game.actors.length,0);
  await api.importAmbientContent(data);assert.equal(writes,1);
  await assert.rejects(api.importAmbientContent(data,{expectedRevision:0}),/mudou/);
  assert.equal(api.listNpcModels().length,1);assert.equal(api.listEnvironments({placeId:'alberich'}).length,1);
  const exported=api.exportAmbientContent();assert.equal(planAmbientContent(stored,exported).changes.length,0);
  game.user.isGM=false;assert.equal(api.listNpcModels().length,0);assert.equal(api.listEnvironments().length,0);
  assert.throws(()=>api.previewAmbientContent(data),/Mestra/);await assert.rejects(api.importAmbientContent(data),/Mestra/);
});
test('conteúdo institucional parcial preserva o uniforme anterior e referência privada não vaza',()=>{
  const plan=planAmbientContent({},packet({organizations:[{id:'dips',campaignProfile:{uniform:{everyday:'Nova roupa'}}}]}));
  const org=buildWorldCatalog(plan.next).organizations.find(row=>row.id==='dips');
  assert.equal(org.campaignProfile.uniform.everyday,'Nova roupa');assert.ok(org.campaignProfile.uniform.field);
  const stored=updateCatalogRecord(plan.next,'environments',{...environment,visibility:'public'});
  assert.equal(buildWorldCatalog(stored,{isGM:false}).environments.length,0);
});
test('modelo exige campos mecânicos e não aceita efeitos ou código no inventário',()=>{
  const data=packet({npcModels:[{id:'agente',name:model.name,model:{...model,inventory:[{name:'Lança',quantity:1,effects:[]}]}}]});
  assert.throws(()=>planAmbientContent({},data),/não aceito/);
});
test('ponte usa API opcional do Criador e cataloga só Actor recém-criado',async()=>{
  let updates=0;const actor={uuid:'Actor.abc',flags:{[CREATOR_ID]:{npcModel:{id:'agente'}}},async update(){updates++;}};
  const game={user:{isGM:true},actors:[],modules:new Map()};
  const catalog={getWorldCatalog:()=>({revision:1}),listNpcModels:()=>[{id:'agente',name:model.name,organizationId:'dips',model}]};
  const service=createNpcModelService(game,catalog);
  await assert.rejects(service.previewNpcModel('agente'),/Ative/);
  game.modules.set(CREATOR_ID,{active:true,api:{family:'quedaco',contractVersion:1,capabilities:{npcTemplates:true},prepareNpcTemplate:async()=>({signature:'a'}),createNpcFromTemplate:async()=>{game.actors.push(actor);return {status:'created',actorUuid:actor.uuid};}}});
  assert.equal((await service.previewNpcModel('agente')).catalogRevision,1);
  await assert.rejects(service.createNpcModel('agente',{expectedRevision:0}),/mudou/);
  await service.createNpcModel('agente',{expectedRevision:1,expectedSignature:'a'});assert.equal(updates,1);
});
