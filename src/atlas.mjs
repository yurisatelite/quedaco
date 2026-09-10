const normalized=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const CITY_KINDS=new Set([
  'capital','cidade','vila','cidade fortaleza','cidade costeira','porto','distrito',
  'cidade soterrada','cidades historicas','capital em ruinas','ilha','fazenda','mercado'
]);

export const DOSSIER_BLOCKS=Object.freeze(['cover','places','fauna','threats','quests','knownNpcs','territoryNpcs','rumors']);

export function placeLayer(kind){
  const key=normalized(kind);
  if(key==='queda')return 'queda';
  return CITY_KINDS.has(key)?'cidade':'marco';
}

export function defaultHiddenPlaces(places=[]){
  return new Set(places.filter(place=>placeLayer(place?.kind)==='queda').map(place=>String(place.id)).filter(Boolean));
}

function locationMatches(quest,region,places){
  const haystack=` ${normalized(quest?.location)} `;
  if(!haystack.trim())return false;
  return [region,...places].some(entry=>{const needle=normalized(entry?.name);return needle&&haystack.includes(` ${needle} `);});
}

/** Build a serializable dossier view model without Foundry globals. */
export function regionDossier(regionId,{regions=[],places=[],npcs=[],monsters=[],quests=[],monsterHabitats={},rumors={}}={}){
  const region=regions.find(entry=>entry.id===regionId)??null;
  const localPlaces=places.filter(entry=>entry.regionId===regionId);
  const grouped={cidade:[],marco:[],queda:[]};
  for(const place of localPlaces)grouped[placeLayer(place.kind)].push(place);
  const knownNpcs=npcs.filter(npc=>npc?.placeId&&localPlaces.some(place=>place.id===npc.placeId));
  const territoryNpcs=npcs.filter(npc=>!npc?.placeId&&npc?.regionId===regionId);
  const threats=monsters.filter(monster=>(monsterHabitats?.[monster.id]??monster.habitat??[]).includes(regionId));
  const openQuests=quests.filter(quest=>!['completed','failed','inactive'].includes(quest?.status)&&locationMatches(quest,region,localPlaces));
  const regionRumors=Array.isArray(rumors?.[regionId])?rumors[regionId]:[];
  return {
    region,
    blocks:{
      cover:region,
      places:grouped,
      fauna:Array.isArray(region?.fauna)?region.fauna:[],
      threats,
      quests:openQuests,
      knownNpcs,
      territoryNpcs,
      rumors:regionRumors
    }
  };
}
