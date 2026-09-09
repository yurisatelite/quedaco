import {MODULE_ID} from './adapter.mjs';
import {PLACES} from './book-world.mjs';
import {normalize} from './rules.mjs';

export const NPC_ROLES={merchant:'Mercador',ally:'Aliado',rival:'Rival',extra:'Figurante'};
export const NPC_ROOTS=['🤖 Criados pela IA','🤖 NPCs por Região'];
export const NPC_LINK_TYPES={pai:'Pai de',mãe:'Mãe de',filho:'Filho de',irmão:'Irmão de',aliado:'Aliado de',conhecido:'Conhecido de',inimigo:'Inimigo de'};
const SYMMETRIC=new Set(['aliado','conhecido','inimigo']);

export function folderPath(actor){
  const result=[];let folder=actor?.folder;const seen=new Set();
  while(folder&&!seen.has(folder.id??folder.name)){seen.add(folder.id??folder.name);result.unshift(folder.name);folder=folder.folder??folder.parent??null;}
  return result.filter(Boolean);
}
export function placeIdFromFolderPath(path,places=PLACES){
  if(!Array.isArray(path)||!path.length)return null;
  const names=path.map(normalize),leaf=names.at(-1);
  if(!names.some(name=>name===normalize('🤖 NPCs por Região')))return null;
  return places.find(place=>normalize(place.name)===leaf)?.id??null;
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
export function npcVisibility({role,active,shared=false,gm=false}){
  if(gm)return Boolean(role);
  if(!active||!shared)return false;
  if(role==='merchant')return 'shop';
  if(role==='ally'||role==='extra')return 'identity';
  if(role==='rival')return 'identity';
  return false;
}
export function initialNpcFlag(actor){
  return {role:'extra',placeId:placeIdFromFolderPath(folderPath(actor))??'',active:false,note:'',shop:{markup:1,note:'',stock:[]}};
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
