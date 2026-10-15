import {Catalog} from './catalog.mjs';
import {CampaignLibrary,navAreaEntries} from './library.mjs';
import {MODULE_ID,escapeHTML as e} from './adapter.mjs';
import {clampPan,zoomToPoint} from './map-view.mjs';
import {openWorldCatalogEditor} from './panels/world-catalog.mjs';
import {renderFamilyArea} from './family-view.mjs';
import {renderAmbientacao} from './panels/ambientacao.mjs';
import {openAmbientImporter,exportAmbientContent,createAmbientNpcModels} from './panels/ambient-import.mjs';
export class CampaignApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS={id:'quedaco-control',classes:['sy-creator'],tag:'section',window:{title:'QUEDAÇO',resizable:true},position:{width:1180,height:820}};
  constructor(options={}) {
    super(options);this.catalog=new Catalog(game);this.library=new CampaignLibrary(game,this.catalog);this.area='npcs';this.loading=true;this.busy=false;this._restoreScroll=null;this._scrollNpcIntoView=false;
  }
  async start(){await this.render(true);try{await Promise.all([this.catalog.load(),this.library.images.load()]);}catch(err){this.message=err.message;}this.loading=false;return this.render(true);}
  async _renderHTML(){
    const sharedAreas=game.user.isGM?[]:[...new Set([...this.library.shared.areas.filter(a=>['npcs','guilds','map','monsters','items','imbue'].includes(a)),'quests'])];
    if(!game.user.isGM&&!sharedAreas.includes(this.area))this.area=sharedAreas[0]??'quests';
    const areaLabels={npcs:'NPCs',guilds:'Guildas',map:'Mapa',monsters:'Monstros',items:'Itens',imbue:'Imbuir',quests:'Quests',ambientacao:'Ambientação',modules:'Módulos'};
    const areaIcons={npcs:'fa-masks-theater',guilds:'fa-shield-halved',map:'fa-map',monsters:'fa-dragon',items:'fa-box-archive',imbue:'fa-wand-sparkles',quests:'fa-scroll',ambientacao:'fa-landmark',modules:'fa-puzzle-piece'};
    const showStored=game.user.isGM&&this.library.showStoredTools;
    const areas=navAreaEntries(game.user.isGM?Object.entries(areaLabels):sharedAreas.map(a=>[a,areaLabels[a]]),{isGM:game.user.isGM,showStored});
    if(!areas.some(([id])=>id===this.area)&&game.user.isGM)this.area='npcs';
    // T29: o ⋯ traz de volta a aba Imbuir e as ferramentas de manutenção guardadas
    const more=game.user.isGM?`<button class="sy-area-btn sy-area-more" data-op="lib-stored-toggle" aria-pressed="${showStored}" title="${showStored?'Guardar de novo':'Mostrar abas e ferramentas guardadas'}"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>`:'';
    const areaNav=areas.length>1||more?`<div class="sy-area-nav">${areas.map(([id,label])=>`<button class="sy-area-btn" data-op="area" data-area="${id}" aria-current="${this.area===id?'page':'false'}"><i class="fa-solid ${areaIcons[id]||'fa-circle'}" aria-hidden="true"></i><span>${label}</span></button>`).join('')}${more}</div>`:'';
    return `<div class="sy-shell"><header><div class="sy-brand-lockup"><img src="modules/quedaco/assets/quedaco-logo.png" alt="QUEDAÇO — por Yuri Satélite"></div></header>${areaNav}${this.library.storedToolsStrip()}${this.renderArea()}</div>`;
  }
  _replaceHTML(result,content){content.innerHTML=result;this.library.filter(content);content.addEventListener('input',this._libraryInput??=(event)=>{if(event.target.name==='libraryQuery'||event.target.matches?.('[data-monster-facet]'))this.library.filter(event.currentTarget);});}
  _scroller(){return this.element?.querySelector?.('.sy-layout>main, .sy-shell>main')??this.element?.querySelector?.('.window-content')??null;}
  async rerender(preserve=true){if(!this.element)return;const scroller=this._scroller();if(preserve&&scroller)this._restoreScroll={top:scroller.scrollTop,left:scroller.scrollLeft};else this._restoreScroll={top:0,left:0};return this.render(true);}
  _onRender(context,options){super._onRender(context,options);if(!this.element)return;const root=this.element,scroller=this._scroller();if(scroller&&this._restoreScroll){scroller.scrollTop=this._restoreScroll.top;scroller.scrollLeft=this._restoreScroll.left;this._restoreScroll=null;}if(this._scrollNpcIntoView){this._scrollNpcIntoView=false;root.querySelector?.('[data-npc-editor]')?.scrollIntoView({block:'nearest',behavior:'smooth'});}if(this._scrollMapDrawerIntoView){this._scrollMapDrawerIntoView=false;root.querySelector?.('.sy-map-drawer')?.scrollIntoView({block:'nearest',behavior:'smooth'});}root.addEventListener('click',this._click??=(event)=>this.handleClick(event));root.addEventListener('change',this._change??=(event)=>this.handleChange(event));root.addEventListener('input',this._input??=(event)=>{
      if(/^(monster|item|guild|npc)CardSize$/.test(event.target.name)){const area=event.target.name.replace('CardSize','');const size=Math.min(420,Math.max(140,Number(event.target.value)||270));this.library.state[event.target.name]=size;for(const grid of root.querySelectorAll(`.sy-${area}-grid`))grid.style.setProperty('--sy-card',`${size}px`);return;}
    });root.addEventListener('toggle',this._atlasToggle??=(event)=>{const details=event.target;if(!details.matches?.('details[data-atlas-open]'))return;const id=details.dataset.atlasOpen;if(!id)return;const open=this.library.state.atlasOpen??(this.library.state.atlasOpen=new Set());if(details.open)open.add(id);else open.delete(id);},true);root.addEventListener('dragstart',this._dragStart??=(event)=>{const card=event.target.closest?.('[data-drag-actor],[data-drag-item]');if(!card||!event.dataTransfer)return;const payload=card.dataset.dragActor?{type:'Actor',uuid:card.dataset.dragActor}:{type:'Item',uuid:card.dataset.dragItem};event.dataTransfer.setData('text/plain',JSON.stringify(payload));event.dataTransfer.effectAllowed='copy';});this._brokenImg??=new Set();for(const image of root.querySelectorAll?.('img[data-fallback-src],img[data-fallback-srcs]')??[]){const chain=[image.getAttribute('src'),...(image.dataset.fallbackSrcs?.split('||')??[]),image.dataset.fallbackSrc].filter(Boolean);const known=this._brokenImg;const firstGood=chain.findIndex(url=>!known.has(url));if(firstGood>0)image.setAttribute('src',chain[firstGood]);const queue=chain.slice(Math.max(0,firstGood)+1).filter(url=>!known.has(url));image.addEventListener('error',()=>{known.add(image.getAttribute('src'));const next=queue.shift();if(next)image.setAttribute('src',next);});}for(const zone of root.querySelectorAll?.('[data-forge-drop]')??[]){zone.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';});zone.addEventListener('drop',async event=>{event.preventDefault();try{const data=JSON.parse(event.dataTransfer.getData('text/plain'));if(data.type!=='Item')throw Error('Arraste um equipamento da ficha.');await this.library.setForgeBase(data.uuid,zone.dataset.forgeDrop);await this.rerender(true);}catch(error){ui.notifications.warn(error.message);}});}this._bindMap(root);this._bindPuzzle(root);}
  /** T13 §2 — quebra-cabeça do Mapa Imersivo. Duas coisas se arrastam:
   *  1. uma caixa do quadro — só muda a posição (grava ao soltar; linhas seguem ao vivo);
   *  2. uma cena da bandeja "sem local" — solta em cima de uma caixa, entra nela.
   *  Clique em botão dentro da caixa continua sendo clique (não inicia arrasto). */
  _bindPuzzle(root){
    const board=root.querySelector?.('[data-puzzle-region]');if(!board)return;
    const regionId=board.dataset.puzzleRegion;
    const redraw=box=>{
      const id=box.dataset.puzzleNode,w=box.offsetWidth,h=box.offsetHeight,x=parseFloat(box.style.left)||0,y=parseFloat(box.style.top)||0;
      for(const line of board.querySelectorAll('line[data-link-from],line[data-link-to]')){
        if(line.dataset.linkFrom===id){line.setAttribute('x1',x+w/2);line.setAttribute('y1',y+h/2);}
        if(line.dataset.linkTo===id){line.setAttribute('x2',x+w/2);line.setAttribute('y2',y+h/2);}
      }
    };
    let drag=null;
    board.addEventListener('pointerdown',event=>{
      const box=event.target.closest('.sy-puzzle-box');
      if(!box||event.button!==0||event.target.closest('button,a,input,select'))return;
      event.preventDefault();
      drag={box,startX:event.clientX,startY:event.clientY,left:parseFloat(box.style.left)||0,top:parseFloat(box.style.top)||0,moved:false};
      box.classList.add('is-dragging');board.setPointerCapture?.(event.pointerId);
    });
    board.addEventListener('pointermove',event=>{
      if(!drag)return;
      const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
      if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<4)return;
      drag.moved=true;
      drag.box.style.left=`${Math.max(0,Math.round(drag.left+dx))}px`;drag.box.style.top=`${Math.max(0,Math.round(drag.top+dy))}px`;
      redraw(drag.box);
    });
    const stop=event=>{
      if(!drag)return;
      const {box,moved}=drag;drag=null;box.classList.remove('is-dragging');
      if(board.hasPointerCapture?.(event.pointerId))board.releasePointerCapture(event.pointerId);
      if(!moved)return;
      const point={x:parseFloat(box.style.left)||0,y:parseFloat(box.style.top)||0};
      // cresce o quadro na hora, se a caixa foi pra além da borda
      board.style.width=`${Math.max(board.offsetWidth,point.x+box.offsetWidth+20)}px`;board.style.height=`${Math.max(board.offsetHeight,point.y+box.offsetHeight+20)}px`;
      const svg=board.querySelector('svg');if(svg){svg.setAttribute('width',board.offsetWidth);svg.setAttribute('height',board.offsetHeight);}
      this.library.setAtlasLayout(regionId,box.dataset.puzzleNode,point).catch(error=>ui.notifications.error(error.message));
    };
    board.addEventListener('pointerup',stop);board.addEventListener('pointercancel',stop);
    for(const chip of root.querySelectorAll('[data-puzzle-loose]')){
      chip.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;event.preventDefault();
        const ghost=chip.cloneNode(true);ghost.classList.add('sy-puzzle-ghost');document.body.append(ghost);
        const place=e=>{ghost.style.left=`${e.clientX+8}px`;ghost.style.top=`${e.clientY+8}px`;};place(event);
        const move=e=>{place(e);for(const box of board.querySelectorAll('.is-drop-target'))box.classList.remove('is-drop-target');document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.sy-puzzle-box:not(.is-missing)')?.classList.add('is-drop-target');};
        const up=async e=>{
          document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);ghost.remove();
          for(const box of board.querySelectorAll('.is-drop-target'))box.classList.remove('is-drop-target');
          const target=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.sy-puzzle-box:not(.is-missing)');
          if(!target||!board.contains(target))return;
          const rect=board.getBoundingClientRect();
          const point={x:Math.max(0,Math.round(e.clientX-rect.left-40)),y:Math.max(0,Math.round(e.clientY-rect.top+30))};
          try{await this.library.dropAtlasScene(regionId,chip.dataset.puzzleLoose,target.dataset.puzzleNode,point);await this.rerender(true);}
          catch(error){ui.notifications.error(error.message);}
        };
        document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);
      });
    }
  }
  _bindMap(root){
    this._mapObserver?.disconnect?.();this._mapObserver=null;
    const viewport=root.querySelector?.('[data-map-viewport]'),world=viewport?.querySelector?.('.sy-map-world'),image=viewport?.querySelector?.('.sy-map-image-base');if(!viewport||!world||!image)return;
    const apply=()=>{const width=image.clientWidth||viewport.clientWidth,height=image.clientHeight||viewport.clientHeight,viewW=viewport.clientWidth,viewH=viewport.clientHeight;this.library.state.map=clampPan(this.library.state.map,width,height,viewW,viewH);const {tx,ty,scale}=this.library.state.map;world.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;};
    if(image.complete)requestAnimationFrame(apply);else image.addEventListener('load',apply,{once:true});
    if(globalThis.ResizeObserver){this._mapObserver=new ResizeObserver(apply);this._mapObserver.observe(viewport);}
    let dragging=false,last=null,pin=null;
    viewport.addEventListener('click',event=>{if(this.library.state.map.movingPins&&event.target.closest('.sy-map-marker')){event.preventDefault();event.stopImmediatePropagation();}},true);
    viewport.addEventListener('pointerdown',event=>{
      const marker=event.target.closest('.sy-map-marker');
      if(this.library.state.map.movingPins&&marker){event.preventDefault();pin=marker;viewport.setPointerCapture?.(event.pointerId);return;}
      if(event.target.closest('button,a,input,select,textarea'))return;dragging=true;last={x:event.clientX,y:event.clientY};viewport.classList.add('is-panning');viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener('pointermove',event=>{
      if(pin){const rect=image.getBoundingClientRect(),x=Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),y=Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100));pin.style.left=`${x}%`;pin.style.top=`${y}%`;pin.dataset.pinX=String(x);pin.dataset.pinY=String(y);return;}
      if(!dragging||!last)return;const dx=event.clientX-last.x,dy=event.clientY-last.y;last={x:event.clientX,y:event.clientY};const state=this.library.state.map;this.library.state.map={...state,tx:state.tx+dx,ty:state.ty+dy};apply();
    });
    const stop=event=>{if(pin){const moved=pin;pin=null;if(moved.dataset.pinX)this.library.setMapHotspot(moved.dataset.pinKind,moved.dataset.pinId,[Number(moved.dataset.pinX),Number(moved.dataset.pinY)]);if(viewport.hasPointerCapture?.(event.pointerId))viewport.releasePointerCapture(event.pointerId);return;}if(!dragging)return;dragging=false;last=null;viewport.classList.remove('is-panning');if(viewport.hasPointerCapture?.(event.pointerId))viewport.releasePointerCapture(event.pointerId);};viewport.addEventListener('pointerup',stop);viewport.addEventListener('pointercancel',stop);
    viewport.addEventListener('wheel',event=>{if(event.target.closest('.sy-map-controls'))return;event.preventDefault();const rect=viewport.getBoundingClientRect(),point={x:event.clientX-rect.left,y:event.clientY-rect.top},factor=event.deltaY<0?1.15:1/1.15,was=this.library.state.map.scale;this.library.state.map=zoomToPoint(this.library.state.map,point,factor);apply();if(this.library.state.map.layer==='auto'&&((was<1.6)!==(this.library.state.map.scale<1.6)))this.rerender(true);},{passive:false});
  }
  renderArea(){
    if(this.area==='modules'&&game.user.isGM)return renderFamilyArea(this.family);
    if(this.area==='ambientacao'&&game.user.isGM)return `${this.message?`<p class="sy-alert" role="status">${e(this.message)}</p>`:''}${renderAmbientacao(game.modules.get(MODULE_ID).api,game.actors)}`;
    if(['npcs','guilds','map','monsters','items','imbue','quests'].includes(this.area))return `${this.message?`<p class="sy-alert" role="status">${e(this.message)}</p>`:''}${this.library.render(this.area,!game.user.isGM)}`;
    const definitions={npcs:['Mercadores','Aliados','Rivais','Figurantes'],map:['Regiões','Cidades e locais','Mapas e cenas','Encontros da região'],monsters:['Aquáticos','Terrestres','Aéreos','Outros'],items:['Armas','Armaduras','Equipamentos','Consumíveis'],quests:['Disponíveis','Ativas','Concluídas']};
    const titles={npcs:'NPCs',map:'Mapa',monsters:'Monstros',items:'Itens',imbue:'Imbuir',quests:'Quests'},items=definitions[this.area]??[];
    return `<main class="sy-empty-area"><small>PAINEL HÍBRIDO DA MESTRA</small><h2>${titles[this.area]}</h2><p>Os cartões desta área serão índices do QUEDAÇO ligados aos documentos nativos da mesa.</p><div class="sy-empty-grid">${items.map(item=>`<section><span class="sy-done sy-pending">·</span><h3>${item}</h3><small>Aguardando preenchimento e vínculo com o Foundry.</small></section>`).join('')}</div></main>`;
  }
  async handleClick(event){
    if(!this.element)return;
    const button=event.target.closest('button[data-op]');
    if(!button||button.disabled||this.busy)return;
    if(button.dataset.op==='lib-open'){try{await this.library.open(button.dataset.id);}catch(error){ui.notifications.warn(error.message);}return;}
    if(button.dataset.op==='lib-region-carousel'){const strip=this.element?.querySelector('.sy-region-carousel');if(strip)strip.scrollBy({left:(button.dataset.id==='next'?1:-1)*240,behavior:'smooth'});return;}
    this.busy=true;button.disabled=true;this.message='';const navigation=button.dataset.op==='area';this.element?.querySelector?.('.sy-shell')?.insertAdjacentHTML('beforeend','<div class="sy-busy" role="status"><span></span><strong>Carregando…</strong></div>');
    try{const {op}=button.dataset;
      if(op==='catalog-edit')await openWorldCatalogEditor(game.modules.get('quedaco').api);
      if(op==='ambient-import')openAmbientImporter(game.modules.get(MODULE_ID).api);
      if(op==='ambient-export')exportAmbientContent(game.modules.get(MODULE_ID).api);
      if(op==='ambient-create-npcs')await createAmbientNpcModels(game.modules.get(MODULE_ID).api,{organizationId:button.dataset.id||undefined});
      if(op==='family-open'){const ok=await this.family?.open(button.dataset.module);if(!ok)ui.notifications.warn('Este módulo não está ativo nesta mesa.');}
      if(op==='area'){const target=button.dataset.area;if(target!=='quests'&&!game.user.isGM&&!this.library.shared.areas.includes(target))throw Error('Esta área ainda não foi liberada pelo mestre.');this.area=target;if(this.area==='monsters'&&game.user.isGM)await this.library.loadActors();if(this.area==='guilds')await this.library.loadSealImages();}
      if(op==='lib-place-img'){const raw=button.dataset.id;if(raw.endsWith(':'))await this.library.setPlaceImage(raw.slice(0,-1),'');else{const FP=foundry.applications.apps.FilePicker.implementation;new FP({type:'image',current:this.library.placeImages[raw]||'',callback:async path=>{await this.library.setPlaceImage(raw,path);this.render(true);}}).render(true);}}
      else if(op==='lib-map-bank-file'){const raw=button.dataset.id;if(raw.endsWith(':'))await this.library.setMapBankFile(raw.slice(0,-1),'');else{const FP=foundry.applications.apps.FilePicker.implementation;new FP({type:'image',current:this.library.mapBankFiles[raw]||'',callback:async path=>{await this.library.setMapBankFile(raw,path);this.render(true);}}).render(true);}}
      else if(op==='lib-region-img'){const raw=button.dataset.id;if(raw.endsWith(':'))await this.library.setRegionImage(raw.slice(0,-1),'');else{const FP=foundry.applications.apps.FilePicker.implementation;new FP({type:'image',current:this.library.regionImages[raw]||'',callback:async path=>{await this.library.setRegionImage(raw,path);this.render(true);}}).render(true);}}
      else if(op.startsWith('lib-')){
        let id=button.dataset.id,data={};
        if(['lib-map-focus','lib-map-zoom','lib-map-reset'].includes(op)){const viewport=button.closest('[data-map-viewport]'),image=viewport?.querySelector('.sy-map-image-base'),rect=viewport?.getBoundingClientRect();data={viewW:viewport?.clientWidth||800,viewH:viewport?.clientHeight||500,imgW:image?.clientWidth||viewport?.clientWidth||800,imgH:image?.clientHeight||viewport?.clientHeight||500,point:{x:(rect?.width||800)/2,y:(rect?.height||500)/2}};}
        if(op==='lib-npc-edit')this._scrollNpcIntoView=true;
        if(op==='lib-place'||op==='lib-map-focus')this._scrollMapDrawerIntoView=true;
        if(op==='lib-region-rumor-add'){const wrap=button.closest('.sy-dossier-add');data={text:wrap?.querySelector('[name="rumorText"]')?.value??''};if(wrap?.querySelector('[name="rumorText"]'))wrap.querySelector('[name="rumorText"]').value='';}
        if(op==='lib-region-scene-info'){const ta=this.element.querySelector(`[name="regionSceneInfo"][data-id="${CSS.escape(button.dataset.id)}"]`)||this.element.querySelector('[name="regionSceneInfo"]');data={text:ta?.value??''};}
        if(op==='lib-region-rumor-edit-save'){const ta=this.element.querySelector(`[name="rumorEditText"][data-id="${CSS.escape(button.dataset.id)}"]`)||this.element.querySelector('[name="rumorEditText"]');data={text:ta?.value??''};}
        if(op==='lib-monster-habitat-add'){const wrap=button.closest('.sy-dossier-add');data={monsterId:wrap?.querySelector('[name="habitatMonster"]')?.value??''};}
        if(op==='lib-monster-import'){const ta=this.element.querySelector('[name="monsterImport"]');data={text:ta?.value??''};}
        if(op==='lib-item-import'){const ta=this.element.querySelector('[name="itemImport"]');data={text:ta?.value??''};}
        if(op==='lib-generate-npc-bulk'){data={count:this.element.querySelector('[name="npcGenCount"]')?.value};}
        if(op==='lib-guild-import'){const ta=this.element.querySelector('[name="guildImport"]');data={text:ta?.value??''};}
        // atlas de cenas: os campos moram no bloco do próprio botão
        if(op==='lib-atlas-edge-add'){const box=button.closest('.sy-scene-atlas-edge-form'),v=n=>box?.querySelector(`[name="${n}"]`);data={fromSceneId:v('atlasEdgeFrom')?.value??'',toSceneId:v('atlasEdgeTo')?.value??'',label:v('atlasEdgeLabel')?.value??'',bidirectional:Boolean(v('atlasEdgeBidirectional')?.checked)};}
        if(op==='lib-atlas-assign'){const box=button.closest('.sy-scene-atlas-scene-tools');data={parentId:box?.querySelector('[name="atlasSceneParent"]')?.value??'unassigned'};}
        if(op==='lib-atlas-suggest-apply')data={sceneIds:Array.from(this.element.querySelectorAll('[name="atlasSuggestion"]:checked')).map(input=>input.value)};
        if(op==='lib-map-bank-apply')data={placeIds:Array.from(this.element.querySelectorAll('[name="mapBankPlace"]:checked')).map(input=>input.value)};
        if(op==='lib-map-bank-adopt-apply')data={placeIds:Array.from(this.element.querySelectorAll('[name="mapBankAdopt"]:checked')).map(input=>input.value)};
        // quebra-cabeça: a caixa nova nasce logo abaixo da caixa-pai escolhida
        if(op==='lib-atlas-puzzle-create'){const box=button.closest('.sy-puzzle-create'),parentId=box?.querySelector('[name="puzzleSceneParent"]')?.value??'unassigned',parent=this.element.querySelector(`[data-puzzle-node="${CSS.escape(parentId)}"]`);data={name:box?.querySelector('[name="puzzleSceneName"]')?.value??'',parentId};if(parent){data.x=parseFloat(parent.style.left)||0;data.y=(parseFloat(parent.style.top)||0)+(parent.offsetHeight||40)+46;}}
        if(op==='lib-atlas-scene-create'){const box=button.closest('.sy-scene-atlas-add');data={name:box?.querySelector('[name="atlasSceneName"]')?.value??''};}
        if(op==='lib-npc-roll-levels'){data={min:this.element.querySelector('[name="npcLevelMin"]')?.value,max:this.element.querySelector('[name="npcLevelMax"]')?.value};}
        if(op.startsWith('lib-npc-')){
          const editor=button.closest('[data-npc-editor]');
          // anotação do jogador: os campos moram no próprio cartão, não no editor do mestre
          if(op==='lib-npc-note-save'){const box=button.closest('.sy-npc-note');data={noteText:box?.querySelector('[name="npcNoteText"]')?.value??'',noteShared:Boolean(box?.querySelector('[name="npcNoteShared"]')?.checked)};}
          if(op==='lib-npc-role2')data={role2:button.closest('.sy-npc-role2')?.querySelector('[name="npcRole2"]')?.value??''};
          // linha da tabela de loja: preço, quantidade e capacidade vêm da própria linha
          if(op==='lib-npc-stock-save'){const tr=button.closest('tr'),v=n=>tr?.querySelector(`[name="${n}"]`)?.value;data={price:v('shopPrice'),qty:v('shopQty'),qtyMax:v('shopQtyMax')};}
          if(op==='lib-npc-save'&&editor){const g=n=>editor.querySelector(`[name="${n}"]`),chk=n=>{const el=g(n);return el?(el.type==='checkbox'?el.checked:el.value==='on'):false;};data={name:g('npcName')?.value,role:g('npcRole')?.value,organizationId:g('npcOrganization')?.value,regionId:g('npcRegion')?.value,placeId:g('npcPlace')?.value,scene:g('npcScene')?.value??'',guildUuid:g('npcGuildUuid')?.value,guild:g('npcGuild')?.value,note:g('npcNote')?.value,markup:g('npcMarkup')?.value,shopNote:g('npcShopNote')?.value,forgeEnabled:chk("npcForgeEnabled"),forgeMarkup:g("npcForgeMarkup")?.value,attitude:g("npcAttitude")?.value,attitudeOverride:g("npcAttitudeOverride")?.value};}
          if(op==='lib-npc-stock-add'&&editor)data={uuid:editor.querySelector('[name="npcStockUuid"]')?.value,price:editor.querySelector('[name="npcStockPrice"]')?.value===''?null:Number(editor.querySelector('[name="npcStockPrice"]')?.value),qty:editor.querySelector('[name="npcStockQty"]')?.value===''?null:Number(editor.querySelector('[name="npcStockQty"]')?.value)};
          if(op==='lib-npc-create-item'&&editor)data={name:editor.querySelector('[name="npcItemName"]')?.value,category:editor.querySelector('[name="npcItemCategory"]')?.value,price:editor.querySelector('[name="npcItemPrice"]')?.value,volume:editor.querySelector('[name="npcItemVolume"]')?.value};
          if(op==='lib-npc-link-suggest'&&editor){const row=button.closest('[data-link-type]');data={type:row?.dataset.linkType,target:row?.querySelector('[name="npcLinkSuggestion"]')?.value,note:'da bio'};}
          if(op==='lib-npc-link-add'&&editor)data={type:editor.querySelector('[name="npcLinkType"]')?.value,target:editor.querySelector('[name="npcLinkTarget"]')?.value,text:editor.querySelector('[name="npcLinkText"]')?.value,note:editor.querySelector('[name="npcLinkNote"]')?.value};
          if(op==='lib-npc-buy'){const row=button.closest('article');data={qty:row?.querySelector('input[type="number"]')?.value};}
          // carrinho e venda leem a quantidade da própria linha, como a compra direta
          if(op==='lib-cart-add'||op==='lib-npc-sell'){const row=button.closest('article');data={qty:row?.querySelector('input[type="number"]')?.value};}
        }
        await this.library.action(op,id,data);
        if(op==='lib-npc-save'){clearTimeout(this._npcSavedTimer);this._npcSavedTimer=setTimeout(()=>{this.library.state.npcSaved=null;if(this.rendered&&this.area==='npcs')this.rerender(true);},1600);}
      }
    }catch(err){this.message=err.message;console.error(MODULE_ID,err);}finally{this.busy=false;this.rerender(!navigation);}
  }
  async handleChange(event){
    const {name,value}=event.target;if(!name)return;
    // caixas de colar/texto livre lidas só na hora do clique (Converter e criar, Adicionar
    // rumor...) não podem re-renderizar ao perder o foco — isso troca a caixa por uma vazia
    // antes do botão ler o valor, porque o texto nunca fica guardado em lugar nenhum.
    if(['monsterImport','itemImport','guildImport','rumorText','regionSceneInfo','rumorEditText'].includes(name)||/^(monster|item|guild|npc)CardSize$/.test(name))return;
    // mesma armadilha no editor de NPC: nome, nota, margens e caixas de item só são lidos
    // quando o botão é clicado, então re-renderizar no blur devolvia o valor antigo.
    if(['npcName','npcOrganization','npcNote','npcGuild','npcShopNote','npcMarkup','npcForgeMarkup','npcTokenVisible','npcDragon','npcForgeEnabled','npcStockPrice','npcStockQty','npcItemName','npcItemPrice','npcItemVolume','npcLinkText','npcLinkNote','npcGenCount','npcNoteText','npcNoteShared','npcRole2','shopPrice','shopQty','shopQtyMax','npcAttitudeOverride','atlasSceneName','atlasSceneParent','atlasEdgeFrom','atlasEdgeTo','atlasEdgeLabel','atlasEdgeBidirectional'].includes(name))return;
    if(name==='libraryQuery'||name==='libraryCategory'){this.library.filter(this.element);return;}
    if(event.target.matches?.('[data-monster-facet]')){
      const facet=event.target.dataset.monsterFacet,checked=Array.from(this.element.querySelectorAll(`[data-monster-facet="${facet}"]:checked`)).map(input=>input.value);
      this.library.state.monsterFacets[facet]=checked;
      const details=event.target.closest('.sy-facet'),count=details?.querySelector('.sy-facet-count');if(count)count.textContent=checked.length?` (${checked.length})`:'';if(details&&checked.length)details.open=true;
      this.library.filter(this.element);return;
    }
    if(event.target.matches?.('[data-guild-facet]')){const facet=event.target.dataset.guildFacet,checked=Array.from(this.element.querySelectorAll(`[data-guild-facet="${facet}"]:checked`)).map(i=>i.value);this.library.state.guildFacets[facet]=checked;const d=event.target.closest('.sy-facet'),c=d?.querySelector('.sy-facet-count');if(c)c.textContent=checked.length?` (${checked.length})`:'';this.library.filter(this.element);return;}
    if(name==='guildStance'){try{await this.library.action('lib-guild-stance',event.target.dataset.id,{stance:value});}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='npcRoleQuick'){try{await this.library.action('lib-npc-role',event.target.dataset.id,{role:value});}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    // atitude trocada ao vivo na visão do jogador, sem abrir o editor do NPC
    if(name==='npcAttitudeLive'){try{await this.library.action('lib-npc-attitude',event.target.dataset.id,{attitude:value});}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='npcSceneQuick'){try{await this.library.action('lib-npc-scene',event.target.dataset.id,{scene:value});}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='regionNpcRole'){try{await this.library.action('lib-region-npc-role',value);}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='monsterHabitatAdd'&&value){try{await this.library.action('lib-monster-habitat',`${event.target.dataset.monster}|${value}|on`);}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='monsterPlaceAdd'&&value){try{await this.library.action('lib-monster-place',`${event.target.dataset.monster}|${value}|on`);}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='monsterAnywhere'){try{await this.library.action('lib-monster-anywhere',`${event.target.dataset.id}|${event.target.checked?'on':'off'}`);}catch(error){ui.notifications.warn(error.message);}this.rerender(true);return;}
    if(name==='npcRole'&&event.target.closest?.('[data-npc-editor]')){this.library.state.npcEditRole=value;this.rerender(true);return;}
    if(name==='npcRegion'&&event.target.closest?.('[data-npc-editor]')){this.library.state.npcEditRegion=value;this.library.state.npcEditPlace='';this.rerender(true);return;}
    if(name==='npcPlace'&&event.target.closest?.('[data-npc-editor]')){this.library.state.npcEditPlace=value;this.rerender(true);return;}
    if(name==='npcPlaceFilter'){this.library.state.npcPlaceFilter=value;this.rerender(true);return;}
    // trocar de legado zera a herança: as opções da lista mudam junto
    if(name==='npcLegacyFilter'){this.library.state.npcLegacyFilter=value;this.library.state.npcHeritageFilter='all';this.rerender(true);return;}
    if(name==='npcHeritageFilter'){this.library.state.npcHeritageFilter=value;this.rerender(true);return;}
    if(name==='npcGuildFilter'){this.library.state.npcGuildFilter=value;this.rerender(true);return;}
    if(name==='localNpcRole'||name==='localNpcLegacy'){this.library.state[name]=value;this.rerender(true);return;}
    if(name==='npcLevelMin'||name==='npcLevelMax'){this.library.state[name]=value===''?(name==='npcLevelMin'?0:12):Math.max(0,Math.min(12,Number(value)||0));this.rerender(true);return;}
    if(name==='npcLinkFilter'){this.library.state.npcLink=value;this.rerender(true);return;}
    if(name==='modBase'){this.library.modBuilder={baseId:value,materialId:'',sigils:[],tab:this.library.modBuilder.tab??'prefixo'};this.rerender(true);return;}
    if(name==='forgeMaterial'){this.library.forgeBuilder.materialId=value;this.rerender(true);return;}
    if(name==='modMaterial'){this.library.modBuilder.materialId=value;this.rerender(true);return;}
    this.rerender(true);
  }
}
