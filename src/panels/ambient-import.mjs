import {escapeHTML as e,baixarArquivo} from '../adapter.mjs';
import {npcModelActor,npcTemplateCreator} from '../npc-models.mjs';

export function exportAmbientContent(api){
  return baixarArquivo(JSON.stringify(api.exportAmbientContent(),null,2),'application/json','quedaco-ambientacao.json');
}

/** Ler e gerar prévia nunca grava; somente o botão Aplicar usa o serviço. */
export function openAmbientImporter(api){
  if(!game.user?.isGM)throw Error('Somente a Mestra pode importar ambientação.');
  let preview=null,previewText='';
  const content='<div class="sy-ambient-import"><p>Importe organizações, ambientes e modelos de NPC sem atualizar o módulo. O arquivo contém dados, não comandos JavaScript. Alterações de ficha são uma etapa separada pelo Criador.</p><label>Arquivo de conteúdo<input type="file" accept=".json,.txt,.md,application/json,text/plain,text/markdown" name="ambientFile"></label><label>Ou cole o conteúdo<textarea name="ambientText" rows="10" placeholder="Cole o pacote JSON ou o texto no formato QUEDACO-AMBIENTACAO 1"></textarea></label><button type="button" data-preview-ambient>Gerar prévia</button><div data-ambient-preview role="status">Selecione um arquivo ou cole o conteúdo.</div></div>';
  class AmbientImportDialog extends foundry.applications.api.DialogV2{
    _onRender(context,options){
      super._onRender(context,options);
      const root=this.element,text=root.querySelector('[name="ambientText"]'),file=root.querySelector('[name="ambientFile"]'),output=root.querySelector('[data-ambient-preview]'),apply=root.querySelector('[data-action="apply"]');
      const reset=()=>{preview=null;previewText='';if(apply)apply.disabled=true;output.textContent='Conteúdo alterado. Gere uma nova prévia.';};
      if(apply)apply.disabled=true;
      text.addEventListener('input',reset);
      file.addEventListener('change',async()=>{
        reset();const selected=file.files?.[0];if(!selected)return;
        try{if(selected.size>2_000_000)throw Error('Arquivo maior que 2 MB.');text.value=await selected.text();output.textContent='Arquivo lido. Clique em Gerar prévia.';}catch(error){output.textContent=error.message;}
      });
      root.querySelector('[data-preview-ambient]').addEventListener('click',()=>{
        reset();try{
          previewText=text.value;preview=api.previewAmbientContent(previewText);
          output.innerHTML=`<h3>${e(preview.title)}</h3><p>${preview.changes.length} alterações · ${preview.unchanged.length} entradas sem mudança.</p>${preview.changes.map(row=>`<details><summary>${row.action==='create'?'Adicionar':'Atualizar'} · ${e(row.name)} (${e(row.group)})</summary><p>Campos: ${e(row.fields.join(', '))}</p><h4>Antes</h4><pre>${e(JSON.stringify(row.before,null,2))}</pre><h4>Depois</h4><pre>${e(JSON.stringify(row.after,null,2))}</pre></details>`).join('')}`;
          if(apply)apply.disabled=!preview.changes.length;
        }catch(error){preview=null;output.textContent=error.message;}
      });
    }
  }
  return new AmbientImportDialog({window:{title:'QUEDAÇO · importar ambientação'},position:{width:760},content,buttons:[{action:'apply',label:'Aplicar conteúdo',default:false,callback:async(_event,button,dialog)=>{
    const text=dialog.element.querySelector('[name="ambientText"]').value;
    if(!preview||text!==previewText)throw Error('Gere uma prévia do conteúdo atual antes de aplicar.');
    const result=await api.importAmbientContent(text,{expectedRevision:preview.expectedRevision});
    ui.notifications.info(`${result.changes.length} cadastros importados. Modelos de NPC estão prontos para a etapa Criar fichas.`);
  }},{action:'close',label:'Fechar'}]}).render({force:true});
}

export async function createAmbientNpcModels(api,{organizationId}={}){
  if(!game.user?.isGM)throw Error('Somente a Mestra pode criar fichas.');
  if(!npcTemplateCreator(game))throw Error('Ative uma versão do Criador de Personagens com suporte a modelos de NPC.');
  const rows=api.listNpcModels({organizationId}).filter(row=>!npcModelActor(game,row.id));
  if(!rows.length)return ui.notifications.info('Nenhum modelo sem ficha nessa seleção.');
  const previews=[];
  for(const row of rows)previews.push({row,preview:await api.previewNpcModel(row.id)});
  const accepted=await foundry.applications.api.DialogV2.confirm({window:{title:'Criar NPCs pelo Criador de Personagens'},position:{width:720},content:`<p>${rows.length} Actors nativos serão criados pelo Criador. Fichas existentes não são substituídas.</p><ul>${previews.map(({row,preview})=>`<li><b>${e(row.name)}</b> · ${e(preview.legacy)} · ${e(preview.characterClass)} ${e(preview.level)} · T$ ${e(preview.cash)} · carga ${e(preview.volume)}/${e(preview.capacity)}<p>${e(preview.inventory)}</p></li>`).join('')}</ul>`,yes:{label:'Criar fichas'},no:{label:'Cancelar'},rejectClose:false});
  if(!accepted)return;
  let created=0;
  for(const {row,preview} of previews){const result=await api.createNpcModel(row.id,{expectedRevision:preview.catalogRevision,expectedSignature:preview.signature});if(result.status==='created')created++;if(result.status==='needs-review')throw Error('Há uma ficha incompleta que precisa de revisão no Criador.');}
  await api.refreshNpcModelRelations();
  ui.notifications.info(`${created} Actors criados pelo Criador de Personagens.`);
}
