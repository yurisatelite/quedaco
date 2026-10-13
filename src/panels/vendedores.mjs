// Telas do reconhecimento de vendedores (T30). Só leitura: nada aqui grava em ficha nem em flag.
import {e} from '../library.mjs';
import {vendorLabel,vendorShop} from '../vendors.mjs';

const VENDOR_COLOR='#4fb5c9';

/** Selo "Vendedor" do cartão de NPC; vazio se o ator não é vendedor. */
export function vendorBadge(lib,actor){
  const shop=vendorShop(actor);
  if(!shop)return '';
  const name=shop.public?'Vendedor':'Vendedor · fechada';
  return `<span class="sy-npc-role sy-vendor-badge ${shop.public?'':'is-closed'}" style="--sy-role:${VENDOR_COLOR}" title="${e(vendorLabel(shop))}"><i class="fa-solid fa-store" aria-hidden="true"></i>${e(name)}</span>`;
}

/** Quadro "Vendedores por local" — aparece quando o filtro Vendedor está ligado. */
export function vendorSummary(lib,distribution,placeFilter='all'){
  if(!distribution.total)return `<section class="sy-vendor-summary"><div class="sy-vendor-head"><strong>Vendedores</strong><span>Nenhum NPC com o modo comerciante ligado ainda.</span></div></section>`;
  const resumo=`${distribution.total} no total · ${distribution.open} abertos aos jogadores${distribution.closed?` · ${distribution.closed} fechados`:''}${distribution.unplaced?` · ${distribution.unplaced} sem local`:''}`;
  const groups=distribution.groups.map(group=>`<div class="sy-vendor-group" style="--sy-region:${e(lib.regionColor(group.regionId))}"><strong>${e(group.name)} · ${group.total}</strong><div class="sy-vendor-places">${group.places.map(place=>`<button class="sy-vendor-place ${place.count?'':'is-empty'}" data-op="lib-npc-place-filter" data-id="${e(place.id)}" aria-pressed="${placeFilter===place.id}" title="${place.count?`${place.count} vendedor(es) — clique para filtrar`:'Nenhum vendedor aqui'}">${e(place.name)} <b>${place.count}</b></button>`).join('')}</div></div>`).join('');
  return `<section class="sy-vendor-summary" aria-label="Vendedores por local"><div class="sy-vendor-head"><strong>Vendedores por local</strong><span>${e(resumo)}</span></div><div class="sy-vendor-groups">${groups}</div></section>`;
}
