import {REGIONS,PLACES} from '../book-world.mjs';
import {placeLayer} from '../atlas.mjs';
import {buildRegionPuzzle,buildSceneAtlasTree,regionLocalityTree,resolveSceneLocality,sceneNeighborhood} from '../scene-atlas.mjs';
import {explorationScene,sceneRevealedHexes,worldExplorerActive} from '../world-explorer.mjs';
import {guildsForPlace} from '../guilds.mjs';
import {mapSourceFor,mapPortalDrafts} from '../map-bank.mjs';
import {adoptNpcFlag,inferRegionId,npcFlag} from '../npcs.mjs';
import {avatarFor,button,e,npcRoleChip,sortByName} from '../library.mjs';

export function sceneAtlasParentOptions(lib,selected='',currentSceneId=''){
    const option=(value,label)=>`<option value="${e(value)}" ${selected===value?'selected':''}>${e(label)}</option>`;
    const regions=sortByName(lib.catalogRegions).map(region=>option(`region:${region.id}`,`Região · ${region.name}`)).join('');
    const places=sortByName(lib.catalogPlaces).map(place=>option(`place:${place.id}`,`${lib.catalogRegions.find(region=>region.id===place.regionId)?.name??'Opath'} · ${place.name}`)).join('');
    const scenes=sortByName(Array.from(lib.game.scenes??[]).filter(scene=>scene.id!==currentSceneId)).map(scene=>option(`scene:${scene.id}`,`Dentro do mapa · ${scene.name}`)).join('');
    return `${option('unassigned','Sem região/local definido')}<optgroup label="Regiões">${regions}</optgroup><optgroup label="Cidades e locais">${places}</optgroup>${scenes?`<optgroup label="Dentro de outro mapa">${scenes}</optgroup>`:''}`;
  }
export function sceneAtlasAddForm(lib,parentId){
    return `<div class="sy-scene-atlas-add"><input name="atlasSceneName" placeholder="Nome do novo mapa"><button data-op="lib-atlas-scene-create" data-id="${e(parentId)}"><i class="fa-solid fa-plus" aria-hidden="true"></i> Criar cena aqui</button></div>`;
  }
export function sceneAtlasFirstScene(lib,node){
    if(node?.type==='scene'&&!node.missing)return node;
    for(const child of node?.children??[]){const found=lib.sceneAtlasFirstScene(child);if(found)return found;}
    return null;
  }
export function renderSceneAtlasScene(lib,node,atlas,depth=0){
    const stored=atlas.scenes[node.key]?.parentId??node.parentId??'unassigned';
    const positioned=node.edgeIds?.length??0;
    const children=(node.children??[]).map(child=>lib.renderSceneAtlasScene(child,atlas,depth+1)).join('');
    const image=lib.state.atlasThumbnails&&node.img?`<img src="${e(node.img)}" alt="" loading="lazy">`:'';
    const placeId=String(node.parentId??'').startsWith('place:')?String(node.parentId).slice(6):'';
    const placeName=lib.catalogPlaces.find(place=>place.id===placeId)?.name;
    const label=placeName===node.label?`Mapa: ${node.label}`:node.label;
    const title=node.missing?`<strong>${e(label)}</strong>`:`<button data-op="lib-open-scene" data-id="${e(node.key)}">${e(label)}</button>`;
    return `<article class="sy-scene-atlas-scene ${node.missing?'is-missing':''}" style="--sy-atlas-depth:${Math.min(6,depth)}">${image}<div class="sy-scene-atlas-scene-body"><div class="sy-scene-atlas-scene-title"><i class="fa-solid ${node.missing?'fa-triangle-exclamation':'fa-map'}" aria-hidden="true"></i>${title}<span>${node.missing?'cena ausente':`${positioned} ligação${positioned===1?'':'ões'}`}</span></div><div class="sy-scene-atlas-scene-tools">${node.missing?`<button data-op="lib-atlas-scene-remove" data-id="${e(node.key)}">Remover esta entrada</button>`:`<select name="atlasSceneParent" data-scene="${e(node.key)}" aria-label="Onde este mapa fica">${lib.sceneAtlasParentOptions(stored,node.key)}</select><button data-op="lib-atlas-assign" data-id="${e(node.key)}">Mover</button>`}</div>${node.missing?'':lib.sceneAtlasAddForm(`scene:${node.key}`)}${children?`<div class="sy-scene-atlas-children">${children}</div>`:''}</div></article>`;
  }
export function renderSceneAtlasPlace(lib,node,atlas){
    const directScenes=(node.children??[]).filter(child=>child.type==='scene');
    const subPlaces=(node.children??[]).filter(child=>child.type==='place');
    const first=lib.sceneAtlasFirstScene(node);
    const count=node.counts?.scenes??0;
    const label=first?`<button data-op="lib-open-scene" data-id="${e(first.key)}" title="Abrir ${e(first.label)}">${e(node.label)}</button>`:`<strong>${e(node.label)}</strong>`;
    const contents=`${lib.sceneAtlasAddForm(node.id)}${directScenes.map(scene=>lib.renderSceneAtlasScene(scene,atlas)).join('')}${subPlaces.map(place=>lib.renderSceneAtlasPlace(place,atlas)).join('')}`;
    const open=lib.state.atlasOpen?.has(node.id)?'open':'';
    return `<details class="sy-scene-atlas-place" data-atlas-open="${e(node.id)}" ${open}><summary><i class="fa-solid ${placeLayer(node.data?.kind)==='cidade'?'fa-city':'fa-location-dot'}" aria-hidden="true"></i>${label}<span class="sy-scene-atlas-count ${count?'has-maps':''}">${count} mapa${count===1?'':'s'}</span></summary><div class="sy-scene-atlas-place-body">${contents}</div></details>`;
  }
export function renderSceneAtlasEdge(lib,edge,sceneMap){
    const from=sceneMap.get(edge.from.sceneId),to=sceneMap.get(edge.to.sceneId);
    const pos=endpoint=>Number.isFinite(endpoint?.x)&&Number.isFinite(endpoint?.y);
    const stair=edge.implementations?.stairways,native=edge.implementations?.native;
    const badge=(id,label,impl)=>`<span class="sy-scene-atlas-provider ${edge.runtimeProvider===id?'is-runtime':''} ${impl?'is-built':''}">${edge.runtimeProvider===id?'●':'○'} ${e(label)} · ${e(impl?.status??(impl?'preparado':'não construído'))}</span>`;
    return `<article class="sy-scene-atlas-edge"><header><div><strong>${e(edge.label)}</strong><small>${e(from?.name??edge.from.sceneId)} ${edge.bidirectional?'↔':'→'} ${e(to?.name??edge.to.sceneId)}</small></div><button data-op="lib-atlas-edge-remove" data-id="${e(edge.id)}" title="Remover ligação" ${stair||native?'disabled':''}><i class="fa-solid fa-trash" aria-hidden="true"></i></button></header><div class="sy-scene-atlas-endpoints"><button data-op="lib-atlas-place" data-id="${e(edge.id)}|from" class="${pos(edge.from)?'is-ready':''}">${pos(edge.from)?'✓':'⌖'} Entrada · ${e(from?.name??edge.from.sceneId)}</button><button data-op="lib-atlas-place" data-id="${e(edge.id)}|to" class="${pos(edge.to)?'is-ready':''}">${pos(edge.to)?'✓':'⌖'} Saída · ${e(to?.name??edge.to.sceneId)}</button></div><div class="sy-scene-atlas-provider-row">${badge('stairways','Stairways',stair)}${badge('native','Regiões',native)}</div><div class="sy-scene-atlas-edge-actions"><button data-op="lib-atlas-build" data-id="${e(edge.id)}" ${pos(edge.from)&&pos(edge.to)?'':'disabled'}>Construir opções ligadas</button>${stair?button('atlas-runtime',`${edge.id}|stairways`,'Usar Stairways'):''}${native?button('atlas-runtime',`${edge.id}|native`,'Usar Regiões'):''}</div></article>`;
  }
export function renderSceneAtlas(lib,){
    const atlas=lib.sceneAtlas,scenes=Array.from(lib.game.scenes??[]),sceneMap=new Map(scenes.map(scene=>[scene.id,scene]));
    const tree=buildSceneAtlasTree({atlas,regions:lib.catalogRegions,places:lib.catalogPlaces,scenes,placeScenes:lib.placeScenes,regionScenes:lib.regionScenes});
    const visibleRegionIds=new Set(lib.campaignRegions().map(region=>region.id));
    const stairModule=lib.game.modules?.get?.('stairways'),stairVersion=String(stairModule?.version??'');
    const stairAvailable=Boolean(stairModule?.active&&/^0\.11\./.test(stairVersion));
    const nativeAvailable=Number(String(lib.game.version??globalThis.game?.version??'13').split('.')[0])===13;
    const toggle=(id,label,available,detail)=>{const on=atlas.providers[id];return `<button class="sy-scene-atlas-toggle ${on?'is-on':''}" data-op="lib-atlas-provider" data-id="${id}:${on?'off':'on'}" aria-pressed="${on}"><i class="fa-solid ${on?'fa-toggle-on':'fa-toggle-off'}" aria-hidden="true"></i><span>${e(label)}<small>${e(available?detail:'indisponível agora')}</small></span></button>`;};
    const focusedSceneIds=new Set(scenes.filter(scene=>visibleRegionIds.has(resolveSceneLocality(atlas,scene.id,{placeScenes:lib.placeScenes,regionScenes:lib.regionScenes})?.regionId)).map(scene=>scene.id));
    const focusOn=lib.campaignFocus.enabled;
    const visibleScenes=focusOn?scenes.filter(scene=>focusedSceneIds.has(scene.id)):scenes;
    const sceneOptions=sortByName(visibleScenes).map(scene=>`<option value="${e(scene.id)}">${e(scene.name)}</option>`).join('');
    const edgeForm=visibleScenes.length>=2?`<section class="sy-scene-atlas-editor"><h3>Nova ligação jogável</h3><div class="sy-scene-atlas-edge-form"><label>Origem<select name="atlasEdgeFrom"><option value="">Escolha…</option>${sceneOptions}</select></label><label>Destino<select name="atlasEdgeTo"><option value="">Escolha…</option>${sceneOptions}</select></label><label>Nome<input name="atlasEdgeLabel" placeholder="Ex.: Porta da taverna"></label><label class="sy-inline-check"><input name="atlasEdgeBidirectional" type="checkbox" checked> Ida e volta</label><button data-op="lib-atlas-edge-add" data-id="">Adicionar ligação</button></div></section>`:'<p class="sy-note">Crie ou vincule pelo menos duas cenas para montar uma ligação jogável.</p>';
    const regionNodes=tree.children.filter(node=>node.type==='region'&&visibleRegionIds.has(node.key));
    const regions=regionNodes.map(region=>`<details class="sy-scene-atlas-region" data-atlas-open="${e(region.id)}" ${lib.state.atlasOpen?.has(region.id)?'open':''} style="--sy-region:${e(lib.regionColor(region.key))}"><summary><span class="sy-atlas-dot"></span><strong>${e(region.label)}</strong><span>${region.counts?.scenes??0} mapa${region.counts?.scenes===1?'':'s'} · ${region.counts?.edges??0} ligações</span></summary><div class="sy-scene-atlas-region-body">${lib.sceneAtlasAddForm(region.id)}${(region.children??[]).map(place=>lib.renderSceneAtlasPlace(place,atlas)).join('')||'<small>Nenhuma localidade cadastrada.</small>'}</div></details>`).join('');
    const unassigned=tree.children.find(node=>node.type==='group');
    const loose=(focusOn?[]:(unassigned?.children??[])).map(scene=>lib.renderSceneAtlasScene(scene,atlas)).join('');
    const visibleEdges=Object.values(atlas.edges).filter(edge=>!focusOn||(focusedSceneIds.has(edge.from?.sceneId)&&focusedSceneIds.has(edge.to?.sceneId)));
    const edges=visibleEdges.map(edge=>lib.renderSceneAtlasEdge(edge,sceneMap)).join('');
    const summary=focusOn?{actualScenes:focusedSceneIds.size,assignedScenes:focusedSceneIds.size,legacyAssignedScenes:0,edges:visibleEdges.length}:tree.summary;
    const puzzleView=lib.state.atlasView!=='list';
    const rawSuggestions=Array.isArray(lib.state.atlasSuggestions)?lib.state.atlasSuggestions:null;
    const suggestions=rawSuggestions&&focusOn?rawSuggestions.filter(item=>{if(item.parentId.startsWith('region:'))return visibleRegionIds.has(item.parentId.slice(7));if(item.parentId.startsWith('place:'))return visibleRegionIds.has(lib.catalogPlaces.find(place=>place.id===item.parentId.slice(6))?.regionId);return false;}):rawSuggestions;
    const suggestionPreview=suggestions?`<section class="sy-scene-atlas-editor sy-atlas-suggestions"><h3>Prévia: sugestões de local</h3><p class="sy-note">Confira antes de aplicar. Teste numa cópia do mundo antes da primeira vez.</p>${suggestions.length?`<div class="sy-check-grid">${suggestions.map(suggestion=>{const target=suggestion.parentId.startsWith('place:')?lib.catalogPlaces.find(place=>`place:${place.id}`===suggestion.parentId)?.name:lib.catalogRegions.find(region=>`region:${region.id}`===suggestion.parentId)?.name;return `<label><input type="checkbox" name="atlasSuggestion" value="${e(suggestion.sceneId)}" ${suggestion.confidence==='alta'?'checked':''}>${e(suggestion.sceneName)} <small>→ ${e(target??suggestion.parentId)} · ${e(suggestion.reason)} · ${e(suggestion.confidence)}</small></label>`;}).join('')}</div><button data-op="lib-atlas-suggest-apply" data-id="">Aplicar marcadas</button>`:'<p class="sy-note">Nenhuma sugestão segura. Cenas já organizadas, vínculos legados e conflitos foram ignorados.</p>'}</section>`:'';
    const viewNav=`<nav class="sy-library-tabs sy-scene-atlas-views" aria-label="Vista do Mapa Imersivo"><button data-op="lib-atlas-view" data-id="puzzle" aria-current="${puzzleView?'page':'false'}"><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i> Quebra-cabeça</button><button data-op="lib-atlas-view" data-id="list" aria-current="${puzzleView?'false':'page'}"><i class="fa-solid fa-list" aria-hidden="true"></i> Lista</button></nav>`;
    return `<section class="sy-scene-atlas"><header class="sy-scene-atlas-head"><div><small>VISÃO CONCEITUAL</small><h2>Mapa Imersivo</h2><p>Região → cidade ou local → mapas internos. Cenas novas aparecem automaticamente em “Sem local”.</p></div><div class="sy-scene-atlas-metrics"><span><b>${summary.actualScenes}</b> cenas</span><span><b>${summary.assignedScenes+summary.legacyAssignedScenes}</b> organizadas</span><span><b>${summary.edges}</b> ligações</span>${lib.explorationButton(lib.state.atlasRegion||'')}</div></header><section class="sy-scene-atlas-automation"><div><h3>Construções automáticas</h3><p>Ligue um ou os dois construtores. As duas versões podem ficar prontas; cada passagem usa só uma delas durante o jogo.</p></div>${toggle('stairways','Stairways',stairAvailable,`v${stairVersion}`)}${toggle('native','Regiões nativas',nativeAvailable,'Foundry 13')}<button data-op="lib-atlas-build-all" data-id="">Construir tudo que estiver pronto</button><button data-op="lib-atlas-thumbnails" data-id="${lib.state.atlasThumbnails?'hide':'show'}"><i class="fa-solid fa-image" aria-hidden="true"></i> ${lib.state.atlasThumbnails?'Ocultar':'Mostrar'} miniaturas</button></section>${viewNav}${suggestionPreview}${puzzleView?`${lib.renderAtlasPuzzle(tree,atlas)}${edgeForm}`:`${edgeForm}<div class="sy-scene-atlas-layout"><div class="sy-scene-atlas-regions">${regions}</div><aside class="sy-scene-atlas-links"><h3>Ligações</h3>${edges||'<p class="sy-note">Nenhuma ligação criada.</p>'}<details class="sy-scene-atlas-unassigned" ${loose?'open':''}><summary>Sem local <span>${unassigned?.counts?.scenes??0}</span></summary>${loose||'<small>Todas as cenas estão organizadas.</small>'}</details></aside></div>`}</section>`;
  }
  /** T15 — botão "Abrir mapa de exploração" do World Explorer. Só existe com o módulo
   *  ativo e uma cena que já tenha dado dele; a contagem de hexágonos é opcional e some
   *  se o formato não for o esperado (ver src/world-explorer.mjs). */
export function explorationButton(lib,regionId=''){
    if(!worldExplorerActive(lib.game))return '';
    const scene=explorationScene(lib.game.scenes??[],regionId?lib.regionMainScene[regionId]:'');
    if(!scene)return '';
    const hexes=sceneRevealedHexes(scene);
    const count=hexes?`<small>${hexes.revealed} revelado${hexes.revealed===1?'':'s'}${hexes.partial?` · ${hexes.partial} parcia${hexes.partial===1?'l':'is'}`:''}</small>`:'';
    return `<button class="sy-explore-open" data-op="lib-explore-open" data-id="${e(scene.id)}" title="Abrir ${e(scene.name)} (World Explorer)"><i class="fa-solid fa-compass" aria-hidden="true"></i> Mapa de exploração${count}</button>`;
  }
  /** Desenho comum do quebra-cabeça e do mini-diagrama: caixas absolutas + linhas SVG.
   *  As linhas guardam de qual caixa a qual caixa vão, pro arrastar redesenhar ao vivo. */
export function puzzleBoard(lib,nodes,links,{width,height,box,regionId='',draggable=false,cls=''}){
    const byId=new Map(nodes.map(node=>[node.id,node]));
    const center=node=>({x:node.x+box.w/2,y:node.y+box.h/2});
    const lines=links.map(link=>{const a=byId.get(link.from),b=byId.get(link.to);if(!a||!b)return '';const p=center(a),q=center(b);const label=link.kind==='portal'?`<title>${e(link.label||'Teletransporte')}${link.bidirectional?' (ida e volta)':''}</title>`:'';return `<line class="sy-puzzle-link is-${link.kind}" data-link-from="${e(link.from)}" data-link-to="${e(link.to)}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}">${label}</line>`;}).join('');
    const icon={region:'fa-earth-americas',place:'fa-location-dot',scene:'fa-map'};
    const boxes=nodes.map(node=>{
      const action=node.type==='scene'&&!node.current?(node.missing?`<button data-op="lib-atlas-scene-remove" data-id="${e(node.key)}" title="Cena apagada no Foundry — remover esta entrada"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>`:`<button data-op="lib-open-scene" data-id="${e(node.key)}" title="Abrir ${e(node.label)}"><i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i></button>`):'';
      return `<div class="sy-puzzle-box is-${node.type} ${node.missing?'is-missing':''} ${node.current?'is-current':''}" data-puzzle-node="${e(node.id)}" style="left:${node.x}px;top:${node.y}px" title="${e(node.missing?`${node.label} — cena ausente`:node.label)}"><i class="fa-solid ${node.missing?'fa-triangle-exclamation':icon[node.type]??'fa-map'}" aria-hidden="true"></i><span>${e(node.label)}</span>${action}</div>`;
    }).join('');
    return `<div class="sy-puzzle-board ${cls}" ${draggable?`data-puzzle-region="${e(regionId)}"`:''} style="width:${width}px;height:${height}px;--sy-box-w:${box.w}px;--sy-box-h:${box.h}px"><svg class="sy-puzzle-lines" width="${width}" height="${height}" aria-hidden="true">${lines}</svg>${boxes}</div>`;
  }
  /** T13 §2 — o quebra-cabeça de uma região. Caixas que já existem vêm prontas e ligadas
   *  (hierarquia fixa); arrastar só muda a posição. Cena solta entra arrastando da bandeja
   *  pra cima de uma caixa; caixa nova nasce pelo formulário, dentro da caixa escolhida. */
export function renderAtlasPuzzle(lib,tree,atlas){
    const visibleRegionIds=new Set(lib.campaignRegions().map(region=>region.id));
    const regions=tree.children.filter(node=>node.type==='region'&&visibleRegionIds.has(node.key));
    if(!regions.length)return '<p class="sy-note">Nenhuma região cadastrada.</p>';
    const selected=regions.find(region=>region.key===lib.state.atlasRegion)??regions.find(region=>region.counts?.scenes)??regions[0];
    const chips=`<nav class="sy-puzzle-regions" aria-label="Região a montar">${regions.map(region=>`<button data-op="lib-atlas-region" data-id="${e(region.key)}" aria-current="${region.key===selected.key?'page':'false'}" style="--sy-region:${e(lib.regionColor(region.key))}"><span class="sy-atlas-dot"></span>${e(region.label)}<small>${region.counts?.scenes??0}</small></button>`).join('')}</nav>`;
    const places=lib.catalogPlaces.filter(place=>place.regionId===selected.key),files=lib.mapBankFiles,progress=lib.mapBuildProgress;
    const progressBar=`<section class="sy-map-progress" aria-label="Progresso da montagem dos mapas"><header><div><small>MONTAGEM DO MUNDO</small><h3>${progress.percent}% pronta</h3></div><span>${progress.sceneCount}/${progress.total} localidades com cena</span></header><div class="sy-map-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}"><span style="width:${progress.percent}%"></span></div><div class="sy-map-progress-steps">${progress.steps.map(step=>`<span class="${step.percent===100?'is-done':''}">${e(step.label)} <b>${step.count}/${step.total}</b></span>`).join('')}</div></section>`;
    const portalDrafts=mapPortalDrafts(lib.catalogPlaces);
    const placeCards=places.map(place=>{const source=mapSourceFor(place.id),file=files[place.id],drafts=portalDrafts.filter(draft=>draft.fromPlaceId===place.id);return `<article class="sy-map-bank-card"><div><strong>${e(place.name)}</strong><small>${e(place.kind)} · ${source?`${e(source.title)} · ${e(source.license)}`:'sem fonte'}</small>${drafts.length?`<small>Saídas planejadas em ${e(drafts[0].section)}: ${drafts.map(draft=>e(draft.label)).join(' · ')} (aguardam posição)</small>`:''}</div>${source?`<a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">Ver mapa</a>`:''}${file?`<img src="${e(file)}" alt="Prévia de ${e(place.name)}" loading="lazy"><small>${e(file)}</small>`:'<small>Arquivo da cena ainda não escolhido</small>'}<button data-op="lib-map-bank-file" data-id="${e(place.id)}">${file?'Trocar arquivo':'Escolher arquivo'}</button>${file?`<button data-op="lib-map-bank-file" data-id="${e(place.id)}:">Limpar</button>`:''}</article>`;}).join('');
    const bank=`<details class="sy-map-bank"><summary>Banco de mapas · ${e(selected.label)} <small>${places.filter(place=>files[place.id]).length}/${places.length} arquivos escolhidos</small></summary><p class="sy-note">Escolha o arquivo da cena no Foundry após obter o mapa na página do autor. Créditos: Ross McConnell / 2-Minute Tabletop, CC BY-NC 4.0, uso privado na mesa.</p><div class="sy-map-bank-grid">${placeCards}</div><button data-op="lib-map-bank-adopt-plan" data-id="${e(selected.key)}">Registrar fundos das cenas vinculadas</button> <button data-op="lib-map-bank-plan" data-id="${e(selected.key)}">Criar cenas com mapas escolhidos</button></details>`;
    const preview=lib.state.mapBankPreview?.regionId===selected.key?`<section class="sy-scene-atlas-editor sy-map-bank-preview"><h3>Prévia · criar cenas em ${e(selected.label)}</h3><p class="sy-note">Teste numa cópia do mundo antes da primeira vez. Cada linha cria uma cena com a imagem escolhida e vincula ao Mapa Imersivo.</p>${lib.state.mapBankPreview.rows.length?`<div class="sy-check-grid">${lib.state.mapBankPreview.rows.map(row=>`<label><input type="checkbox" name="mapBankPlace" value="${e(row.placeId)}" ${row.background||row.existingSceneId?'checked':'disabled'}><span>${e(row.name)} <small>${row.existingSceneId?'vincular cena já criada · ':''}${row.background?e(row.background):'sem arquivo — escolha no banco antes de aplicar'}</small></span></label>`).join('')}</div><button data-op="lib-map-bank-apply" data-id="" ${lib.state.mapBankPreview.rows.some(row=>row.background||row.existingSceneId)?'':'disabled'}>Aplicar cenas marcadas</button>`:'<p class="sy-note">Todos os locais desta região já têm cena.</p>'}</section>`:'';
    const adoptionPreview=lib.state.mapBankAdoptionPreview?.regionId===selected.key?`<section class="sy-scene-atlas-editor sy-map-bank-preview"><h3>Prévia · registrar fundos de cenas em ${e(selected.label)}</h3><p class="sy-note">Somente registra os caminhos reais dos fundos no Banco de mapas. Não cria, edita ou move cenas.</p>${lib.state.mapBankAdoptionPreview.rows.length?`<div class="sy-check-grid">${lib.state.mapBankAdoptionPreview.rows.map(row=>`<label><input type="checkbox" name="mapBankAdopt" value="${e(row.placeId)}" checked><span>${e(row.name)} <small>${e(row.sceneId)} · ${e(row.background)}</small></span></label>`).join('')}</div><button data-op="lib-map-bank-adopt-apply" data-id="">Registrar mapas marcados</button>`:'<p class="sy-note">Nenhuma cena vinculada desta região tem fundo novo para registrar.</p>'}</section>`:'';
    const puzzle=buildRegionPuzzle({tree,regionId:selected.key,atlas});
    const placeNames=new Map(lib.catalogPlaces.map(place=>[`place:${place.id}`,place.name]));
    const nodes=puzzle.nodes.map(node=>node.type==='scene'&&placeNames.get(node.parentId)===node.label?{...node,label:`Mapa: ${node.label}`}:node);
    const board=lib.puzzleBoard(nodes,puzzle.links,{width:puzzle.width,height:puzzle.height,box:puzzle.box,regionId:selected.key,draggable:true});
    const unassigned=tree.children.find(node=>node.type==='group');
    const loose=(unassigned?.children??[]).filter(node=>!node.missing);
    const tray=`<div class="sy-puzzle-tray"><strong>Cenas sem local</strong>${loose.length?`<small>Arraste uma para cima de uma caixa para colocá-la ali dentro.</small><button data-op="lib-atlas-suggest" data-id=""><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Sugerir onde ficam</button><div class="sy-puzzle-tray-list">${loose.map(node=>`<span class="sy-puzzle-loose" data-puzzle-loose="${e(node.key)}" title="Arraste para uma caixa">${e(node.label)}</span>`).join('')}</div>`:'<small>Todas as cenas já estão em algum lugar.</small>'}</div>`;
    const parentOptions=nodes.filter(node=>!node.missing).map(node=>`<option value="${e(node.id)}">${node.type==='region'?'Região':node.type==='place'?'Local':'Dentro do mapa'} · ${e(node.label)}</option>`).join('');
    const create=`<div class="sy-puzzle-create"><input name="puzzleSceneName" placeholder="Nome da caixa nova (cria uma cena)"><select name="puzzleSceneParent" aria-label="Dentro de qual caixa">${parentOptions}</select><button data-op="lib-atlas-puzzle-create" data-id=""><i class="fa-solid fa-plus" aria-hidden="true"></i> Criar caixa</button></div>`;
    const sceneName=id=>lib.game.scenes?.get?.(id)?.name??id;
    const externals=puzzle.externals.length?`<p class="sy-puzzle-externals"><i class="fa-solid fa-door-open" aria-hidden="true"></i> Portais para fora desta região: ${puzzle.externals.map(link=>`${e(nodes.find(node=>node.id===link.nodeId)?.label??'')} → ${e(sceneName(link.otherSceneId))}`).join(' · ')}</p>`:'';
    const legend=`<div class="sy-puzzle-legend"><span class="is-region">Região</span><span class="is-place">Local</span><span class="is-scene">Cena</span><span class="is-portal">- - - teletransporte</span><button data-op="lib-atlas-layout-reset" data-id="${e(selected.key)}" title="Esquecer as posições desta região"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reorganizar caixas</button></div>`;
    return `<section class="sy-puzzle" style="--sy-region:${e(lib.regionColor(selected.key))}">${chips}${progressBar}${bank}${adoptionPreview}${preview}${legend}<div class="sy-puzzle-scroll">${board}</div>${externals}<div class="sy-puzzle-tools">${create}${tray}</div></section>`;
  }
