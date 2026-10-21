import {escapeHTML as e} from '../adapter.mjs';
import {npcFlag,NPC_ROLES} from '../npcs.mjs';
import {npcModelActor,npcTemplateCreator} from '../npc-models.mjs';

const pill=value=>`<span class="sy-ambient-pill">${e(value)}</span>`;
const list=values=>`<ul>${values.map(value=>`<li>${e(value)}</li>`).join('')}</ul>`;
const ORG_ICONS=Object.freeze({
  dips:'fa-door-open',copa:'fa-compass','senado-alberich':'fa-landmark',uao:'fa-graduation-cap',sap:'fa-scroll',
  'academia-magica-forah':'fa-hat-wizard','frota-rompante':'fa-ship','cortes-das-estacoes':'fa-leaf',
  'conclave-fadas-risonhas':'fa-wand-sparkles','irmandade-esquilos-voadores':'fa-feather-pointed',
  'ordem-cavaleiros-topteros':'fa-shield-halved','irmandade-primeiros-saltadores':'fa-person-running',
  'guarda-jade':'fa-shield','armada-sulfurica':'fa-anchor','circulo-calcifero':'fa-gem','coros-lapis':'fa-music',
  'culto-quimerizadores':'fa-flask','escola-oratoria-democratica':'fa-microphone','grandes-familias-sodori':'fa-people-roof',
  'conselho-dez':'fa-scale-balanced','siva':'fa-store'
});

function profileDetails(profile){
  if(!profile)return '';
  return `<details class="sy-library-guide"><summary>Uniformes, equipamento e comportamento · campanha</summary><p>${e(profile.identity)}</p><h4>Vestuário</h4>${Object.entries({everyday:'Cotidiano',field:'Em campo',formal:'Cerimonial',adaptations:'Adaptações aos legados'}).map(([key,label])=>`<p><strong>${label}:</strong> ${e(profile.uniform?.[key])}</p>`).join('')}<h4>Conduta</h4>${list(profile.conduct??[])}<h4>Equipamento por função</h4>${(profile.equipment??[]).map(kit=>`<p><strong>${e(kit.purpose)}:</strong> ${e(kit.items.join(', '))}. ${e(kit.notes)}</p>`).join('')}<h4>Cargos e experiência</h4>${list(profile.ranks??[])}<h4>Recursos</h4><p>${e(profile.finances)}</p><h4>Limites institucionais</h4><p>${e(profile.limits)}</p><h4>Ganchos</h4>${list(profile.hooks??[])}</details>`;
}
const sections=rows=>(rows??[]).map(row=>`<h4>${e(row.title)}</h4><p class="sy-ambient-text">${e(row.text)}</p>`).join('');

/** Painel administrativo: organizações do QUEDAÇO agrupam Actors nativos. */
export function renderAmbientacao(api,actors=[],gameContext=globalThis.game){
  const catalog=api.getWorldCatalog({includeInactive:true});
  const organizations=api.listOrganizations({includeInactive:true});
  const placeName=id=>catalog.places.find(place=>place.id===id)?.name??id;
  const organizationIds=new Set(organizations.map(org=>org.id));
  const models=api.listNpcModels?.()??[],creatorReady=Boolean(npcTemplateCreator(gameContext??{}));
  const folderPlan=api.npcFolderPlan?.()??{rows:[],counts:{total:0}};
  const tools=`<div class="sy-ambient-tools"><button data-op="ambient-import">Importar arquivo / texto</button><button data-op="ambient-export">Exportar conteúdo</button><button data-op="ambient-organize-folders" ${folderPlan.rows.length?'':'disabled'}><i class="fa-solid fa-folder-tree" aria-hidden="true"></i> Organizar pastas${folderPlan.rows.length?` · ${folderPlan.rows.length}`:''}</button><button data-op="ambient-create-npcs" ${creatorReady?'':'disabled'}>Criar fichas dos modelos</button></div><p class="sy-note">Conteúdo é salvo neste mundo e permanece após atualizar o módulo. ${folderPlan.rows.length?`Há ${folderPlan.rows.length} NPC(s) fora da pasta regional correta.`:'As pastas regionais estão organizadas.'} ${creatorReady?'O Criador está disponível para validar e criar Actors.':'Para criar Actors por modelos, ative o Criador com suporte a modelos; a ambientação funciona sozinha.'}</p>`;
  const environments=`<section><h3>Ambientes · ${(catalog.environments??[]).length}</h3><div class="sy-ambient-grid">${(catalog.environments??[]).map(row=>`<article class="sy-ambient-org"><h3>${e(row.name)}</h3><small>${e(row.kind??'Ambiente')} · ${e(placeName(row.placeId)||row.regionId||'Sem local')}</small><p class="sy-ambient-text">${e(row.description??'')}</p>${sections(row.sections)}</article>`).join('')||'<p>Importe fichas de ambientes para preencher este catálogo.</p>'}</div></section>`;
  const modelSection=`<section><h3>Modelos de NPC · ${models.length}</h3><p>Planejamento para o Criador; a ficha definitiva é o Actor do Foundry.</p><div class="sy-ambient-roster">${models.map(row=>`<article class="sy-ambient-npc"><strong>${e(row.name)}</strong><small>${e(row.model.legacy)} · ${e(row.model.characterClass)} ${e(row.model.level)}</small><p>${npcModelActor(gameContext??{},row.id)?'Ficha vinculada no Foundry':'Aguardando criação pelo Criador'}</p></article>`).join('')}</div></section>`;
  const npcActors=Array.from(actors).filter(actor=>actor?.type==='character').map(actor=>({actor,flag:npcFlag(actor)})).filter(({flag})=>organizationIds.has(flag?.organizationId));
  return `<main class="sy-library sy-ambientacao"><header class="sy-ambient-head"><div><small>FONTE CENTRAL DA CAMPANHA</small><h2>Ambientação</h2><p>Organizações, funções e referências para fichas nativas do Foundry.</p></div><div class="sy-ambient-count"><b>${organizations.length}</b><span>organizações</span><b>${npcActors.length}</b><span>Actors catalogados</span></div></header>${tools}<p class="sy-note">As fichas são Actors do sistema Skyfall. Para vinculá-las, abra um NPC na aba NPCs, escolha a organização e salve. O QUEDAÇO só lê esse vínculo.</p><div class="sy-ambient-grid">${organizations.map(org=>{
    const roster=npcActors.filter(({flag})=>flag.organizationId===org.id);
    const icon=ORG_ICONS[org.id]??'fa-people-group';
    return `<details class="sy-ambient-org" data-organization="${e(org.id)}"><summary class="sy-ambient-summary"><span class="sy-ambient-org-icon" aria-hidden="true"><i class="fa-solid ${icon}"></i></span><span class="sy-ambient-org-title"><strong>${e(org.name)}</strong><small>${e(org.kind)} · ${e(org.status)}</small></span><span class="sy-ambient-org-meta">${roster.length} Actor${roster.length===1?'':'s'} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></summary><div class="sy-ambient-org-body"><p>${e(org.functions.join(' · '))}</p><div class="sy-library-chips">${org.placeIds.map(id=>pill(placeName(id))).join('')}${org.aliases.slice(0,1).map(alias=>pill(alias)).join('')}</div>${profileDetails(org.campaignProfile)}${sections(org.sections)}<h4>Representantes no Foundry · ${roster.length}</h4><div class="sy-ambient-roster">${roster.map(({actor,flag})=>`<article class="sy-ambient-npc"><img src="${e(actor.img||'icons/svg/mystery-man.svg')}" alt=""><div><strong>${e(actor.name)}</strong><small>${e(NPC_ROLES[flag.role]??'NPC')} · ${e(placeName(flag.placeId)||'sem local')}</small><p>${e(flag.note||'Sem nota de catálogo.')}</p><button class="sy-secondary" data-op="lib-npc-open" data-id="${e(actor.id)}">Abrir ficha</button></div></article>`).join('')||'<p class="sy-library-deferred">Nenhuma ficha vinculada ainda.</p>'}</div></div></details>`;
  }).join('')}</div>${environments}${modelSection}</main>`;
}
