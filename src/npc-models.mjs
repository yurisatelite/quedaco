/** Integração opcional por API pública; regras e criação pertencem ao Criador. */
import {catalogCreatedNpc} from './adapter.mjs';
import {getNpcBatchInstructions} from './npc-batch-content.mjs';
export const CREATOR_ID='quedaco-personagens-skyfall-rpg';
export function npcTemplateCreator(game){
  const module=game.modules?.get?.(CREATOR_ID),api=module?.api;
  if(!module?.active||api?.family!=='quedaco'||api?.contractVersion!==1||api?.capabilities?.npcTemplates!==true||typeof api.prepareNpcTemplate!=='function'||typeof api.createNpcFromTemplate!=='function')return null;
  return api;
}
export function npcModelActor(game,id){
  const matches=Array.from(game.actors??[]).filter(actor=>actor.flags?.[CREATOR_ID]?.npcModel?.id===id);
  return matches.length===1?matches[0]:null;
}
export function createNpcModelService(game,catalog){
  const batchSelection=(selection={})=>{
    if(!game.user?.isGM)throw Error('Somente a Mestra pode criar lotes de NPCs.');
    const api=npcTemplateCreator(game);
    if(!api?.capabilities?.npcBatch||typeof api.prepareNpcBatch!=='function'||typeof api.createNpcBatch!=='function')throw Error('Ative o Criador 0.1.9 ou superior com suporte a lotes de NPCs.');
    if(api.capabilities.npcTemplateResolution!==true)throw Error('Atualize QUEDAÇO - Personagens Skyfall RPG para 0.3.3 ou superior: esta criação em lote precisa da resolução corrigida de trilhas, talentos e façanhas. O Cadastro funciona sem o Criador.');
    if(selection.ids!==undefined&&(!Array.isArray(selection.ids)||!selection.ids.length||new Set(selection.ids).size!==selection.ids.length))throw Error('Informe uma lista de IDs sem repetição.');
    const rows=catalog.listNpcModels(selection).filter(row=>!selection.ids||selection.ids.includes(row.id));
    if(selection.ids&&rows.length!==selection.ids.length)throw Error('Um modelo selecionado não existe ou está inativo.');
    if(!rows.length||rows.length>200)throw Error('Selecione de 1 a 200 modelos.');
    return {api,rows,batch:{name:'NPCs do Cadastro',npcs:rows.map(row=>({...structuredClone(row.model),id:row.id,organizationId:row.organizationId??'',environmentId:row.environmentId??''}))}};
  };
  const requireModel=id=>{
    if(!game.user?.isGM)throw Error('Somente a Mestra pode criar fichas por modelo.');
    const row=catalog.listNpcModels().find(row=>row.id===id);if(!row)throw Error('Modelo de NPC não encontrado.');
    const api=npcTemplateCreator(game);if(!api)throw Error('Ative uma versão do Criador de Personagens com suporte a modelos de NPC. A ambientação continua disponível.');
    return {row,api,model:{...structuredClone(row.model),id:row.id,organizationId:row.organizationId??''}};
  };
  return {
    getNpcBatchInstructions,
    async previewNpcBatch(selection={}){
      const {api,batch}=batchSelection(selection),revision=catalog.getWorldCatalog().revision;
      const preview=await api.prepareNpcBatch(batch);
      if(revision!==catalog.getWorldCatalog().revision)throw Error('O cadastro mudou. Gere uma nova prévia do lote.');
      return {...preview,catalogRevision:revision,ids:batch.npcs.map(npc=>npc.id)};
    },
    async createNpcBatch(selection={}, {expectedSignature,expectedRevision}={}){
      const {api,batch}=batchSelection(selection);
      if(expectedRevision!==catalog.getWorldCatalog().revision)throw Error('O cadastro mudou. Gere uma nova prévia do lote.');
      const report=await api.createNpcBatch(batch,{expectedSignature});
      for(const result of report.results){
        if(result.status!=='created')continue;
        try{
          const actor=npcModelActor(game,result.id);
          if(!actor||actor.uuid!==result.actorUuid)throw Error('Ficha criada não pôde ser confirmada no Cadastro.');
          await catalogCreatedNpc(actor,batch.npcs.find(npc=>npc.id===result.id));
        }catch(error){result.catalogError=error.message;report.warnings??=[];report.warnings.push({id:result.id,error:error.message});}
      }
      return report;
    },
    async refreshNpcModelRelations(){
      if(!game.user?.isGM)throw Error('Somente a Mestra pode vincular relações.');
      const api=npcTemplateCreator(game);if(typeof api?.refreshNpcTemplateRelations!=='function')return false;
      for(const row of catalog.listNpcModels())await api.refreshNpcTemplateRelations({...structuredClone(row.model),id:row.id});
      return true;
    },
    async previewNpcModel(id){const {api,model}=requireModel(id);return {...await api.prepareNpcTemplate(model),catalogRevision:catalog.getWorldCatalog().revision};},
    async createNpcModel(id,{expectedSignature,expectedRevision}={}){
      const {row,api,model}=requireModel(id);
      if(expectedRevision!==catalog.getWorldCatalog().revision)throw Error('O cadastro mudou. Gere uma nova prévia do modelo.');
      const result=await api.createNpcFromTemplate(model,{expectedSignature});
      if(result.status==='created'){
        // Só cataloga a ficha recém-criada pelo Criador. Nunca adota por nome.
        const actor=npcModelActor(game,id);
        if(!actor||actor.uuid!==result.actorUuid)throw Error('O Criador retornou uma ficha que não pôde ser confirmada.');
        await catalogCreatedNpc(actor,{...model,organizationId:row.organizationId??''});
      }
      return result;
    }
  };
}
