/** Integração opcional por API pública; regras e criação pertencem ao Criador. */
import {catalogCreatedNpc} from './adapter.mjs';
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
  const requireModel=id=>{
    if(!game.user?.isGM)throw Error('Somente a Mestra pode criar fichas por modelo.');
    const row=catalog.listNpcModels().find(row=>row.id===id);if(!row)throw Error('Modelo de NPC não encontrado.');
    const api=npcTemplateCreator(game);if(!api)throw Error('Ative uma versão do Criador de Personagens com suporte a modelos de NPC. A ambientação continua disponível.');
    return {row,api,model:{...structuredClone(row.model),id:row.id,organizationId:row.organizationId??''}};
  };
  return {
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
