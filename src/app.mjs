import {Catalog} from './catalog.mjs';
import {ABILITIES,classRules,backgroundRules,startingMoney,conventionalRoll,validateAttributes,hitPoints} from './rules.mjs';
import {buildLevelOnePlan,validateBenefitChoices,resolvedPlanItems} from './benefits.mjs';
import {buildTrainingPlan,resolveTraining,actorTrainingUpdate} from './training.mjs';
import {MODULE_ID,escapeHTML as e,safeImage,createDraft,addResolvedPlan,refillResources} from './adapter.mjs';
const STEPS=['Conceito','Legado','Herança','Maldição','Antecedente','Classe','Benefícios','Atributos','Treinamento','Dinheiro','Catálogo','Retrato','Revisão'];
const TYPES={1:'legacy',2:'heritage',3:'curse',4:'background',5:'class'};
const LABELS={legacy:'Legados',heritage:'Heranças',curse:'Maldições',background:'Antecedentes',class:'Classes',path:'Trilhas',feature:'Características',feat:'Talentos',ability:'Habilidades',spell:'Magias',weapon:'Armas',armor:'Armaduras',clothing:'Vestimentas',equipment:'Equipamentos',consumable:'Consumíveis',loot:'Outros itens',sigil:'Sigilos',seal:'Selos'};
const number=(n)=>n==null?'—':n;
export class CreatorApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS={id:'skyfall-yuri-creator',classes:['sy-creator'],tag:'section',window:{title:'Skyfall — Criador do Yuri',resizable:true},position:{width:1100,height:780}};
  constructor(options={}) {
    super(options);this.catalog=new Catalog(game);this.step=0;this.query='';this.type='spell';this.loading=true;this.busy=false;this.detail=null;this.actor=null;
    this.draft={name:'',biography:'',selections:{},attributes:{str:1,dex:1,con:2,int:3,wis:0,cha:0},method:'fixed',slots:[2,3,1,0,4,5],boost:5,spellcasting:'int',portrait:'',token:'',cash:0};
    this.heritageOptions=[];
    this.sums={class:null,background:null};this.rolls=[];this.rollSlots=[0,1,2,3,4,5];this.swap=[0,1];this.extra=new Set();this.benefitChoices={};this.benefitPlan=null;this.trainingChoices={};this.trainingPlan=null;this.trainingResolved=null;this._cantrips=null;
  }
  async start(){await this.render(true);try{await this.catalog.load();}catch(err){this.message=err.message;}this.loading=false;return this.render(true);}
  selected(type){return this.catalog.items.find(i=>i.uuid===this.draft.selections[type]);}
  money(){try{return startingMoney(this.selected('class')?.name,this.selected('background')?.name,this.sums.class,this.sums.background);}catch{return null;}}
  attrErrors(){const bases=[3,2,1,1,0,-1],values=Object.values(this.draft.attributes);const errors=validateAttributes(values,this.draft.method,this.draft.slots.map(i=>bases[i]),this.draft.boost);if(this.draft.method==='fixed'&&new Set(this.draft.slots).size!==6)errors.push('Use cada posição da distribuição uma única vez.');if(['conventional','ordered'].includes(this.draft.method)&&this.rolls.length!==6)errors.push('Role os seis conjuntos antes de continuar.');return errors;}
  async _renderHTML(){
    const selected=this.selected('class');let hp='—';try{hp=hitPoints(selected?.name,this.draft.attributes.con);}catch{}
    const money=this.money();
    return `<div class="sy-shell"><header><div><div class="sy-brand">SKYFALL</div><small>Criador de personagens · Yuri</small></div><small>Desenvolvimento · catálogo real da mesa</small><button data-op="audit">Conferir conteúdo</button></header>
      <div class="sy-layout"><nav aria-label="Etapas">${STEPS.map((title,i)=>`<button data-op="step" data-index="${i}" ${this.step===i?'aria-current="step"':''}>${i+1} ${title}</button>`).join('')}</nav>
      <main>${this.message?`<p class="sy-alert" role="status">${e(this.message)}</p>`:''}<small>ETAPA ${this.step+1} DE ${STEPS.length}</small><h2>${STEPS[this.step]}</h2>${this.loading?'<p>Carregando os compêndios acessíveis…</p>':await this.renderStep()}</main>
      <aside><small>SEU PERSONAGEM</small><h3>${e(this.draft.name||'Novo aventureiro')}</h3>${this.draft.portrait?`<img class="sy-portrait" src="${e(safeImage(this.draft.portrait))}" alt="Retrato">`:''}<div class="sy-stats"><div>Vida base<strong>${hp} PV</strong></div><div>Ênfase base<strong>${selected?'3':'—'} PE</strong></div></div><small>Nível 1 · benefícios adicionais calculados pelo sistema</small><dl>${['legacy','heritage','curse','background','class'].map(t=>`<dt>${LABELS[t]}</dt><dd>${e(this.selected(t)?.name??'—')}</dd>`).join('')}</dl><h3>Bolsa</h3><div class="sy-stats">${['k','p','t'].map(k=>`<div>${k.toUpperCase()}$<strong>${number(money?.wallet[k])}</strong></div>`).join('')}</div>${money?.debt?`<p>Dívida: T$ ${money.debt}</p>`:''}${money?.equipmentBudget?`<p>Verba de exploração: T$ ${money.equipmentBudget}</p>`:''}<small>Dinheiro e verba para equipamento são separados.</small></aside></div>
      <footer><button data-op="previous" ${this.step===0?'disabled':''}>← Voltar</button><small>${this.actor?'Rascunho criado na mesa':'Nenhuma ficha criada ainda'}</small><button class="sy-primary" data-op="next" ${this.step===10?'disabled':''}>Continuar →</button></footer></div>`;
  }
  _replaceHTML(result,content){content.innerHTML=result;}
  _onRender(context,options){super._onRender(context,options);const root=this.element;root.addEventListener('click',this._click??=(event)=>this.handleClick(event));root.addEventListener('change',this._change??=(event)=>this.handleChange(event));}
  async renderStep(){
    const d=this.draft;
    if(this.step===0)return `<label>Nome<input name="name" value="${e(d.name)}" maxlength="100"></label><label>Conceito e história<textarea name="biography" rows="7">${e(d.biography)}</textarea></label><label>Atributo-chave de conjuração<select name="spellcasting">${['int','wis','cha'].map(k=>`<option value="${k}" ${d.spellcasting===k?'selected':''}>${ABILITIES[k]}</option>`).join('')}</select></label><p>O nível inicial é 1. A evolução será conferida antes de habilitar níveis superiores.</p>`;
    if(TYPES[this.step])return this.renderCatalog(TYPES[this.step]);
    if(this.step===6)return this.renderBenefits();
    if(this.step===7)return this.renderAttributes();
    if(this.step===8)return this.renderTraining();
    if(this.step===9)return this.renderMoney();
    if(this.step===10)return `<label>Tipo de conteúdo<select name="catalogType">${Object.entries(LABELS).map(([k,v])=>`<option value="${k}" ${this.type===k?'selected':''}>${v}</option>`).join('')}</select></label>${await this.renderCatalog(this.type,true)}`;
    if(this.step===11)return `<p>Escolha imagens que já estejam no armazenamento da sua mesa.</p><div class="sy-row"><button data-op="portrait">Escolher retrato</button><button data-op="token">Escolher token</button></div>${d.portrait?`<img class="sy-large-portrait" src="${e(safeImage(d.portrait))}" alt="Retrato escolhido">`:''}${d.token?`<img class="sy-large-portrait" src="${e(safeImage(d.token))}" alt="Token escolhido">`:''}`;
    return this.renderReview();
  }
  async prepareBenefitPlan(){this.benefitPlan=await buildLevelOnePlan(this.catalog,this.draft.selections);return this.benefitPlan;}
  async renderBenefits(){
    if(!this.selected('legacy')||!this.selected('heritage')||!this.selected('background')||!this.selected('class'))return '<p>Escolha legado, herança, antecedente e classe para montar os benefícios de nível 1.</p>';
    const plan=await this.prepareBenefitPlan();
    const fixed=plan.included.map(item=>`<li><img src="${e(safeImage(item.entry.img))}" alt=""> <span>${e(item.entry.name)}</span><button data-op="detail" data-uuid="${e(item.entry.uuid)}">Descrição</button></li>`).join('');
    const groups=plan.groups.map(group=>`<section class="sy-choice"><h3>${e(group.title)}</h3><small>${group.granting==='spell'?'Truque mágico':group.granting==='path'?'Trilha':'Escolha de talento'} · ${group.count} ${group.count===1?'opção':'opções'}</small>${Array.from({length:group.count},(_,index)=>`<label>Escolha ${index+1}<select name="benefit" data-group="${e(group.id)}" data-choice-index="${index}"><option value="">Selecione…</option>${group.options.map(option=>`<option value="${e(option.uuid)}" ${this.benefitChoices[group.id]?.[index]===option.uuid?'selected':''}>${e(option.name)}</option>`).join('')}</select></label>`).join('')}<div class="sy-row">${group.options.map(option=>`<button data-op="detail" data-uuid="${e(option.uuid)}">${e(option.name)}</button>`).join('')}</div></section>`).join('');
    const errors=validateBenefitChoices(plan,this.benefitChoices);
    return `<p>As características fixas entram automaticamente. Complete abaixo apenas as escolhas variáveis registradas pelo sistema.</p><h3>Recebidos automaticamente</h3><ul class="sy-benefit-list">${fixed||'<li>Nenhum benefício fixo registrado.</li>'}</ul>${groups||'<p>Nenhuma escolha variável registrada.</p>'}${errors.map(error=>`<p class="sy-alert">${e(error)}</p>`).join('')}`;
  }
  async cantrips(){
    if(this._cantrips)return this._cantrips;
    const result=[];for(const entry of this.catalog.list('spell')){const document=await this.catalog.document(entry.uuid);if(Array.from(document.system?.descriptors??[]).includes('cantrip'))result.push(entry);}
    this._cantrips=result;return result;
  }
  async prepareTrainingPlan(){
    this.trainingPlan=buildTrainingPlan(this.selected('class')?.name,this.selected('background')?.name,this.draft.spellcasting,this.trainingChoices,this.draft.attributes.int,await this.cantrips());
    this.trainingResolved=resolveTraining(this.trainingPlan,this.trainingChoices);return this.trainingPlan;
  }
  async renderTraining(){
    if(!this.selected('class')||!this.selected('background'))return '<p>Escolha classe e antecedente para montar as proficiências.</p>';
    const plan=await this.prepareTrainingPlan(),resolved=this.trainingResolved;
    const fixed=[...plan.fixed.proficiencies.map(value=>`Equipamento: ${value}`),...plan.fixed.skills.map(value=>`Perícia: ${value}`),...plan.fixed.protections.map(value=>`Proteção: ${value.toUpperCase()}`),...plan.fixed.languages.map(value=>`Idioma: ${value}`)];
    const groups=plan.groups.map(g=>`<fieldset class="sy-choice"><legend>${e(g.title)} · escolha ${g.count}</legend><div class="sy-check-grid">${g.options.map(option=>`<label><input type="checkbox" name="training" data-group="${e(g.id)}" data-option="${e(option.id)}" ${this.trainingChoices[g.id]?.includes(option.id)?'checked':''}>${e(option.label)}</label>`).join('')}</div></fieldset>`).join('');
    return `<p>Estas escolhas são gravadas nos campos nativos de perícias, proteções, idiomas e proficiências da ficha.</p><small>${e(fixed.join(' · '))}</small>${plan.fixed.notes.map(note=>`<p class="sy-alert">O idioma ${e(note)} aparece no antecedente, mas não existe na lista nativa do Skyfall 1.0.1; ele será preservado nas notas da criação.</p>`).join('')}${groups}${resolved.errors.map(error=>`<p class="sy-alert">${e(error)}</p>`).join('')}`;
  }
  async renderCatalog(type,extra=false){
    let list=this.catalog.list(type,this.query);
    if(type==='heritage') {
      if(!this.selected('legacy')) return '<p>Escolha primeiro um legado. As heranças serão mostradas conforme os vínculos oficiais do compêndio.</p>';
      const allowed=new Set(this.heritageOptions.map(item=>item.uuid));
      list=list.filter(item=>allowed.has(item.uuid));
    }
    const cards=list.map(i=>`<article class="sy-card"><img src="${e(safeImage(i.img))}" alt="${e(i.name)}" loading="lazy"><div><h3>${e(i.name)}</h3><small>${e(i.source)}</small><div class="sy-row"><button data-op="detail" data-uuid="${e(i.uuid)}">Descrição</button><button data-op="${extra?'extra':'select'}" data-type="${type}" data-uuid="${e(i.uuid)}" aria-pressed="${extra?this.extra.has(i.uuid):this.draft.selections[type]===i.uuid}">${extra?(this.extra.has(i.uuid)?'Remover':'Separar'):(this.draft.selections[type]===i.uuid?'✓ Escolhido':'Escolher')}</button></div></div></article>`).join('');
    let detail='';
    if(this.detail){try{const doc=await this.catalog.document(this.detail);const fragments=[doc.system.description?.value,doc.system.effect?.descriptive,doc.system.attack?.hit,doc.system.attack?.miss,doc.system.special?.descriptive].filter(Boolean);detail=`<section class="sy-detail"><div class="sy-row"><h3>${e(doc.name)}</h3><button data-op="closeDetail">Fechar descrição</button></div>${await foundry.applications.ux.TextEditor.implementation.enrichHTML(fragments.join('<hr>'),{secrets:false,relativeTo:doc})}<button data-op="openSheet" data-uuid="${e(doc.uuid)}">Abrir ficha original completa</button></section>`;}catch(err){detail=`<p class="sy-alert">${e(err.message)}</p>`;}}
    return `${type==='curse'?'<button data-op="noCurse">Sem maldição</button>':''}<label>Buscar em ${e(LABELS[type])}<input name="query" value="${e(this.query)}" placeholder="Digite e pressione Tab"></label><small>${list.length} documentos${type==='heritage'?' ligados ao legado escolhido':' · sem limite de opções'}</small>${extra?'<p>Separar um item não valida pré-requisitos nem concede o item automaticamente. A integração dos benefícios está em conferência.</p>':''}${detail}<div class="sy-grid">${cards||'<p>Nenhum documento encontrado. Confira os compêndios e suas permissões.</p>'}</div>`;
  }
  renderAttributes(){
    const d=this.draft,keys=Object.keys(ABILITIES),base=[3,2,1,1,0,-1];
    let fields=keys.map((key,i)=>`<label>${ABILITIES[key]}${d.method==='fixed'?`<select name="slot-${i}">${base.map((v,j)=>`<option value="${j}" ${d.slots[i]===j?'selected':''}>${v>=0?'+':''}${v}${j===2?' (A)':j===3?' (B)':''}</option>`).join('')}</select>`:d.method==='conventional'?`<select name="rollslot-${i}">${this.rolls.map((r,j)=>`<option value="${j}" ${this.rollSlots[i]===j?'selected':''}>Rolagem ${j+1}: ${r.value}</option>`).join('')}</select>`:`<input name="attr-${key}" type="number" min="-4" max="4" value="${d.attributes[key]}" ${d.method==='ordered'?'disabled':''}>`}</label>`).join('');
    return `<label>Método<select name="method">${[['fixed','Valores fixos'],['conventional','Rolagem convencional'],['ordered','Rolagem em ordem'],['manual','Digitar modificadores acordados com o mestre']].map(([v,l])=>`<option value="${v}" ${d.method===v?'selected':''}>${l}</option>`).join('')}</select></label><div class="sy-attributes">${fields}</div>${d.method==='fixed'?`<label>Atributo que recebe +1<select name="boost">${keys.map((k,i)=>`<option value="${i}" ${d.boost===i?'selected':''}>${ABILITIES[k]}</option>`).join('')}</select></label>`:''}${['conventional','ordered'].includes(d.method)?`<div class="sy-row"><button data-op="rollAttributes">Rolar seis conjuntos de 4d6</button><button data-op="rerollLowest" ${!this.rolls.length||!this.attrErrors().length?'disabled':''}>Rerrolar o menor</button></div><ol>${this.rolls.map(r=>`<li>${r.dice.join(' + ')} · descarta ${r.discarded} → ${r.total} → ${r.value}</li>`).join('')}</ol>`:''}${d.method==='ordered'&&this.rolls.length?`<div class="sy-row">${[0,1].map(i=>`<label>Trocar atributo ${i+1}<select name="swap-${i}">${keys.map((k,j)=>`<option value="${j}" ${this.swap[i]===j?'selected':''}>${ABILITIES[k]}</option>`).join('')}</select></label>`).join('')}<button data-op="swap">Aplicar uma troca</button></div>`:''}<p>Resultado: ${keys.map(k=>`${ABILITIES[k]} ${d.attributes[k]}`).join(' · ')}</p>${this.attrErrors().map(t=>`<p class="sy-alert">${e(t)}</p>`).join('')}<small>Livro Básico pp. 153–154. Vida inicial: máximo do dado da classe + CON, sem rolagem.</small>`;
  }
  renderMoney(){
    const rules={class:classRules(this.selected('class')?.name)?.money,background:backgroundRules(this.selected('background')?.name)};
    if(!rules.class||!rules.background)return '<p>Escolha classe e antecedente com regras de dinheiro conhecidas.</p>';
    return Object.entries(rules).map(([key,r])=>`<section><h3>${key==='class'?'Classe':'Antecedente'} · ${r.dice}d${r.sides??6}${r.bonus?` + ${r.bonus}`:''}</h3><label>Soma dos dados, sem o bônus<input name="money-${key}" type="number" min="${r.dice}" max="${r.dice*(r.sides??6)}" value="${this.sums[key]??''}"></label><button data-op="rollMoney" data-kind="${key}">Rolar ${r.dice}d${r.sides??6}</button>${r.budgetOnly?'<p>Esta quantia é verba para equipamentos de exploração, não dinheiro livre.</p>':''}${r.debt?'<p>A dívida equivale a dez vezes o valor recebido pelo antecedente.</p>':''}</section>`).join('')+'<p>1 Pilar = 10 Trocados · 1 K = 1.000 Trocados.</p><small>Campos aceitam resultados de dados físicos. O bônus é somado uma única vez.</small>';
  }
  errors(){const errors=[];if(!this.draft.name.trim())errors.push('Nome não informado.');for(const t of ['legacy','heritage','background','class'])if(!this.selected(t))errors.push(`${LABELS[t]}: escolha pendente.`);if(this.benefitPlan){if(!this.benefitPlan.included.some(item=>item.entry.uuid===this.draft.selections.heritage))errors.push('A herança escolhida não pertence ao legado selecionado.');errors.push(...validateBenefitChoices(this.benefitPlan,this.benefitChoices));}else errors.push('Benefícios de nível 1 ainda não foram conferidos.');if(this.trainingResolved){errors.push(...this.trainingResolved.errors);const benefitUuids=new Set(Object.values(this.benefitChoices).flat());if(this.trainingResolved.spells.some(uuid=>benefitUuids.has(uuid)))errors.push('O bônus de INT não pode repetir um truque já escolhido como benefício de classe.');}else errors.push('Treinamento de classe e antecedente ainda não foi conferido.');errors.push(...this.attrErrors());if(!this.money())errors.push('Dinheiro inicial ainda não foi determinado.');if(!this.draft.portrait)errors.push('Retrato não selecionado.');return errors;}
  async renderReview(){
    if(this.selected('legacy')&&this.selected('heritage')&&this.selected('background')&&this.selected('class')){await this.prepareBenefitPlan();await this.prepareTrainingPlan();}
    const errors=this.errors();
    return `<p class="sy-alert">Versão de desenvolvimento: benefícios de nível 1 já são resolvidos pelo módulo. Proficiências e equipamentos iniciais ainda estão em auditoria antes da liberação aos jogadores.</p>${errors.map(t=>`<p>${e(t)}</p>`).join('')}${!this.actor?`<button class="sy-primary" data-op="createCharacter" ${errors.length?'disabled':''}>Criar ficha de nível 1 na mesa</button>`:`<button data-op="openActor">Abrir ficha criada</button><p>Legado, herança, antecedente, classe, características fixas e escolhas variáveis foram copiados dos compêndios com seus efeitos e imagens.</p>`}`;
  }
  async handleClick(event){
    const button=event.target.closest('button[data-op]');if(!button||button.disabled||this.busy)return;
    this.busy=true;button.disabled=true;this.message='';
    try{const {op,uuid,type,kind}=button.dataset;
      if(op==='step'||op==='previous'||op==='next'){this.step=op==='step'?Number(button.dataset.index):this.step+(op==='next'?1:-1);this.query='';this.detail=null;}
      if(op==='select'){this.draft.selections[type]=uuid;this.benefitPlan=null;this.benefitChoices={};this.trainingPlan=null;this.trainingChoices={};if(type==='class'||type==='background')this.sums[type]=null;if(type==='legacy'){delete this.draft.selections.heritage;this.heritageOptions=await this.catalog.linkedItems(uuid,{type:'heritage',level:0});}this.detail=uuid;}
      if(op==='noCurse'){delete this.draft.selections.curse;this.detail=null;}
      if(op==='extra'){if(this.extra.has(uuid))this.extra.delete(uuid);else this.extra.add(uuid);}
      if(op==='detail')this.detail=uuid;
      if(op==='closeDetail')this.detail=null;
      if(op==='openSheet')(await this.catalog.document(uuid)).sheet.render(true);
      if(op==='audit'){const report={...this.catalog.report(),benefitGraph:await this.catalog.auditBenefits()};saveDataToFile(JSON.stringify(report,null,2),'application/json','skyfall-auditoria-catalogo.json');this.message=`Auditoria exportada: ${report.missing.length} nomes do livro não localizados; ${report.benefitGraph.missing.length} vínculos quebrados; ${report.benefitGraph.unlinkedHeritages.length} heranças sem legado vinculado.`;}
      if(op==='rollAttributes'||op==='rerollLowest'){const rollOne=async()=>{const roll=await new Roll('4d6').evaluate();await roll.toMessage({flavor:'Criação de atributos — descarte o menor d6'},{rollMode:game.settings.get('core','rollMode')});return conventionalRoll(roll.dice[0].results.map(d=>d.result));};if(op==='rollAttributes'){this.rolls=[];for(let i=0;i<6;i++)this.rolls.push(await rollOne());this.rollSlots=[0,1,2,3,4,5];}else{const i=this.rolls.findIndex(r=>r.total===Math.min(...this.rolls.map(r=>r.total)));this.rolls[i]=await rollOne();}this.applyRolled();}
      if(op==='swap'){const order=[0,1,2,3,4,5];[order[this.swap[0]],order[this.swap[1]]]=[order[this.swap[1]],order[this.swap[0]]];this.rollSlots=order;this.applyRolled();}
      if(op==='rollMoney'){const rule=kind==='class'?classRules(this.selected('class')?.name).money:backgroundRules(this.selected('background')?.name);const roll=await new Roll(`${rule.dice}d${rule.sides??6}`).evaluate();await roll.toMessage({flavor:'Dinheiro inicial — soma dos dados, antes do bônus'},{rollMode:game.settings.get('core','rollMode')});this.sums[kind]=roll.total;}
      if(op==='portrait'||op==='token'){const FP=foundry.applications.apps.FilePicker.implementation;new FP({type:'image',current:this.draft[op],callback:path=>{this.draft[op]=path;this.render(true);}}).render(true);}
      if(op==='createCharacter'){if(this.actor)throw Error('A ficha já foi criada.');await this.prepareBenefitPlan();await this.prepareTrainingPlan();const errors=this.errors();if(errors.length)throw Error(errors.join(' '));const money=this.money();this.actor=await createDraft({...this.draft,...money});const planItems=resolvedPlanItems(this.benefitPlan,this.benefitChoices);for(const spell of this.trainingResolved.spells){const entry=this.catalog.items.find(item=>item.uuid===spell);if(entry)planItems.push({entry,originId:'yuri-intelligence'});}await addResolvedPlan(this.actor,planItems,this.catalog);await this.actor.update({...actorTrainingUpdate(this.trainingResolved),[`flags.${MODULE_ID}.trainingNotes`]:this.trainingResolved.notes});await refillResources(this.actor);this.message='Ficha criada com benefícios, treinamento e recursos de nível 1.';}
      if(op==='openActor')this.actor.sheet.render(true);
      if(op==='refill'){await refillResources(this.actor);this.message='Recursos preenchidos com os totais calculados pelo Skyfall.';}
    }catch(err){this.message=err.message;console.error(MODULE_ID,err);}finally{this.busy=false;this.render(true);}
  }
  applyRolled(){if(this.rolls.length!==6)return;Object.keys(ABILITIES).forEach((k,i)=>{this.draft.attributes[k]=this.rolls[this.rollSlots[i]].value;});}
  applyFixed(){const base=[3,2,1,1,0,-1];Object.keys(ABILITIES).forEach((k,i)=>{this.draft.attributes[k]=base[this.draft.slots[i]]+(i===this.draft.boost?1:0);});}
  async handleChange(event){
    const {name,value}=event.target;if(!name)return;
    if(['name','biography','spellcasting'].includes(name))this.draft[name]=value;
    if(name==='method'){this.draft.method=value;if(value==='fixed')this.applyFixed();if(['ordered','conventional'].includes(value)){this.rollSlots=[0,1,2,3,4,5];this.applyRolled();}}
    if(name.startsWith('slot-')){this.draft.slots[Number(name.slice(5))]=Number(value);this.applyFixed();}
    if(name==='boost'){this.draft.boost=Number(value);this.applyFixed();}
    if(name.startsWith('attr-'))this.draft.attributes[name.slice(5)]=value===''?null:Number(value);
    if(name.startsWith('rollslot-')){const i=Number(name.slice(9)),j=this.rollSlots.indexOf(Number(value));[this.rollSlots[i],this.rollSlots[j]]=[this.rollSlots[j],this.rollSlots[i]];this.applyRolled();}
    if(name.startsWith('swap-'))this.swap[Number(name.slice(5))]=Number(value);
    if(name.startsWith('money-'))this.sums[name.slice(6)]=value===''?null:Number(value);
    if(name==='query')this.query=value;
    if(name==='catalogType'){this.type=value;this.query='';this.detail=null;}
    if(name==='benefit'){const group=event.target.dataset.group,index=Number(event.target.dataset.choiceIndex);const selected=[...(this.benefitChoices[group]??[])];selected[index]=value;this.benefitChoices[group]=selected;}
    if(name==='training'){const group=event.target.dataset.group,option=event.target.dataset.option,definition=this.trainingPlan?.groups.find(item=>item.id===group);let selected=[...(this.trainingChoices[group]??[])].filter(value=>value!==option);if(event.target.checked){if(definition?.count===1)selected=[];selected.push(option);}this.trainingChoices[group]=selected;}
    this.render(true);
  }
}
