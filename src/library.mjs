import {REGIONS,PLACES,BEYOND} from './book-world.mjs';
import {BASE_ITEMS,MODIFICATION_GUIDES,SIGIL_COSTS,IMBUE_COSTS} from './book-items.mjs';
import {SIGILS} from './book-sigils.mjs';
import {MONSTERS} from './book-monsters.mjs';
import {MODULE_ID,purchaseItem} from './adapter.mjs';
import {NPC_LINK_TYPES,NPC_ROLES,NPC_ROLE_STYLE,adoptNpcFlag,inferPlaceId,inferRegionId,isGeneratedNpc,linksFromBio,itemTypeForCategory,npcCardOutline,npcCoverage,normalizeNpcLinks,npcFlag,npcLinkSummary,npcVisibility,stripTags} from './npcs.mjs';
import {modifiedItemSheet} from './item-mod.mjs';
import {clampPan,focusRegion,resolveHotspot,zoomToPoint} from './map-view.mjs';
import {equipmentKind,forgeFragments,forgeQuote,magicNamePreview,purchaseForgedItem,sigilCompatible} from './forge.mjs';
import {walletTotal} from './rules.mjs';
import {localityStock} from './locality.mjs';
import {ImageResolver} from './images.mjs';
import {placeLayer,defaultHiddenPlaces,regionDossier} from './atlas.mjs';
import {regionColor} from './regions.mjs';
import {ForienQuestIntegration,QUEST_STATUSES,questCounts} from './forien-quests.mjs';
import {generatorScope} from './generator.mjs';
import {normalizeMonsterInput,toSkyfallNpc} from './monster-convert.mjs';
import {rollLevel} from './npc-level.mjs';
import {guildKind,guildsForPlace,npcGuildLabel,cleanSeal,guildThemes,GUILD_STANCES,guildMembers,guildLevel} from './guilds.mjs';

export const BOOK_ITEMS=[...BASE_ITEMS,...SIGILS];

// Conteúdo que o mestre libera para os jogadores. Guardado no mundo, sem UUIDs privados.
export const SHARED_KEY='sharedContent';
export const SCENES_KEY='placeScenes';
export const REGION_SCENES_KEY='regionScenes';
export const PLACE_IMG_KEY='placeImages';
export const REGION_IMG_KEY='regionImages';
export const MAP_IMAGE_KEY='opathMapImage';
export const MAP_HOTSPOTS_KEY='mapHotspots';
export const MAP_HIDDEN_KEY='mapHidden';
export const MONSTER_HABITATS_KEY='monsterHabitats';
export const REGION_RUMORS_KEY='regionRumors';
export const ASSET_ROOT_KEY='assetRoot';
export const ITEM_COMPENDIUM_KEY='itemCompendium';
export const NPC_LINKS_KEY='npcLinks';
export const NPC_GRAPH_KEY='npcGraph';
export const GENERATOR_MACRO_KEY='generatorMacro';
export const DEFAULT_GENERATOR_MACRO='Skyfall — Criador de Conteúdo';
export const emptyShare=()=>({areas:[],map:[],monsters:[],items:[],npcs:[],guilds:[]});
export const generatorMacroName=settings=>String(settings?.get?.(MODULE_ID,GENERATOR_MACRO_KEY)||DEFAULT_GENERATOR_MACRO);
export function registerLibrarySettings(game,onChange){
  game.settings.register(MODULE_ID,SHARED_KEY,{scope:'world',config:false,type:Object,default:emptyShare(),onChange});
  game.settings.register(MODULE_ID,SCENES_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,REGION_SCENES_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,PLACE_IMG_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,REGION_IMG_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,ASSET_ROOT_KEY,{scope:'world',config:true,type:String,default:'assets',filePicker:'folder',name:'Pasta de imagens do QUEDAÇO',hint:'Pasta da mesa com regioes, locais, npcs, monstros, itens, quests e o arquivo opcional quedaco-imagens.json. Padrao: assets',onChange});
  game.settings.register(MODULE_ID,MAP_HOTSPOTS_KEY,{scope:'world',config:false,type:Object,default:{regions:{},places:{}},onChange});
  game.settings.register(MODULE_ID,MAP_HIDDEN_KEY,{scope:'world',config:false,type:Array,default:null,onChange});
  game.settings.register(MODULE_ID,MONSTER_HABITATS_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,REGION_RUMORS_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,MAP_IMAGE_KEY,{scope:'world',config:true,type:String,default:'',filePicker:'image',
    name:'Imagem do mapa de Opath',hint:'Arquivo no armazenamento da mesa (não acompanha o módulo). Aparece no topo do índice do Mapa.',onChange});
  game.settings.register(MODULE_ID,ITEM_COMPENDIUM_KEY,{scope:'world',config:true,type:String,default:'',
    name:'Compêndio de itens do QUEDAÇO',hint:'Collection do compêndio onde o mestre cria itens tabelados para lojas. Deixe vazio para desabilitar a criação.',onChange});
  game.settings.register(MODULE_ID,NPC_LINKS_KEY,{scope:'world',config:false,type:Array,default:[],onChange});
  game.settings.register(MODULE_ID,NPC_GRAPH_KEY,{scope:'world',config:false,type:Object,default:{},onChange});
  game.settings.register(MODULE_ID,GENERATOR_MACRO_KEY,{scope:'world',config:true,type:String,default:DEFAULT_GENERATOR_MACRO,
    name:'Macro geradora de conteúdo',hint:'Nome da macro do mestre que o QUEDAÇO abre quando uma ameaça não existe na biblioteca.',onChange});
}
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const nameKey=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+]+/g,' ').trim().replace(/\s+/g,' ');
const page=entry=>`Livro Básico 1.25 · p. ${entry.page}`;
const currency=value=>`T$ ${Number(value).toLocaleString('pt-BR')}`;
const button=(op,id,label,className='')=>`<button${className?` class="${e(className)}"`:''} data-op="lib-${op}" data-id="${e(id)}">${e(label)}</button>`;
const chips=values=>`<div class="sy-library-chips">${values.filter(v=>v!==null&&v!==undefined&&v!=='').map(v=>`<span>${e(v)}</span>`).join('')}</div>`;
const thumb=image=>{
  const src=typeof image==='string'?image:image?.src||'';
  const fallbacks=typeof image==='string'?[]:(Array.isArray(image?.fallbacks)?image.fallbacks:[]);
  const chain=[src,...fallbacks].filter(Boolean);
  if(!chain.length||chain.every(url=>/mystery-man|item-bag|svg\/(mystery|blank|item)/.test(String(url))))return '';
  return `<img class="sy-library-thumb" src="${e(chain[0])}" alt="" loading="lazy"${chain.length>1?` data-fallback-srcs="${e(chain.slice(1).join('||'))}"`:''}>`;
};
const avatarThumb=(src,fallbacks=[])=>{const list=(Array.isArray(fallbacks)?fallbacks:[fallbacks]).filter(Boolean);return `<img class="sy-library-thumb" src="${e(src||'icons/svg/mystery-man.svg')}" alt="" loading="lazy"${list.length?` data-fallback-srcs="${e(list.join('||'))}"`:''}>`;};
const avatarFor=img=>avatarThumb(img.src,img.fallbacks);
const npcRoleChip=role=>{const style=NPC_ROLE_STYLE[role]??NPC_ROLE_STYLE.extra;return `<span class="sy-npc-role" data-role="${e(role)}" style="--sy-role:${e(style.color)}"><i class="fa-solid ${e(style.icon)}" aria-hidden="true"></i>${e(style.label)}</span>`;};
const sortByName=list=>[...(list??[])].sort((a,b)=>String(a?.name??'').localeCompare(String(b?.name??''),'pt-BR'));
const NPC_ASPECTS=[['legacy','Legado'],['heritage','Herança'],['class','Classe'],['path','Trilha'],['curse','Maldição'],['background','Antecedente']];
const npcAspectChips=actor=>NPC_ASPECTS.map(([type,label])=>{const it=Array.from(actor?.items??[]).find(entry=>entry.type===type);if(!it)return '';const img=it.img&&!/mystery-man|svg\/(item|blank)/.test(String(it.img))?`<img src="${e(it.img)}" alt="" loading="lazy">`:'';return `<span class="sy-npc-chip" title="${e(label)}: ${e(it.name)}">${img}<b>${e(label)}</b>${e(it.name)}</span>`;}).filter(Boolean).join('');
const npcStatBadges=actor=>{const s=actor?.system??{},out=[];const lvl=s.level?.value;if(lvl!=null)out.push(`<span class="sy-npc-stat is-level" title="Nível"><b>Nv</b>${e(lvl)}</span>`);const hp=s.resources?.hp;if(hp&&hp.max)out.push(`<span class="sy-npc-stat is-hp" title="Pontos de Vida"><b>PV</b>${e(hp.value??0)}/${e(hp.max)}</span>`);const ep=s.resources?.ep;if(ep&&ep.max)out.push(`<span class="sy-npc-stat is-ep" title="Pontos de Esforço"><b>PE</b>${e(ep.value??0)}/${e(ep.max)}</span>`);const sh=s.resources?.shadow;if(sh&&sh.value!=null)out.push(`<span class="sy-npc-stat is-shadow" title="Pontos de Sombra gastos"><b>Sombra</b>${e(Math.max(0,5-(Number(sh.value)||0)))}/5</span>`);return out.length?`<div class="sy-npc-stats">${out.join('')}</div>`:'';};
const figurePencil=edit=>edit?`<button class="sy-figure-edit" data-op="lib-${e(edit.op)}" data-id="${e(edit.id)}" title="Trocar imagem" aria-label="Trocar imagem"><i class="fa-solid fa-pencil" aria-hidden="true"></i></button>`:'';
const cardFigure=(src,name,size='wide',fallback='',edit=null)=>{const fallbacks=(Array.isArray(fallback)?fallback:[fallback]).filter(Boolean);return src?`<div class="sy-card-figure sy-card-figure-${e(size)}"><img src="${e(src)}" alt="${e(name)}" loading="lazy"${fallbacks.length?` data-fallback-srcs="${e(fallbacks.join('||'))}"`:''}>${figurePencil(edit)}</div>`:(edit?`<div class="sy-card-figure sy-card-figure-${e(size)} sy-card-figure-empty">${figurePencil(edit)}</div>`:'');};
const typesFor=entry=>entry.category==='Sigilos'?['sigil']:entry.category?.startsWith('Armas')?['weapon']:entry.category==='Armaduras e escudos'?['armor','weapon']:entry.category==='Vestimentas'?['clothing']:entry.category==='Consumíveis'?['consumable']:['weapon','armor','clothing','equipment','consumable','loot','seal'];
export function itemFallback(entry){
  const category=String(entry?.category??'');
  if(category==='Munição')return 'icons/weapons/ammunition/arrow-head-war-flight.webp';
  if(category.startsWith('Armas'))return 'icons/svg/sword.svg';
  if(category==='Armaduras e escudos')return 'icons/equipment/chest/breastplate-layered-steel.webp';
  if(category==='Vestimentas')return 'icons/equipment/back/cloak-heavy-fur-blue.webp';
  if(category==='Consumíveis')return 'icons/consumables/potions/bottle-bulb-corked-glowing-red.webp';
  return 'icons/containers/bags/pack-leather-white-tan.webp';
}

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
const monsterRoles=entry=>(String(entry.role).split('·')[1]??'').split(',').map(value=>value.trim()).filter(Boolean);
const monsterTier=entry=>String(entry.role).split('·')[0].trim();
const monsterNdBand=nd=>nd<=4?'ND 1–4':nd<=8?'ND 5–8':nd<=12?'ND 9–12':'ND 13+';
export function monsterFacetValues(entry){return {tipo:[entry.creatureType],papel:monsterRoles(entry),porte:[monsterTier(entry)],desloc:Array.from(entry.movement??[]),nd:[monsterNdBand(entry.nd)],conf:entry.status?[entry.status]:[]};}
export function monsterMatches(entry,filters={}){
  const values=monsterFacetValues(entry);
  return Object.entries(filters).every(([facet,selected])=>!Array.isArray(selected)||!selected.length||selected.some(value=>(values[facet]??[]).includes(value)));
}
export function monsterCategory(entry){return Object.entries(monsterFacetValues(entry)).flatMap(([facet,values])=>values.map(value=>`${facet}:${value}`)).join('|');}

export class CampaignLibrary {
  constructor(game,catalog){this.game=game;this.catalog=catalog;this.images=new ImageResolver(game,MODULE_ID,ASSET_ROOT_KEY);this.quests=new ForienQuestIntegration(game);this.actors=[];this.failures=[];this.loaded=false;this.state={mapView:'regions',region:null,place:null,map:{scale:1,tx:0,ty:0,focus:null,layer:'auto',movingPins:false},npcRole:'all',npcLink:'all',npcPlaceFilter:'all',npcActor:null,npcSaved:null,npcEditRole:null,npcEditPlace:null,monsterFacets:{},guildFacets:{},questStatus:'all'};this.modBuilder={baseId:'',materialId:'',sigils:[],tab:'prefixo'};this.forgeBuilder={smithId:'',baseUuid:'',materialId:'',sigils:[],tab:'prefixo'};}
  image(kind,id,documentImg='',fallback='icons/svg/mystery-man.svg'){return this.images.resolve(kind,id,documentImg,fallback);}
  assertGM(){if(!this.game.user?.isGM)throw Error('Esta área está disponível somente para o mestre.');}
  get shared(){try{return {...emptyShare(),...(this.game.settings?.get(MODULE_ID,SHARED_KEY)||{})};}catch{return emptyShare();}}
  get placeScenes(){try{return {...(this.game.settings?.get(MODULE_ID,SCENES_KEY)||{})};}catch{return {};}}
  get placeImages(){try{return {...(this.game.settings?.get(MODULE_ID,PLACE_IMG_KEY)||{})};}catch{return {};}}
  get regionScenes(){try{return {...(this.game.settings?.get(MODULE_ID,REGION_SCENES_KEY)||{})};}catch{return {};}}
  async toggleRegionScene(regionId,sceneId){
    this.assertGM();if(!regionId||!REGIONS.some(region=>region.id===regionId))return;
    const map=this.regionScenes;let list=Array.isArray(map[regionId])?[...map[regionId]]:[];
    if(!sceneId)delete map[regionId];
    else{const index=list.indexOf(sceneId);if(index>=0)list.splice(index,1);else list.push(sceneId);if(list.length)map[regionId]=list;else delete map[regionId];}
    await this.game.settings.set(MODULE_ID,REGION_SCENES_KEY,map);
  }
  get regionImages(){try{return {...(this.game.settings?.get(MODULE_ID,REGION_IMG_KEY)||{})};}catch{return {};}}
  get mapHotspots(){try{return {...(this.game.settings?.get(MODULE_ID,MAP_HOTSPOTS_KEY)||{regions:{},places:{}})};}catch{return {regions:{},places:{}};}}
  async setMapHotspot(kind,id,point){this.assertGM();if(!['regions','places'].includes(kind)||!id)return;const current={regions:{...(this.mapHotspots.regions??{})},places:{...(this.mapHotspots.places??{})}};if(point)current[kind][id]=point;else delete current[kind][id];await this.game.settings.set(MODULE_ID,MAP_HOTSPOTS_KEY,current);}
  get mapHidden(){try{const value=this.game.settings?.get(MODULE_ID,MAP_HIDDEN_KEY);return Array.isArray(value)?new Set(value):defaultHiddenPlaces(PLACES);}catch{return defaultHiddenPlaces(PLACES);}}
  async setMapHidden(id,hidden){this.assertGM();if(!id)return;const set=new Set(this.mapHidden);if(hidden)set.add(String(id));else set.delete(String(id));await this.game.settings.set(MODULE_ID,MAP_HIDDEN_KEY,[...set]);}
  get monsterHabitats(){try{return {...(this.game.settings?.get(MODULE_ID,MONSTER_HABITATS_KEY)||{})};}catch{return {};}}
  async setMonsterHabitat(monsterId,regionId,on){this.assertGM();if(!monsterId||!regionId)return;const map=this.monsterHabitats,list=new Set(Array.isArray(map[monsterId])?map[monsterId]:[]);if(on)list.add(regionId);else list.delete(regionId);map[monsterId]=[...list];if(!map[monsterId].length)delete map[monsterId];await this.game.settings.set(MODULE_ID,MONSTER_HABITATS_KEY,map);}
  get regionRumors(){try{return {...(this.game.settings?.get(MODULE_ID,REGION_RUMORS_KEY)||{})};}catch{return {};}}
  async addRegionRumor(regionId,text){this.assertGM();if(!regionId||!String(text).trim())return;const map=this.regionRumors,list=Array.isArray(map[regionId])?[...map[regionId]]:[];list.push({id:`r${Date.now().toString(36)}`,text:String(text).trim(),shared:false});map[regionId]=list;await this.game.settings.set(MODULE_ID,REGION_RUMORS_KEY,map);}
  async updateRegionRumor(regionId,rumorId,change){this.assertGM();const map=this.regionRumors,list=Array.isArray(map[regionId])?[...map[regionId]]:[];const idx=list.findIndex(item=>item.id===rumorId);if(idx<0)return;if(change==='remove')list.splice(idx,1);else if(change==='share')list[idx]={...list[idx],shared:!list[idx].shared};map[regionId]=list;await this.game.settings.set(MODULE_ID,REGION_RUMORS_KEY,map);}
  get resolvedMapImage(){return this.mapImage||this.image('map','opath','','').src;}
  get mapImage(){try{const value=this.game.settings?.get(MODULE_ID,MAP_IMAGE_KEY);return typeof value==='string'?value:'';}catch{return '';}}
  regionColor(id){return regionColor(id,this.game.folders,REGIONS);}
  get npcLinks(){try{return normalizeNpcLinks(this.game.settings?.get(MODULE_ID,NPC_LINKS_KEY)||[]);}catch{return [];}}
  async setPlaceScene(placeId,sceneId){
    this.assertGM();if(!placeId)return;
    const current={...(this.game.settings.get(MODULE_ID,SCENES_KEY)||{})};
    if(!sceneId||current[placeId]===sceneId)delete current[placeId];else current[placeId]=sceneId;
    await this.game.settings.set(MODULE_ID,SCENES_KEY,current);
  }
  async setPlaceImage(placeId,path){
    this.assertGM();if(!placeId)return;
    const current={...(this.game.settings.get(MODULE_ID,PLACE_IMG_KEY)||{})};
    if(!path)delete current[placeId];else current[placeId]=String(path);
    await this.game.settings.set(MODULE_ID,PLACE_IMG_KEY,current);
  }
  async setRegionImage(regionId,path){
    this.assertGM();if(!regionId||!REGIONS.some(region=>region.id===regionId))return;
    const current={...(this.game.settings.get(MODULE_ID,REGION_IMG_KEY)||{})};
    if(!path)delete current[regionId];else current[regionId]=String(path);
    await this.game.settings.set(MODULE_ID,REGION_IMG_KEY,current);
  }
  async setShare(bucket,value){
    this.assertGM();
    if(!['areas','map','monsters','items','npcs','guilds'].includes(bucket)||!value)return;
    const current={...emptyShare(),...(this.game.settings.get(MODULE_ID,SHARED_KEY)||{})};
    const list=Array.isArray(current[bucket])?[...current[bucket]]:[];
    const i=list.indexOf(value);if(i>=0)list.splice(i,1);else list.push(value);
    current[bucket]=list;
    // Liberar um item de uma aba implica liberar a aba.
    if(bucket!=='areas'&&list.length&&!current.areas.includes(bucket))current.areas=[...current.areas,bucket];
    await this.game.settings.set(MODULE_ID,SHARED_KEY,current);
  }
  async rollNpcLevels(min,max,force=false){
    this.assertGM();
    const lo=Math.max(1,Math.min(12,Math.floor(Number(min)||1))),hi=Math.max(lo,Math.min(12,Math.floor(Number(max)||lo)));
    const targets=this.npcActors().filter(actor=>!actor.hasPlayerOwner&&actor.system?.level&&(force||(Number(actor.system?.level?.value)||0)<=1));
    if(!targets.length){globalThis.ui?.notifications?.warn?.('Nenhum NPC para sortear (todos já têm nível acima de 1).');return 0;}
    const updates=targets.map(actor=>({_id:actor.id,'system.level.value':rollLevel(lo,hi)}));
    await Actor.updateDocuments(updates);
    globalThis.ui?.notifications?.info?.(`Nível sorteado (${lo}–${hi}) para ${targets.length} NPC(s).`);
    return targets.length;
  }
  guildActors(){return sortByName(Array.from(this.game.actors??[]).filter(guildKind));}
  async setGuildStance(uuid,stance){
    this.assertGM();const actor=this.guildActors().find(guild=>guild.uuid===uuid||guild.id===uuid);if(!actor)return;
    const value=GUILD_STANCES[stance]?stance:'desconhecida';
    await actor.update({[`flags.${MODULE_ID}.guild`]:{...(actor.flags?.[MODULE_ID]?.guild??{}),stance:value}});
  }
  async importGuilds(input=''){
    this.assertGM();
    let parsed=null;
    const text=String(input??'').trim();
    if(text){try{parsed=JSON.parse(text);}catch{throw Error('O texto colado não é um JSON válido de guildas.');}}
    else{
      const response=await fetch('modules/quedaco/.local/guildas-foundry.json').catch(()=>null);
      if(!response?.ok)throw Error('Cole o conteúdo do arquivo guildas-foundry.json na caixa, ou deixe-o em Data/modules/quedaco/.local/guildas-foundry.json.');
      parsed=await response.json();
    }
    const documents=Array.isArray(parsed)?parsed:Array.isArray(parsed?.documents)?parsed.documents:[];
    const sources=documents.filter(source=>source?.type==='guild'&&source?.name);
    if(!sources.length)throw Error('O arquivo não contém Actors do tipo guild.');
    const existing=new Set(this.guildActors().map(actor=>nameKey(actor.name))),fresh=sources.filter(source=>!existing.has(nameKey(source.name)));
    const confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:'Importar guildas do apêndice'},content:`<p>${sources.length} guilda(s) encontrada(s); ${fresh.length} ainda não existem nesta mesa. Importar agora?</p>`,yes:{label:'Importar'},no:{label:'Cancelar'}});
    if(!confirmed||!fresh.length)return 0;
    let folder=Array.from(this.game.folders??[]).find(entry=>entry.type==='Actor'&&entry.name==='Guildas · Apêndice B');
    if(!folder)folder=await Folder.create({name:'Guildas · Apêndice B',type:'Actor'});
    await Actor.createDocuments(fresh.map(source=>{const copy=foundry.utils.deepClone(source);delete copy._id;return {...copy,folder:folder.id};}));
    globalThis.ui?.notifications?.info?.(`${fresh.length} guilda(s) importada(s).`);return fresh.length;
  }
  async setMapShares(mode){
    this.assertGM();const current={...emptyShare(),...(this.game.settings.get(MODULE_ID,SHARED_KEY)||{})};
    if(mode==='regions')current.map=REGIONS.map(region=>region.id);
    else if(mode==='all')current.map=[...REGIONS.map(region=>region.id),...PLACES.map(place=>place.id)];
    else if(mode==='none')current.map=[];else return;
    if(current.map.length&&!current.areas.includes('map'))current.areas=[...current.areas,'map'];
    await this.game.settings.set(MODULE_ID,SHARED_KEY,current);
  }
  sharedPlaceIds(){const s=this.shared.map;const ids=new Set(s);for(const r of REGIONS)if(s.includes(r.id))for(const p of PLACES)if(p.regionId===r.id)ids.add(p.id);return ids;}
  async shareLocality(kind,id){
    this.assertGM();
    const current={...emptyShare(),...(this.game.settings.get(MODULE_ID,SHARED_KEY)||{})};
    const map=new Set(current.map),npcs=new Set(current.npcs),monsters=new Set(current.monsters),areas=new Set(current.areas);
    const addNpcs=match=>{for(const actor of this.npcActors()){const flag=npcFlag(actor)??adoptNpcFlag(actor);if(match(flag))npcs.add(actor.uuid);}};
    if(kind==='place'){
      const place=PLACES.find(entry=>entry.id===id);if(!place)return;
      map.add(place.id);addNpcs(flag=>flag.placeId===place.id);areas.add('map');areas.add('npcs');
    }else if(kind==='region'){
      const region=REGIONS.find(entry=>entry.id===id);if(!region)return;
      map.add(region.id);for(const place of PLACES)if(place.regionId===region.id)map.add(place.id);
      addNpcs(flag=>flag.regionId===region.id||PLACES.find(place=>place.id===flag.placeId)?.regionId===region.id);
      for(const [monsterId,list] of Object.entries(this.monsterHabitats))if(Array.isArray(list)&&list.includes(region.id))monsters.add(monsterId);
      areas.add('map');areas.add('npcs');if(monsters.size)areas.add('monsters');
    }else return;
    await this.game.settings.set(MODULE_ID,SHARED_KEY,{...current,map:[...map],npcs:[...npcs],monsters:[...monsters],areas:[...areas]});
    globalThis.ui?.notifications?.info?.('Conteúdo do local liberado para os jogadores.');
  }
  shareButton(bucket,value,labelOn,labelOff){const on=this.shared[bucket]?.includes(value);return `<button class="sy-share-toggle ${on?'is-on':''}" data-op="lib-share" data-id="${e(bucket)}:${e(value)}">${on?labelOn:labelOff}</button>`;}
  async loadActors(force=false){
    this.assertGM();if(this.loaded&&!force)return;
    this.actors=[];this.failures=[];
    for(const actor of this.game.actors??[]){if(actor.visible!==false)this.actors.push({name:actor.name,type:actor.type,img:actor.img,uuid:actor.uuid??`Actor.${actor.id}`,source:'Mundo'});}
    for(const pack of this.game.packs??[]){
      if(pack.documentName!=='Actor'||(pack.metadata?.system&&pack.metadata.system!=='skyfall'))continue;
      if(pack.visible===false){this.failures.push({pack:pack.collection,reason:'Sem permissão de leitura'});continue;}
      try{const index=await pack.getIndex({fields:['name','type','img']});for(const item of index)this.actors.push({name:item.name,type:item.type,img:item.img,uuid:item.uuid??`Compendium.${pack.collection}.Actor.${item._id}`,source:pack.metadata?.label??pack.collection});}
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
  async action(op,id,data={}){
    const openOps=['lib-map','lib-region','lib-place','lib-map-focus','lib-map-zoom','lib-map-reset','lib-map-layer','lib-open-scene','lib-npc-buy','lib-npc-open','lib-forge-clear','lib-forge-add','lib-forge-remove','lib-forge-imbue','lib-forge-tab','lib-forge-pay','lib-forge-base','lib-imbue-pay','lib-quest-filter','lib-quest-open'];
    if(!openOps.includes(op))this.assertGM();
    if(op==='lib-map'){this.state.mapView=id;this.state.region=null;this.state.place=null;if(id==='regions')this.state.map={scale:1,tx:0,ty:0,focus:null};}
    if(op==='lib-region'){if(!REGIONS.some(i=>i.id===id)||(!this.game.user?.isGM&&!this.shared.map.includes(id)))return;this.state.mapView='regions';this.state.region=id;this.state.place=null;}
    if(op==='lib-map-focus'){
      if(!REGIONS.some(i=>i.id===id)||(!this.game.user?.isGM&&!this.shared.map.includes(id)))return;
      const focused=focusRegion(id,REGIONS,data.viewW??800,data.viewH??500,data.imgW??data.viewW??800,data.imgH??data.viewH??500);if(!focused)return;
      this.state.map=focused;this.state.mapView='regions';this.state.region=id;this.state.place=null;
    }
    if(op==='lib-map-zoom'){
      const factor=id==='in'?1.2:1/1.2,point=data.point??{x:(data.viewW??800)/2,y:(data.viewH??500)/2};
      this.state.map=clampPan(zoomToPoint(this.state.map,point,factor),data.imgW??data.viewW??800,data.imgH??data.viewH??500,data.viewW??800,data.viewH??500);
    }
    if(op==='lib-map-reset'){this.state.map={...this.state.map,scale:1,tx:0,ty:0,focus:null};this.state.mapView='regions';this.state.region=null;this.state.place=null;}
    if(op==='lib-map-layer')this.state.map={...this.state.map,layer:['auto','regions','cities','marks','falls','all'].includes(id)?id:'auto'};
    if(op==='lib-map-hide'){const [pid,mode]=String(id).split(':');await this.setMapHidden(pid,mode!=='show');}
    if(op==='lib-map-share-all')await this.setMapShares(id);
    if(op==='lib-share-locality'){const cut=String(id).indexOf(':');await this.shareLocality(String(id).slice(0,cut),String(id).slice(cut+1));}
    if(op==='lib-region-scene'){const cut=String(id).indexOf(':');await this.toggleRegionScene(String(id).slice(0,cut),String(id).slice(cut+1));}
    if(op==='lib-map-pins')this.state.map={...this.state.map,movingPins:!this.state.map.movingPins};
    if(op==='lib-map-hotspot-reset'){const [kind,pinId]=String(id).split(':');await this.setMapHotspot(kind,pinId,null);}
    if(op==='lib-place'){const place=[...PLACES,...BEYOND].find(i=>i.id===id);if(!place||(!this.game.user?.isGM&&!this.sharedPlaceIds().has(id)))return;this.state.mapView=place.regionId?'regions':'beyond';this.state.region=place.regionId??null;this.state.place=id;}
    if(op==='lib-open')await this.open(id);
    if(op==='lib-refresh')await this.loadActors(true);
    if(op==='lib-export-tokens'){const documents=id==='npcs'?this.npcActors().map(actor=>({uuid:actor.uuid,name:actor.name,type:actor.type,role:(npcFlag(actor)??adoptNpcFlag(actor)).role,biography:actor.system?.biography??actor.system?.details?.description??''})):monsterAudit(this.actors,this.failures,this.loaded).filter(entry=>entry.matches[0]).map(entry=>({uuid:entry.matches[0].uuid,name:entry.name,type:'npc',creatureType:entry.creatureType,role:entry.role}));saveDataToFile(JSON.stringify({documents},null,2),'application/json','fichas-para-casar.json');}
    if(op==='lib-report')saveDataToFile(JSON.stringify(this.report(),null,2),'application/json','quedaco-monstros-pendentes.json');
    if(op==='lib-share'){const idx=String(id).indexOf(':');await this.setShare(String(id).slice(0,idx),String(id).slice(idx+1));}
    if(op==='lib-scene'){const idx=String(id).indexOf(':');await this.setPlaceScene(String(id).slice(0,idx),String(id).slice(idx+1));}
    if(op==='lib-open-scene'){const scene=this.game.scenes?.get?.(id);if(scene)scene.view?.();}
    if(op==='lib-activate-scene'){this.assertGM();const scene=this.game.scenes?.get?.(id);if(scene)await scene.activate?.();}
    if(op==='lib-npc-edit'){
      const actor=this.actorById(id);if(!actor)throw Error('NPC não encontrado.');
      this.state.npcActor=actor.id;this.state.npcEditRole=null;this.state.npcEditPlace=null;
    }
    if(op==='lib-npc-close'){this.state.npcActor=null;this.state.npcEditRole=null;this.state.npcEditPlace=null;}
    if(op==='lib-npc-roll-levels')await this.rollNpcLevels(data.min,data.max,id==='force');
    if(op==='lib-guild-import')await this.importGuilds(data.text);
    if(op==='lib-guild-stance')await this.setGuildStance(id,data.stance);
    if(op==='lib-region-rumor-add')await this.addRegionRumor(id,data.text);
    if(op==='lib-region-rumor'){const [regionId,rumorId,change]=String(id).split('|');await this.updateRegionRumor(regionId,rumorId,change);}
    if(op==='lib-monster-habitat'){const [monsterId,regionId,mode]=String(id).split('|');await this.setMonsterHabitat(monsterId,regionId,mode!=='off');}
    if(op==='lib-monster-habitat-add'&&data.monsterId)await this.setMonsterHabitat(data.monsterId,id,true);
    if(op==='lib-npc-role'){this.assertGM();const actor=this.actorById(id);if(actor&&NPC_ROLES[data.role]){const current=npcFlag(actor)??adoptNpcFlag(actor);await actor.update({[`flags.${MODULE_ID}.npc`]:{...current,role:data.role}});this.state.npcSaved=actor.id;}}
    if(op==='lib-npc-filter')this.state.npcRole=NPC_ROLES[id]?id:'all';
    if(op==='lib-npc-link-filter')this.state.npcLink=NPC_LINK_TYPES[id]?id:'all';
    if(op==='lib-npc-place-accept'){
      const split=String(id).lastIndexOf(':'),actor=this.actorById(String(id).slice(0,split)),placeId=String(id).slice(split+1);
      if(!actor||!PLACES.some(place=>place.id===placeId))throw Error('Local sugerido inválido.');
      await actor.update({[`flags.${MODULE_ID}.npc`]:{...(npcFlag(actor)??adoptNpcFlag(actor)),regionId:PLACES.find(place=>place.id===placeId)?.regionId??'',placeId}});this.state.npcActor=actor.id;
    }
    if(op==='lib-npc-delete'){
      const actor=this.actorById(id);if(!actor)throw Error('NPC não encontrado.');
      if(actor.hasPlayerOwner)throw Error('Este Actor pertence a um jogador e não pode ser excluído pelo painel.');
      const confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:'Excluir NPC'},content:`<p>Excluir <strong>${e(actor.name)}</strong> permanentemente da mesa?</p>`,yes:{label:'Excluir'},no:{label:'Cancelar'}});
      if(confirmed){if(this.state.npcActor===actor.id)this.state.npcActor=null;await actor.delete();}
    }
    if(op==='lib-npc-save')await this.saveNpc(id,data);
    if(op==='lib-npc-stock-add')await this.updateStock(id,data);
    if(op==='lib-npc-stock-remove'){const [actorId,...uuid]=String(id).split('|');await this.updateStock(actorId,{remove:uuid.join('|')});}
    if(op==='lib-npc-create-item')await this.createTableItem(id,data);
    if(op==='lib-npc-link-add'||op==='lib-npc-link-suggest')await this.addNpcLink(id,data);
    if(op==='lib-npc-link-remove')await this.removeNpcLink(Number(id));
    if(op==='lib-forge-clear')this.forgeBuilder={smithId:'',baseUuid:'',materialId:'',sigils:[],tab:'prefixo'};
    if(op==='lib-forge-base'){const cut=String(id).indexOf('|');await this.setForgeBase(String(id).slice(cut+1),String(id).slice(0,cut));}
    if(op==='lib-forge-tab')this.forgeBuilder.tab=id==='sufixo'?'sufixo':'prefixo';
    if(op==='lib-forge-add'){
      const base=this.forgeBase(),book=SIGILS.find(item=>item.id===id),match=book&&findMatches(book,this.catalog?.items??[],['sigil','seal'])[0];if(!base||!book||!match)throw Error('Sigilo de compêndio indisponível.');
      const next={...book,uuid:match.uuid,infused:false};if(!sigilCompatible(base,next))throw Error('Sigilo incompatível com o equipamento.');forgeQuote(base,this.forgeMaterial(),[...this.forgeBuilder.sigils,next],1);this.forgeBuilder.sigils.push(next);
    }
    if(op==='lib-forge-remove')this.forgeBuilder.sigils.splice(Number(id),1);
    if(op==='lib-forge-imbue'){const item=this.forgeBuilder.sigils[Number(id)];if(item)item.infused=!item.infused;}
    if(op==='lib-forge-pay')await this.executeForge(id);
    if(op==='lib-imbue-pay')await this.executeImbue();
    if(op==='lib-mod-add'){
      const sigil=SIGILS.find(item=>item.id===id);if(!sigil)throw Error('Sigilo não encontrado.');
      const next=[...this.modBuilder.sigils,{id:sigil.id,name:sigil.name,grade:sigil.grade,slot:sigil.slot,imbue:false}];modifiedItemSheet(this.modBase(),this.modMaterial(),next);this.modBuilder.sigils=next;
    }
    if(op==='lib-mod-remove')this.modBuilder.sigils.splice(Number(id),1);
    if(op==='lib-mod-imbue'){const index=Number(id);if(this.modBuilder.sigils[index])this.modBuilder.sigils[index]={...this.modBuilder.sigils[index],imbue:!this.modBuilder.sigils[index].imbue};}
    if(op==='lib-mod-tab')this.modBuilder.tab=id==='sufixo'?'sufixo':'prefixo';
    if(op==='lib-mod-copy'){const sheet=this.modSheet();if(globalThis.navigator?.clipboard)await navigator.clipboard.writeText(sheet.text);}
    if(op==='lib-create-merchant')await this.createTypicalMerchant(id);
    if(op==='lib-generate-npc'){
      const parts=String(id).split('|'),regionId=parts[0],placeId=parts.length>2?parts[1]:'',archetype=parts.length>2?parts.slice(2).join('|'):parts[1],region=REGIONS.find(item=>item.id===regionId),place=PLACES.find(item=>item.id===placeId);
      await this.runGenerator(generatorScope({kind:'npc',region,place,archetype,count:1}));
    }
    if(op==='lib-generate-npc-batch'){
      const maximum=id==='all'?Infinity:Math.max(1,Math.floor(Number(id)||1)),jobs=REGIONS.flatMap(region=>npcCoverage(region,this.npcActors()).missing.map(archetype=>({region,archetype}))).slice(0,maximum);
      await this.runGeneratorBatch(jobs);
    }
    if(op==='lib-monster-import')await this.importMonster(data.text);
    if(op==='lib-generate-monster'){
      const facets=Object.values(this.state.monsterFacets??{}).flat().filter(Boolean),archetype=facets.length?facets.join(', '):'ameaça';
      await this.runGenerator(generatorScope({kind:'monster',archetype,count:1}));
    }
    if(op==='lib-quest-filter')this.state.questStatus=QUEST_STATUSES.some(([status])=>status===id)?id:'all';
    if(op==='lib-quest-open')this.quests.open(id);
    if(op==='lib-quest-create')await this.quests.create();
    if(op==='lib-npc-open'){const actor=this.actorById(id);actor?.sheet?.render(true);}
    if(op==='lib-npc-buy'){
      const [actorId,...uuidParts]=String(id).split('|'),uuid=uuidParts.join('|'),actor=this.actorById(actorId),flag=npcFlag(actor),shared=this.shared.npcs.includes(actor?.uuid);
      if(!actor||npcVisibility({...flag,shared,gm:this.game.user?.isGM})!=='shop')throw Error('Esta loja não está disponível.');
      const entry=flag.shop?.stock?.find(item=>item.uuid===uuid);if(!entry)throw Error('Item fora do estoque.');
      const buyer=this.game.user?.character;if(!buyer)throw Error('Escolha um personagem para seu usuário antes de comprar.');
      await purchaseItem(buyer,actor,entry,Math.max(1,Number(data.qty)||1));
    }
  }
  actorById(id){return Array.from(this.game.actors??[]).find(actor=>actor.id===id||actor.uuid===id);}
  npcActors(){return Array.from(this.game.actors??[]).filter(isGeneratedNpc);}
  generatorMacro(){const name=generatorMacroName(this.game.settings),macro=this.game.macros?.getName?.(name);if(!macro)globalThis.ui?.notifications?.warn?.(`Macro '${name}' não encontrada. Configure o nome em Configurações do Módulo → QUEDAÇO.`);return macro??null;}
  async runGenerator(scope){const macro=this.generatorMacro();if(!macro)return false;await macro.execute({quedaco:scope});return true;}
  async runGeneratorBatch(jobs=[]){
    if(!jobs.length){globalThis.ui?.notifications?.info?.('A cobertura regional já está completa.');return 0;}
    const macro=this.generatorMacro();if(!macro)return 0;
    for(let index=0;index<jobs.length;index++){const job=jobs[index];globalThis.ui?.notifications?.info?.(`QUEDAÇO · gerando ${index+1} de ${jobs.length}: ${job.archetype} de ${job.region.name}.`);await macro.execute({quedaco:generatorScope({kind:'npc',region:job.region,place:job.place,archetype:job.archetype,count:1})});}
    globalThis.ui?.notifications?.info?.(`QUEDAÇO · ${jobs.length} NPC(s) enviado(s) para geração.`);return jobs.length;
  }
  async saveNpc(actorId,data){
    this.assertGM();const actor=this.actorById(actorId);if(!actor)throw Error('NPC não encontrado.');
    const current=npcFlag(actor)??adoptNpcFlag(actor),role=NPC_ROLES[data.role]?data.role:current.role;
    const placeId=PLACES.some(place=>place.id===data.placeId)?data.placeId:'',place=PLACES.find(entry=>entry.id===placeId),regionId=place?.regionId??(REGIONS.some(region=>region.id===data.regionId)?data.regionId:'');
    const guildUuid=this.guildActors().some(guild=>guild.uuid===data.guildUuid)?String(data.guildUuid):'';
    const next={...current,role,regionId,placeId,guildUuid,guild:String(data.guild??'').trim(),tokenVisible:Boolean(data.tokenVisible),note:String(data.note??''),forge:{...current.forge,enabled:Boolean(data.forgeEnabled),markup:Math.max(.1,Number(data.forgeMarkup)||1)},shop:{...current.shop,markup:Math.max(.1,Number(data.markup)||1),note:String(data.shopNote??'')}};
    const update={[`flags.${MODULE_ID}.npc`]:next};if(next.tokenVisible)update.ownership={...(actor.ownership??{}),default:Math.max(1,Number(actor.ownership?.default)||0)};
    delete next.active;await actor.update(update);this.state.npcActor=actor.id;this.state.npcSaved=actor.id;this.state.npcEditRole=null;this.state.npcEditPlace=null;ui.notifications.info('NPC atualizado.');
  }
  async updateStock(actorId,change){
    this.assertGM();const actor=this.actorById(actorId);if(!actor)throw Error('NPC não encontrado.');const flag=npcFlag(actor)??adoptNpcFlag(actor);
    const stock=Array.from(flag.shop?.stock??[]);
    if(change.remove){const index=stock.findIndex(item=>item.uuid===change.remove);if(index>=0)stock.splice(index,1);}
    else if(change.uuid&&String(change.uuid).startsWith('Compendium.')&&!stock.some(item=>item.uuid===change.uuid))stock.push({uuid:change.uuid,price:change.price==null?null:Math.max(0,Math.floor(change.price)),qty:change.qty==null?null:Math.max(0,Math.floor(change.qty)),note:String(change.note??'')});
    await actor.update({[`flags.${MODULE_ID}.npc`]:{...flag,shop:{...flag.shop,stock}}});
  }
  async createTableItem(actorId,data){
    this.assertGM();const collection=String(this.game.settings.get(MODULE_ID,ITEM_COMPENDIUM_KEY)||'');if(!collection)throw Error('Configure o compêndio de itens do QUEDAÇO nas Configurações do Módulo.');
    const pack=this.game.packs?.get?.(collection)??Array.from(this.game.packs??[]).find(item=>item.collection===collection);if(!pack||pack.documentName!=='Item')throw Error('O compêndio configurado não é um compêndio de Item acessível.');
    const name=String(data.name??'').trim(),book=BOOK_ITEMS.find(item=>nameKey(item.name)===nameKey(name));
    const price=Math.max(0,Math.floor(data.price===''||data.price==null?Number(book?.price)||0:Number(data.price)||0)),capacity=Math.max(0,data.volume===''||data.volume==null?Number(book?.volume)||0:Number(data.volume)||0);if(!name)throw Error('Informe o nome do item.');
    const document=await Item.create({name,type:itemTypeForCategory(data.category),img:itemFallback({category:data.category}),system:{price,quantity:1,capacity}},{pack:collection});
    if(!document?.uuid)throw Error('O Foundry não criou o item no compêndio.');
    await this.updateStock(actorId,{uuid:document.uuid,price:null,qty:null,note:''});return document;
  }
  async createTypicalMerchant(targetId){
    this.assertGM();const itinerant=String(targetId).startsWith('region:'),id=itinerant?String(targetId).slice(7):targetId,place=itinerant?null:PLACES.find(entry=>entry.id===id),region=REGIONS.find(entry=>entry.id===(place?.regionId??id));
    if(!region||(!itinerant&&!place))throw Error('Localidade inválida para o mercador.');
    const stock=localityStock(place??{kind:'selvagem'},this.catalog?.items??[],{markup:itinerant?1.25:1.15});if(!stock.length)throw Error('Nenhum item de compêndio compatível foi encontrado. Carregue os compêndios de itens primeiro.');
    const name=itinerant?`Mercador itinerante de ${region.name}`:`Mercador de ${place.name}`,flag={role:'merchant',regionId:region.id,placeId:place?.id??'',note:itinerant?'Viaja pela região.':'Estoque sugerido pela localidade.',shop:{markup:itinerant?1.25:1.15,note:'Estoque inicial sugerido pelo QUEDAÇO; revise antes de liberar.',stock}};
    const actor=await Actor.create({name,type:'character',img:this.image('npc',name,'','icons/svg/mystery-man.svg').src,flags:{[MODULE_ID]:{npc:flag}},prototypeToken:{actorLink:true}});if(actor)this.state.npcActor=actor.id;return actor;
  }
  async importMonster(input){
    this.assertGM();
    const mob=normalizeMonsterInput(input);
    if(!mob||!mob.name)throw Error('Não reconheci um bloco de D&D 5e. Cole o JSON do Open5e / 5e.tools ou o texto completo do statblock.');
    const source=toSkyfallNpc(mob);
    const actor=await Actor.create({...source,prototypeToken:{actorLink:true}});
    if(!actor?.id)throw Error('O Foundry não criou a ficha.');
    globalThis.ui?.notifications?.info?.(`"${actor.name}" criado como ND ${source.system.level.value}. Revise PV, RD e ataques na ficha.`);
    return actor;
  }
  async addNpcLink(actorId,data){
    this.assertGM();const actor=this.actorById(actorId),target=String(data.target||data.text&&`txt:${data.text}`||'');if(!actor||!target)throw Error('Escolha ou informe o outro NPC.');
    if(!npcFlag(actor))await actor.update({[`flags.${MODULE_ID}.npc`]:adoptNpcFlag(actor)});
    const links=normalizeNpcLinks([...this.npcLinks,{from:actor.uuid,to:target,type:data.type,note:data.note}]);await this.game.settings.set(MODULE_ID,NPC_LINKS_KEY,links);
  }
  async removeNpcLink(index){this.assertGM();const links=this.npcLinks;if(Number.isInteger(index)&&index>=0&&index<links.length){links.splice(index,1);await this.game.settings.set(MODULE_ID,NPC_LINKS_KEY,links);}}
  forgeBuyer(){return this.game.user?.character||this.game.canvas?.tokens?.controlled?.[0]?.actor||null;}
  forgeBase(){const buyer=this.forgeBuyer();return Array.from(buyer?.items??[]).find(item=>item.uuid===this.forgeBuilder.baseUuid||item.id===this.forgeBuilder.baseUuid)??null;}
  forgeMaterial(){return BOOK_ITEMS.find(item=>item.id===this.forgeBuilder.materialId&&item.category==='Materiais especiais'&&item.price===300)??null;}
  async setForgeBase(uuid,smithId=''){
    const buyer=this.forgeBuyer();if(!buyer?.isOwner)throw Error('Escolha um personagem próprio para usar a forja.');const item=await fromUuid(uuid);if(!item||!(item.parent===buyer||Array.from(buyer.items??[]).some(entry=>entry.id===item.id)))throw Error('Arraste um equipamento do seu próprio personagem.');if(!['weapon','armor','clothing'].includes(item.type))throw Error('A forja aceita arma, armadura ou vestimenta.');this.forgeBuilder={smithId,baseUuid:item.uuid??item.id,materialId:'',sigils:[],tab:this.forgeBuilder.tab??'prefixo'};
  }
  async executeForge(smithId){
    const smith=this.actorById(smithId),flag=npcFlag(smith)??adoptNpcFlag(smith),buyer=this.forgeBuyer(),base=this.forgeBase();if(!smith||npcVisibility({...flag,shared:this.shared.npcs.includes(smith.uuid),gm:this.game.user?.isGM})!=='forge')throw Error('Esta forja não está disponível.');
    const Dialog=foundry.applications.api.DialogV2,consume=await Dialog.wait({window:{title:'Finalizar item na forja'},content:`<p>O que fazer com o equipamento original <strong>${e(base?.name)}</strong>?</p>`,buttons:[{action:'keep',label:'Manter original',callback:()=>false},{action:'consume',label:'Consumir original',callback:()=>true},{action:'cancel',label:'Cancelar',callback:()=>null}]});if(consume===null||consume===undefined)return;
    const result=await purchaseForgedItem({buyer,base,material:this.forgeMaterial(),sigils:this.forgeBuilder.sigils,markup:flag.forge?.markup??1,consumeOriginal:consume});this.forgeBuilder={smithId:'',baseUuid:'',materialId:'',sigils:[],tab:'prefixo'};ui.notifications.info(`Item forjado por T$ ${result.quote.total}.`);
  }
  renderForge(smith){
    const flag=npcFlag(smith)??adoptNpcFlag(smith),buyer=this.forgeBuyer(),base=this.forgeBase(),kind=equipmentKind(base),material=this.forgeMaterial(),markup=flag.forge?.markup??1,chosen=this.forgeBuilder.sigils,tab=this.forgeBuilder.tab==='sufixo'?'sufixo':'prefixo';
    const available=base?SIGILS.filter(sigil=>sigilCompatible(base,sigil)&&String(sigil.slot).toLowerCase()===tab&&!chosen.some(item=>item.id===sigil.id)).map(sigil=>({sigil,match:findMatches(sigil,this.catalog?.items??[],['sigil','seal'])[0]})).filter(row=>row.match):[];
    let quote=null,error='';try{if(base)quote=forgeQuote(base,material,chosen,markup);}catch(reason){error=reason.message;}const fragments=forgeFragments(chosen,buyer?.system?.fragments?.max??0),balance=walletTotal(buyer?.system?.currency??{}),affordable=Boolean(quote&&!quote.unknown&&balance>=quote.total&&!error),preview=magicNamePreview(base,chosen);
    const slots=['prefixo','sufixo'].map(slot=>{const entries=chosen.filter(sigil=>String(sigil.slot).toLowerCase()===slot);return `<section class="sy-forge-slot-group"><h5>${slot==='prefixo'?'Prefixos':'Sufixos'} ${entries.length}/2</h5><div class="sy-forge-slots">${[0,1].map(position=>{const sigil=entries[position],index=sigil?chosen.indexOf(sigil):-1;return sigil?`<article class="sy-forge-slot is-filled"><strong>${e(sigil.name)}</strong><small>${sigil.grade}º grau · ${sigil.fragments??0} fragmentos</small>${sigil.summary?`<p>${e(sigil.summary)}</p>`:''}<div>${button('forge-imbue',String(index),sigil.infused?'✓ Imbuído':'Imbuir')}${button('forge-remove',String(index),'×')}</div></article>`:`<article class="sy-forge-slot is-empty"><b>+</b><small>${slot}</small></article>`;}).join('')}</div></section>`;}).join('');
    const costs=quote?`<div class="sy-forge-cost ${affordable?'is-affordable':'is-unaffordable'}"><span>Saldo: ${currency(balance)}</span><strong>Total: ${currency(quote.total)}</strong></div><details><summary>Ver quebra do custo</summary><pre class="sy-mod-sheet">${e(quote.lines.map(line=>`${line.label}: ${line.cost==null?'a conferir':currency(line.cost)}`).join('\n'))}\nMargem do ferreiro: × ${quote.markup}</pre></details>`:'';
    return `<section class="sy-forge" data-forge-smith="${e(smith.id)}"><h4><i class="fa-solid fa-hammer"></i> Forja de ${e(smith.name)}</h4>${buyer?`<div class="sy-forge-bench"><div class="sy-forge-inventory"><span>Seu equipamento</span>${Array.from(buyer.items??[]).filter(item=>['weapon','armor','clothing'].includes(item.type)&&item.name!=='Ataque desarmado'&&item.system?.natural!==true).map(item=>`<button data-op="lib-forge-base" data-id="${e(smith.id)}|${e(item.uuid)}" class="sy-forge-inv-item ${base&&(base.uuid===item.uuid||base.id===item.id)?'is-active':''}">${avatarThumb(item.img)}<span>${e(item.name)}</span></button>`).join('')||'<small>Nenhuma arma, armadura ou vestimenta na ficha.</small>'}</div><div class="sy-forge-base"><span>Item base ${base?button('forge-clear','','× remover'):''}</span><div class="sy-forge-drop" data-forge-drop="${e(smith.id)}">${base?`${avatarThumb(base.img)}<strong>${e(base.name)}</strong><small>${e(kind)} · escolha ou arraste outro</small>`:'<b>+</b><small>Escolha ao lado ou arraste uma arma, armadura ou vestimenta</small>'}</div></div><div class="sy-forge-rack">${slots}</div></div>`:'<p class="sy-alert">Associe um personagem ao seu usuário (ou selecione um token na cena) para usar a forja.</p>'}${base?`<h3 class="sy-magic-name">${e(preview)}</h3><label>Material especial opcional<select name="forgeMaterial"><option value="">Sem material</option>${BOOK_ITEMS.filter(item=>item.category==='Materiais especiais'&&item.price===300).map(item=>`<option value="${item.id}" ${material?.id===item.id?'selected':''}>${e(item.name)} · +T$ 300</option>`).join('')}</select></label><div class="sy-library-tabs sy-forge-tabs">${button('forge-tab','prefixo',`Prefixo ${chosen.filter(item=>String(item.slot).toLowerCase()==='prefixo').length}/2`,tab==='prefixo'?'is-active':'')}${button('forge-tab','sufixo',`Sufixo ${chosen.filter(item=>String(item.slot).toLowerCase()==='sufixo').length}/2`,tab==='sufixo'?'is-active':'')}</div><div class="sy-mod-sigils">${available.map(({sigil})=>`<article><span><strong>${e(sigil.name)}</strong><small>${sigil.grade}º grau · ${sigil.fragments??0} fragmentos</small>${sigil.summary?`<em>${e(sigil.summary)}</em>`:''}</span>${button('forge-add',sigil.id,'Adicionar')}</article>`).join('')||'<small>Nenhum sigilo disponível nesta aba.</small>'}</div>${costs}<p class="sy-fragments ${fragments.overload?'is-overload':''}">Fragmentos Arcanos: usa ${fragments.used} / limite ${fragments.max}${fragments.overload?` · vai sobrecarregar: ${fragments.overload}d6 de dano ao equipar`:''}</p>${error?`<p class="sy-alert">${e(error)}</p>`:''}${quote?.unknown?'<p class="sy-alert">Há um custo de imbuência a conferir com o mestre.</p>':''}<button class="sy-primary sy-forge-submit" data-op="lib-forge-pay" data-id="${e(smith.id)}" ${affordable?'':'disabled'}>Forjar por ${quote?currency(quote.total):'—'}</button>${button('forge-clear','','Limpar bancada')}`:''}</section>`;
  }
  modBases(){return BOOK_ITEMS.filter(item=>item.name!=='Ataque desarmado'&&!item.referenceOnly&&(item.category.startsWith('Armas')||item.category==='Armaduras e escudos'||item.category==='Vestimentas'));}
  modBase(){return this.modBases().find(item=>item.id===this.modBuilder.baseId)??null;}
  modMaterial(){return BOOK_ITEMS.find(item=>item.id===this.modBuilder.materialId&&item.category==='Materiais especiais'&&item.price===300)??null;}
  modEquipment(){const base=this.modBase();if(!base)return '';if(base.category.startsWith('Armas'))return 'Arma';if(base.name.startsWith('Escudo'))return 'Escudo';if(base.category==='Armaduras e escudos')return 'Armadura';if(base.category==='Vestimentas')return 'Vestimenta';return '';}
  modSheet(){return modifiedItemSheet(this.modBase(),this.modMaterial(),this.modBuilder.sigils);}
  render(area,readonly=false){
    if(!readonly)this.assertGM();
    else if(area!=='quests'&&!this.shared.areas.includes(area))return `<main class="sy-library"><small>CONSULTA DA CAMPANHA</small><h2>${area}</h2><p class="sy-library-deferred">O mestre ainda não liberou este conteúdo.</p></main>`;
    const titles={npcs:'NPCs',guilds:'Guildas e Hansas',map:'Mapa',monsters:'Monstros',items:'Itens',imbue:'Imbuir',quests:'Quests'};
    const body=area==='npcs'?this.renderNpcs(readonly):area==='guilds'?this.renderGuilds(readonly):area==='map'?this.renderMap(readonly):area==='monsters'?this.renderMonsters(readonly):area==='imbue'?this.renderImbue(readonly):area==='quests'?this.renderQuests(readonly):this.renderItems(readonly);
    return `<main class="sy-library"><small>${area==='quests'?'QUESTS DA CAMPANHA':readonly?'LIBERADO PELO MESTRE':'CONSULTA DA CAMPANHA'}</small><h2>${titles[area]}</h2>${body}</main>`;
  }
  renderQuests(readonly=false){
    if(!this.quests.available)return `<p class="sy-library-deferred"><strong>Forien's Quest Log não está disponível.</strong><br>Ative o módulo nesta mesa e abra novamente o QUEDAÇO.</p>`;
    if(readonly&&this.quests.hiddenFromPlayers)return `<p class="sy-library-deferred">A área de Quests está disponível, mas o Forien's Quest Log está configurado para ocultar suas quests dos jogadores.</p>`;
    const all=this.quests.quests(),counts=questCounts(all);
    const allowedStatuses=readonly&&counts.inactive===0?QUEST_STATUSES.filter(([status])=>status!=='inactive'):QUEST_STATUSES;
    if(!allowedStatuses.some(([status])=>status===this.state.questStatus))this.state.questStatus='all';
    const visible=this.state.questStatus==='all'?all:all.filter(quest=>quest.status===this.state.questStatus);
    const tabs=allowedStatuses.map(([status,label])=>`<button data-op="lib-quest-filter" data-id="${status}" aria-current="${this.state.questStatus===status?'page':'false'}">${label} <span class="sy-quest-count">${counts[status]??0}</span></button>`).join('');
    const cards=visible.map(quest=>{
      const taskSummary=quest.tasks.length?`${quest.completed} de ${quest.tasks.length} objetivos concluídos${quest.failed?` · ${quest.failed} falharam`:''}`:'Sem objetivos visíveis';
      const badges=[quest.statusLabel,quest.primary?'Principal':'',quest.personal?'Pessoal':'',quest.location,quest.giver?`Por ${quest.giver}`:''].filter(Boolean);
      const objectives=quest.tasks.length?`<ul class="sy-quest-objectives">${quest.tasks.slice(0,4).map(task=>`<li class="${task.completed?'is-complete':task.failed?'is-failed':''}"><span>${task.completed?'✓':task.failed?'×':'○'}</span>${e(task.name)}</li>`).join('')}${quest.tasks.length>4?`<li>+ ${quest.tasks.length-4} objetivo(s)</li>`:''}</ul>`:'';
      const giver=Array.from(this.game.actors??[]).find(actor=>nameKey(actor.name)===nameKey(quest.giver)),drag=giver?` draggable="true" data-drag-actor="${e(giver.uuid??`Actor.${giver.id}`)}" title="Arraste o contratante para a cena ou diálogo"`:'';
      return `<article class="sy-library-card sy-quest-card"${drag} data-search="${e(nameKey([quest.name,quest.description,quest.giver,quest.location,quest.statusLabel].join(' ')))}" data-category="${e(quest.status)}">${(()=>{const image=this.image('quest',quest.name,quest.image,'icons/svg/book.svg');return cardFigure(image.src,quest.name,'full',image.fallbacks);})()}<div class="sy-library-card-content">${chips(badges)}<h3>${e(quest.name)}</h3>${quest.description?`<p>${e(quest.description)}</p>`:''}${objectives}<small>${e(taskSummary)} · ${quest.rewardCount} recompensa(s)${quest.subquestCount?` · ${quest.subquestCount} subquest(s)`:''}</small><div class="sy-library-tabs">${button('quest-open',quest.id,'Abrir quest')}</div></div></article>`;
    }).join('');
    return `<p>Quests sincronizadas com o Forien's Quest Log. Cada jogador vê somente o que o Forien permite para seu usuário.</p>${readonly?'':`<div class="sy-library-share-row">${button('quest-create','','Nova quest')}</div>`}<nav class="sy-library-tabs sy-quest-tabs" aria-label="Estados das quests">${tabs}</nav>${this.filters([],'Buscar quest por nome, local ou contratante')}<div class="sy-library-grid sy-quest-grid">${cards||'<p class="sy-library-deferred">Nenhuma quest corresponde a este filtro.</p>'}</div>`;
  }
  renderNpcs(readonly=false){
    const all=this.npcActors(),shared=this.shared.npcs;
    const flagFor=actor=>npcFlag(actor)??adoptNpcFlag(actor);
    const actorPlace=actor=>flagFor(actor).placeId||inferPlaceId(actor)||'';
    const availablePlaceIds=new Set(all.map(actorPlace).filter(Boolean));
    const placeFilter=availablePlaceIds.has(this.state.npcPlaceFilter)?this.state.npcPlaceFilter:'all';
    const matchesPlace=actor=>placeFilter==='all'||actorPlace(actor)===placeFilter;
    const linkedKeys=type=>new Set(this.npcLinks.filter(link=>type==='all'||link.type===type).flatMap(link=>[link.from,link.to]));
    const keys=linkedKeys(this.state.npcLink);
    const visible=(readonly?all.filter(actor=>npcVisibility({...flagFor(actor),shared:shared.includes(actor.uuid)})):all.filter(actor=>this.state.npcRole==='all'||flagFor(actor).role===this.state.npcRole)).filter(actor=>(this.state.npcLink==='all'||keys.has(actor.uuid))&&matchesPlace(actor));
    const placeName=id=>PLACES.find(place=>place.id===id)?.name||'Sem local';
    const placeRegion=id=>PLACES.find(place=>place.id===id)?.regionId;
    const nameFor=key=>key.startsWith('txt:')?key.slice(4):this.actorById(key)?.name??key;
    const stockCard=(actor,flag,player)=>{const stock=flag.shop?.stock??[];if(flag.role!=='merchant')return '';return `<div class="sy-shop-stock">${flag.shop?.note?`<p>${e(flag.shop.note)}</p>`:''}${stock.map(item=>{const entry=this.catalog?.entry?.(item.uuid)??this.catalog?.items?.find(i=>i.uuid===item.uuid),name=entry?.name??item.uuid,price=item.price??entry?.system?.price??0,drag=String(item.uuid).startsWith('Compendium.')?` draggable="true" data-drag-item="${e(item.uuid)}" title="Arraste para uma ficha ou diálogo"`:'';return `<article${drag}><span><strong>${e(name)}</strong><small>T$ ${e(price)}${item.qty==null?'':' · '+e(item.qty)+' restantes'}</small></span>${player?`<input type="number" min="1" value="1" aria-label="Quantidade"><button data-op="lib-npc-buy" data-id="${e(actor.id)}|${e(item.uuid)}|1">Comprar</button>`:''}</article>`;}).join('')||'<small>Estoque vazio.</small>'}</div>`;};
    const cards=visible.map(actor=>{
      const flag=flagFor(actor),mode=npcVisibility({...flag,shared:shared.includes(actor.uuid),gm:!readonly}),editing=this.state.npcActor===actor.id,outline=npcCardOutline(flag),regionId=flag.regionId||placeRegion(flag.placeId),color=this.regionColor(regionId),live=shared.includes(actor.uuid);
      const location=flag.placeId?placeName(flag.placeId):regionId?REGIONS.find(region=>region.id===regionId)?.name||'Região':'Sem local';
      const level=actor?.system?.level?.value;
      const remove=readonly||actor.hasPlayerOwner?'':`<button class="sy-danger sy-npc-delete" data-op="lib-npc-delete" data-id="${e(actor.id)}" aria-label="Excluir NPC" title="Excluir NPC"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>`;
      const shareIcon=readonly?'':`<button class="sy-npc-live-dot ${live?'is-live':''}" data-op="lib-share" data-id="npcs:${e(actor.uuid)}" aria-pressed="${live?'true':'false'}" title="${live?'Liberado aos jogadores — clique para ocultar':'Liberar aos jogadores'}"><i class="fa-solid ${live?'fa-eye':'fa-eye-slash'}" aria-hidden="true"></i></button>`;
      const actions=readonly?'':`<div class="sy-npc-actions">${button('npc-edit',actor.id,editing?'Editando':'Editar')}</div>`;
      return `<article class="sy-library-card sy-npc-card sy-npc-outline-${outline} ${editing?'is-editing':''} ${live?'is-live':''} ${mode==='shop'||mode==='forge'?'sy-npc-card-full':''}" style="--sy-region:${e(color)}" draggable="true" data-drag-actor="${e(actor.uuid)}" title="Arraste para a cena ou diálogo">${shareIcon}<div class="sy-library-card-content"><div class="sy-npc-card-grid">${avatarFor(this.image('npc',actor.name,actor.img,'icons/svg/mystery-man.svg'))}<span class="sy-npc-identity"><strong>${e(actor.name)}</strong><small>${npcRoleChip(flag.role)} <span class="sy-npc-location"><i></i>${e(location)}${outline==='itinerant'?' · errante':''}</span>${level!=null?` <span class="sy-npc-level" title="Nível">NV ${e(level)}</span>`:''}</small></span></div>${actions}${remove}${mode==='shop'?stockCard(actor,flag,true):mode==='forge'?this.renderForge(actor):''}</div></article>`;
    }).join('');
    if(readonly)return `<div class="sy-library-grid">${cards||'<p class="sy-library-deferred">Nenhum NPC está disponível agora.</p>'}</div>`;
    const filters=`<div class="sy-npc-toolbar"><div class="sy-library-tabs">${[['all','Todos'],...Object.entries(NPC_ROLES)].map(([id,label])=>`<button data-op="lib-npc-filter" data-id="${id}" aria-current="${this.state.npcRole===id?'page':'false'}">${id==='all'?e(label):npcRoleChip(id)}</button>`).join('')}</div><div class="sy-npc-filters"><label>Local<select name="npcPlaceFilter"><option value="all">Todos os locais</option>${sortByName(PLACES.filter(place=>availablePlaceIds.has(place.id))).map(place=>`<option value="${e(place.id)}" ${placeFilter===place.id?'selected':''}>${e(place.name)}</option>`).join('')}</select></label><label>Vínculo<select name="npcLinkFilter"><option value="all">Todos</option>${Object.entries(NPC_LINK_TYPES).map(([id,label])=>`<option value="${id}" ${this.state.npcLink===id?'selected':''}>${label}</option>`).join('')}</select></label><span class="sy-npc-level-range"><label>Nível mín.<input type="number" name="npcLevelMin" min="1" max="12" value="1"></label><label>Nível máx.<input type="number" name="npcLevelMax" min="1" max="12" value="12"></label><button data-op="lib-npc-roll-levels">Sortear níveis ausentes</button>${button('npc-roll-levels','force','Sortear todos')}</span></div></div>`;
    const coverage=REGIONS.map(region=>({region,...npcCoverage(region,all)}));
    const missingCount=coverage.reduce((sum,item)=>sum+item.missing.length,0),batch=missingCount?`<div class="sy-library-share-row">${button('generate-npc-batch','5',`Criar ${Math.min(5,missingCount)} próximos`)}${button('generate-npc-batch','all',`Criar todos os ${missingCount}`)}</div>`:'';
    const audit=`<details class="sy-library-guide sy-npc-coverage"><summary>Cobertura regional de NPCs · ${missingCount} lacunas</summary>${batch}${coverage.map(item=>`<section><strong style="color:${e(this.regionColor(item.region.id))}">${e(item.region.name)}</strong>${item.missing.length?`<div class="sy-library-tabs">${item.missing.map(archetype=>button('generate-npc',`${item.region.id}||${archetype}`,`Criar ${archetype}`)).join('')}</div>`:'<small> ✓ cobertura sugerida presente</small>'}</section>`).join('')}<p class="sy-note">As sugestões vêm dos temas da região no livro. A macro recebe região, local, arquétipo e prompt prontos; revise a ficha gerada antes de usar.</p></details>`;
    const editor=this.renderNpcEditor(this.actorById(this.state.npcActor));
    return `<p>NPCs ligados a cidades, lojas e ao controle do mestre. Todos os Actors das pastas da macro aparecem direto nesta lista; alterações só são gravadas quando você salva.</p><div class="sy-library-share-row">${button('export-tokens','npcs','Exportar fichas para casar tokens')}${this.shareButton('areas','npcs','✓ Aba NPCs visível aos jogadores','Liberar a aba NPCs aos jogadores')}</div>${audit}${filters}<div class="sy-library-grid">${cards||'<p class="sy-library-deferred">Nenhum NPC encontrado nesta seção.</p>'}</div>${editor}`;
  }
  guildFacets(guild){
    const ap=guild.flags?.[MODULE_ID]?.appendix??guild.flags?.quedaco?.appendix??{};
    const gp=guild.flags?.[MODULE_ID]?.guild??{};
    const seals=[...(ap.seals||[]),ap.patron].map(cleanSeal).filter(Boolean);
    const text=`${stripTags(guild.system?.motto||'')} ${ap.description||''} ${ap.focus||''} ${ap.truths||''}`;
    return {ap,gp,seals,tipo:ap.kind==='hansa'?'hansa':'guilda',tema:guildThemes(text),stance:GUILD_STANCES[gp.stance]?gp.stance:'desconhecida'};
  }
  resolveActor(uuid){try{return globalThis.fromUuidSync?.(uuid)??this.actorById(uuid);}catch{return this.actorById(uuid);}}
  renderGuilds(readonly=false){
    const shared=this.shared.guilds,guilds=this.guildActors().filter(guild=>!readonly||shared.includes(guild.uuid));
    const abilityLabels={cunning:'Astúcia',knowledge:'Conhecimento',crafting:'Ofício',reputation:'Reputação'};
    const resolve=uuid=>this.resolveActor(uuid);
    const sealSet=new Map();for(const g of guilds)for(const s of this.guildFacets(g).seals)sealSet.set(nameKey(s),s);
    const sel=this.state.guildFacets??{};
    const facetGroups=[
      {facet:'tipo',label:'Tipo',items:[['guilda','Guilda'],['hansa','Hansa']]},
      {facet:'selo',label:'Selo / Mecenas',items:[...sealSet.entries()].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'))},
      {facet:'tema',label:'Campo de atuação',items:[['comercio','Comércio'],['contrabando','Contrabando'],['informacao','Informação'],['militar','Militar'],['arcano','Arcano'],['maritimo','Marítimo']]},
      {facet:'relacao',label:'Relação com o grupo',items:Object.entries(GUILD_STANCES).map(([k,v])=>[k,v.label])},
      ...(readonly?[]:[{facet:'liberada',label:'Liberada aos jogadores',items:[['sim','Sim'],['nao','Não']]}])
    ];
    const facetsHtml=`<div class="sy-monster-facets">${facetGroups.map(group=>{const chosen=sel[group.facet]??[];return `<details class="sy-facet" ${chosen.length?'open':''}><summary>${e(group.label)}<span class="sy-facet-count">${chosen.length?` (${chosen.length})`:''}</span></summary><div class="sy-check-grid">${group.items.map(([value,label])=>`<label><input type="checkbox" data-guild-facet="${e(group.facet)}" value="${e(value)}" ${chosen.includes(value)?'checked':''}>${e(label)}</label>`).join('')}</div></details>`;}).join('')}</div>`;
    const cards=guilds.map(guild=>{
      const system=guild.system??{},f=this.guildFacets(guild),motto=stripTags(system.motto??'');
      const membros=guildMembers(guild,resolve).length,nivel=guildLevel(guild,resolve);
      const abilities=Object.entries(abilityLabels).map(([key,label])=>`${label} ${system.abilities?.[key]?.value??'—'}`);
      const st=GUILD_STANCES[f.stance];
      const tokens=[`tipo:${f.tipo}`,...f.seals.map(s=>`selo:${nameKey(s)}`),...f.tema.map(t=>`tema:${t}`),`relacao:${f.stance}`,`liberada:${shared.includes(guild.uuid)?'sim':'nao'}`].join('|');
      const stancePick=readonly?'':`<select class="sy-guild-stance" name="guildStance" data-id="${e(guild.uuid)}" title="Relação com o grupo">${Object.entries(GUILD_STANCES).map(([k,v])=>`<option value="${k}" ${f.stance===k?'selected':''}>${v.label}</option>`).join('')}</select>`;
      return `<article class="sy-library-card sy-guild-card" data-search="${e(nameKey(`${guild.name} ${motto} ${f.ap.creator??''} ${f.ap.description??''}`))}" data-category="${e(tokens)}"><div class="sy-library-card-content">${thumb(this.image('guild',guild.name,guild.img,'icons/svg/village.svg'))}<small>${f.tipo==='hansa'?'Hansa':'Guilda'} · Nível ${e(nivel)} · ${membros} jogador(es)</small><h3>${e(guild.name)}</h3>${f.ap.symbol?`<p class="sy-guild-symbol">🔰 ${e(f.ap.symbol)}</p>`:''}${motto?`<p>${e(motto)}</p>`:''}${f.seals.length?chips(f.seals):''}${chips(abilities)}<div class="sy-library-tabs"><span class="sy-guild-stance-dot" style="--sy-role:${e(st.color)}" title="${e(st.label)}"></span>${stancePick}${button('open',guild.uuid,'Abrir ficha')}${readonly?'':this.shareButton('guilds',guild.uuid,'✓ Liberada','Liberar aos jogadores')}</div></div></article>`;
    }).join('');
    const importer=readonly?'':`<details class="sy-library-guide"><summary>Importar guildas do apêndice</summary><p class="sy-note">Cole aqui o conteúdo de <code>.local/guildas-foundry.json</code> (gerado por <code>tools/parse-guilds.mjs</code>) ou deixe o arquivo em <code>Data/modules/quedaco/.local/</code> e clique sem colar nada. Cria os Actors <code>guild</code> numa pasta "Guildas · Apêndice B"; pula as que já existem.</p><textarea name="guildImport" rows="4" placeholder='[ { "type": "guild", "name": "...", ... } ]'></textarea><div class="sy-library-tabs">${button('guild-import','','Importar')}</div></details>`;
    return `<p>Guildas e Hansas registradas como fichas nativas do Skyfall.</p>${readonly?'':`<div class="sy-library-share-row">${this.shareButton('areas','guilds','✓ Aba Guildas visível aos jogadores','Liberar a aba Guildas aos jogadores')}</div>`}${importer}${this.filters([],'Buscar por nome, criador ou descrição')}${facetsHtml}<div class="sy-library-grid">${cards||'<p class="sy-library-deferred">Nenhuma guilda disponível.</p>'}</div>`;
  }
  renderNpcEditor(actor){
    if(!actor)return '';const flag=npcFlag(actor)??adoptNpcFlag(actor);
    const role=NPC_ROLES[this.state.npcEditRole]?this.state.npcEditRole:flag.role;
    const suggested=!flag.placeId?inferPlaceId(actor):null,suggestedPlace=PLACES.find(place=>place.id===suggested);
    const stock=flag.shop?.stock??[],compendium=String(this.game.settings?.get?.(MODULE_ID,ITEM_COMPENDIUM_KEY)||'');
    const catalogItems=sortByName((this.catalog?.items??[]).filter(item=>String(item.uuid).startsWith('Compendium.')&&['weapon','armor','clothing','equipment','consumable','loot'].includes(item.type)));
    const marked=sortByName(this.npcActors().filter(item=>item.uuid!==actor.uuid)),links=this.npcLinks;
    const linkRows=links.map((link,index)=>({link,index})).filter(({link})=>link.from===actor.uuid||link.to===actor.uuid).map(({link,index})=>`<div><span>${e(NPC_LINK_TYPES[link.type])} · ${e(link.from===actor.uuid?link.to:link.from)}${link.note?` · ${e(link.note)}`:''}</span>${button('npc-link-remove',String(index),'Remover')}</div>`).join('');
    const suggestions=linksFromBio(actor,marked).filter(suggestion=>!links.some(link=>link.from===actor.uuid&&link.type===suggestion.type&&(link.to===suggestion.to||suggestion.ambiguous?.some(item=>item.uuid===link.to))));
    const suggestionRows=suggestions.map((suggestion,index)=>`<div class="sy-npc-suggestion" data-link-type="${e(suggestion.type)}"><span>${suggestion.ambiguous?`⚠ Vários NPCs chamados “${e(suggestion.targetName)}”: escolha qual`:`${e(NPC_LINK_TYPES[suggestion.type])} ${e(suggestion.targetName)}`} <small>· detectado na bio</small></span>${suggestion.ambiguous?`<select name="npcLinkSuggestion">${suggestion.ambiguous.map(item=>`<option value="${e(item.uuid)}">${e(item.name)} · ${e(item.folder?.name??item.id)}</option>`).join('')}</select>`:`<input type="hidden" name="npcLinkSuggestion" value="${e(suggestion.to)}">`}${button('npc-link-suggest',actor.id,'Confirmar')}</div>`).join('');
    const roleOptions=Object.entries(NPC_ROLES).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([id,label])=>`<option value="${id}" ${role===id?'selected':''}>${label}</option>`).join('');
    const placeId=this.state.npcEditPlace!=null?this.state.npcEditPlace:flag.placeId;
    const placeRegionId=PLACES.find(place=>place.id===placeId)?.regionId;
    const regionId=placeRegionId||flag.regionId;
    const regionOptions=sortByName(REGIONS).map(region=>`<option value="${e(region.id)}" ${regionId===region.id?'selected':''}>${e(region.name)}</option>`).join('');
    const placeOptions=sortByName(PLACES).map(place=>`<option value="${e(place.id)}" ${placeId===place.id?'selected':''}>${e(place.name)}</option>`).join('');
    const guilds=this.guildActors(),guildLabel=npcGuildLabel(flag,guilds);
    const guildOptions=guilds.map(guild=>`<option value="${e(guild.uuid)}" ${flag.guildUuid===guild.uuid?'selected':''}>${e(guild.name)}</option>`).join('');
    const portrait=this.image('npc',actor.name,actor.img,'icons/svg/mystery-man.svg');
    const shopFields=role==='merchant'?`<label>Margem da loja<input type="number" name="npcMarkup" min="0.1" step="0.1" value="${e(flag.shop?.markup??1)}"></label><label>Apresentação da loja<textarea name="npcShopNote">${e(flag.shop?.note??'')}</textarea></label>`:`<input type="hidden" name="npcMarkup" value="${e(flag.shop?.markup??1)}"><input type="hidden" name="npcShopNote" value="${e(flag.shop?.note??'')}">`;
    const forgeFields=role==='smith'?`<label class="sy-inline-check"><input type="checkbox" name="npcForgeEnabled" ${flag.forge?.enabled?'checked':''}> Forja habilitada</label><label>Margem da forja<input type="number" name="npcForgeMarkup" min="0.1" step="0.1" value="${e(flag.forge?.markup??1)}"></label>`:`<input type="hidden" name="npcForgeEnabled" value="${flag.forge?.enabled?'on':''}"><input type="hidden" name="npcForgeMarkup" value="${e(flag.forge?.markup??1)}">`;
    return `<section class="sy-library-detail sy-npc-editor" data-npc-editor="${e(actor.id)}"><img class="sy-npc-editor-portrait" src="${e(portrait.src)}" alt="" loading="lazy"${portrait.fallbacks.length?` data-fallback-srcs="${e(portrait.fallbacks.join('||'))}"`:''}><div class="sy-npc-editor-head"><h3>Editar · ${e(actor.name)}</h3><span class="sy-npc-saved" ${this.state.npcSaved===actor.id?'':'hidden'}>✓ salvo</span>${button('npc-open',actor.id,'Abrir ficha')}${button('npc-close',actor.id,'Fechar edição')}</div>${(npcStatBadges(actor)||npcAspectChips(actor)||guildLabel)?`<div class="sy-npc-editor-summary">${npcStatBadges(actor)}<div class="sy-npc-chip-row">${npcAspectChips(actor)}${guildLabel?`<span class="sy-npc-chip sy-npc-chip-guild" title="Guilda / Hansa"><b>Guilda</b>${e(guildLabel)}</span>`:''}</div></div>`:''}${suggestedPlace?`<p class="sy-hint"><span>Local sugerido: <strong>${e(suggestedPlace.name)}</strong></span>${button('npc-place-accept',`${actor.id}:${suggestedPlace.id}`,'Usar local sugerido')}</p>`:''}<div class="sy-npc-form"><label>Papel<select name="npcRole">${roleOptions}</select></label><label>Região<select name="npcRegion" ${placeId?'disabled':''}><option value="">Sem região</option>${regionOptions}</select>${placeId?`<small class="sy-hint-inline">Definida pelo local: ${e(PLACES.find(p=>p.id===placeId)?.name??'')}</small>`:''}</label><label>Local<select name="npcPlace"><option value="">Sem local</option>${placeOptions}</select>${placeId?'':'<small class="sy-hint-inline">Ao escolher o local, a região é preenchida sozinha.</small>'}</label><label>Guilda / Hansa da mesa<select name="npcGuildUuid"><option value="">Nenhuma ficha vinculada</option>${guildOptions}</select></label><label>Outra Guilda / Hansa<input name="npcGuild" value="${e(flag.guild??'')}" placeholder="Nome livre"></label><label>Nota<textarea name="npcNote">${e(flag.note??'')}</textarea></label><label class="sy-inline-check"><input type="checkbox" name="npcTokenVisible" ${flag.tokenVisible!==false?'checked':''}> Jogadores podem ver o token</label>${shopFields}${forgeFields}</div>${button('npc-save',actor.id,'Salvar NPC')}<details class="sy-library-guide"><summary>Vínculos${linkRows?'':' · nenhum'}</summary>${suggestionRows?`<div class="sy-npc-suggestions"><strong>Detectados na bio</strong>${suggestionRows}</div>`:''}<div class="sy-npc-stock">${linkRows||'<small>Nenhum vínculo.</small>'}</div><div class="sy-npc-link-add"><select name="npcLinkType">${Object.entries(NPC_LINK_TYPES).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select><select name="npcLinkTarget"><option value="">Outro NPC…</option>${marked.map(item=>`<option value="${e(item.uuid)}">${e(item.name)}</option>`).join('')}</select><input name="npcLinkText" placeholder="Ou nome fora da mesa"><input name="npcLinkNote" placeholder="Nota opcional">${button('npc-link-add',actor.id,'Adicionar vínculo')}</div></details><details class="sy-library-guide"><summary>Estoque de compêndio${stock.length?` · ${stock.length}`:''}</summary><div class="sy-npc-stock">${stock.map(item=>`<div><code>${e(item.uuid)}</code><span>${item.price==null?'Preço do item':currency(item.price)} · ${item.qty==null?'sem limite':e(item.qty)+' un.'}</span>${button('npc-stock-remove',`${actor.id}|${item.uuid}`,'Remover')}</div>`).join('')||'<small>Estoque vazio.</small>'}</div><div class="sy-npc-stock-add"><select name="npcStockUuid"><option value="">Adicionar item…</option>${catalogItems.map(item=>`<option value="${e(item.uuid)}">${e(item.name)} · ${e(item.source)}</option>`).join('')}</select><input name="npcStockPrice" type="number" min="0" placeholder="Preço opcional"><input name="npcStockQty" type="number" min="0" placeholder="Qtd. vazia = infinita">${button('npc-stock-add',actor.id,'Adicionar ao estoque')}</div></details><details class="sy-library-guide"><summary>Criar item tabelado</summary>${compendium?`<div class="sy-npc-new-item"><input name="npcItemName" placeholder="Nome"><select name="npcItemCategory">${[...new Set(BOOK_ITEMS.map(item=>item.category))].map(category=>`<option>${e(category)}</option>`).join('')}</select><input name="npcItemPrice" type="number" min="0" placeholder="Preço em T$"><input name="npcItemVolume" type="number" min="0" step="0.1" placeholder="Volume">${button('npc-create-item',actor.id,'Criar no compêndio e adicionar')}</div>`:'<p class="sy-alert">Configure “Compêndio de itens do QUEDAÇO” para criar itens tabelados. Nenhum item solto de Mundo será criado.</p>'}</details></section>`;
  }
  npcsForLocation(regionId,placeId=null,readonly=false){
    const shared=this.shared.npcs;
    const matches=this.npcActors().filter(actor=>{const flag=npcFlag(actor)??adoptNpcFlag(actor),actorRegion=flag.regionId||PLACES.find(place=>place.id===flag.placeId)?.regionId||inferRegionId(actor);return placeId?flag.placeId===placeId:actorRegion===regionId;}).filter(actor=>!readonly||shared.includes(actor.uuid));
    if(!matches.length)return '';
    return `<section class="sy-location-npcs"><h4>NPCs</h4><div class="sy-location-npc-list">${matches.map(actor=>{const flag=npcFlag(actor)??adoptNpcFlag(actor);return `<button class="sy-location-npc" data-op="lib-npc-open" data-id="${e(actor.id)}" draggable="true" data-drag-actor="${e(actor.uuid)}" title="Abrir ficha ou arrastar para a cena">${avatarFor(this.image('npc',actor.name,actor.img,'icons/svg/mystery-man.svg'))}<span><strong>${e(actor.name)}</strong>${npcRoleChip(flag.role)}</span></button>`;}).join('')}</div></section>`;
  }
  card(entry,op,share=null){
    const kind=op==='region'?'region':'place',explicit=op==='region'?this.regionImages[entry.id]:this.placeImages[entry.id],resolved=this.image(kind,entry.id,'',kind==='region'?'icons/svg/mountain.svg':'icons/svg/village.svg'),image=explicit||resolved.src,fallBacks=explicit?[resolved.src,...resolved.fallbacks]:resolved.fallbacks;
    const regionId=op==='region'?entry.id:entry.regionId;
    return `<article class="sy-library-card sy-region-card" style="--sy-region:${e(this.regionColor(regionId))}" data-search="${e(nameKey([entry.name,entry.kind,entry.summary,...(entry.highlights??[])].join(' ')))}" data-category="${e(entry.regionId??'')}">${cardFigure(image,entry.name,'wide',fallBacks)}${share?this.shareButton(share,entry.id,'✓ Liberado','Liberar'):''}<div class="sy-library-card-content"><small>${e(entry.kind??'Região')} · p. ${entry.page}</small><h3>${e(entry.name)}</h3><p>${e(entry.summary)}</p>${button(op,entry.id,op==='region'?'Explorar região':'Abrir local')}</div></article>`;
  }
  scenePicker(place){
    const linked=this.placeScenes[place.id],scenes=Array.from(this.game.scenes??[]);
    const actions=linked?`<div class="sy-library-share-row">${button('open-scene',linked,'Abrir cena')}${button('activate-scene',linked,'Ativar para os jogadores')}${button('scene',`${place.id}:`,'Desvincular')}</div>`:'';
    const grid=scenes.length?`<div class="sy-scene-grid">${scenes.map(s=>`<button class="sy-scene-pick ${linked===s.id?'is-on':''}" data-op="lib-scene" data-id="${e(place.id)}:${e(s.id)}"><img src="${e(s.thumb||s.background?.src||'')}" alt="" loading="lazy"><span>${e(s.name)}</span></button>`).join('')}</div>`:'<small>Nenhuma cena criada na mesa.</small>';
    return `<details class="sy-library-guide"><summary>Mapa/cena vinculada${linked?` — ${e(scenes.find(s=>s.id===linked)?.name??'cena')}`:''}</summary>${actions}${grid}</details>`;
  }
  regionScenePicker(region,gm=false){
    const linked=Array.isArray(this.regionScenes[region.id])?this.regionScenes[region.id]:[];
    const scenes=Array.from(this.game.scenes??[]),named=linked.map(id=>scenes.find(scene=>scene.id===id)).filter(Boolean);
    if(!gm)return named.length?`<section class="sy-region-scenes"><h4>Cenas da região</h4><div class="sy-library-share-row">${named.map(scene=>button('open-scene',scene.id,`Abrir ${scene.name}`)).join('')}</div></section>`:'';
    const rows=named.length?`<div class="sy-region-scene-list">${named.map(scene=>`<div><strong>${e(scene.name)}</strong>${button('open-scene',scene.id,'Abrir')}${button('activate-scene',scene.id,'Ativar p/ jogadores')}${button('region-scene',`${region.id}:${scene.id}`,'Desvincular')}</div>`).join('')}</div>`:'<small>Nenhuma cena vinculada a esta região.</small>';
    const grid=scenes.length?`<div class="sy-scene-grid">${scenes.map(scene=>`<button class="sy-scene-pick ${linked.includes(scene.id)?'is-on':''}" data-op="lib-region-scene" data-id="${e(region.id)}:${e(scene.id)}"><img src="${e(scene.thumb||scene.background?.src||'')}" alt="" loading="lazy"><span>${e(scene.name)}</span></button>`).join('')}</div>`:'<small>Nenhuma cena criada na mesa.</small>';
    return `<details class="sy-library-guide"><summary>Cenas da região${named.length?` — ${named.length} vinculada(s)`:''}</summary><p class="sy-note">Vincule quantas cenas quiser a uma região; os jogadores veem os botões de abrir quando a região está liberada.</p>${rows}${grid}</details>`;
  }
  mapIndexBanner(interactive){
    const pins=interactive?REGIONS.filter(r=>Array.isArray(r.hotspot)).map(r=>`<button class="sy-map-pin" data-op="lib-region" data-id="${e(r.id)}" style="left:${r.hotspot[0]}%;top:${r.hotspot[1]}%"><span>${e(r.name)}</span></button>`).join(''):'';
    return `<div class="sy-map-wrap"><img class="sy-map-banner" src="${e(this.resolvedMapImage)}" alt="Mapa de Opath" loading="lazy">${pins}</div>`;
  }
  placeMarkerPosition(place,index,total){
    if(Array.isArray(place.hotspot))return place.hotspot;
    const region=REGIONS.find(entry=>entry.id===place.regionId);if(region?.capital===place.id)return [50,50];
    const siblings=PLACES.filter(entry=>entry.regionId===place.regionId&&entry.id!==region?.capital),position=Math.max(0,siblings.findIndex(entry=>entry.id===place.id)),count=Math.max(1,siblings.length);
    const angle=-Math.PI*.9+(Math.PI*1.8*(count===1?.5:position/(count-1))),radius=count<=4?24:34;
    return [50+Math.cos(angle)*radius,52+Math.sin(angle)*radius*.68];
  }
  renderDynamicMap(readonly=false){
    const state=this.state.map??{scale:1,tx:0,ty:0,focus:null},shared=this.shared.map,placeIds=this.sharedPlaceIds();
    const focus=REGIONS.find(region=>region.id===state.focus),place=[...PLACES,...BEYOND].find(entry=>entry.id===this.state.place);
    const regions=(readonly?REGIONS.filter(region=>shared.includes(region.id)):REGIONS).filter(region=>Array.isArray(region.hotspot));
    const layer=state.layer??'auto',hidden=this.mapHidden;
    const layerLets=kind=>{const l=placeLayer(kind);if(layer==='all'||layer==='auto')return true;if(layer==='cities')return l==='cidade';if(layer==='marks')return l==='marco';if(layer==='falls')return l==='queda';return false;};
    // mapHidden (Quedas nascem ocultas) só vale nas vistas auto/tudo. Ao escolher uma
    // camada de propósito (Cidades/Marcos/Quedas) os pinos daquela camada aparecem mesmo ocultos.
    const respectHidden=layer==='auto'||layer==='all';
    const placeVisible=entry=>layerLets(entry.kind)&&(!respectHidden||!hidden.has(entry.id))&&(!readonly||placeIds.has(entry.id));
    const places=focus?PLACES.filter(entry=>entry.regionId===focus.id&&placeVisible(entry)):[];
    const showRegions=!focus&&(layer==='regions'||layer==='all'||(layer==='auto'&&state.scale<1.6)),showCities=!focus&&layer!=='regions'&&(layer!=='auto'||state.scale>=1.6);
    const globalPlaces=showCities?PLACES.filter(placeVisible):[];
    const regionPins=showRegions?regions.map(region=>{const point=resolveHotspot(this.mapHotspots,'regions',region.id,region.hotspot);return `<button class="sy-map-marker ${state.movingPins?'is-movable':''}" data-pin-kind="regions" data-pin-id="${e(region.id)}" data-op="lib-map-focus" data-id="${e(region.id)}" style="--sy-region:${e(this.regionColor(region.id))};left:${point[0]}%;top:${point[1]}%" title="${state.movingPins?'Arraste para reposicionar':`Explorar ${e(region.name)}`}"><span>${e(region.name)}</span></button>`;}).join(''):'';
    const shownPlaces=focus?places:globalPlaces;
    const placePins=shownPlaces.map((entry,index)=>{let fallback;if(focus)fallback=this.placeMarkerPosition(entry,index,shownPlaces.length);else{const region=REGIONS.find(item=>item.id===entry.regionId),siblings=PLACES.filter(item=>item.regionId===entry.regionId),local=this.placeMarkerPosition(entry,siblings.indexOf(entry),siblings.length),base=region?.hotspot??[50,50];fallback=[Math.max(1,Math.min(99,base[0]+(local[0]-50)*.18)),Math.max(1,Math.min(99,base[1]+(local[1]-50)*.18))];}const [x,y]=resolveHotspot(this.mapHotspots,'places',entry.id,fallback);return `<button class="sy-map-marker sy-map-marker-place ${state.movingPins?'is-movable':''} ${this.state.place===entry.id?'is-current':''}" data-pin-kind="places" data-pin-id="${e(entry.id)}" data-op="lib-place" data-id="${e(entry.id)}" style="--sy-region:${e(this.regionColor(entry.regionId))};left:${x}%;top:${y}%" title="Abrir ${e(entry.name)}"><span>${e(entry.name)}</span></button>`;}).join('');
    const regionImage=focus?(this.regionImages[focus.id]||this.image('region',focus.id,'','').src):null;
    const images=`<img class="sy-map-image sy-map-image-base ${regionImage?'is-faded':''}" src="${e(this.resolvedMapImage)}" alt="Mapa de Opath" draggable="false">${regionImage?`<img class="sy-map-image sy-map-image-region" src="${e(regionImage)}" alt="Mapa de ${e(focus.name)}" draggable="false">`:''}`;
    const transform=`translate(${Number(state.tx)||0}px,${Number(state.ty)||0}px) scale(${Number(state.scale)||1})`;
    const controls=`<div class="sy-map-controls"><div class="sy-map-zoom" aria-label="Controles do mapa">${button('map-zoom','in','+')} ${button('map-zoom','out','−')} ${button('map-reset','','Reenquadrar')}${readonly?'':button('map-pins','',state.movingPins?'✓ Movendo pinos':'Mover pinos')}</div><div class="sy-map-layers" aria-label="Camadas">${[['auto','Automático'],['regions','Regiões'],['cities','Cidades'],['marks','Marcos'],['falls','Quedas'],['all','Tudo']].map(([id,label])=>`<button data-op="lib-map-layer" data-id="${id}" aria-current="${layer===id?'page':'false'}">${label}</button>`).join('')}</div><div class="sy-map-breadcrumb" aria-label="Localização no mapa">${button('map-reset','','Opath')}${focus?`<span aria-hidden="true">›</span><strong>${e(focus.name)}</strong>`:''}${place?`<span aria-hidden="true">›</span><strong>${e(place.name)}</strong>`:''}</div></div>`;
    const viewport=`<div class="sy-map-viewport" data-map-viewport><div class="sy-map-world" style="transform:${e(transform)}">${images}${regionPins}${placePins}</div>${controls}</div>`;
    let detail='';
    if(place&&(!readonly||placeIds.has(place.id))){const scene=this.placeScenes[place.id];detail=`<div class="sy-map-drawer">${this.placeDetail(place,!readonly)}${readonly?(scene?`<div class="sy-library-share-row">${button('open-scene',scene,'Abrir cena vinculada')}</div>`:''):this.scenePicker(place)}</div>`;}
    else if(focus&&(!readonly||shared.includes(focus.id)))detail=`<div class="sy-map-drawer">${this.regionDetail(focus,!readonly)}<p class="sy-note">Escolha um pino de cidade no mapa para abrir seus detalhes.</p></div>`;
    const atlas=readonly?'':this.renderAtlas();
    const solo=!detail&&!atlas;
    return `<div class="sy-map-layout ${solo?'sy-map-layout-solo':''}">${viewport}${solo?'':`<div class="sy-map-side">${atlas}${detail||''}</div>`}</div>`;
  }
  atlasShareIcon(id){const on=this.shared.map.includes(id);return `<button class="sy-atlas-icon ${on?'is-on':''}" data-op="lib-share" data-id="map:${e(id)}" aria-pressed="${on}" title="${on?'Liberado no mapa — clique para ocultar dos jogadores':'Liberar no mapa para os jogadores'}"><i class="fa-solid ${on?'fa-eye':'fa-eye-slash'}" aria-hidden="true"></i></button>`;}
  atlasPinIcon(id){const off=this.mapHidden.has(id);return `<button class="sy-atlas-icon" data-op="lib-map-hide" data-id="${e(id)}:${off?'show':'hide'}" title="${off?'Mostrar o pino no mapa':'Ocultar o pino do mapa'}"><i class="fa-solid ${off?'fa-location-dot-slash':'fa-location-dot'}" aria-hidden="true"></i></button>`;}
  renderAtlas(){
    const tree=REGIONS.map(region=>{
      const groups=[['cidade','Cidades'],['marco','Marcos'],['queda','Quedas']].map(([k,label])=>{
        const list=PLACES.filter(p=>p.regionId===region.id&&placeLayer(p.kind)===k);
        return list.length?`<div class="sy-atlas-group"><h6>${label}</h6>${list.map(p=>`<div class="sy-atlas-place"><button data-op="lib-place" data-id="${e(p.id)}">${e(p.name)}</button>${this.atlasShareIcon(p.id)}${this.atlasPinIcon(p.id)}</div>`).join('')}</div>`:'';
      }).join('');
      return `<details class="sy-atlas-region" style="--sy-region:${e(this.regionColor(region.id))}"><summary><span class="sy-atlas-dot"></span>${e(region.name)}</summary><div class="sy-atlas-region-body"><div class="sy-atlas-row">${button('map-focus',region.id,'⌖ Focar / dossiê')}${this.atlasShareIcon(region.id)}<span class="sy-atlas-hint">olho = liberar · alfinete = pino</span></div>${groups||'<small>Sem locais.</small>'}</div></details>`;
    }).join('');
    return `<aside class="sy-atlas"><div class="sy-atlas-mass">${button('map-share-all','regions','Liberar regiões')}${button('map-share-all','all','Liberar tudo')}${button('map-share-all','none','Recolher')}</div>${tree}</aside>`;
  }
  renderMap(readonly=false){
    const {mapView,region:regionId,place:placeId}=this.state;
    const region=REGIONS.find(i=>i.id===regionId),place=[...PLACES,...BEYOND].find(i=>i.id===placeId);
    const banner=this.resolvedMapImage&&!regionId&&!placeId?this.mapIndexBanner(!readonly):'';
    if(this.resolvedMapImage){const shareArea=readonly?'':`<div class="sy-library-share-row">${this.shareButton('areas','map','✓ Aba Mapa visível aos jogadores','Liberar a aba Mapa aos jogadores')}</div>`;return `${shareArea}${readonly?'':`<details class="sy-library-guide"><summary>Onde colocar as imagens</summary><p>Use <code>${e(this.images.root||'worlds/seu-mundo/quedaco')}/regioes/&lt;id&gt;.webp</code> e <code>${e(this.images.root||'worlds/seu-mundo/quedaco')}/locais/&lt;id&gt;.webp</code>. IDs: ${e(REGIONS.map(r=>r.id).join(', '))}.</p></details>`}${this.renderDynamicMap(readonly)}`;}
    const fallback=`<p class="${readonly?'sy-library-deferred':'sy-alert'}">${readonly?'O mestre ainda não configurou a imagem do mapa de Opath.':'Configure “Imagem do mapa de Opath” para ativar o visor com pan e zoom. A lista continua disponível abaixo.'}</p>`;
    if(readonly){
      const sharedRegions=this.shared.map,placeIds=this.sharedPlaceIds();
      const visibleRegions=REGIONS.filter(r=>sharedRegions.includes(r.id));
      const loosePlaces=[...PLACES,...BEYOND].filter(p=>placeIds.has(p.id)&&(!p.regionId||!sharedRegions.includes(p.regionId))&&!p.parentId);
      if(place&&placeIds.has(place.id)){
        const parent=[...PLACES,...BEYOND].find(i=>i.id===place.parentId&&placeIds.has(i.id));
        const scene=this.placeScenes[place.id]?`<div class="sy-library-share-row">${button('open-scene',this.placeScenes[place.id],'Abrir cena vinculada')}</div>`:'';
        return `${fallback}<div class="sy-library-breadcrumb">${button('map','regions','← Voltar')}${region&&sharedRegions.includes(region.id)?button('region',region.id,region.name):''}${parent?button('place',parent.id,parent.name):''}</div>${this.placeDetail(place)}${scene}<div class="sy-library-grid">${[...PLACES,...BEYOND].filter(i=>i.parentId===place.id&&placeIds.has(i.id)).map(i=>this.card(i,'place')).join('')}</div>`;
      }
      if(region&&sharedRegions.includes(region.id)){
        const capital=PLACES.find(i=>i.id===region.capital);
        return `${fallback}${visibleRegions.length+loosePlaces.length>1?button('map','regions','← Tudo que foi liberado'):''}${this.regionDetail(region,false)}<h3>Cidades e locais</h3><div class="sy-library-grid">${PLACES.filter(i=>i.regionId===region.id).map(i=>this.card(i,'place')).join('')}</div>`;
      }
      const cards=[...visibleRegions.map(i=>this.card(i,'region')),...loosePlaces.map(i=>this.card(i,'place'))].join('');
      return `${fallback}${banner}<div class="sy-library-grid">${cards||'<p class="sy-library-deferred">O mestre ainda não liberou nenhuma região.</p>'}</div>`;
    }
    const tabs=[['regions','Regiões'],['places','Cidades e locais'],['beyond','Além de Opath'],['scenes','Mapas e cenas'],['encounters','Encontros da região']];
    const shareArea=this.shareButton('areas','map','✓ Aba Mapa visível aos jogadores','Liberar a aba Mapa aos jogadores');
    let body='';
    if(place){
      const parent=[...PLACES,...BEYOND].find(i=>i.id===place.parentId);
      body=`<div class="sy-library-breadcrumb">${button('map',mapView,'← Voltar ao índice')}${region?button('region',region.id,region.name):''}${parent?button('place',parent.id,parent.name):''}</div>${this.placeDetail(place,true)}${this.scenePicker(place)}<div class="sy-library-grid">${[...PLACES,...BEYOND].filter(i=>i.parentId===place.id).map(i=>this.card(i,'place','map')).join('')}</div>`;
    }else if(region){
      const capital=PLACES.find(i=>i.id===region.capital);
      body=`${button('map','regions','← Todas as regiões')}${this.regionDetail(region,true)}<h3>Cidades e locais da região</h3><div class="sy-library-grid">${PLACES.filter(i=>i.regionId===region.id).map(i=>this.card(i,'place','map')).join('')}</div><section class="sy-library-deferred"><h4>Mapas, cenas e encontros</h4><p>Reservados para seleção manual do mestre.</p></section>`;
    }else if(mapView==='scenes'||mapView==='encounters')body='<p class="sy-library-deferred">Aguardando a seleção manual do mestre.</p>';
    else{const entries=mapView==='places'?PLACES:mapView==='beyond'?BEYOND:REGIONS;body=`${this.filters(mapView==='places'?REGIONS.map(i=>[i.id,i.name]):[],`Buscar ${mapView==='regions'?'região':'local'}`)}<div class="sy-library-grid">${entries.map(i=>this.card(i,mapView==='regions'?'region':'place',mapView==='beyond'?null:'map')).join('')}</div>`;}
    return `${fallback}${banner}<div class="sy-library-share-row">${shareArea}</div><nav class="sy-library-tabs" aria-label="Mapa">${tabs.map(([id,label])=>`<button data-op="lib-map" data-id="${id}" aria-current="${mapView===id?'page':'false'}">${label}</button>`).join('')}</nav>${body}`;
  }
  regionDetail(region,gm=false){
    const resolved=this.image('region',region.id,'','icons/svg/mountain.svg'),img=this.regionImages[region.id]||resolved.src,capital=PLACES.find(i=>i.id===region.capital);
    const controls=gm?`<div class="sy-library-share-row">${button('share-locality',`region:${region.id}`,'Liberar tudo da região')}${button('region-img',region.id,this.regionImages[region.id]?'Trocar imagem':'Definir imagem')}${this.regionImages[region.id]?button('region-img',`${region.id}:`,'Remover imagem'):''}</div>`:'';
    return `<section class="sy-library-detail">${gm?this.shareButton('map',region.id,'✓ Liberado','Liberar'):''}${cardFigure(img,region.name,'wide',resolved.fallbacks,gm?{op:'region-img',id:region.id}:null)}<small>${page(region)}</small><h3>${e(region.name)}</h3><p>${e(region.summary)}</p><h4>Governo</h4><p>${e(region.government)}</p><h4>Comércio</h4><p>${e(region.trade)}</p><h4>Destaques</h4>${chips(region.highlights)}${capital?button('place',capital.id,`Ir à capital: ${capital.name}`):''}${gm?button('create-merchant',`region:${region.id}`,'Criar mercador itinerante'):''}${this.renderDossier(region,gm)}${this.regionScenePicker(region,gm)}${gm&&this.mapHotspots.regions?.[region.id]?button('map-hotspot-reset',`regions:${region.id}`,'Voltar ao padrão do livro'):''}${controls}</section>`;
  }
  renderDossier(region,gm=false){
    const readonly=!gm,sharedNpcs=this.shared.npcs,sharedMonsters=this.shared.monsters;
    const npcs=this.npcActors().map(a=>{const f=npcFlag(a)??adoptNpcFlag(a);return {id:a.id,name:a.name,img:a.img,uuid:a.uuid,role:f.role,placeId:f.placeId,regionId:f.regionId||PLACES.find(p=>p.id===f.placeId)?.regionId||inferRegionId(a),guildUuid:f.guildUuid,guild:f.guild,shared:sharedNpcs.includes(a.uuid)};});
    const quests=this.quests?.available?this.quests.quests():[];
    const {blocks}=regionDossier(region.id,{regions:REGIONS,places:PLACES,npcs,monsters:MONSTERS,quests,monsterHabitats:this.monsterHabitats,rumors:this.regionRumors});
    const audit=monsterAudit(this.actors,this.failures,this.loaded);
    const npcBtn=n=>`<button class="sy-location-npc" data-op="lib-npc-open" data-id="${e(n.id)}" draggable="true" data-drag-actor="${e(n.uuid)}" title="Abrir ficha ou arrastar">${avatarFor(this.image('npc',n.name,n.img,'icons/svg/mystery-man.svg'))}<span><strong>${e(n.name)}</strong>${npcRoleChip(n.role)}</span></button>`;
    const knownNpcs=blocks.knownNpcs.filter(n=>!readonly||n.shared),territoryNpcs=blocks.territoryNpcs.filter(n=>!readonly||n.shared);
    const guilds=guildsForPlace({npcs,guilds:this.guildActors(),regionId:region.id,places:PLACES}).filter(guild=>!readonly||this.shared.guilds.includes(guild.uuid));
    const placesHtml=[['cidade','Cidades'],['marco','Marcos'],['queda','Quedas']].map(([k,label])=>{const list=blocks.places[k]||[];return list.length?`<div class="sy-dossier-places"><h5>${label}</h5>${list.map(p=>button('place',p.id,p.name)).join('')}</div>`:'';}).join('');
    const threats=blocks.threats.filter(m=>!readonly||sharedMonsters.includes(m.id));
    const threatCard=m=>{const row=audit.find(a=>a.id===m.id),uuid=row?.matches?.[0]?.uuid,img=this.image('monster',m.name,row?.matches?.[0]?.img,'icons/svg/mystery-man.svg');return `<span class="sy-dossier-threat">${uuid?`<button class="sy-location-npc" data-op="lib-open" data-id="${e(uuid)}" draggable="true" data-drag-actor="${e(uuid)}" title="Abrir ou arrastar">`:'<span class="sy-location-npc">'}${avatarFor(img)}<span><strong>${e(m.name)}</strong><small>ND ${e(m.nd)} · ${e(m.creatureType)}</small></span>${uuid?'</button>':'</span>'}${gm?button('monster-habitat',`${m.id}|${region.id}|off`,'×'):''}</span>`;};
    const addThreat=gm?`<div class="sy-dossier-add"><select name="habitatMonster"><option value="">Adicionar ameaça…</option>${MONSTERS.filter(m=>!(this.monsterHabitats[m.id]||[]).includes(region.id)).map(m=>`<option value="${e(m.id)}">${e(m.name)} · ND ${e(m.nd)}</option>`).join('')}</select><button data-op="lib-monster-habitat-add" data-id="${e(region.id)}">Incluir</button></div>`:'';
    const rumors=(blocks.rumors||[]).filter(r=>!readonly||r.shared);
    const rumorsHtml=(rumors.length||gm)?`<section class="sy-dossier-rumors"><h4>Rumores</h4>${rumors.map(r=>`<p class="sy-rumor ${r.shared?'is-shared':''}">${e(r.text)}${gm?` ${button('region-rumor',`${region.id}|${r.id}|share`,r.shared?'✓ liberado':'liberar')} ${button('region-rumor',`${region.id}|${r.id}|remove`,'×')}`:''}</p>`).join('')||'<small>Nenhum rumor ainda.</small>'}${gm?`<div class="sy-dossier-add"><input name="rumorText" placeholder="Novo rumor"><button data-op="lib-region-rumor-add" data-id="${e(region.id)}">Adicionar</button></div>`:''}</section>`:'';
    const questsHtml=blocks.quests.length?`<section><h4>Missões abertas</h4><div class="sy-location-npc-list">${blocks.quests.map(q=>`<button data-op="lib-quest-open" data-id="${e(q.id)}" class="sy-dossier-quest">${e(q.name)}</button>`).join('')}</div></section>`:'';
    const faunaHtml=(blocks.fauna||[]).length?`<section><h4>Fauna</h4>${chips(blocks.fauna)}</section>`:'';
    return `<div class="sy-dossier">${placesHtml?`<section><h4>Cidades e locais</h4>${placesHtml}</section>`:''}${faunaHtml}${(threats.length||gm)?`<section><h4>Ameaças</h4><div class="sy-location-npc-list">${threats.map(threatCard).join('')||'<small>Nenhuma ameaça marcada.</small>'}</div>${addThreat}</section>`:''}${questsHtml}${knownNpcs.length?`<section><h4>NPCs conhecidos</h4><div class="sy-location-npc-list">${knownNpcs.map(npcBtn).join('')}</div></section>`:''}${territoryNpcs.length?`<section><h4>NPCs pelo território</h4><div class="sy-location-npc-list">${territoryNpcs.map(npcBtn).join('')}</div></section>`:''}${guilds.length?`<section><h4>Guildas presentes</h4><div class="sy-location-npc-list">${guilds.map(guild=>`<button class="sy-location-npc" data-op="lib-open" data-id="${e(guild.uuid)}">${avatarThumb(guild.img,'icons/svg/village.svg')}<span><strong>${e(guild.name)}</strong><small>Abrir ficha</small></span></button>`).join('')}</div></section>`:''}${rumorsHtml}</div>`;
  }
  placeDetail(place,gm=false){
    const resolved=this.image('place',place.id,'','icons/svg/village.svg'),img=this.placeImages[place.id]||resolved.src;
    const onMap=!this.mapHidden.has(place.id);
    const controls=gm?`<div class="sy-library-share-row">${button('share-locality',`place:${place.id}`,'Liberar tudo deste local')}${button('place-img',place.id,this.placeImages[place.id]?'Trocar imagem':'Definir imagem')}${this.placeImages[place.id]?button('place-img',`${place.id}:`,'Remover imagem'):''}${button('map-hide',`${place.id}:${onMap?'hide':'show'}`,onMap?'Ocultar do mapa':'Mostrar no mapa')}</div>`:'';
    return `<section class="sy-library-detail">${gm?this.shareButton('map',place.id,'✓ Liberado','Liberar'):''}${cardFigure(img,place.name,'wide',resolved.fallbacks,gm?{op:'place-img',id:place.id}:null)}<small>${page(place)} · ${e(place.kind??'Local')}</small><h3>${e(place.name)}</h3><p>${e(place.summary)}</p>${place.highlights?.length?`<h4>Destaques</h4>${chips(place.highlights)}`:''}${gm?button('create-merchant',place.id,'Criar mercador típico'):''}${this.npcsForLocation(place.regionId,place.id,!gm)}${gm&&this.mapHotspots.places?.[place.id]?button('map-hotspot-reset',`places:${place.id}`,'Voltar ao padrão do livro'):''}${controls}</section>`;
  }
  filters(categories,label='Buscar por nome ou descrição',groups=null){
    const opts=groups?groups.filter(g=>g.items.length).map(g=>`<optgroup label="${e(g.label)}">${g.items.map(([id,name])=>`<option value="${e(id)}">${e(name)}</option>`).join('')}</optgroup>`).join(''):categories.map(([id,name])=>`<option value="${e(id)}">${e(name)}</option>`).join('');
    const hasSelect=groups?groups.some(g=>g.items.length):categories.length;
    return `<div class="sy-library-filters"><label>${label}<input name="libraryQuery" type="search" autocomplete="off"></label>${hasSelect?`<label>${groups?'Filtro':'Categoria'}<select name="libraryCategory"><option value="">${groups?'Todos':'Todas'}</option>${opts}</select></label>`:''}<small class="sy-library-count" role="status"></small></div><p class="sy-library-no-results" hidden>Nenhuma entrada corresponde aos filtros.</p>`;
  }
  monsterFilters(groups){
    return `<div class="sy-library-filters sy-monster-filter"><label>Buscar monstro por nome, tipo ou papel<input name="libraryQuery" type="search" autocomplete="off"></label><small class="sy-library-count" role="status"></small></div><div class="sy-monster-facets">${groups.map(group=>{const selected=this.state.monsterFacets[group.facet]??[];return `<details class="sy-facet" data-monster-facet-group="${e(group.facet)}" ${selected.length?'open':''}><summary>${e(group.label)}<span class="sy-facet-count">${selected.length?` (${selected.length})`:''}</span></summary><div class="sy-check-grid">${group.items.map(([value,label])=>`<label><input type="checkbox" name="monsterFacet" data-monster-facet="${e(group.facet)}" value="${e(value)}" ${selected.includes(value)?'checked':''}>${e(label)}</label>`).join('')}</div></details>`;}).join('')}</div><section class="sy-library-no-results sy-generate-monster" hidden><p>Nenhuma ameaça do livro combina com esses filtros.</p>${button('generate-monster','','Gerar um monstro assim')}<small>Depois de gerar, clique em Conferir Foundry novamente.</small></section>`;
  }
  filter(root){
    const query=nameKey(root.querySelector('[name="libraryQuery"]')?.value),category=root.querySelector('[name="libraryCategory"]')?.value??'';
    const facets={};for(const input of root.querySelectorAll('[data-monster-facet]:checked'))(facets[input.dataset.monsterFacet]??=[]).push(input.value);for(const input of root.querySelectorAll('[data-guild-facet]:checked'))(facets[input.dataset.guildFacet]??=[]).push(input.value);
    let count=0;for(const card of root.querySelectorAll('[data-search]')){const tokens=(card.dataset.category??'').split('|'),facetMatch=Object.entries(facets).every(([facet,selected])=>selected.some(value=>tokens.includes(`${facet}:${value}`)));card.hidden=!(card.dataset.search.includes(query)&&(!category||tokens.includes(category))&&facetMatch);if(!card.hidden)count++;}
    const label=root.querySelector('.sy-library-count');if(label)label.textContent=`${count} entradas`;
    const empty=root.querySelector('.sy-library-no-results');if(empty)empty.hidden=count!==0;
  }
  links(matches){return matches.length?`<div class="sy-library-links">${matches.map(m=>button('open',m.uuid,`Abrir no Foundry · ${m.source}`)).join('')}</div>`:'<small>Sem correspondência exata no catálogo acessível.</small>';}
  renderMonsters(readonly=false){
    if(readonly){
      const shared=this.shared.monsters,list=MONSTERS.filter(m=>shared.includes(m.id));
      return `${this.filters([],'Buscar ameaça liberada')}<div class="sy-library-grid">${list.map(entry=>`<details class="sy-library-card" data-search="${e(nameKey(`${entry.name} ${entry.creatureType} ${entry.role} ${entry.summary}`))}" data-category=""><summary><div class="sy-card-heading"><span><small>ND ${entry.nd} · ${e(entry.creatureType)}</small><strong>${e(entry.name)}</strong></span><span class="sy-library-question" aria-hidden="true">?</span></div></summary><div class="sy-library-body"><p>${e(entry.summary)}</p>${chips([monsterTier(entry),...monsterRoles(entry),monsterNdBand(entry.nd),page(entry)])}</div></details>`).join('')||'<p class="sy-library-deferred">O mestre ainda não liberou nenhuma ameaça.</p>'}</div>`;
    }
    const report=this.report(),audit=monsterAudit(this.actors,this.failures,this.loaded);
    const types=[...new Set(MONSTERS.map(m=>m.creatureType))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const roles=[...new Set(MONSTERS.flatMap(monsterRoles))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const tiers=[...new Set(MONSTERS.map(monsterTier))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const filterGroups=[
      {facet:'tipo',label:'Tipo de criatura',items:types.map(t=>[t,t])},
      {facet:'papel',label:'Papel',items:roles.map(r=>[r,r])},
      {facet:'porte',label:'Porte',items:tiers.map(t=>[t,t])},
      {facet:'desloc',label:'Deslocamento',items:[['terrestrial','Terrestre'],['aquatic','Aquático'],['aerial','Aéreo']]},
      {facet:'nd',label:'Nível de Desafio',items:['ND 1–4','ND 5–8','ND 9–12','ND 13+'].map(b=>[b,b])},
      {facet:'conf',label:'Conferência na mesa',items:[['missing','Ficha pendente'],['found','Encontrado'],['unverified','A conferir']]}
    ];
    return `<p>${MONSTERS.length} blocos do livro. Encontrados por nome e tipo: <strong>${report.found.length}</strong>. Fichas pendentes: <strong>${report.missing.length}</strong>. Sem verificação completa: <strong>${report.unverified.length}</strong>.</p><p class="sy-note">Encontrar o nome não confirma os valores da ficha. As fichas pendentes aguardam sua revisão antes de serem criadas. Os filtros usam as classificações do livro: tipo de criatura, papel, porte, deslocamento e Nível de Desafio.</p><div class="sy-library-share-row">${this.shareButton('areas','monsters','✓ Aba Monstros visível aos jogadores','Liberar a aba Monstros aos jogadores')}</div><div class="sy-library-tabs">${button('refresh','','Conferir Foundry novamente')}${button('report','','Exportar conferência')}${button('export-tokens','monsters','Exportar fichas para casar tokens')}</div><details class="sy-library-guide"><summary>Importar criatura de D&amp;D 5e</summary><p class="sy-note">Cole o JSON do <a href="https://open5e.com/monsters" target="_blank" rel="noopener">Open5e</a> / 5e.tools ou o texto completo do bloco de status. O QUEDAÇO cria uma ficha <code>npc</code> do Skyfall na escala de ND (máx. 12 ≈ CR 20): atributos e deslocamento saem convertidos; PV, RD e os ataques entram estimados e anotados na biografia para você ajustar. Só SRD/próprio material — criaturas de Produto (Vecna, mind flayer…) você cola o bloco à mão.</p><textarea name="monsterImport" rows="6" placeholder='Cole aqui: { "name": "...", "challenge_rating": ... }  ou  o texto do statblock'></textarea><div class="sy-library-tabs">${button('monster-import','','Converter e criar ficha')}</div></details>${this.failures.length?`<p class="sy-alert">${this.failures.length} compêndio(s) não puderam ser consultados; ausências ainda não confirmadas.</p>`:''}${this.monsterFilters(filterGroups)}<div class="sy-library-grid">${audit.map(entry=>{const uuid=entry.matches[0]?.uuid,drag=uuid?` draggable="true" data-drag-actor="${e(uuid)}" title="Arraste para a cena para colocar o token"`:'';return `<details class="sy-library-card"${drag} data-search="${e(nameKey(`${entry.name} ${entry.creatureType} ${entry.role} ND ${entry.nd} ${entry.summary}`))}" data-category="${e(monsterCategory(entry))}"><summary>${(()=>{const image=this.image('monster',entry.name,entry.matches[0]?.img,'icons/svg/mystery-man.svg');return cardFigure(image.src,entry.name,'full',image.fallbacks);})()}<div class="sy-card-heading"><span><small>ND ${entry.nd} · ${e(entry.creatureType)}</small><strong>${e(entry.name)}</strong></span><span class="sy-library-status ${entry.status==='found'?'sy-library-found':''}" title="${entry.status==='found'?'Correspondência por nome e tipo':'Aguardando revisão'}">${entry.status==='found'?'✓ Encontrado':entry.status==='missing'?'Ficha pendente':'A conferir'}</span></div></summary>${this.shareButton('monsters',entry.id,'✓ Liberado','Liberar')}<div class="sy-library-body"><p>${e(entry.summary)}</p>${chips([monsterTier(entry),...monsterRoles(entry),monsterNdBand(entry.nd),page(entry)])}${this.links(entry.matches)}${entry.candidates.length?'<p class="sy-note">Há documento com esse nome, mas de outro tipo de ficha. Não contado como ameaça.</p>':''}</div></details>`;}).join('')}</div>`;
  }
  itemCard(entry,readonly){
    const tags=[entry.category,entry.equipment,entry.grade?`${entry.grade}º grau`:null,entry.price!=null?currency(entry.price):null,entry.priceKind,entry.priceFormula,entry.rarity,entry.setting,entry.volume!=null?`${entry.volume} vol.`:null,entry.damage?`Dano ${entry.damage}`:null,entry.reduction?`RD ${entry.reduction}`:null,entry.range?`Alcance ${entry.range} m`:null,entry.slot,entry.charges?`${entry.charges} cargas`:null,entry.fragments?`${entry.fragments} fragmentos`:null,entry.imbued];
    const matches=findMatches(entry,this.catalog?.items??[],typesFor(entry));
    const uuid=matches.find(match=>String(match.uuid).startsWith('Compendium.'))?.uuid,drag=uuid?` draggable="true" data-drag-item="${e(uuid)}" title="Arraste para uma ficha ou diálogo"`:'';
    return `<details class="sy-library-card"${drag} data-search="${e(nameKey(`${entry.name} ${entry.category} ${entry.equipment??''} ${entry.summary} ${(entry.aliases??[]).join(' ')}`))}" data-category="${e(entry.category)}"><summary><div class="sy-card-heading">${thumb(this.image('item',entry.name,matches[0]?.img,itemFallback(entry)))}<span><small>${e(entry.category)}${entry.equipment?` · ${e(entry.equipment)}`:''}</small><strong>${e(entry.name)}</strong></span><span class="sy-library-question" title="Abrir consulta" aria-hidden="true">?</span></div></summary>${readonly?'':this.shareButton('items',entry.id,'✓ Liberado','Liberar')}<div class="sy-library-body">${chips(tags)}<p>${e(entry.summary)}</p>${entry.descriptors?`<p><b>Descritores:</b> ${e(Array.isArray(entry.descriptors)?entry.descriptors.join(', '):entry.descriptors)}</p>`:''}${entry.note?`<p class="sy-alert">${e(entry.note)}</p>`:''}<small>${page(entry)}</small>${entry.referenceOnly?'<p class="sy-note">Entrada de referência; não é uma compra automática.</p>':''}${readonly?'':this.links(matches)}</div></details>`;
  }
  renderItems(readonly=false){
    if(readonly){
      const shared=this.shared.items,list=BOOK_ITEMS.filter(i=>i.name!=='Ataque desarmado'&&shared.includes(i.id));
      return `${this.filters([],'Buscar item liberado')}<div class="sy-library-grid">${list.map(entry=>this.itemCard(entry,true)).join('')||'<p class="sy-library-deferred">O mestre ainda não liberou nenhum item.</p>'}</div>`;
    }
    const visibleItems=BOOK_ITEMS.filter(i=>i.name!=='Ataque desarmado');
    const categories=[...new Set(visibleItems.map(i=>i.category))];
    return `<p>Equipamentos, serviços e modificações do livro, com preços, volume e referências. Abra um cartão para consultar; vínculos abrem documentos existentes da mesa.</p><div class="sy-library-share-row">${this.shareButton('areas','items','✓ Aba Itens visível aos jogadores','Liberar a aba Itens aos jogadores')}</div>${this.filters(categories.map(c=>[c,c]))}<div class="sy-library-grid">${visibleItems.map(entry=>this.itemCard(entry,false)).join('')}</div>`;
  }
  async executeImbue(){
    const buyer=this.forgeBuyer(),base=this.forgeBase();
    if(!buyer?.isOwner)throw Error('Associe um personagem próprio para imbuir.');
    if(!base)throw Error('Escolha um equipamento da ficha para imbuir.');
    if(!this.forgeBuilder.sigils.length)throw Error('Adicione ao menos um sigilo.');
    const result=await purchaseForgedItem({buyer,base,material:this.forgeMaterial(),sigils:this.forgeBuilder.sigils,markup:1,consumeOriginal:false});
    this.forgeBuilder={smithId:'',baseUuid:'',materialId:'',sigils:[],tab:'prefixo'};
    globalThis.ui?.notifications?.info?.(`Item imbuído por T$ ${result.quote.total}.`);
    return result;
  }
  renderImbueBench(){
    const buyer=this.forgeBuyer();
    if(!buyer)return '<p class="sy-note">Associe um personagem ao seu usuário (ou selecione um token na cena) para imbuir um equipamento da própria ficha aqui, sem precisar de um Ferreiro.</p>';
    const base=this.forgeBase(),material=this.forgeMaterial(),chosen=this.forgeBuilder.sigils,tab=this.forgeBuilder.tab==='sufixo'?'sufixo':'prefixo';
    const items=Array.from(buyer.items??[]).filter(item=>['weapon','armor','clothing'].includes(item.type)&&item.name!=='Ataque desarmado'&&item.system?.natural!==true);
    const available=base?SIGILS.filter(sigil=>sigilCompatible(base,sigil)&&String(sigil.slot).toLowerCase()===tab&&!chosen.some(item=>item.id===sigil.id)).map(sigil=>({sigil,match:findMatches(sigil,this.catalog?.items??[],['sigil','seal'])[0]})).filter(row=>row.match):[];
    let quote=null,error='';try{if(base)quote=forgeQuote(base,material,chosen,1);}catch(reason){error=reason.message;}
    const balance=walletTotal(buyer?.system?.currency??{}),affordable=Boolean(quote&&!quote.unknown&&balance>=quote.total&&!error&&chosen.length),preview=magicNamePreview(base,chosen);
    const slots=['prefixo','sufixo'].map(slot=>{const entries=chosen.filter(sigil=>String(sigil.slot).toLowerCase()===slot);return `<section class="sy-forge-slot-group"><h5>${slot==='prefixo'?'Prefixos':'Sufixos'} ${entries.length}/2</h5><div class="sy-forge-slots">${[0,1].map(position=>{const sigil=entries[position],index=sigil?chosen.indexOf(sigil):-1;return sigil?`<article class="sy-forge-slot is-filled"><strong>${e(sigil.name)}</strong><small>${sigil.grade}º grau · ${sigil.fragments??0} fragmentos</small>${sigil.summary?`<p>${e(sigil.summary)}</p>`:''}<div>${button('forge-imbue',String(index),sigil.infused?'✓ Imbuído':'Imbuir')}${button('forge-remove',String(index),'×')}</div></article>`:`<article class="sy-forge-slot is-empty"><b>+</b><small>${slot}</small></article>`;}).join('')}</div></section>`;}).join('');
    const costs=quote?`<div class="sy-forge-cost ${affordable?'is-affordable':'is-unaffordable'}"><span>Saldo: ${currency(balance)}</span><strong>Total: ${currency(quote.total)}</strong></div><details><summary>Ver quebra do custo (por sigilo)</summary><pre class="sy-mod-sheet">${e(quote.lines.map((line,i)=>`${i+1}. ${line.label}: ${line.cost==null?'a conferir':currency(line.cost)}`).join('\n'))}</pre><p class="sy-note">Paga-se por sigilo; cada sigilo a mais no mesmo item custa mais caro (prefixo e sufixo contam juntos). Imbuir cada sigilo tem custo próprio por grau.</p></details>`:'';
    return `<section class="sy-forge sy-imbue-bench"><h4><i class="fa-solid fa-wand-sparkles"></i> Imbuir na sua ficha — ${e(buyer.name)}</h4><div class="sy-forge-bench"><div class="sy-forge-inventory"><span>Seu equipamento</span>${items.map(item=>`<button data-op="lib-forge-base" data-id="|${e(item.uuid)}" class="sy-forge-inv-item ${base&&(base.uuid===item.uuid||base.id===item.id)?'is-active':''}">${avatarThumb(item.img)}<span>${e(item.name)}</span></button>`).join('')||'<small>Nenhuma arma, armadura ou vestimenta na ficha.</small>'}</div><div class="sy-forge-base"><span>Item base ${base?button('forge-clear','','× remover'):''}</span><div class="sy-forge-drop" data-forge-drop="">${base?`${avatarThumb(base.img)}<strong>${e(base.name)}</strong><small>escolha ou arraste outro</small>`:'<b>+</b><small>Escolha ao lado ou arraste uma arma, armadura ou vestimenta</small>'}</div></div><div class="sy-forge-rack">${slots}</div></div>${base?`<h3 class="sy-magic-name">${e(preview)}</h3><label>Material especial opcional<select name="forgeMaterial"><option value="">Sem material</option>${BOOK_ITEMS.filter(item=>item.category==='Materiais especiais'&&item.price===300).map(item=>`<option value="${item.id}" ${material?.id===item.id?'selected':''}>${e(item.name)} · +T$ 300</option>`).join('')}</select></label><div class="sy-library-tabs sy-forge-tabs">${button('forge-tab','prefixo',`Prefixo ${chosen.filter(item=>String(item.slot).toLowerCase()==='prefixo').length}/2`,tab==='prefixo'?'is-active':'')}${button('forge-tab','sufixo',`Sufixo ${chosen.filter(item=>String(item.slot).toLowerCase()==='sufixo').length}/2`,tab==='sufixo'?'is-active':'')}</div><div class="sy-mod-sigils">${available.map(({sigil})=>`<article><span><strong>${e(sigil.name)}</strong><small>${sigil.grade}º grau · ${sigil.fragments??0} fragmentos</small>${sigil.summary?`<em>${e(sigil.summary)}</em>`:''}</span>${button('forge-add',sigil.id,'Adicionar')}</article>`).join('')||'<small>Nenhum sigilo disponível nesta aba.</small>'}</div>${costs}${error?`<p class="sy-alert">${e(error)}</p>`:''}<button class="sy-primary" data-op="lib-imbue-pay" data-id="" ${affordable?'':'disabled'}>Imbuir por ${quote?currency(quote.total):'—'}</button>${button('forge-clear','','Limpar bancada')}`:''}</section>`;
  }
  renderImbue(readonly=false){
    const imbueHelp=`<section class="sy-note"><strong>O que é imbuir?</strong><p>Imbuir torna o encantamento do sigilo permanente. Em vez de gastar cargas até acabar, o efeito fica sempre disponível ou recarrega no descanso longo, conforme o sigilo. <strong>Paga-se por sigilo</strong>, não um valor único: 1º grau T$ 250 · 2º T$ 1.000 · 3º T$ 5.000 · 4º grau a conferir. Além disso, cada sigilo colocado no item (prefixo ou sufixo, contam juntos) tem um custo que <strong>aumenta conforme quantos já estão no item</strong> — ver a tabela abaixo. A ordem entre eles não muda o preço.</p></section>`;
    if(readonly)return `<p>Regras de imbuir liberadas pelo mestre.</p>${this.renderImbueBench()}${imbueHelp}`;
    const bases=this.modBases(),base=this.modBase(),materials=BOOK_ITEMS.filter(item=>item.category==='Materiais especiais'&&item.price===300),equipment=this.modEquipment(),tab=this.modBuilder.tab==='sufixo'?'sufixo':'prefixo',available=SIGILS.filter(sigil=>equipment&&(sigil.equipment===equipment||(equipment==='Escudo'&&sigil.equipment==='Arma'))&&String(sigil.slot).toLowerCase()===tab&&!this.modBuilder.sigils.some(chosen=>chosen.id===sigil.id));
    let sheet=null,error='';try{sheet=this.modSheet();}catch(reason){error=reason.message;}
    const chosen=this.modBuilder.sigils,preview=magicNamePreview(base,chosen),fragmentUse=chosen.filter(sigil=>!sigil.imbue).reduce((sum,sigil)=>sum+Math.max(0,Number(sigil.fragments)||0),0);
    const slots=['prefixo','sufixo'].map(slot=>{const entries=chosen.filter(sigil=>String(sigil.slot).toLowerCase()===slot);return `<section class="sy-forge-slot-group"><h5>${slot==='prefixo'?'Prefixos':'Sufixos'} ${entries.length}/2</h5><div class="sy-forge-slots">${[0,1].map(position=>{const sigil=entries[position],index=sigil?chosen.indexOf(sigil):-1;return sigil?`<article class="sy-forge-slot is-filled"><strong>${e(sigil.name)}</strong><small>${sigil.grade}º grau · ${sigil.fragments??0} fragmentos</small>${sigil.summary?`<p>${e(sigil.summary)}</p>`:''}<div>${button('mod-imbue',String(index),sigil.imbue?'✓ Imbuído':'Imbuir')}${button('mod-remove',String(index),'×')}</div></article>`:`<article class="sy-forge-slot is-empty"><b>+</b><small>${slot}</small></article>`;}).join('')}</div></section>`;}).join('');
    const worksheet=sheet?`<div class="sy-forge-cost is-affordable"><span>Calculadora do mestre</span><strong>Total: ${currency(sheet.result.total)}${sheet.result.unknown?' + valor a conferir':''}</strong></div><details><summary>Ver quebra do custo</summary><pre class="sy-mod-sheet">${e(sheet.text)}</pre>${sheet.result.warnings.map(warning=>`<p class="sy-alert">${e(warning)}</p>`).join('')}${button('mod-copy','','Copiar folha')}</details>`:'';
    return `<p>Imbua um equipamento da sua ficha na bancada abaixo, ou use a calculadora para consultar custos sem alterar nada.</p><div class="sy-library-share-row">${this.shareButton('areas','imbue','✓ Aba Imbuir visível aos jogadores','Liberar a aba Imbuir aos jogadores')}</div>${this.renderImbueBench()}<details class="sy-library-guide"><summary>Calculadora (não altera Item da mesa)</summary><p>Esta calculadora não cria nem altera Item no Foundry.</p><div class="sy-mod-controls"><label>Item base<select name="modBase"><option value="">Escolha…</option>${bases.map(item=>`<option value="${item.id}" ${this.modBuilder.baseId===item.id?'selected':''}>${e(item.name)} · ${item.price==null?'sem preço':currency(item.price)}</option>`).join('')}</select></label><label>Material especial opcional<select name="modMaterial"><option value="">Sem material</option>${materials.map(item=>`<option value="${item.id}" ${this.modBuilder.materialId===item.id?'selected':''}>${e(item.name)} · +T$ 300</option>`).join('')}</select></label></div><div class="sy-forge-bench"><div class="sy-forge-base"><span>Item base</span><div class="sy-forge-drop">${base?`${avatarFor(this.image('item',base.name,'',itemFallback(base)))}<strong>${e(base.name)}</strong><small>${e(equipment)}</small>`:'<b>+</b><small>Escolha o item acima</small>'}</div></div><div class="sy-forge-rack">${slots}</div></div>${base?`<h3 class="sy-magic-name">${e(preview)}</h3><div class="sy-library-tabs sy-forge-tabs">${button('mod-tab','prefixo',`Prefixo ${chosen.filter(item=>String(item.slot).toLowerCase()==='prefixo').length}/2`,tab==='prefixo'?'is-active':'')}${button('mod-tab','sufixo',`Sufixo ${chosen.filter(item=>String(item.slot).toLowerCase()==='sufixo').length}/2`,tab==='sufixo'?'is-active':'')}</div><div class="sy-mod-sigils">${available.map(sigil=>`<article><span><strong>${e(sigil.name)}</strong><small>${sigil.grade}º grau · ${sigil.fragments??0} fragmentos</small>${sigil.summary?`<em>${e(sigil.summary)}</em>`:''}</span>${button('mod-add',sigil.id,'Adicionar')}</article>`).join('')||'<small>Nenhum sigilo disponível nesta aba.</small>'}</div><p class="sy-fragments">Fragmentos Arcanos não imbuídos: usa ${fragmentUse} · compare com o limite da ficha.</p>`:''}${error?`<p class="sy-alert">${e(error)}</p>`:worksheet}${imbueHelp}<details><summary>Consultar regras e tabelas usadas</summary>${MODIFICATION_GUIDES.map(i=>`<h4>${e(i.name)} <small>p. ${i.page}</small></h4><p>${e(i.summary)}</p>`).join('')}<table><thead><tr><th>Sigilo no item</th>${[1,2,3,4].map(n=>`<th>${n}º grau</th>`).join('')}</tr></thead><tbody>${SIGIL_COSTS.map((row,i)=>`<tr><th>${i+1}º sigilo</th>${row.map(v=>`<td>${currency(v)}</td>`).join('')}</tr>`).join('')}<tr><th>Imbuir</th>${IMBUE_COSTS.map(v=>`<td>${v==null?'A conferir*':currency(v)}</td>`).join('')}</tr></tbody></table></details></details>`;
  }
}
