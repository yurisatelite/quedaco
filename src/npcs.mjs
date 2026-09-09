import {MODULE_ID} from './adapter.mjs';
import {PLACES,REGIONS} from './book-world.mjs';
import {normalize} from './rules.mjs';

export const NPC_ROLE_STYLE={
  merchant:{label:'Mercador',icon:'fa-coins',color:'#d8ad4c'},
  ally:{label:'Aliado',icon:'fa-shield-halved',color:'#50b878'},
  rival:{label:'Rival',icon:'fa-khanda',color:'#d95858'},
  extra:{label:'Figurante',icon:'fa-masks-theater',color:'#9aa5b1'},
  smith:{label:'Ferreiro',icon:'fa-hammer',color:'#d08048'}
};
export const NPC_ROLES=Object.fromEntries(Object.entries(NPC_ROLE_STYLE).map(([id,value])=>[id,value.label]));
export const NPC_ROOTS=['🤖 Criados pela IA','🤖 NPCs por Região'];
export const NPC_LINK_TYPES={pai:'Pai de',mãe:'Mãe de',filho:'Filho de',irmão:'Irmão de',aliado:'Aliado de',conhecido:'Conhecido de',inimigo:'Inimigo de'};
const SYMMETRIC=new Set(['aliado','conhecido','inimigo']);

export function folderPath(actor){
  const result=[];let folder=actor?.folder;const seen=new Set();
  while(folder&&!seen.has(folder.id??folder.name)){seen.add(folder.id??folder.name);result.unshift(folder.name);folder=folder.folder??folder.parent??null;}
  return result.filter(Boolean);
}
export function regionIdFromFolderPath(path,regions=REGIONS){
  if(!Array.isArray(path)||!path.length)return null;
  const names=path.map(normalize),root=names.indexOf(normalize('🤖 NPCs por Região'));
  if(root<0)return null;
  return regions.find(region=>names.slice(root+1).some(name=>name===normalize(region.name)||name===normalize(region.id)))?.id??null;
}
export function placeIdFromFolderPath(path,places=PLACES){
  if(!Array.isArray(path)||!path.length)return null;
  const names=path.map(normalize),leaf=names.at(-1);
  if(!names.some(name=>name===normalize('🤖 NPCs por Região')))return null;
  return places.find(place=>normalize(place.name)===leaf)?.id??null;
}
export function stripTags(html){
  return String(html??'').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
}
export function hasWord(haystack,needle){
  const hay=normalize(haystack),word=normalize(needle);return Boolean(word)&&` ${hay} `.includes(` ${word} `);
}
export function inferRegionId(actor,regions=REGIONS){
  const byFolder=regionIdFromFolderPath(folderPath(actor),regions);if(byFolder)return byFolder;
  const html=actor?.system?.details?.description??actor?.system?.biography??'',haystack=`${stripTags(html)} ${actor?.name??''}`;
  return regions.find(region=>hasWord(haystack,region.name)||hasWord(haystack,region.id))?.id??null;
}
export function inferPlaceId(actor,places=PLACES){
  const byFolder=placeIdFromFolderPath(folderPath(actor),places);if(byFolder)return byFolder;
  const html=actor?.system?.details?.description??actor?.system?.biography??'',haystack=`${stripTags(html)} ${actor?.name??''}`;
  const hits=places.filter(place=>hasWord(haystack,place.name));if(hits.length)return (hits.find(place=>place.regionId)??hits[0]).id;
  const region=REGIONS.find(entry=>hasWord(haystack,entry.name)||hasWord(haystack,entry.id));
  return region?.capital&&places.some(place=>place.id===region.capital)?region.capital:null;
}
export function npcFlag(actor){return actor?.flags?.[MODULE_ID]?.npc??null;}
export function isGeneratedNpc(actor){
  const path=folderPath(actor).map(normalize);
  if(npcFlag(actor))return true;
  if(actor?.type!=='character')return false;
  const regional=path.indexOf(normalize('🤖 NPCs por Região'));
  if(regional>=0)return path.length>regional+1;
  const generated=path.indexOf(normalize('🤖 Criados pela IA'));
  return generated>=0&&path[generated+1]===normalize('NPCs');
}
export function npcVisibility({role,shared=false,gm=false}){
  if(gm)return Boolean(role);
  if(!shared)return false;
  if(role==='merchant')return 'shop';
  if(role==='ally'||role==='extra')return 'identity';
  if(role==='rival')return 'identity';
  return false;
}
export function initialNpcFlag(actor){
  return {role:'extra',regionId:regionIdFromFolderPath(folderPath(actor))??'',placeId:placeIdFromFolderPath(folderPath(actor))??'',note:'',shop:{markup:1,note:'',stock:[]}};
}
export function adoptNpcFlag(actor){
  const existing=npcFlag(actor);if(existing)return existing;
  const base=initialNpcFlag(actor),placeId=inferPlaceId(actor)??base.placeId,place=PLACES.find(entry=>entry.id===placeId);
  return {...base,regionId:place?.regionId??inferRegionId(actor)??base.regionId,placeId};
}
export function itemTypeForCategory(category){
  if(String(category).startsWith('Armas'))return 'weapon';
  if(category==='Armaduras e escudos')return 'armor';
  if(category==='Vestimentas')return 'clothing';
  if(category==='Consumíveis')return 'consumable';
  if(['Sigilos','Materiais especiais','Sinapses','Artefatos do Sangue Macabro'].includes(category))return 'loot';
  return 'equipment';
}
export function normalizeNpcLinks(links){
  const result=[],seen=new Set();
  for(const raw of Array.isArray(links)?links:[]){
    const type=String(raw.type??''),from=String(raw.from??''),to=String(raw.to??'');if(!NPC_LINK_TYPES[type]||!from||!to||from===to)continue;
    const pair=SYMMETRIC.has(type)?[from,to].sort():[from,to],key=`${type}|${pair.join('|')}`;if(seen.has(key))continue;seen.add(key);
    result.push({from:pair[0],to:pair[1],type,note:String(raw.note??'')});
  }
  return result;
}
export function npcLinkSummary(key,links,nameFor=value=>value.replace(/^txt:/,'')){
  const inverse={pai:'Filho de',mãe:'Filho de',filho:'Responsável por',irmão:'Irmão de',aliado:'Aliado de',conhecido:'Conhecido de',inimigo:'Inimigo de'};
  return normalizeNpcLinks(links).filter(link=>link.from===key||link.to===key).map(link=>{
    const outward=link.from===key,target=outward?link.to:link.from,label=outward?NPC_LINK_TYPES[link.type]:inverse[link.type];
    return `${label} ${nameFor(target)}`;
  });
}
