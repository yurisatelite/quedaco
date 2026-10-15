import {escapeHTML as e} from '../adapter.mjs';

const pill=value=>`<span class="sy-ambient-pill">${e(value)}</span>`;

/** Painel administrativo: os dossiês não criam nem alteram Actors. */
export function renderAmbientacao(api){
  const catalog=api.getWorldCatalog({includeInactive:true});
  const organizations=api.listOrganizations({includeInactive:true});
  const placeName=id=>catalog.places.find(place=>place.id===id)?.name??id;
  return `<main class="sy-library sy-ambientacao"><header class="sy-ambient-head"><div><small>FONTE CENTRAL DA CAMPANHA</small><h2>Ambientação</h2><p>Organizações, funções e dossiês reutilizáveis pelos módulos da família QUEDAÇO.</p></div><div class="sy-ambient-count"><b>${organizations.length}</b><span>organizações</span><b>${catalog.ambientNpcs.length}</b><span>dossiês</span></div></header><p class="sy-note">Os dossiês abaixo ainda não são Actors da mesa. Eles servem para planejar a campanha e podem receber ficha, token e cena quando a Mestra decidir usá-los.</p><div class="sy-ambient-grid">${organizations.map(org=>{
    const roster=api.listAmbientNpcs({organizationId:org.id});
    return `<section class="sy-ambient-org" data-organization="${e(org.id)}"><header><div><small>${e(org.kind)}</small><h3>${e(org.name)}</h3></div><span class="sy-ambient-status">${e(org.status)}</span></header><p>${e(org.functions.join(' · '))}</p><div class="sy-library-chips">${org.placeIds.map(id=>pill(placeName(id))).join('')}${org.aliases.slice(0,1).map(alias=>pill(alias)).join('')}</div><h4>Equipe · ${roster.length}</h4><div class="sy-ambient-roster">${roster.map(npc=>`<article class="sy-ambient-npc ${npc.canonical?'is-canonical':''}"><header><strong>${e(npc.name)}</strong>${npc.canonical?'<span title="Nome citado no livro">Livro</span>':'<span title="Personagem criado para esta campanha">Mesa</span>'}</header><small>${e(npc.role)} · ${e(npc.characterClass)} ${e(npc.level)}</small><p>${e(npc.publicSummary)}</p><div class="sy-library-chips">${pill(npc.legacy)}${pill(npc.heritage)}${pill(placeName(npc.placeId))}</div></article>`).join('')}</div></section>`;
  }).join('')}</div></main>`;
}
