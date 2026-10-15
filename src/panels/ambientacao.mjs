import {escapeHTML as e} from '../adapter.mjs';
import {npcFlag,NPC_ROLES} from '../npcs.mjs';

const pill=value=>`<span class="sy-ambient-pill">${e(value)}</span>`;
const list=values=>`<ul>${values.map(value=>`<li>${e(value)}</li>`).join('')}</ul>`;

function profileDetails(profile){
  if(!profile)return '';
  return `<details class="sy-library-guide"><summary>Uniformes, equipamento e comportamento · campanha</summary><p>${e(profile.identity)}</p><h4>Vestuário</h4>${Object.entries({everyday:'Cotidiano',field:'Em campo',formal:'Cerimonial',adaptations:'Adaptações aos legados'}).map(([key,label])=>`<p><strong>${label}:</strong> ${e(profile.uniform[key])}</p>`).join('')}<h4>Conduta</h4>${list(profile.conduct)}<h4>Equipamento por função</h4>${profile.equipment.map(kit=>`<p><strong>${e(kit.purpose)}:</strong> ${e(kit.items.join(', '))}. ${e(kit.notes)}</p>`).join('')}<h4>Cargos e experiência</h4>${list(profile.ranks)}<h4>Recursos</h4><p>${e(profile.finances)}</p><h4>Limites institucionais</h4><p>${e(profile.limits)}</p><h4>Ganchos</h4>${list(profile.hooks)}</details>`;
}

/** Painel administrativo: organizações do QUEDAÇO agrupam Actors nativos. */
export function renderAmbientacao(api,actors=[]){
  const catalog=api.getWorldCatalog({includeInactive:true});
  const organizations=api.listOrganizations({includeInactive:true});
  const placeName=id=>catalog.places.find(place=>place.id===id)?.name??id;
  const organizationIds=new Set(organizations.map(org=>org.id));
  const npcActors=Array.from(actors).filter(actor=>actor?.type==='character').map(actor=>({actor,flag:npcFlag(actor)})).filter(({flag})=>organizationIds.has(flag?.organizationId));
  return `<main class="sy-library sy-ambientacao"><header class="sy-ambient-head"><div><small>FONTE CENTRAL DA CAMPANHA</small><h2>Ambientação</h2><p>Organizações, funções e referências para fichas nativas do Foundry.</p></div><div class="sy-ambient-count"><b>${organizations.length}</b><span>organizações</span><b>${npcActors.length}</b><span>Actors catalogados</span></div></header><p class="sy-note">As fichas são Actors do sistema Skyfall. Para vinculá-las, abra um NPC na aba NPCs, escolha a organização e salve. O QUEDAÇO só lê esse vínculo.</p><div class="sy-ambient-grid">${organizations.map(org=>{
    const roster=npcActors.filter(({flag})=>flag.organizationId===org.id);
    return `<section class="sy-ambient-org" data-organization="${e(org.id)}"><header><div><small>${e(org.kind)}</small><h3>${e(org.name)}</h3></div><span class="sy-ambient-status">${e(org.status)}</span></header><p>${e(org.functions.join(' · '))}</p><div class="sy-library-chips">${org.placeIds.map(id=>pill(placeName(id))).join('')}${org.aliases.slice(0,1).map(alias=>pill(alias)).join('')}</div>${profileDetails(org.campaignProfile)}<h4>Equipe no Foundry · ${roster.length}</h4><div class="sy-ambient-roster">${roster.map(({actor,flag})=>`<article class="sy-ambient-npc"><header><strong>${e(actor.name)}</strong><span>Actor</span></header><small>${e(NPC_ROLES[flag.role]??'NPC')} · ${e(placeName(flag.placeId)||'sem local')}</small><p>${e(flag.note||'Sem nota de catálogo.')}</p><button class="sy-secondary" data-op="lib-npc-open" data-id="${e(actor.id)}">Abrir ficha</button></article>`).join('')||'<p class="sy-library-deferred">Nenhuma ficha vinculada ainda.</p>'}</div></section>`;
  }).join('')}</div></main>`;
}
