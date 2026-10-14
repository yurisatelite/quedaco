import {missingKnownModules} from './family.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAPABILITY_LABELS={calendar:'calendário',currentDate:'data atual',currentTime:'hora atual',advanceTime:'avançar tempo',daylightControl:'luz do dia',mapAtlas:'atlas',sceneLinks:'cenas',npcDatabase:'NPCs',localityDatabase:'localidades',combatMaps:'mapas de combate',newspaper:'jornal',createEdition:'criar edição',characterCreator:'criador',createActor:'cria fichas',tables:'tabelas',merchants:'mercadores'};
const label=key=>CAPABILITY_LABELS[key]??key;

/** Aba “Módulos” (só da Mestra): quem da família QUEDAÇO está ativo, o que oferece e como abrir. */
export function renderFamilyArea(registry,game=globalThis.game){
  const modules=registry?.scan?.().list?.()??[];
  const missing=registry?missingKnownModules(registry,game):[];
  const cards=modules.map(m=>`<article class="sy-family-card">
    <div class="sy-family-head"><i class="fa-solid ${esc(m.icon)}" aria-hidden="true"></i><div><h3>${esc(m.title)}</h3><small>v${esc(m.version)}${m.ready?"":" · não está pronto"}</small></div></div>
    ${m.hint?`<p>${esc(m.hint)}</p>`:''}
    <ul class="sy-family-caps">${m.capabilities.map(c=>`<li>${esc(label(c))}</li>`).join('')}</ul>
    <button data-op="family-open" data-module="${esc(m.id)}"><i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i> Abrir</button>
  </article>`).join('');
  const absent=missing.length?`<section class="sy-family-missing"><h3>Ainda não conectados</h3><ul>${missing.map(m=>`<li><i class="fa-solid ${esc(m.icon)}" aria-hidden="true"></i><span><strong>${esc(m.id)}</strong> — ${esc(m.hint)}</span><small>${m.installed?(m.active?'ativo, mas sem a API do protocolo (atualize)':'instalado, desativado'):'não instalado'}</small></li>`).join('')}</ul></section>`:'';
  return `<main class="sy-family"><small>FAMÍLIA QUEDAÇO</small><h2>Módulos</h2><p class="sy-note">Cada módulo funciona sozinho. Aqui o QUEDAÇO reconhece os que seguem o Protocolo de Integração (contrato v1) e abre a interface deles.</p>
  <button data-op="catalog-edit"><i class="fa-solid fa-database"></i> Cadastros compartilhados</button><div class="sy-family-grid">${cards||'<p class="sy-note">Nenhum módulo da família está ativo e conectado ainda.</p>'}</div>${absent}</main>`;
}
