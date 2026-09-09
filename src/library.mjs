import {REGIONS,PLACES,BEYOND} from './book-world.mjs';
import {BASE_ITEMS,MODIFICATION_GUIDES,SIGIL_COSTS,IMBUE_COSTS} from './book-items.mjs';
import {SIGILS} from './book-sigils.mjs';
import {MONSTERS} from './book-monsters.mjs';
import {MODULE_ID} from './adapter.mjs';

export const BOOK_ITEMS=[...BASE_ITEMS,...SIGILS];

// Conteúdo que o mestre libera para os jogadores. Guardado no mundo, sem UUIDs privados.
export const SHARED_KEY='sharedContent';
export const emptyShare=()=>({areas:[],map:[],monsters:[],items:[]});
export function registerSharedContent(game,onChange){
  game.settings.register(MODULE_ID,SHARED_KEY,{scope:'world',config:false,type:Object,default:emptyShare(),onChange});
}
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const nameKey=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+]+/g,' ').trim().replace(/\s+/g,' ');
const page=entry=>`Livro Básico 1.25 · p. ${entry.page}`;
const currency=value=>`T$ ${Number(value).toLocaleString('pt-BR')}`;
const button=(op,id,label)=>`<button data-op="lib-${op}" data-id="${e(id)}">${e(label)}</button>`;
const chips=values=>`<div class="sy-library-chips">${values.filter(v=>v!==null&&v!==undefined&&v!=='').map(v=>`<span>${e(v)}</span>`).join('')}</div>`;
const typesFor=entry=>entry.category==='Sigilos'?['sigil']:entry.category?.startsWith('Armas')?['weapon']:entry.category==='Armaduras e escudos'?['armor','weapon']:entry.category==='Vestimentas'?['clothing']:entry.category==='Consumíveis'?['consumable']:['weapon','armor','clothing','equipment','consumable','loot','seal'];

/** Exact normalized names and explicit aliases only; a match is not a mechanical audit. */
export function findMatches(entry,documents,types){
  const names=new Set([entry.name,...(entry.aliases??[])].map(nameKey));
  return documents.filter(doc=>(!types||types.includes(doc.type))&&names.has(nameKey(doc.name)));
}
export function monsterAudit(documents,failures=[],loaded=true){
  return MONSTERS.map(entry=>{
    const matches=findMatches(entry,documents,['npc']);
    const candidates=findMatches(entry,documents).filter(doc=>doc.type!=='npc');
    return {...entry,matches,candidates,status:matches.length?'found':!loaded||failures.length?'unverified':'missing'};
  });
}

export class CampaignLibrary {
  constructor(game,catalog){this.game=game;this.catalog=catalog;this.actors=[];this.failures=[];this.loaded=false;this.state={mapView:'regions',region:null,place:null};}
  assertGM(){if(!this.game.user?.isGM)throw Error('Esta área está disponível somente para o mestre.');}
  get shared(){try{return {...emptyShare(),...(this.game.settings?.get(MODULE_ID,SHARED_KEY)||{})};}catch{return emptyShare();}}
  async setShare(bucket,value){
    this.assertGM();
    if(!['areas','map','monsters','items'].includes(bucket)||!value)return;
    const current={...emptyShare(),...(this.game.settings.get(MODULE_ID,SHARED_KEY)||{})};
    const list=Array.isArray(current[bucket])?[...current[bucket]]:[];
    const i=list.indexOf(value);if(i>=0)list.splice(i,1);else list.push(value);
    current[bucket]=list;
    // Liberar um item de uma aba implica liberar a aba.
    if(bucket!=='areas'&&list.length&&!current.areas.includes(bucket))current.areas=[...current.areas,bucket];
    await this.game.settings.set(MODULE_ID,SHARED_KEY,current);
  }
  sharedPlaceIds(){const s=this.shared.map;const ids=new Set(s);for(const r of REGIONS)if(s.includes(r.id))for(const p of PLACES)if(p.regionId===r.id)ids.add(p.id);return ids;}
  shareButton(bucket,value,labelOn,labelOff){const on=this.shared[bucket]?.includes(value);return `<button class="sy-share-toggle ${on?'is-on':''}" data-op="lib-share" data-id="${e(bucket)}:${e(value)}">${on?labelOn:labelOff}</button>`;}
  async loadActors(force=false){
    this.assertGM();if(this.loaded&&!force)return;
    this.actors=[];this.failures=[];
    for(const actor of this.game.actors??[]){if(actor.visible!==false)this.actors.push({name:actor.name,type:actor.type,uuid:actor.uuid??`Actor.${actor.id}`,source:'Mundo'});}
    for(const pack of this.game.packs??[]){
      if(pack.documentName!=='Actor'||(pack.metadata?.system&&pack.metadata.system!=='skyfall'))continue;
      if(pack.visible===false){this.failures.push({pack:pack.collection,reason:'Sem permissão de leitura'});continue;}
      try{const index=await pack.getIndex({fields:['name','type']});for(const item of index)this.actors.push({name:item.name,type:item.type,uuid:item.uuid??`Compendium.${pack.collection}.Actor.${item._id}`,source:pack.metadata?.label??pack.collection});}
      catch(error){this.failures.push({pack:pack.collection,reason:error.message});}
    }
    this.loaded=true;
  }
  report(){this.assertGM();const audit=monsterAudit(this.actors,this.failures,this.loaded);return {book:'Skyfall RPG — Livro Básico DIGITAL 1.25',world:this.game.world?.id,system:this.game.system?.version,checkedAt:new Date().toISOString(),note:'Correspondência por nome e tipo npc. Valores da ficha ainda não revisados. Nenhuma ficha criada.',failures:this.failures,found:audit.filter(i=>i.status==='found'),missing:audit.filter(i=>i.status==='missing'),unverified:audit.filter(i=>i.status==='unverified')};}
  async open(uuid){
    this.assertGM();
    const actor=this.actors.find(item=>item.uuid===uuid);
    const item=this.catalog.items.find(item=>item.uuid===uuid);
    if(!actor&&!item)throw Error('Documento fora do índice acessível.');
    const document=actor?await fromUuid(uuid):await this.catalog.document(uuid);
    if(!document||document.visible===false)throw Error('Documento indisponível.');
    document.sheet.render(true);
  }
  async action(op,id){
    const navOps=['lib-map','lib-region','lib-place'];
    if(!navOps.includes(op))this.assertGM();
    if(op==='lib-map'){this.state={mapView:id,region:null,place:null};}
    if(op==='lib-region'){if(!REGIONS.some(i=>i.id===id))return;this.state={mapView:'regions',region:id,place:null};}
    if(op==='lib-place'){const place=[...PLACES,...BEYOND].find(i=>i.id===id);if(!place)return;this.state={mapView:place.regionId?'regions':'beyond',region:place.regionId??null,place:id};}
    if(op==='lib-open')await this.open(id);
    if(op==='lib-refresh')await this.loadActors(true);
    if(op==='lib-report')saveDataToFile(JSON.stringify(this.report(),null,2),'application/json','quedaco-monstros-pendentes.json');
    if(op==='lib-share'){const idx=String(id).indexOf(':');await this.setShare(String(id).slice(0,idx),String(id).slice(idx+1));}
  }
  render(area,readonly=false){
    if(!readonly)this.assertGM();
    else if(!this.shared.areas.includes(area))return `<main class="sy-library"><small>CONSULTA DA CAMPANHA</small><h2>${area}</h2><p class="sy-library-deferred">O mestre ainda não liberou este conteúdo.</p></main>`;
    const titles={map:'Mapa',monsters:'Monstros',items:'Itens'};
    return `<main class="sy-library"><small>${readonly?'LIBERADO PELO MESTRE':'CONSULTA DA CAMPANHA'}</small><h2>${titles[area]}</h2>${area==='map'?this.renderMap(readonly):area==='monsters'?this.renderMonsters(readonly):this.renderItems(readonly)}</main>`;
  }
  card(entry,op,share=null){return `<article class="sy-library-card" data-search="${e(nameKey([entry.name,entry.kind,entry.summary,...(entry.highlights??[])].join(' ')))}" data-category="${e(entry.regionId??'')}"><small>${e(entry.kind??'Região')} · p. ${entry.page}</small><h3>${e(entry.name)}</h3><p>${e(entry.summary)}</p>${button(op,entry.id,op==='region'?'Explorar região':'Abrir local')}${share?this.shareButton(share,entry.id,'✓ Liberado','Liberar'):''}</article>`;}
  renderMap(readonly=false){
    const {mapView,region:regionId,place:placeId}=this.state;
    const region=REGIONS.find(i=>i.id===regionId),place=[...PLACES,...BEYOND].find(i=>i.id===placeId);
    if(readonly){
      const sharedRegions=this.shared.map,placeIds=this.sharedPlaceIds();
      const visibleRegions=REGIONS.filter(r=>sharedRegions.includes(r.id));
      const loosePlaces=[...PLACES,...BEYOND].filter(p=>placeIds.has(p.id)&&(!p.regionId||!sharedRegions.includes(p.regionId))&&!p.parentId);
      if(place&&placeIds.has(place.id)){
        const parent=[...PLACES,...BEYOND].find(i=>i.id===place.parentId&&placeIds.has(i.id));
        return `<div class="sy-library-breadcrumb">${button('map','regions','← Voltar')}${region&&sharedRegions.includes(region.id)?button('region',region.id,region.name):''}${parent?button('place',parent.id,parent.name):''}</div>${this.placeDetail(place)}<div class="sy-library-grid">${[...PLACES,...BEYOND].filter(i=>i.parentId===place.id&&placeIds.has(i.id)).map(i=>this.card(i,'place')).join('')}</div>`;
      }
      if(region&&sharedRegions.includes(region.id)){
        const capital=PLACES.find(i=>i.id===region.capital);
        return `${visibleRegions.length+loosePlaces.length>1?button('map','regions','← Tudo que foi liberado'):''}<section class="sy-library-detail"><small>${page(region)}</small><h3>${e(region.name)}</h3><p>${e(region.summary)}</p><h4>Governo</h4><p>${e(region.government)}</p><h4>Comércio</h4><p>${e(region.trade)}</p><h4>Destaques</h4>${chips(region.highlights)}${capital?button('place',capital.id,`Ir à capital: ${capital.name}`):''}</section><h3>Cidades e locais</h3><div class="sy-library-grid">${PLACES.filter(i=>i.regionId===region.id).map(i=>this.card(i,'place')).join('')}</div>`;
      }
      const cards=[...visibleRegions.map(i=>this.card(i,'region')),...loosePlaces.map(i=>this.card(i,'place'))].join('');
      return `<div class="sy-library-grid">${cards||'<p class="sy-library-deferred">O mestre ainda não liberou nenhuma região.</p>'}</div>`;
    }
    const tabs=[['regions','Regiões'],['places','Cidades e locais'],['beyond','Além de Opath'],['scenes','Mapas e cenas'],['encounters','Encontros da região']];
    const shareArea=this.shareButton('areas','map','✓ Aba Mapa visível aos jogadores','Liberar a aba Mapa aos jogadores');
    let body='';
    if(place){
      const parent=[...PLACES,...BEYOND].find(i=>i.id===place.parentId);
      body=`<div class="sy-library-breadcrumb">${button('map',mapView,'← Voltar ao índice')}${region?button('region',region.id,region.name):''}${parent?button('place',parent.id,parent.name):''}</div>${this.placeDetail(place)}<div class="sy-library-share-row">${this.shareButton('map',place.id,'✓ Local liberado aos jogadores','Liberar este local aos jogadores')}</div><div class="sy-library-grid">${[...PLACES,...BEYOND].filter(i=>i.parentId===place.id).map(i=>this.card(i,'place','map')).join('')}</div>`;
    }else if(region){
      const capital=PLACES.find(i=>i.id===region.capital);
      body=`${button('map','regions','← Todas as regiões')}<section class="sy-library-detail"><small>${page(region)}</small><h3>${e(region.name)}</h3><p>${e(region.summary)}</p><h4>Governo</h4><p>${e(region.government)}</p><h4>Comércio</h4><p>${e(region.trade)}</p><h4>Destaques</h4>${chips(region.highlights)}${capital?button('place',capital.id,`Ir à capital: ${capital.name}`):''}<div class="sy-library-share-row">${this.shareButton('map',region.id,'✓ Região liberada aos jogadores (com suas cidades)','Liberar região aos jogadores (com suas cidades)')}</div></section><h3>Cidades e locais da região</h3><div class="sy-library-grid">${PLACES.filter(i=>i.regionId===region.id).map(i=>this.card(i,'place','map')).join('')}</div><section class="sy-library-deferred"><h4>Mapas, cenas e encontros</h4><p>Reservados para seleção manual do mestre.</p></section>`;
    }else if(mapView==='scenes'||mapView==='encounters')body='<p class="sy-library-deferred">Aguardando a seleção manual do mestre.</p>';
    else{const entries=mapView==='places'?PLACES:mapView==='beyond'?BEYOND:REGIONS;body=`${this.filters(mapView==='places'?REGIONS.map(i=>[i.id,i.name]):[],`Buscar ${mapView==='regions'?'região':'local'}`)}<div class="sy-library-grid">${entries.map(i=>this.card(i,mapView==='regions'?'region':'place',mapView==='beyond'?null:'map')).join('')}</div>`;}
    return `<div class="sy-library-share-row">${shareArea}</div><nav class="sy-library-tabs" aria-label="Mapa">${tabs.map(([id,label])=>`<button data-op="lib-map" data-id="${id}" aria-current="${mapView===id?'page':'false'}">${label}</button>`).join('')}</nav>${body}`;
  }
  placeDetail(place){return `<section class="sy-library-detail"><small>${page(place)} · ${e(place.kind??'Local')}</small><h3>${e(place.name)}</h3><p>${e(place.summary)}</p>${place.highlights?.length?`<h4>Destaques</h4>${chips(place.highlights)}`:''}</section>`;}
  filters(categories,label='Buscar por nome ou descrição',groups=null){
    const opts=groups?groups.filter(g=>g.items.length).map(g=>`<optgroup label="${e(g.label)}">${g.items.map(([id,name])=>`<option value="${e(id)}">${e(name)}</option>`).join('')}</optgroup>`).join(''):categories.map(([id,name])=>`<option value="${e(id)}">${e(name)}</option>`).join('');
    const hasSelect=groups?groups.some(g=>g.items.length):categories.length;
    return `<div class="sy-library-filters"><label>${label}<input name="libraryQuery" type="search" autocomplete="off"></label>${hasSelect?`<label>${groups?'Filtro':'Categoria'}<select name="libraryCategory"><option value="">${groups?'Todos':'Todas'}</option>${opts}</select></label>`:''}<small class="sy-library-count" role="status"></small></div><p class="sy-library-no-results" hidden>Nenhuma entrada corresponde aos filtros.</p>`;
  }
  filter(root){
    const query=nameKey(root.querySelector('[name="libraryQuery"]')?.value),category=root.querySelector('[name="libraryCategory"]')?.value??'';
    let count=0;for(const card of root.querySelectorAll('[data-search]')){card.hidden=!(card.dataset.search.includes(query)&&(!category||(card.dataset.category??'').split('|').includes(category)));if(!card.hidden)count++;}
    const label=root.querySelector('.sy-library-count');if(label)label.textContent=`${count} entradas`;
    const empty=root.querySelector('.sy-library-no-results');if(empty)empty.hidden=count!==0;
  }
  links(matches){return matches.length?`<div class="sy-library-links">${matches.map(m=>button('open',m.uuid,`Abrir no Foundry · ${m.source}`)).join('')}</div>`:'<small>Sem correspondência exata no catálogo acessível.</small>';}
  renderMonsters(readonly=false){
    const roleList=entry=>(entry.role.split('·')[1]??'').split(',').map(s=>s.trim()).filter(Boolean);
    const tierOf=entry=>entry.role.split('·')[0].trim();
    const ndBand=nd=>nd<=4?'ND 1–4':nd<=8?'ND 5–8':nd<=12?'ND 9–12':'ND 13+';
    if(readonly){
      const shared=this.shared.monsters,list=MONSTERS.filter(m=>shared.includes(m.id));
      return `${this.filters([],'Buscar ameaça liberada')}<div class="sy-library-grid">${list.map(entry=>`<details class="sy-library-card" data-search="${e(nameKey(`${entry.name} ${entry.creatureType} ${entry.role} ${entry.summary}`))}" data-category=""><summary><span><small>ND ${entry.nd} · ${e(entry.creatureType)}</small><strong>${e(entry.name)}</strong></span><span class="sy-library-question" aria-hidden="true">?</span></summary><p>${e(entry.summary)}</p>${chips([tierOf(entry),...roleList(entry),ndBand(entry.nd),page(entry)])}</details>`).join('')||'<p class="sy-library-deferred">O mestre ainda não liberou nenhuma ameaça.</p>'}</div>`;
    }
    const report=this.report(),audit=monsterAudit(this.actors,this.failures,this.loaded);
    const types=[...new Set(MONSTERS.map(m=>m.creatureType))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const roles=[...new Set(MONSTERS.flatMap(roleList))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const tiers=[...new Set(MONSTERS.map(tierOf))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const filterGroups=[
      {label:'Tipo de criatura',items:types.map(t=>[t,t])},
      {label:'Papel',items:roles.map(r=>[r,r])},
      {label:'Porte do bloco',items:tiers.map(t=>[t,t])},
      {label:'Nível de Desafio',items:['ND 1–4','ND 5–8','ND 9–12','ND 13+'].map(b=>[b,b])},
      {label:'Conferência na mesa',items:[['missing','Ficha pendente'],['found','Encontrados'],['unverified','A conferir']]}
    ];
    return `<p>${MONSTERS.length} blocos do livro. Encontrados por nome e tipo: <strong>${report.found.length}</strong>. Fichas pendentes: <strong>${report.missing.length}</strong>. Sem verificação completa: <strong>${report.unverified.length}</strong>.</p><p class="sy-note">Encontrar o nome não confirma os valores da ficha. As fichas pendentes aguardam sua revisão antes de serem criadas. Os filtros usam as classificações do livro: tipo de criatura, papel, porte (Simples/Complexo/Chefão) e Nível de Desafio.</p><div class="sy-library-share-row">${this.shareButton('areas','monsters','✓ Aba Monstros visível aos jogadores','Liberar a aba Monstros aos jogadores')}</div><div class="sy-library-tabs">${button('refresh','','Conferir Foundry novamente')}${button('report','','Exportar conferência')}</div>${this.failures.length?`<p class="sy-alert">${this.failures.length} compêndio(s) não puderam ser consultados; ausências ainda não confirmadas.</p>`:''}${this.filters([],'Buscar monstro por nome, tipo ou papel',filterGroups)}<div class="sy-library-grid">${audit.map(entry=>`<details class="sy-library-card" data-search="${e(nameKey(`${entry.name} ${entry.creatureType} ${entry.role} ND ${entry.nd} ${entry.summary}`))}" data-category="${e([entry.creatureType,...roleList(entry),tierOf(entry),ndBand(entry.nd),entry.status].join('|'))}"><summary><span><small>ND ${entry.nd} · ${e(entry.creatureType)}</small><strong>${e(entry.name)}</strong></span><span class="sy-library-status ${entry.status==='found'?'sy-library-found':''}" title="${entry.status==='found'?'Correspondência por nome e tipo':'Aguardando revisão'}">${entry.status==='found'?'✓ Encontrado':entry.status==='missing'?'Ficha pendente':'A conferir'}</span></summary><p>${e(entry.summary)}</p>${chips([tierOf(entry),...roleList(entry),ndBand(entry.nd),page(entry)])}<div class="sy-library-share-row">${this.shareButton('monsters',entry.id,'✓ Liberado aos jogadores','Liberar aos jogadores')}</div>${this.links(entry.matches)}${entry.candidates.length?'<p class="sy-note">Há documento com esse nome, mas de outro tipo de ficha. Não contado como ameaça.</p>':''}</details>`).join('')}</div>`;
  }
  itemCard(entry,readonly){
    const tags=[entry.category,entry.equipment,entry.grade?`${entry.grade}º grau`:null,entry.price!=null?currency(entry.price):null,entry.priceKind,entry.priceFormula,entry.rarity,entry.setting,entry.volume!=null?`${entry.volume} vol.`:null,entry.damage?`Dano ${entry.damage}`:null,entry.reduction?`RD ${entry.reduction}`:null,entry.range?`Alcance ${entry.range} m`:null,entry.slot,entry.charges?`${entry.charges} cargas`:null,entry.fragments?`${entry.fragments} fragmentos`:null,entry.imbued];
    const matches=readonly?[]:findMatches(entry,this.catalog.items,typesFor(entry));
    return `<details class="sy-library-card" data-search="${e(nameKey(`${entry.name} ${entry.category} ${entry.equipment??''} ${entry.summary} ${(entry.aliases??[]).join(' ')}`))}" data-category="${e(entry.category)}"><summary><span><small>${e(entry.category)}${entry.equipment?` · ${e(entry.equipment)}`:''}</small><strong>${e(entry.name)}</strong></span><span class="sy-library-question" title="Abrir consulta" aria-hidden="true">?</span></summary><div class="sy-library-body">${chips(tags)}<p>${e(entry.summary)}</p>${entry.descriptors?`<p><b>Descritores:</b> ${e(Array.isArray(entry.descriptors)?entry.descriptors.join(', '):entry.descriptors)}</p>`:''}${entry.note?`<p class="sy-alert">${e(entry.note)}</p>`:''}<small>${page(entry)}</small>${entry.referenceOnly?'<p class="sy-note">Entrada de referência; não é uma compra automática.</p>':''}${readonly?'':`<div class="sy-library-share-row">${this.shareButton('items',entry.id,'✓ Liberado aos jogadores','Liberar aos jogadores')}</div>${this.links(matches)}`}</div></details>`;
  }
  renderItems(readonly=false){
    if(readonly){
      const shared=this.shared.items,list=BOOK_ITEMS.filter(i=>shared.includes(i.id));
      return `${this.modifications()}${this.filters([],'Buscar item liberado')}<div class="sy-library-grid">${list.map(entry=>this.itemCard(entry,true)).join('')||'<p class="sy-library-deferred">O mestre ainda não liberou nenhum item.</p>'}</div>`;
    }
    const categories=[...new Set(BOOK_ITEMS.map(i=>i.category))];
    return `<p>Equipamentos, serviços e modificações do livro, com preços, volume e referências. Abra um cartão para consultar; vínculos abrem documentos existentes da mesa.</p><div class="sy-library-share-row">${this.shareButton('areas','items','✓ Aba Itens visível aos jogadores','Liberar a aba Itens aos jogadores')}</div>${this.modifications()}${this.filters(categories.map(c=>[c,c]))}<div class="sy-library-grid">${BOOK_ITEMS.map(entry=>this.itemCard(entry,false)).join('')}</div>`;
  }
  modifications(){return `<details class="sy-library-guide"><summary>Como consultar itens modificados</summary><p>Materiais, sigilos, sinapses e artefatos estão nas categorias abaixo. Esta consulta não aplica modificações à ficha.</p>${MODIFICATION_GUIDES.map(i=>`<h4>${e(i.name)} <small>p. ${i.page}</small></h4><p>${e(i.summary)}</p>`).join('')}<h4>Preço de aplicação de sigilos · p. 243</h4><table><thead><tr><th>Sigilo no item</th>${[1,2,3,4].map(n=>`<th>${n}º grau</th>`).join('')}</tr></thead><tbody>${SIGIL_COSTS.map((row,i)=>`<tr><th>${i+1}º sigilo</th>${row.map(v=>`<td>${currency(v)}</td>`).join('')}</tr>`).join('')}<tr><th>Imbuir</th>${IMBUE_COSTS.map(v=>`<td>${v==null?'A conferir*':currency(v)}</td>`).join('')}</tr></tbody></table><p class="sy-note">* O custo de 4º grau está impresso como “T$ 1.2000”. Mantido sem interpretação até esclarecimento. Divergências específicas aparecem nos cartões.</p></details>`;}
}
