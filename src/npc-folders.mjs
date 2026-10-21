import {PLACES,REGIONS} from './book-world.mjs';
import {folderPath,inferPlaceId,inferRegionId,npcFlag} from './npcs.mjs';

const ROOT_NAMES=new Set(['🤖 NPCs por Região','NPCs por Região']);
const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const nameOf=(rows,id,fallback)=>rows.find(row=>row.id===id)?.name??fallback;
const pathOf=folder=>{const path=[];const seen=new Set();for(let row=folder;row&&!seen.has(row.id);row=row.folder??row.parent){seen.add(row.id);path.unshift(row.name);}return path;};
const findFolder=(folders,name,parentId)=>folders.find(folder=>folder.type==='Actor'&&norm(folder.name)===norm(name)&&(folder.folder?.id??folder.parent?.id??null)===(parentId??null));

/** Plano puro: não cria pastas nem grava Actors. Jogadores e P.I.P.I. ficam fora. */
export function planNpcFolderOrganization({actors=[],folders=[],regions=REGIONS,places=PLACES}={}){
  const list=Array.from(folders),root=list.find(folder=>folder.type==='Actor'&&ROOT_NAMES.has(folder.name));
  const rows=[];
  for(const actor of Array.from(actors)){
    if(actor?.type!=='character'||actor.hasPlayerOwner||actor.ownership?.default>=2)continue;
    const flag=npcFlag(actor)??{};const placeId=flag.placeId||inferPlaceId(actor,places)||'';const regionId=flag.regionId||places.find(place=>place.id===placeId)?.regionId||inferRegionId(actor,regions)||'';
    if(!regionId)continue;
    const regionName=nameOf(regions,regionId,regionId),placeName=placeId?nameOf(places,placeId,placeId):'';
    const target=[root?.name??'🤖 NPCs por Região',regionName,...(placeName?[placeName]:[])];
    const current=folderPath(actor),same=current.length===target.length&&current.every((value,index)=>norm(value)===norm(target[index]));
    if(!same)rows.push({actorId:actor.id,actorName:actor.name,regionId,placeId,target,current});
  }
  return {rootFound:Boolean(root),rows,counts:{total:rows.length,regions:new Set(rows.map(row=>row.regionId)).size,places:new Set(rows.filter(row=>row.placeId).map(row=>row.placeId)).size}};
}

export function resolveNpcFolderPath(path,{folders=[],createFolder}={}){
  let parentId=null;const ids=[];
  for(const name of path){let folder=findFolder(folders,name,parentId);if(!folder){if(typeof createFolder!=='function')return null;folder=createFolder({name,type:'Actor',folder:parentId});folders.push(folder);}ids.push(folder.id);parentId=folder.id;}
  return ids.at(-1)??null;
}
