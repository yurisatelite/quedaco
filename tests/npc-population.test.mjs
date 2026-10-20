import test from 'node:test';
import assert from 'node:assert/strict';
import {createNpcPopulationService} from '../src/npc-population.mjs';
import {createNpcRequestService} from '../src/npc-requests.mjs';
import {CREATOR_ID} from '../src/npc-models.mjs';
import {getNpcBatchInstructions} from '../src/npc-batch-content.mjs';
function setup(){
  const data={revision:1,regions:[{id:'maruma',name:'Maruma'}],places:[{id:'porto',name:'Porto',regionId:'maruma'},{id:'vila',name:'Vila',regionId:'maruma'}],environments:[],organizations:[],npcGenerationProfiles:[{id:'ladrao',name:'Ladrão',kind:'purpose',terms:['ladrão']},{id:'anima-gato',kind:'animal',terms:['gato']} ]};
  const game={user:{id:'gm',isGM:true,can:()=>true},journal:[],actors:[],modules:new Map()};
  const creator={family:'quedaco',contractVersion:1,capabilities:{npcTemplates:true,npcDescription:true,npcProfileSelection:true},prepareNpcTemplate(){},async getNpcCreationCatalog(){return {items:[{name:'Humani',type:'legacy'},{name:'Gnomo',type:'legacy'}],failures:[]};},async prepareNpcDescription(request){return {state:request.text.includes('pendência')?'needs-choices':'ready',model:{...request,name:request.id},issues:[],signature:JSON.stringify(request)};},async createNpcFromTemplate(model){
    const existing=game.actors.find(row=>row.flags[CREATOR_ID].npcModel.id===model.id);if(existing)return {status:'existing',actorUuid:existing.uuid};
    const actor={uuid:`Actor.${game.actors.length}`,flags:{[CREATOR_ID]:{npcModel:{id:model.id}}},async update(){}};game.actors.push(actor);return {status:'created',actorUuid:actor.uuid};
  }};
  game.modules.set(CREATOR_ID,{active:true,api:creator});
  const catalog={getWorldCatalog:()=>structuredClone(data)};
  const JournalClass={async create(value){const doc=structuredClone(value);doc.update=async change=>{doc.flags.quedaco.npcRequest=structuredClone(change['flags.quedaco.npcRequest']);};game.journal.push(doc);return doc;}};
  const requests=createNpcRequestService(game,catalog,{JournalClass});
  return {data,game,requests,api:createNpcPopulationService(game,catalog,requests)};
}
const config={regionId:'maruma',count:30,minLevel:1,maxLevel:3,legacyWeights:{Humani:1,Gnomo:1},purposeWeights:{ladrao:1},seed:'teste',teamId:'ladroes-maruma'};
test('sorteio estável e reutilizável, escopo, níveis, ânima, equipe e nenhuma criação na prévia',async()=>{
  const f=setup(),a=await f.api.planNpcPopulation(config),b=await f.api.planNpcPopulation(config);
  assert.deepEqual(a,b);assert.equal(a.requests.length,30);assert.equal(new Set(a.requests.map(row=>row.id)).size,30);
  assert.equal(f.game.journal.length,0);assert.equal(f.game.actors.length,0);
  for(const row of a.requests){assert.ok(['porto','vila'].includes(row.placeId));assert.ok(row.level>=1&&row.level<=3);assert.equal(row.purposeProfileId,'ladrao');assert.equal(row.teamId,'ladroes-maruma');if(row.legacy==='Gnomo')assert.equal(row.anima,'gato');}
  assert.equal(Object.keys(a.summary.places).length,2);
  const c=await f.api.planNpcPopulation({...config,seed:'outro'});assert.notEqual(a.batchId,c.batchId);assert.notDeepEqual(a.requests,c.requests);
  const restricted=await f.api.planNpcPopulation({...config,placeWeights:{porto:1}});assert.ok(restricted.requests.every(row=>row.placeId==='porto'));
});
test('entrada e escopo inválidos são recusados antes da fila; não há substituições silenciosas',async()=>{
  const f=setup();
  for(const change of [{count:201},{minLevel:5,maxLevel:2},{legacyWeights:{Tritão:1}},{purposeWeights:{guarda:1}},{placeWeights:{fora:1}},{legacyWeights:{Humani:0}},{regionId:'fora'},{extra:1}])await assert.rejects(f.api.planNpcPopulation({...config,...change}));
  f.data.npcGenerationProfiles=f.data.npcGenerationProfiles.filter(row=>row.kind!=='animal');await assert.rejects(f.api.planNpcPopulation(config),/ânima/);
  assert.equal(f.game.journal.length,0);
  f.game.user.isGM=false;await assert.rejects(f.api.planNpcPopulation(config),/Mestra/);
});
test('guardar exige plano original, protege mudanças do Cadastro e é idempotente',async()=>{
  const f=setup(),plan=await f.api.planNpcPopulation(config);
  await assert.rejects(f.api.stageNpcPopulation(plan),/Revise/);
  const changed=structuredClone(plan);changed.requests[0].level=12;
  await assert.rejects(f.api.stageNpcPopulation(changed,{expectedSignature:plan.signature}),/mudou/);
  f.data.revision++;await assert.rejects(f.api.stageNpcPopulation(plan,{expectedSignature:plan.signature}),/mudou/);
  const fresh=await f.api.planNpcPopulation(config);await f.api.stageNpcPopulation(fresh,{expectedSignature:fresh.signature});await f.api.stageNpcPopulation(fresh,{expectedSignature:fresh.signature});
  assert.equal(f.game.journal.length,30);assert.equal(f.game.actors.length,0);
});
test('documento JSON → pedidos privados → Criador → Actors, inteiramente por código',async()=>{
  const f=setup(),document={format:'quedaco-grupo-npcs',schemaVersion:1,population:{...config,count:3}};
  const preview=await f.api.prepareNpcGroup('```json\n'+JSON.stringify(document)+'\n```');
  assert.equal(preview.ready,3);assert.equal(f.game.actors.length,0);assert.equal(f.game.journal.length,3);
  const result=await f.api.createPreparedNpcGroup(preview);assert.equal(result.created,3);assert.equal(f.game.actors.length,3);
  const again=await f.api.prepareNpcGroup(document);assert.equal((await f.api.createPreparedNpcGroup(again)).existing,3);assert.equal(f.game.actors.length,3);
  await assert.rejects(f.api.prepareNpcGroup('um grupo de ladrões'),/JSON/);
  const pending=await f.api.prepareNpcGroup({format:'quedaco-grupo-npcs',schemaVersion:1,requests:[{id:'grupo:pendente',text:'pendência em Maruma',regionId:'maruma'}]});
  await assert.rejects(f.api.createPreparedNpcGroup(pending),/pendentes/);
  const stale=await f.api.prepareNpcGroup({...document,population:{...config,count:2}});f.data.revision++;
  await assert.rejects(f.api.createPreparedNpcGroup(stale),/mudou/);
});
test('guia consultável explica o contrato sem exigir interface',()=>{
  const guide=getNpcBatchInstructions().populationEngine;
  assert.match(guide.instructions,/ladrões de Maruma/);assert.ok(guide.groupTemplate);assert.ok(guide.individualTemplate);
});

test('nomes repetidos e Criador antigo impedem criação silenciosa de um grupo incorreto',async()=>{
  const f=setup(),creator=f.game.modules.get(CREATOR_ID).api;
  const original=creator.prepareNpcDescription;
  creator.prepareNpcDescription=async request=>({...await original(request),model:{id:request.id,name:'Mesmo nome'}});
  const preview=await f.api.prepareNpcGroup({format:'quedaco-grupo-npcs',schemaVersion:1,population:{...config,count:2}});
  assert.equal(preview.ready,0);assert.equal(preview.issues.length,2);
  await assert.rejects(f.api.createPreparedNpcGroup(preview),/pendentes/);assert.equal(f.game.actors.length,0);
  creator.capabilities.npcProfileSelection=false;
  await assert.rejects(f.api.planNpcPopulation(config),/0.3.0/);
});
