import {REGIONS, PLACES, BEYOND} from './book-world.mjs';
import {NPC_ROLES} from './npcs.mjs';
import {ORGANIZATIONS} from './ambientacao.mjs';

export const CATALOG_KEY='worldCatalog';
export const CATALOG_SCHEMA=1;
const GROUPS=['regions','places','tags','climates'];
const clone=value=>structuredClone(value);
const key=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const text=value=>String(value??'').trim().slice(0,200);
const strings=value=>[...new Set((Array.isArray(value)?value:[]).map(text).filter(Boolean))];
const climateSeeds=[['temperado','Temperado'],['frio','Frio'],['arido','Árido'],['umido','Úmido'],['magico','Mágico / variável']];

/** Metadados públicos, sem copiar a prosa do livro ou impor clima por região. */
export function baseWorldCatalog(){
  const kinds=[...new Set(PLACES.map(p=>p.kind))];
  return {schemaVersion:CATALOG_SCHEMA,revision:0,
    regions:REGIONS.map(r=>({id:r.id,name:r.name,color:r.color,capitalId:r.capital,aliases:[],tags:[],climateId:'',active:true,source:'skyfall-book',imageKey:`region:${r.id}`})),
    places:PLACES.map(p=>({id:p.id,name:p.name,regionId:p.regionId,parentId:p.parentId??'',kind:p.kind,aliases:[],tags:[],climateId:'',active:true,source:'skyfall-book',imageKey:`place:${p.id}`})),
    tags:[...Object.entries(NPC_ROLES).map(([id,label])=>({id:`role:${id}`,name:label,label,category:'npc-role',active:true,source:'quedaco'})),...kinds.map(name=>({id:`place:${key(name)}`,name,label:name,category:'place-kind',active:true,source:'quedaco'}))],
    climates:climateSeeds.map(([id,name])=>({id,name,description:'Perfil configurável da campanha; sem efeitos mecânicos automáticos.',active:true,source:'quedaco'})),
    organizations:ORGANIZATIONS.map(row=>({...clone(row),active:true})),
    beyond:BEYOND.map(({id,name,kind,parentId})=>({id,name,kind,parentId:parentId??'',source:'skyfall-book'}))};
}

export function buildWorldCatalog(stored={}, {isGM=true,includeInactive=false}={}){
  const result=baseWorldCatalog();
  result.revision=Number.isSafeInteger(stored?.revision)?stored.revision:0;
  for(const group of GROUPS){
    const rows=new Map(result[group].map(r=>[r.id,r]));
    for(const row of Array.isArray(stored?.[group])?stored[group]:[])if(row&&typeof row.id==='string')rows.set(row.id,{...rows.get(row.id),...clone(row)});
    result[group]=[...rows.values()].filter(r=>(includeInactive||r.active!==false)&&(isGM||r.visibility!=='gm'));
  }
  // Referências restritas não podem revelar nomes, aliases nem relações aos jogadores.
  if(!isGM){
    const regions=new Set(result.regions.map(r=>r.id));
    let places=result.places.filter(p=>regions.has(p.regionId));
    let previous;
    do{previous=places.length;const ids=new Set(places.map(p=>p.id));places=places.filter(p=>!p.parentId||ids.has(p.parentId));}while(places.length!==previous);
    result.places=places;
    const tags=new Set(result.tags.map(t=>t.id)),climates=new Set(result.climates.map(c=>c.id));
    for(const row of [...result.regions,...result.places]){row.tags=(row.tags??[]).filter(t=>tags.has(t));if(!climates.has(row.climateId))row.climateId='';}
    result.organizations=result.organizations.filter(row=>row.visibility!=='gm'&&row.active!==false);
  }
  return result;
}

function validate(catalog){
  const ids=group=>new Set(catalog[group].map(r=>r.id));
  const regions=ids('regions'),places=ids('places'),tags=ids('tags'),climates=ids('climates');
  for(const row of [...catalog.regions,...catalog.places]){
    if(row.climateId&&!climates.has(row.climateId))throw Error('Clima não cadastrado.');
    if((row.tags??[]).some(t=>!tags.has(t)))throw Error('Tag não cadastrada.');
  }
  for(const row of catalog.regions)if(row.capitalId){const capital=catalog.places.find(p=>p.id===row.capitalId);if(!capital||capital.regionId!==row.id)throw Error('Capital deve pertencer à região.');}
  for(const row of catalog.places){
    if(!regions.has(row.regionId))throw Error('Região não cadastrada.');
    if(row.parentId&&!places.has(row.parentId))throw Error('Localidade-pai não cadastrada.');
    const seen=new Set([row.id]);let parent=catalog.places.find(p=>p.id===row.parentId);
    while(parent){if(seen.has(parent.id))throw Error('A hierarquia de localidades não pode ter ciclos.');if(parent.regionId!==row.regionId)throw Error('Localidade-pai deve pertencer à mesma região.');seen.add(parent.id);parent=catalog.places.find(p=>p.id===parent.parentId);}
  }
}

/** Atualização imutável: ID estável, lista de campos permitidos e sem exclusão. */
export function updateCatalogRecord(stored,group,input){
  if(!GROUPS.includes(group))throw Error('Cadastro inválido.');
  const id=text(input?.id);
  if(!/^[a-z0-9][a-z0-9:-]{0,99}$/.test(id)||['constructor','prototype','__proto__'].includes(id))throw Error('Use um ID estável em letras minúsculas, números, hífen ou dois-pontos.');
  const catalog=buildWorldCatalog(stored,{includeInactive:true});
  const before=catalog[group].find(r=>r.id===id);
  const name=text(input.name??before?.name);
  if(!name)throw Error('Informe um nome.');
  const row={...before,id,name,source:before?.source??'world',active:input.active??before?.active??true,visibility:input.visibility??before?.visibility??(before?'public':'gm')};
  if(typeof row.active!=='boolean'||!['gm','public'].includes(row.visibility))throw Error('Visibilidade inválida.');
  for(const field of ['regionId','parentId','kind','capitalId','climateId','category','description','color'])if(input[field]!==undefined)row[field]=text(input[field]);
  if(row.color&&!/^#[0-9a-f]{6}$/i.test(row.color))throw Error('Cor inválida.');
  for(const field of ['aliases','tags'])if(input[field]!==undefined)row[field]=strings(input[field]);
  if(group==='tags')row.label=name;
  if(group==='places'||group==='regions')row.imageKey=`${group==='places'?'place':'region'}:${id}`;
  const next={schemaVersion:CATALOG_SCHEMA,revision:(stored?.revision??0)+1};
  for(const g of GROUPS)next[g]=clone(Array.isArray(stored?.[g])?stored[g]:[]);
  next[group]=[...next[group].filter(r=>r.id!==id),row];
  validate(buildWorldCatalog(next,{includeInactive:true}));
  return next;
}

export function createWorldCatalogService(game,hooks){
  let queue=Promise.resolve();
  const read=()=>{try{return game.settings?.get?.('quedaco',CATALOG_KEY)??{};}catch{return {};}};
  const get=options=>buildWorldCatalog(read(),{...options,isGM:game.user?.isGM===true});
  const list=(group,options={})=>get(options)[group].filter(r=>!options.regionId||r.regionId===options.regionId).filter(r=>!options.category||r.category===options.category);
  const service={
    getWorldCatalog:get,listRegions:options=>list('regions',options),listPlaces:options=>list('places',options),listTags:options=>list('tags',options),listClimates:options=>list('climates',options),
    listOrganizations:options=>get(options).organizations.filter(row=>!options?.regionId||row.regionIds.includes(options.regionId)),
    getOrganization:id=>get().organizations.find(row=>row.id===id)??null,
    getPlace:id=>list('places').find(p=>p.id===id)??null,
    getEnvironment(placeId){const c=get(),place=c.places.find(p=>p.id===placeId);if(!place)return null;const region=c.regions.find(r=>r.id===place.regionId);let climateId=place.climateId,sourceId=place.id,parent=place;const seen=new Set();while(!climateId&&parent.parentId&&!seen.has(parent.id)){seen.add(parent.id);parent=c.places.find(p=>p.id===parent.parentId);if(!parent)break;climateId=parent.climateId;sourceId=parent.id;}if(!climateId){climateId=region?.climateId;sourceId=region?.id;}return {placeId,regionId:place.regionId,climate:c.climates.find(r=>r.id===climateId)??null,sourceId:climateId?sourceId:null};},
    resolveLocality(value){const catalog=get(),needle=key(value);const exact=[...catalog.regions,...catalog.places].filter(r=>r.id===value);if(exact.length===1)return exact[0];const matches=[...catalog.regions,...catalog.places].filter(r=>[r.name,...r.aliases??[]].some(v=>key(v)===needle));return matches.length===1?matches[0]:null;},
    getImageKey(type,id){const row=list(type==='region'?'regions':'places').find(r=>r.id===id);return row?.imageKey??null;},
    async upsertCatalogRecord(group,record,{expectedRevision}={}){
      if(!game.user?.isGM)throw Error('Somente a Mestra pode editar os cadastros.');
      const task=queue.then(async()=>{const stored=read();if(expectedRevision!==undefined&&expectedRevision!==(stored.revision??0))throw Error('O cadastro mudou. Reabra a edição antes de salvar.');const next=updateCatalogRecord(stored,group,record);await game.settings.set('quedaco',CATALOG_KEY,next);return get({includeInactive:true})[group].find(r=>r.id===record.id);});queue=task.catch(()=>{});return task;
    },
    getExplorerCatalog(){const c=get();return {regions:c.regions,places:c.places,tags:c.tags};},
    getMapLinks(placeId){if(!service.getPlace(placeId))return [];let atlas={},legacy={};try{atlas=game.settings.get('quedaco','sceneAtlas')??{};legacy=game.settings.get('quedaco','placeScenes')??{};}catch{}const ids=new Set(Object.entries(atlas.scenes??{}).filter(([,s])=>s.parentId===`place:${placeId}`).map(([id])=>id));for(const id of [].concat(legacy[placeId]??[]))ids.add(id);return [...game.scenes??[]].filter(s=>ids.has(s.id)&&s.visible!==false).map(s=>({id:s.id,uuid:s.uuid??`Scene.${s.id}`,name:s.name}));}
  };
  return Object.freeze(service);
}

export function registerWorldCatalog(game,hooks){
  game.settings.register('quedaco',CATALOG_KEY,{scope:'world',config:false,type:Object,default:{schemaVersion:CATALOG_SCHEMA,revision:0},onChange:value=>hooks?.callAll?.('quedaco:catalog-updated',{schemaVersion:CATALOG_SCHEMA,revision:value?.revision??0})});
}
