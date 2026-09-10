import {MODULE_ID} from './adapter.mjs';
import {PLACES,REGIONS} from './book-world.mjs';
import {normalize} from './rules.mjs';

export const NPC_ROLE_STYLE={
  merchant:{label:'Mercador',icon:'fa-coins',color:'#d8ad4c'},
  smith:{label:'Ferreiro',icon:'fa-hammer',color:'#d08048'},
  ally:{label:'Aliado',icon:'fa-shield-halved',color:'#50b878'},
  rival:{label:'Rival',icon:'fa-khanda',color:'#d95858'},
  extra:{label:'Figurante',icon:'fa-masks-theater',color:'#9aa5b1'},
  diplomat:{label:'Diplomata',icon:'fa-handshake',color:'#6ab0d6'},
  guard:{label:'Guarda',icon:'fa-shield',color:'#7f8c9b'},
  clergy:{label:'Clero',icon:'fa-hands-praying',color:'#e6d3a3'},
  scholar:{label:'Erudito',icon:'fa-book-open',color:'#a98fd0'},
  noble:{label:'Nobre',icon:'fa-crown',color:'#e2c044'},
  spy:{label:'Espião',icon:'fa-user-secret',color:'#667080'},
  healer:{label:'Curandeiro',icon:'fa-kit-medical',color:'#5fc9a3'},
  artisan:{label:'Artesão',icon:'fa-screwdriver-wrench',color:'#c98a5b'},
  authority:{label:'Autoridade',icon:'fa-gavel',color:'#b9762f'},
  usurer:{label:'Agiota',icon:'fa-sack-dollar',color:'#caa64a'},
  mercenary:{label:'Mercenário',icon:'fa-crosshairs',color:'#cc6a5a'},
  informant:{label:'Informante',icon:'fa-comment-dots',color:'#8fa4b5'}
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

export function npcCoverage(region,actors=[],places=PLACES){
  const expected=Array.from(region?.npcArchetypes??[]),found=new Set();
  for(const actor of actors){
    const flag=npcFlag(actor)??adoptNpcFlag(actor),actorRegion=flag.regionId||places.find(place=>place.id===flag.placeId)?.regionId||inferRegionId(actor);
    if(actorRegion!==region?.id)continue;
    const text=`${actor?.name??''} ${stripTags(actor?.system?.details?.description??actor?.system?.biography??'')} ${NPC_ROLES[flag.role]??''}`;
    for(const archetype of expected)if(hasWord(text,archetype)||(archetype==='ferreiro'&&flag.role==='smith')||(archetype==='mercador'&&flag.role==='merchant'))found.add(archetype);
  }
  return {regionId:region?.id,expected,found:[...found],missing:expected.filter(item=>!found.has(item))};
}

export function npcVisibility({role,shared=false,gm=false,forge={}}){
  if(!role)return false;
  if(!gm&&!shared)return false;
  if(role==='merchant')return 'shop';
  if(role==='smith'&&forge.enabled!==false)return 'forge';
  return 'identity';
}
export function npcCardOutline(flag={}){if(flag?.placeId)return 'city';if(flag?.regionId||flag?.itinerant)return 'itinerant';return 'none';}
export function initialNpcFlag(actor){
  return {role:'extra',regionId:regionIdFromFolderPath(folderPath(actor))??'',placeId:placeIdFromFolderPath(folderPath(actor))??'',tokenVisible:true,note:'',shop:{markup:1,note:'',stock:[]},forge:{enabled:false,markup:1}};
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

const BIO_RELATIONS=[
 ['filho','filho de'],['filho','filha de'],['irmão','irmão de'],['irmão','irmã de'],['mãe','mãe de'],['pai','pai de'],
 ['aliado','casado com'],['aliado','casada com'],['aliado','aliado de'],['aliado','aliada de'],['inimigo','rival de'],['inimigo','inimigo de'],['inimigo','inimiga de']
];
export function resolveLinkTarget(name,allNpcs=[]){
  const matches=Array.from(allNpcs).filter(actor=>normalize(actor?.name)===normalize(name));
  if(matches.length===1)return {match:matches[0]};
  if(matches.length>1)return {ambiguous:matches};
  return {match:null};
}
export function linksFromBio(actor,allNpcs=[]){
  const bio=stripTags(actor?.system?.details?.description??actor?.system?.biography??''),from=actor?.uuid??actor?.id;
  if(!from||!bio)return [];
  const results=[],seen=new Set();
  for(const candidate of allNpcs){
    if(candidate===actor||candidate?.uuid===from||!candidate?.name)continue;
    for(const [type,phrase] of BIO_RELATIONS){
      if(!hasWord(bio,`${phrase} ${candidate.name}`))continue;
      const key=`${type}|${normalize(candidate.name)}`;if(seen.has(key))continue;seen.add(key);
      const resolution=resolveLinkTarget(candidate.name,allNpcs.filter(item=>item?.uuid!==from));
      results.push({type,from,targetName:candidate.name,to:resolution.match?.uuid??null,note:'da bio',...(resolution.ambiguous?{ambiguous:resolution.ambiguous}:{} )});
    }
  }
  return results;
}

export function npcLinkSummary(key,links,nameFor=value=>value.replace(/^txt:/,'')){
  const inverse={pai:'Filho de',mãe:'Filho de',filho:'Responsável por',irmão:'Irmão de',aliado:'Aliado de',conhecido:'Conhecido de',inimigo:'Inimigo de'};
  return normalizeNpcLinks(links).filter(link=>link.from===key||link.to===key).map(link=>{
    const outward=link.from===key,target=outward?link.to:link.from,label=outward?NPC_LINK_TYPES[link.type]:inverse[link.type];
    return `${label} ${nameFor(target)}`;
  });
}
