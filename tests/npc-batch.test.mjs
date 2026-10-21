import test from 'node:test';
import assert from 'node:assert/strict';
import {NPC_BATCH_EXAMPLE,getNpcBatchInstructions} from '../src/npc-batch-content.mjs';
import {parseContentPackage} from '../src/catalog-content.mjs';
import {planAmbientContent,createWorldCatalogService} from '../src/world-catalog.mjs';
import {createNpcModelService,CREATOR_ID} from '../src/npc-models.mjs';
import {registeredNpcs} from '../src/integration.mjs';
test('documento narrativo chega ao Cadastro com equipe, descrição e IDs estáveis',()=>{
  const parsed=parseContentPackage(NPC_BATCH_EXAMPLE),npc=parsed.records.npcModels[0];
  assert.equal(npc.id,'teatro:mara');assert.equal(npc.model.teamId,'arquibancada-norte');
  assert.match(npc.model.description,/\nCobra favores/);
  const planned=planAmbientContent({},NPC_BATCH_EXAMPLE);
  assert.equal(planned.changes.length,1);
  assert.equal(planAmbientContent(planned.next,NPC_BATCH_EXAMPLE).changes.length,0);
  assert.equal(getNpcBatchInstructions().maxNpcs,200);
  assert.deepEqual(parseContentPackage('```text\n'+NPC_BATCH_EXAMPLE+'\n```'),parsed);
  assert.throws(()=>parseContentPackage(NPC_BATCH_EXAMPLE.replace('Nível: 1','Nível: um')),/inteiro/);
  assert.throws(()=>parseContentPackage(NPC_BATCH_EXAMPLE+'\nFunção: repetida'),/repetido/);
  assert.throws(()=>planAmbientContent({},NPC_BATCH_EXAMPLE+'\nInventário: []'),/repetido/);
  assert.throws(()=>planAmbientContent({},NPC_BATCH_EXAMPLE+'\nOrganização: inexistente'),/não cadastrada/);
});
test('JSON de lote e JSON nativo convivem; campos desconhecidos não são descartados',()=>{
  const parsed=parseContentPackage(NPC_BATCH_EXAMPLE),row=parsed.records.npcModels[0];
  const batch={format:'quedaco-npcs',schemaVersion:1,id:'arena',name:'Arena',npcs:[{id:row.id,...row.model}]};
  assert.equal(planAmbientContent({},JSON.stringify(batch)).changes.length,1);
  assert.throws(()=>planAmbientContent({},{...batch,npcs:[...batch.npcs,...batch.npcs]}),/repetido/);
  assert.throws(()=>planAmbientContent({},{...batch,npcs:[{...batch.npcs[0],execute:'Actor.create'}]}),/não aceito/);
  assert.equal(planAmbientContent({},parsed).changes.length,1);
});

test('módulos consumidores descobrem fichas e equipes pela API pública',()=>{
  const game={actors:[{id:'mara',uuid:'Actor.mara',name:'Mara',type:'character',flags:{[CREATOR_ID]:{npcModel:{id:'teatro:mara'}},quedaco:{npc:{teamId:'norte',sourceModule:'quedaco-teatro',tags:['apostadora'],environmentId:'arena'}}}}]};
  const [row]=registeredNpcs(game);
  assert.equal(row.modelId,'teatro:mara');assert.equal(row.teamId,'norte');assert.equal(row.sourceModule,'quedaco-teatro');
  row.tags.push('alterado');assert.deepEqual(game.actors[0].flags.quedaco.npc.tags,['apostadora']);
});
test('Cadastro importa documento, prepara lote e delega fichas ao Criador com revisão',async()=>{
  let stored={},writes=0,creates=0,metadata;
  const actor={uuid:'Actor.mara',flags:{[CREATOR_ID]:{npcModel:{id:'teatro:mara'}}},async update(change){metadata=change;}};
  const game={user:{isGM:true},actors:[],modules:new Map(),settings:{get:()=>stored,set:async(_id,_key,value)=>{stored=value;writes++;}}};
  const catalog=createWorldCatalogService(game),service=createNpcModelService(game,catalog);
  const plan=catalog.previewAmbientContent(NPC_BATCH_EXAMPLE);
  await catalog.importAmbientContent(NPC_BATCH_EXAMPLE,{expectedRevision:plan.expectedRevision});
  assert.equal(writes,1);assert.equal(creates,0);
  await assert.rejects(service.previewNpcBatch(),/Ative/);
  game.modules.set(CREATOR_ID,{active:true,api:{family:'quedaco',contractVersion:1,capabilities:{npcTemplates:true,npcBatch:true},prepareNpcTemplate(){},createNpcFromTemplate(){},async prepareNpcBatch(batch){assert.equal(batch.npcs[0].teamId,'arquibancada-norte');return {signature:'signed',errors:[],rows:[]};},async createNpcBatch(batch,options){assert.equal(options.expectedSignature,'signed');assert.equal(batch.npcs[0].id,'teatro:mara');creates++;game.actors.push(actor);return {created:1,results:[{id:'teatro:mara',status:'created',actorUuid:actor.uuid}]};}}});
  await assert.rejects(service.previewNpcBatch({ids:['teatro:mara']}),/Atualize.*0\.3\.3/);
  game.modules.get(CREATOR_ID).api.capabilities.npcTemplateResolution=true;
  const preview=await service.previewNpcBatch({ids:['teatro:mara']});
  assert.equal(preview.catalogRevision,1);
  await assert.rejects(service.createNpcBatch({ids:preview.ids},{expectedRevision:0,expectedSignature:preview.signature}),/mudou/);
  await assert.rejects(service.previewNpcBatch({ids:['inexistente']}),/não existe/);
  const result=await service.createNpcBatch({ids:preview.ids},{expectedRevision:preview.catalogRevision,expectedSignature:preview.signature});
  assert.equal(result.created,1);assert.equal(creates,1);assert.equal(metadata['flags.quedaco.npc'].teamId,'arquibancada-norte');
  game.user.isGM=false;await assert.rejects(service.previewNpcBatch(),/Mestra/);
});
