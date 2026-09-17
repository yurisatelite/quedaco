import {PLACES,REGIONS} from './book-world.mjs';

export const SCENE_ATLAS_SCHEMA=1;
export const SCENE_ATLAS_PROVIDERS=Object.freeze(['stairways','native']);
export const SCENE_ATLAS_RUNTIME_PROVIDERS=Object.freeze(['none',...SCENE_ATLAS_PROVIDERS]);
export const SCENE_ATLAS_UNASSIGNED='unassigned';

const PROVIDERS=new Set(SCENE_ATLAS_PROVIDERS);
const RUNTIME_PROVIDERS=new Set(SCENE_ATLAS_RUNTIME_PROVIDERS);
const PARENT_TYPES=new Set(['region','place','scene']);
const UNSAFE_IDS=new Set(['__proto__','prototype','constructor']);
const hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const cleanId=value=>{
  const id=typeof value==='string'?value.trim():'';
  return UNSAFE_IDS.has(id)?'':id;
};

function cloneJson(value,stack=new Set()){
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(typeof value!=='object')return undefined;
  if(stack.has(value))return undefined;
  stack.add(value);
  let result;
  if(Array.isArray(value)){
    result=value.map(entry=>{
      const cloned=cloneJson(entry,stack);
      return cloned===undefined?null:cloned;
    });
  }else{
    const entries=[];
    for(const [key,entry] of Object.entries(value)){
      const cloned=cloneJson(entry,stack);
      if(cloned!==undefined)entries.push([key,cloned]);
    }
    result=Object.fromEntries(entries);
  }
  stack.delete(value);
  return result;
}

function cloneObject(value){
  const cloned=cloneJson(value);
  return isObject(cloned)?cloned:{};
}

function parseParentId(parentId){
  const value=cleanId(parentId);
  if(value===SCENE_ATLAS_UNASSIGNED)return {type:'unassigned',id:''};
  const separator=value.indexOf(':');
  if(separator<1)return null;
  const type=value.slice(0,separator);
  const id=cleanId(value.slice(separator+1));
  if(!PARENT_TYPES.has(type)||!id)return null;
  return {type,id};
}

export function isValidSceneAtlasParentId(parentId){
  return Boolean(parseParentId(parentId));
}

function normalizedParentId(parentId){
  const parsed=parseParentId(parentId);
  if(!parsed)return SCENE_ATLAS_UNASSIGNED;
  return parsed.type==='unassigned'?SCENE_ATLAS_UNASSIGNED:`${parsed.type}:${parsed.id}`;
}

function normalizedEndpoint(value){
  if(!isObject(value))return null;
  const sceneId=cleanId(value.sceneId);
  if(!sceneId)return null;
  const endpoint={sceneId};
  if(typeof value.x==='number'&&Number.isFinite(value.x))endpoint.x=value.x;
  if(typeof value.y==='number'&&Number.isFinite(value.y))endpoint.y=value.y;
  return endpoint;
}

function normalizedEdge(value,fallbackId=''){
  if(!isObject(value))return null;
  const id=cleanId(fallbackId)||cleanId(value.id);
  const from=normalizedEndpoint(value.from);
  const to=normalizedEndpoint(value.to);
  if(!id||!from||!to)return null;
  const runtimeProvider=RUNTIME_PROVIDERS.has(value.runtimeProvider)?value.runtimeProvider:'none';
  return {
    id,
    label:typeof value.label==='string'?value.label.trim():'',
    bidirectional:Boolean(value.bidirectional),
    from,
    to,
    runtimeProvider,
    implementations:cloneObject(value.implementations)
  };
}

function breakSceneParentCycles(scenes){
  for(const startId of Object.keys(scenes).sort()){
    const path=[startId];
    const positions=new Map([[startId,0]]);
    let currentId=startId;
    while(true){
      const parsed=parseParentId(scenes[currentId]?.parentId);
      if(parsed?.type!=='scene'||!hasOwn(scenes,parsed.id))break;
      if(positions.has(parsed.id)){
        for(const sceneId of path.slice(positions.get(parsed.id)))scenes[sceneId]={parentId:SCENE_ATLAS_UNASSIGNED};
        break;
      }
      currentId=parsed.id;
      positions.set(currentId,path.length);
      path.push(currentId);
    }
  }
  return scenes;
}

export function emptySceneAtlas(){
  return {schema:SCENE_ATLAS_SCHEMA,providers:{stairways:false,native:false},scenes:{},edges:{}};
}

export const createSceneAtlas=emptySceneAtlas;

/** Return a new, JSON-safe atlas containing only fields in the persisted schema. */
export function normalizeSceneAtlas(value){
  const source=isObject(value)?value:{};
  const sceneEntries=[];
  if(isObject(source.scenes))for(const [rawId,rawScene] of Object.entries(source.scenes)){
    const sceneId=cleanId(rawId);
    if(!sceneId)continue;
    sceneEntries.push([sceneId,{parentId:normalizedParentId(rawScene?.parentId)}]);
  }
  const scenes=breakSceneParentCycles(Object.fromEntries(sceneEntries));
  const edgeEntries=[];
  if(isObject(source.edges))for(const [rawId,rawEdge] of Object.entries(source.edges)){
    const edge=normalizedEdge(rawEdge,rawId);
    if(edge)edgeEntries.push([edge.id,edge]);
  }
  return {
    schema:SCENE_ATLAS_SCHEMA,
    providers:{
      stairways:Boolean(source.providers?.stairways),
      native:Boolean(source.providers?.native)
    },
    scenes,
    edges:Object.fromEntries(edgeEntries)
  };
}

export function cloneSceneAtlas(value){
  return normalizeSceneAtlas(value);
}

function requiredId(value,label){
  const id=cleanId(value);
  if(!id)throw new TypeError(`${label} inválido.`);
  return id;
}

export function setAtlasProvider(atlas,provider,enabled){
  if(!PROVIDERS.has(provider))throw new TypeError('Provedor do atlas inválido.');
  const result=cloneSceneAtlas(atlas);
  result.providers[provider]=Boolean(enabled);
  return result;
}

export const setSceneAtlasProvider=setAtlasProvider;

/** Register a Scene without changing an assignment that already exists. */
export function registerAtlasScene(atlas,sceneId,parentId){
  const id=requiredId(typeof sceneId==='object'?sceneId?.id:sceneId,'ID de Scene');
  let result=cloneSceneAtlas(atlas);
  if(!hasOwn(result.scenes,id))result.scenes[id]={parentId:SCENE_ATLAS_UNASSIGNED};
  if(parentId!==undefined)result=assignAtlasScene(result,id,parentId);
  return result;
}

/** Add real Scenes that are not known yet while preserving entries no longer present. */
export function syncAtlasScenes(atlas,scenes=[]){
  const result=cloneSceneAtlas(atlas);
  for(const scene of Array.isArray(scenes)?scenes:[]){
    const id=cleanId(typeof scene==='object'?scene?.id:scene);
    if(id&&!hasOwn(result.scenes,id))result.scenes[id]={parentId:SCENE_ATLAS_UNASSIGNED};
  }
  return result;
}

/** Explicitly unregister a Scene. Edges are retained so broken links remain repairable. */
export function removeAtlasScene(atlas,sceneId){
  const id=requiredId(sceneId,'ID de Scene');
  const result=cloneSceneAtlas(atlas);
  result.scenes=Object.fromEntries(Object.entries(result.scenes).filter(([entryId])=>entryId!==id));
  for(const entry of Object.values(result.scenes))if(entry.parentId===`scene:${id}`)entry.parentId=SCENE_ATLAS_UNASSIGNED;
  return result;
}

export function assignAtlasScene(atlas,sceneId,parentId=SCENE_ATLAS_UNASSIGNED){
  const id=requiredId(sceneId,'ID de Scene');
  const parsed=parseParentId(parentId);
  if(!parsed)throw new TypeError('Pai de Scene inválido.');
  const parent=parsed.type==='unassigned'?SCENE_ATLAS_UNASSIGNED:`${parsed.type}:${parsed.id}`;
  const result=cloneSceneAtlas(atlas);
  if(!hasOwn(result.scenes,id))throw new Error(`Scene não registrada: ${id}.`);
  if(parsed.type==='scene'){
    if(!hasOwn(result.scenes,parsed.id))throw new Error(`Scene-pai não registrada: ${parsed.id}.`);
    let cursor=parsed.id;
    const visited=new Set();
    while(cursor){
      if(cursor===id)throw new Error('A atribuição criaria um ciclo entre Scenes.');
      if(visited.has(cursor))throw new Error('A hierarquia de Scenes já contém um ciclo.');
      visited.add(cursor);
      const next=parseParentId(result.scenes[cursor]?.parentId);
      cursor=next?.type==='scene'?next.id:'';
    }
  }
  result.scenes[id]={parentId:parent};
  return result;
}

function addEdgeScenes(atlas,edge){
  for(const sceneId of [edge.from.sceneId,edge.to.sceneId])if(!hasOwn(atlas.scenes,sceneId))atlas.scenes[sceneId]={parentId:SCENE_ATLAS_UNASSIGNED};
}

export function createAtlasEdge(atlas,edge){
  const result=cloneSceneAtlas(atlas);
  const normalized=normalizedEdge(edge);
  if(!normalized)throw new TypeError('Aresta do atlas inválida.');
  if(hasOwn(result.edges,normalized.id))throw new Error(`Aresta já registrada: ${normalized.id}.`);
  result.edges[normalized.id]=normalized;
  addEdgeScenes(result,normalized);
  return result;
}

export function updateAtlasEdge(atlas,edgeId,changes={}){
  const id=requiredId(edgeId,'ID de aresta');
  const result=cloneSceneAtlas(atlas);
  const current=result.edges[id];
  if(!current)throw new Error(`Aresta não registrada: ${id}.`);
  if(changes?.id!==undefined&&cleanId(changes.id)!==id)throw new Error('O ID de uma aresta não pode ser alterado.');
  const candidate={
    ...current,
    ...(isObject(changes)?changes:{}),
    id,
    from:{...current.from,...(isObject(changes?.from)?changes.from:{})},
    to:{...current.to,...(isObject(changes?.to)?changes.to:{})},
    implementations:changes?.implementations===undefined
      ?current.implementations
      :{...current.implementations,...cloneObject(changes.implementations)}
  };
  const normalized=normalizedEdge(candidate,id);
  if(!normalized)throw new TypeError('Atualização de aresta inválida.');
  result.edges[id]=normalized;
  addEdgeScenes(result,normalized);
  return result;
}

export function removeAtlasEdge(atlas,edgeId){
  const id=requiredId(edgeId,'ID de aresta');
  const result=cloneSceneAtlas(atlas);
  result.edges=Object.fromEntries(Object.entries(result.edges).filter(([entryId])=>entryId!==id));
  return result;
}

/** Set or clear x/y for one endpoint. Undefined preserves a coordinate; null clears it. */
export function setAtlasEndpointCoordinates(atlas,edgeId,side,coordinates={}){
  if(side!=='from'&&side!=='to')throw new TypeError('Endpoint deve ser "from" ou "to".');
  if(!isObject(coordinates))throw new TypeError('Coordenadas inválidas.');
  const result=cloneSceneAtlas(atlas);
  const id=requiredId(edgeId,'ID de aresta');
  const edge=result.edges[id];
  if(!edge)throw new Error(`Aresta não registrada: ${id}.`);
  const endpoint={...edge[side]};
  for(const axis of ['x','y']){
    if(coordinates[axis]===undefined)continue;
    if(coordinates[axis]===null){delete endpoint[axis];continue;}
    if(typeof coordinates[axis]!=='number'||!Number.isFinite(coordinates[axis]))throw new TypeError(`Coordenada ${axis} inválida.`);
    endpoint[axis]=coordinates[axis];
  }
  edge[side]=endpoint;
  return result;
}

export const setAtlasEndpoint=setAtlasEndpointCoordinates;

export function setAtlasEdgeRuntimeProvider(atlas,edgeId,provider){
  if(!RUNTIME_PROVIDERS.has(provider))throw new TypeError('Provedor de execução inválido.');
  return updateAtlasEdge(atlas,edgeId,{runtimeProvider:provider});
}

function endpointPositioned(endpoint){
  return Number.isFinite(endpoint?.x)&&Number.isFinite(endpoint?.y);
}

export function sceneAtlasCounts(atlas,realScenes=null){
  const value=normalizeSceneAtlas(atlas);
  const sceneIds=Object.keys(value.scenes);
  const actualIds=realScenes===null
    ?new Set(sceneIds)
    :new Set((Array.isArray(realScenes)?realScenes:[]).map(scene=>cleanId(typeof scene==='object'?scene?.id:scene)).filter(Boolean));
  const edges=Object.values(value.edges);
  const runtimeProviders={none:0,stairways:0,native:0};
  for(const edge of edges)runtimeProviders[edge.runtimeProvider]++;
  return {
    scenes:sceneIds.length,
    actualScenes:actualIds.size,
    assignedScenes:sceneIds.filter(id=>value.scenes[id].parentId!==SCENE_ATLAS_UNASSIGNED).length,
    unassignedScenes:sceneIds.filter(id=>value.scenes[id].parentId===SCENE_ATLAS_UNASSIGNED).length,
    missingScenes:sceneIds.filter(id=>!actualIds.has(id)).length,
    edges:edges.length,
    bidirectionalEdges:edges.filter(edge=>edge.bidirectional).length,
    positionedEdges:edges.filter(edge=>endpointPositioned(edge.from)&&endpointPositioned(edge.to)).length,
    runtimeProviders,
    providers:{...value.providers}
  };
}

function mappedSceneIds(value){
  if(Array.isArray(value))return value.map(cleanId).filter(Boolean);
  const id=cleanId(value);
  return id?[id]:[];
}

function sceneInventory(atlas,scenes,placeScenes,regionScenes){
  const actual=new Map();
  for(const scene of Array.isArray(scenes)?scenes:[]){
    const id=cleanId(typeof scene==='object'?scene?.id:scene);
    if(id)actual.set(id,typeof scene==='object'?scene:{id,name:id});
  }
  const ids=new Set([...actual.keys(),...Object.keys(atlas.scenes)]);
  for(const scene of Object.values(atlas.scenes)){
    const parsed=parseParentId(scene.parentId);
    if(parsed?.type==='scene')ids.add(parsed.id);
  }
  if(isObject(placeScenes))for(const value of Object.values(placeScenes))for(const id of mappedSceneIds(value))ids.add(id);
  if(isObject(regionScenes))for(const value of Object.values(regionScenes))for(const id of mappedSceneIds(value))ids.add(id);
  for(const edge of Object.values(atlas.edges))for(const endpoint of [edge.from,edge.to])ids.add(endpoint.sceneId);
  return {actual,ids};
}

function legacyParentMaps(places,regions,placeScenes,regionScenes){
  const placeByScene=new Map();
  for(const place of places){
    const ids=mappedSceneIds(placeScenes?.[place.id]);
    for(const id of ids)if(!placeByScene.has(id))placeByScene.set(id,`place:${place.id}`);
  }
  const regionByScene=new Map();
  for(const region of regions){
    const ids=mappedSceneIds(regionScenes?.[region.id]);
    for(const id of ids)if(!regionByScene.has(id))regionByScene.set(id,`region:${region.id}`);
  }
  return {placeByScene,regionByScene};
}

function sceneNodeData(scene,id){
  const name=typeof scene?.name==='string'&&scene.name.trim()?scene.name.trim():id;
  const img=typeof scene?.thumb==='string'&&scene.thumb?scene.thumb:
    typeof scene?.img==='string'&&scene.img?scene.img:
    typeof scene?.background?.src==='string'?scene.background.src:null;
  return {id:`scene:${id}`,key:id,type:'scene',label:name,img,missing:!scene,parentId:SCENE_ATLAS_UNASSIGNED,children:[],edgeIds:[]};
}

function addNodeCounts(node,edges){
  const sceneIds=new Set(node.type==='scene'?[node.key]:[]);
  let missingScenes=node.type==='scene'&&node.missing?1:0;
  for(const child of node.children){
    const childResult=addNodeCounts(child,edges);
    for(const id of childResult.sceneIds)sceneIds.add(id);
    missingScenes+=childResult.missingScenes;
  }
  const edgeCount=edges.filter(edge=>sceneIds.has(edge.from.sceneId)||sceneIds.has(edge.to.sceneId)).length;
  node.counts={scenes:sceneIds.size,missingScenes,edges:edgeCount};
  return {sceneIds,missingScenes};
}

/** Build the full conceptual hierarchy without reading Foundry globals. */
export function buildSceneAtlasTree({
  atlas,
  regions=REGIONS,
  places=PLACES,
  scenes=[],
  placeScenes={},
  regionScenes={}
}={}){
  const value=normalizeSceneAtlas(atlas);
  const regionList=Array.isArray(regions)?regions.filter(region=>cleanId(region?.id)):[];
  const placeList=Array.isArray(places)?places.filter(place=>cleanId(place?.id)):[];
  const regionNodes=new Map(regionList.map(region=>[region.id,{
    id:`region:${region.id}`,key:region.id,type:'region',label:region.name??region.id,data:region,children:[]
  }]));
  const placeNodes=new Map(placeList.map(place=>[place.id,{
    id:`place:${place.id}`,key:place.id,type:'place',label:place.name??place.id,data:place,children:[]
  }]));
  const placesById=new Map(placeList.map(place=>[place.id,place]));
  const hasPlaceCycle=startId=>{
    const visited=new Set();
    let cursor=startId;
    while(cursor){
      if(visited.has(cursor))return true;
      visited.add(cursor);
      const parentId=cleanId(placesById.get(cursor)?.parentId);
      cursor=placesById.has(parentId)?parentId:'';
    }
    return false;
  };
  for(const place of placeList){
    const parentId=cleanId(place.parentId);
    const parent=!hasPlaceCycle(place.id)?placeNodes.get(parentId):null;
    (parent??regionNodes.get(place.regionId))?.children.push(placeNodes.get(place.id));
  }

  const unassigned={id:SCENE_ATLAS_UNASSIGNED,key:SCENE_ATLAS_UNASSIGNED,type:'group',label:'Sem região/local definido',children:[]};
  const {actual,ids}=sceneInventory(value,scenes,placeScenes,regionScenes);
  const sceneNodes=new Map([...ids].sort().map(id=>[id,sceneNodeData(actual.get(id),id)]));
  const {placeByScene,regionByScene}=legacyParentMaps(placeList,regionList,placeScenes,regionScenes);
  const effectiveParents=new Map();
  for(const id of ids){
    const stored=value.scenes[id]?.parentId??SCENE_ATLAS_UNASSIGNED;
    const parent=stored!==SCENE_ATLAS_UNASSIGNED?stored:(placeByScene.get(id)??regionByScene.get(id)??SCENE_ATLAS_UNASSIGNED);
    effectiveParents.set(id,parent);
  }
  for(const [id,node] of sceneNodes){
    const parentId=effectiveParents.get(id)??SCENE_ATLAS_UNASSIGNED;
    const parsed=parseParentId(parentId);
    let parent=null;
    if(parsed?.type==='region')parent=regionNodes.get(parsed.id);
    else if(parsed?.type==='place')parent=placeNodes.get(parsed.id);
    else if(parsed?.type==='scene'&&parsed.id!==id)parent=sceneNodes.get(parsed.id);
    (parent??unassigned).children.push(node);
    node.parentId=parent?.id??SCENE_ATLAS_UNASSIGNED;
  }

  const edges=Object.values(value.edges);
  for(const node of sceneNodes.values())node.edgeIds=edges.filter(edge=>edge.from.sceneId===node.key||edge.to.sceneId===node.key).map(edge=>edge.id);
  const root={id:'atlas',key:'atlas',type:'root',label:'Mapa conceitual',children:[...regionNodes.values(),unassigned]};
  addNodeCounts(root,edges);
  root.summary={
    ...sceneAtlasCounts(value,scenes),
    conceptualScenes:root.counts.scenes,
    legacyAssignedScenes:[...ids].filter(id=>(value.scenes[id]?.parentId??SCENE_ATLAS_UNASSIGNED)===SCENE_ATLAS_UNASSIGNED&&(placeByScene.has(id)||regionByScene.has(id))).length
  };
  return root;
}
