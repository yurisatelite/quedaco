import test from 'node:test';
import assert from 'node:assert/strict';
import {createNpcRequestService,generationContext} from '../src/npc-requests.mjs';
import {createWorldCatalogService,baseWorldCatalog,planAmbientContent} from '../src/world-catalog.mjs';
import {CREATOR_ID} from '../src/npc-models.mjs';
function setup(){
  const game={user:{id:'gm',isGM:true},actors:[],journal:[],modules:new Map(),settings:{get:()=>({})}};
  let creates=0,failures=new Set();
  const JournalClass={async create(data){assert.deepEqual(data.ownership,{default:0});const doc=structuredClone(data);doc.update=async change=>{for(const [key,value] of Object.entries(change))if(key==='flags.quedaco.npcRequest')doc.flags.quedaco.npcRequest=structuredClone(value);};game.journal.push(doc);return doc;}};
  const catalog=createWorldCatalogService(game);
  const creator={family:'quedaco',contractVersion:1,capabilities:{npcTemplates:true,npcDescription:true},prepareNpcTemplate(){},async prepareNpcDescription(request,{context,profiles}){
    if(request.text.includes('pendente'))return {id:request.id,state:'needs-choices',issues:['Animal ausente']};
    return {id:request.id,state:'ready',issues:[],name:request.name??request.id,model:{id:request.id,name:request.name??request.id,context:context.summary,sourceModule:request.sourceModule,teamId:request.teamId},signature:JSON.stringify([request,context,profiles])};
  },async createNpcFromTemplate(model){
    const existing=game.actors.find(actor=>actor.flags?.[CREATOR_ID]?.npcModel.id===model.id);
    if(existing)return {status:'existing',actorUuid:existing.uuid};
    if(failures.has(model.id))throw Error('Falha simulada');
    const actor={uuid:`Actor.a${creates++}`,flags:{[CREATOR_ID]:{npcModel:{id:model.id}}},async update(){}};
    game.actors.push(actor);return {status:'created',actorUuid:actor.uuid};
  },async getNpcCreationCatalog(){return {items:[{name:'Anuro',type:'legacy'}],failures:[]};}};
  game.modules.set(CREATOR_ID,{active:true,api:creator});
  return {game,catalog,JournalClass,failures,service:createNpcRequestService(game,catalog,{JournalClass})};
}
const request={id:'teatro:mara',text:'Uma Anura mercadora em Huma nível 1',sourceModule:'quedaco-teatro',batchId:'arena',teamId:'norte'};
test('pedido fica privado, sobrevive a outra instância, permite revisar e impede edição perdida',async()=>{
  const f=setup();await f.service.stageNpcRequests(request);assert.equal(f.game.actors.length,0);
  await f.service.stageNpcRequests(request);assert.equal(f.game.journal.length,1);
  const reloaded=createNpcRequestService(f.game,f.catalog,{JournalClass:f.JournalClass});
  assert.equal(reloaded.listNpcRequests({sourceModule:'quedaco-teatro'}).length,1);
  await assert.rejects(reloaded.stageNpcRequests({...request,text:'Texto alterado em Huma'}),/expectedRevision/);
  await reloaded.stageNpcRequests({...request,text:'Uma Anura guarda em Huma nível 1'},{expectedRevision:1});
  assert.equal(reloaded.listNpcRequests()[0].revision,2);
  await assert.rejects(reloaded.stageNpcRequests(request,{expectedRevision:1}),/mudou/);
  f.game.user.isGM=false;assert.throws(()=>reloaded.listNpcRequests(),/Mestra/);await assert.rejects(reloaded.stageNpcRequests(request),/Mestra/);
});
test('assinatura e pendências bloqueiam; somente IDs revisados criam Actor; repetição não duplica',async()=>{
  const f=setup();await f.service.stageNpcRequests([request,{...request,id:'teatro:b',text:'NPC pendente em Huma'}]);
  const pending=await f.service.prepareNpcRequests({ids:['teatro:mara','teatro:b']});
  await assert.rejects(f.service.createPreparedNpcRequests({ids:['teatro:mara','teatro:b']},{expectedSignature:pending.signature}),/pendentes/);
  assert.equal(f.game.actors.length,0);
  const preview=await f.service.prepareNpcRequests({ids:[request.id]});
  await assert.rejects(f.service.createPreparedNpcRequests({ids:[request.id]},{expectedSignature:'antiga'}),/mudou/);
  const result=await f.service.createPreparedNpcRequests({ids:[request.id]},{expectedSignature:preview.signature});
  assert.equal(result.created,1);assert.equal(f.game.actors.length,1);
  assert.equal((await f.service.createPreparedNpcRequests({ids:[request.id]},{expectedSignature:preview.signature})).existing,1);
  assert.equal(f.service.listNpcRequests({state:'created'}).length,1);
  await assert.rejects(f.service.stageNpcRequests({...request,text:'Outro NPC'}),/já criado/);
});
test('pedido e perfil alterados invalidam prévia; relatório preserva erro parcial',async()=>{
  const f=setup();await f.service.stageNpcRequests([request,{...request,id:'teatro:c'}]);
  let preview=await f.service.prepareNpcRequests({ids:[request.id]});
  await f.service.stageNpcRequests({...request,level:2},{expectedRevision:1});
  await assert.rejects(f.service.createPreparedNpcRequests({ids:[request.id]},{expectedSignature:preview.signature}),/mudou/);
  preview=await f.service.prepareNpcRequests({ids:[request.id]});
  const base=f.catalog.getWorldCatalog();base.npcGenerationProfiles[0].cash=999;
  const changed=createNpcRequestService(f.game,{...f.catalog,getWorldCatalog:()=>base},{JournalClass:f.JournalClass});
  await assert.rejects(changed.createPreparedNpcRequests({ids:[request.id]},{expectedSignature:preview.signature}),/mudou/);
  f.failures.add('teatro:c');
  preview=await changed.prepareNpcRequests({ids:[request.id,'teatro:c']});
  const report=await changed.createPreparedNpcRequests({ids:[request.id,'teatro:c']},{expectedSignature:preview.signature});
  assert.equal(report.created,1);assert.equal(report.errors,1);assert.equal(changed.listNpcRequests({state:'needs-review'}).length,1);
});
test('contexto usa Huma, descrições culturais e localidades; diagnóstico lista referências ausentes',async()=>{
  const f=setup();const ctx=generationContext(f.catalog,{text:'Um tritão no arquipélago de Uma'});
  assert.equal(ctx.regionId,'huma');assert.match(ctx.summary,/Armada|Huma/);
  const conflict=generationContext(f.catalog,{text:'NPC',regionId:'huma',placeId:'alberich'});assert.ok(conflict.issues.length);
  const seeded=f.catalog.getWorldCatalog();seeded.environments.push({id:'arena',name:'Arena de teste',placeId:'alberich',regionId:'thurthur',organizationId:'dips'});
  const scoped=generationContext({getWorldCatalog:()=>seeded},{text:'Um guarda',environmentId:'arena'});assert.equal(scoped.placeId,'alberich');assert.equal(scoped.organizationId,'dips');assert.deepEqual(scoped.issues,[]);
  const audit=await f.service.auditNpcGeneration();assert.ok(audit.gaps.length);assert.equal(audit.profiles,9);assert.deepEqual(audit.legacies,['Anuro']);
  const seed=baseWorldCatalog();assert.ok(seed.regions.every(row=>row.description));assert.ok(seed.places.every(row=>row.description));
  const packet={format:'quedaco-ambientacao',schemaVersion:1,id:'profiles',records:{npcGenerationProfiles:[{...seed.npcGenerationProfiles[0],cash:12}]}};
  const plan=planAmbientContent({},packet);assert.equal(plan.next.npcGenerationProfiles[0].cash,12);
  assert.throws(()=>planAmbientContent({}, {...packet,records:{npcGenerationProfiles:[{...seed.npcGenerationProfiles[0],script:'eval'}]}}),/não aceito/);
});
