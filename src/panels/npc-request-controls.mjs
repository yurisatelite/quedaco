import {escapeHTML as e} from '../adapter.mjs';
export function npcRequestControlsHTML(){return `<details class="sy-npc-requests"><summary>Descrever e preparar NPCs</summary>
<p>IA e módulos: o contrato abaixo ensina a transformar um pedido de grupo em documento JSON e criar Actors pelo Cadastro → Criador de Personagens. Todo o fluxo também funciona por código, sem cliques por NPC.</p>
<button type="button" data-npc-request="guide">Modelo para IA e outros módulos</button>
<p>Descreva legado, local, nível e propósito. O motor local consulta perfis do Cadastro e compêndios; escolhas sem informação aparecem como pendências.</p><label>Descrição<textarea name="npcRequestText" rows="5" placeholder="Uma gnoma com ânima de gato, nível 1, batedora em Huma..."></textarea></label><label>Nome (opcional)<input name="npcRequestName"></label><label>Nível (opcional se estiver na descrição)<input type="number" name="npcRequestLevel" min="1" max="12"></label><button type="button" data-npc-request="stage">Guardar e preparar descrição</button>
<p>Para gerar novos moradores regularmente, escolha uma região e sorteie um elenco. A distribuição é uma proposta da campanha; não cria fichas nem coloca tokens no mapa.</p>
<label>Região<select name="npcPopulationRegion"></select></label>
<label>Quantidade de NPCs<input name="npcPopulationCount" type="number" min="1" max="200" value="10"></label>
<label>Nível mínimo<input name="npcPopulationMin" type="number" min="1" max="12" value="1"></label>
<label>Nível máximo<input name="npcPopulationMax" type="number" min="1" max="12" value="1"></label>
<label>Legados permitidos (separados por vírgula)<input name="npcPopulationLegacies" placeholder="Humani, Anuro, Gnomo"></label>
<label>IDs dos perfis de propósito (opcional, separados por vírgula)<input name="npcPopulationPurposes" placeholder="mercador, lutador, batedor"></label>
<label>Orientação adicional (opcional)<textarea name="npcPopulationText" rows="3" placeholder="Moradores envolvidos no comércio do porto..."></textarea></label>
<p>Sem filtro de propósito, usa todos os perfis compatíveis com o local. A orientação não muda as proporções do sorteio automaticamente.</p>
<button type="button" data-npc-request="population-plan">Sortear novo elenco regional</button><button type="button" data-npc-request="population-stage" disabled>Guardar elenco na fila</button>
<button type="button" data-npc-request="list">Ver pedidos preparados</button><button type="button" data-npc-request="audit">Diagnosticar informações do Cadastro</button><div data-npc-request-list></div><button type="button" data-npc-request="preview">Revisar selecionados</button><button type="button" data-npc-request="create" disabled>Criar selecionados</button><div data-npc-request-output role="status"></div></details>`;}

export function bindNpcRequestControls(root,api){
  if(typeof api.stageNpcRequests!=='function')return;
  const output=root.querySelector('[data-npc-request-output]'),list=root.querySelector('[data-npc-request-list]'),create=root.querySelector('[data-npc-request="create"]');
  if(!output)return;let preview=null,population=null,busy=false;
  const populationStage=root.querySelector('[data-npc-request="population-stage"]');
  const regionSelect=root.querySelector('[name="npcPopulationRegion"]');
  if(regionSelect)regionSelect.innerHTML=(api.getWorldCatalog?.().regions??[]).map(row=>`<option value="${e(row.id)}">${e(row.name)}</option>`).join('');
  const populationFields=Array.from(root.querySelectorAll('[name^="npcPopulation"]'));
  for(const field of populationFields)for(const event of ['input','change'])field.addEventListener(event,()=>{population=null;populationStage.disabled=true;});
  const invalidate=()=>{preview=null;create.disabled=true;};
  const selected=()=>Array.from(list.querySelectorAll('input:checked')).map(input=>input.value);
  const renderList=()=>{
    list.innerHTML=api.listNpcRequests().map(row=>`<label><span><input type="checkbox" value="${e(row.request.id)}" ${row.state==='created'?'disabled':''}> ${e(row.prepared?.name??row.request.name??row.request.id)} · ${e(({draft:'Rascunho',ready:'Pronto para revisar','needs-choices':'Precisa de escolhas',created:'Criado','needs-review':'Com pendência'})[row.state]??row.state)}</span></label>`).join('')||'<p>Nenhum pedido guardado.</p>';
    invalidate();for(const box of list.querySelectorAll('input'))box.addEventListener('change',invalidate);
  };
  for(const button of root.querySelectorAll('[data-npc-request]'))button.addEventListener('click',async()=>{
    if(busy)return;busy=true;button.disabled=true;
    try{
      const action=button.dataset.npcRequest;
      if(action==='guide'){
        const guide=api.getNpcBatchInstructions().populationEngine;
        output.innerHTML=`<p>Modelo oficial de integração desta versão. Copie e envie à IA ou consulte api.getNpcBatchInstructions().populationEngine.</p><label>Instruções e modelos<textarea rows="18" readonly>${e(JSON.stringify(guide,null,2))}</textarea></label>`;
      }
      if(action==='population-plan'){
        population=null;populationStage.disabled=true;invalidate();
        if(!api.planNpcPopulation)throw Error('Atualize o Cadastro para usar o planejador regional.');
        output.textContent='Sorteando localidades, perfis, legados e níveis…';
        const value=name=>root.querySelector(`[name="npcPopulation${name}"]`).value;
        const distribution=text=>Object.fromEntries(text.split(',').map(term=>term.trim()).filter(Boolean).map(term=>[term,1]));
        const purposeWeights=distribution(value('Purposes'));
        population=await api.planNpcPopulation({regionId:value('Region'),count:Number(value('Count')),minLevel:Number(value('Min')),maxLevel:Number(value('Max')),legacyWeights:distribution(value('Legacies')),...(Object.keys(purposeWeights).length?{purposeWeights}:{}),text:value('Text')});
        output.innerHTML=`<p>${population.requests.length} propostas · semente ${e(population.config.seed)}.</p><ul>${population.warnings.map(warning=>`<li>${e(warning)}</li>`).join('')}</ul><ol>${population.requests.map(row=>`<li>${e(row.text)}</li>`).join('')}</ol>`;
        populationStage.disabled=false;
      }
      if(action==='population-stage'){
        if(!population)throw Error('Sorteie e revise o elenco primeiro.');
        const rows=await api.stageNpcPopulation(population,{expectedSignature:population.signature});
        const ids=rows.map(row=>row.request.id);renderList();
        for(const input of list.querySelectorAll('input'))input.checked=ids.includes(input.value)&&!input.disabled;
        population=null;populationStage.disabled=true;
        output.textContent=`${rows.length} pedidos guardados e selecionados. Clique em Revisar selecionados para conferir as escolhas mecânicas antes de criar.`;
      }
      if(action==='stage'){
        output.textContent='Guardando o pedido e consultando os compêndios…';
        const text=root.querySelector('[name="npcRequestText"]').value,name=root.querySelector('[name="npcRequestName"]').value.trim(),level=root.querySelector('[name="npcRequestLevel"]').value;
        const rows=await api.stageNpcRequests({text,...(name?{name}:{}),...(level?{level:Number(level)}:{})});
        const prepared=await api.prepareNpcRequests({ids:rows.map(row=>row.request.id)});
        renderList();
        output.innerHTML=prepared.rows.map(row=>`<p><b>${e(row.prepared.name??row.id)}</b> · ${row.prepared.state==='ready'?'Pronto para revisar':'Precisa de escolhas'}</p><ul>${(row.prepared.issues??[]).map(issue=>`<li>${e(issue)}</li>`).join('')}</ul>`).join('');
      }
      if(action==='list'){renderList();output.textContent='Selecione os pedidos e clique em Revisar selecionados.';}
      if(action==='audit'){output.innerHTML=`<pre>${e(JSON.stringify(await api.auditNpcGeneration(),null,2))}</pre>`;}
      if(action==='preview'){
        output.textContent='Preparando escolhas e conferindo os pedidos selecionados…';
        invalidate();const ids=selected();if(!ids.length)throw Error('Selecione ao menos um pedido.');
        preview=await api.prepareNpcRequests({ids});
        output.innerHTML=preview.rows.map(row=>`<details open><summary>${e(row.prepared.name??row.id)} · ${row.prepared.state==='ready'?'Pronto':'Precisa de escolhas'}</summary><ul>${(row.prepared.issues??[]).map(issue=>`<li>${e(issue)}</li>`).join('')}</ul>${row.prepared.model?`<p>${e(row.prepared.model.legacy)} · ${e(row.prepared.model.characterClass)} ${e(row.prepared.model.level)} · ${e(row.prepared.model.background)}</p>`:''}<ul>${(row.prepared.decisions??[]).map(choice=>`<li>${e(choice.value)} — ${e(choice.reason)}</li>`).join('')}</ul></details>`).join('');
        create.disabled=preview.issues.length>0;
      }
      if(action==='create'){
        if(!preview||preview.issues.length)throw Error('Revise os pedidos antes de criar.');
        output.textContent='Criando as fichas selecionadas pelo Criador…';
        const report=await api.createPreparedNpcRequests({ids:preview.rows.map(row=>row.id)},{expectedSignature:preview.signature});
        renderList();output.innerHTML=`<p>${report.created} criados · ${report.existing} existentes · ${report.errors} com erro.</p><ul>${report.results.map(row=>`<li>${e(row.id)}: ${e(row.actorUuid??row.error??row.status)}${row.catalogError?` · ${e(row.catalogError)}`:''}</li>`).join('')}</ul>`;
      }
    }catch(error){invalidate();population=null;populationStage.disabled=true;output.textContent=error.message;}
    finally{busy=false;if(button!==create&&button!==populationStage)button.disabled=false;}
  });
}
