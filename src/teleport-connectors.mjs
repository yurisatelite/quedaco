export const TELEPORT_PROVIDERS=Object.freeze({STAIRWAYS:'stairways',NATIVE:'native'});
export const TELEPORT_FLAG_SCOPE='quedaco';
export const TELEPORT_FLAG_KEY='teleport';
export const TELEPORT_SCHEMA_VERSION=1;

const asString=value=>String(value??'').trim();
const asNumber=value=>Number(value);

export function cloneTeleportEdge(edge={}){
  if(typeof structuredClone==='function')return structuredClone(edge);
  return JSON.parse(JSON.stringify(edge));
}

export function normalizeTeleportProvider(provider,{allowNone=false}={}){
  const key=asString(provider).toLowerCase();
  if(key==='stairways'||key==='stairway')return TELEPORT_PROVIDERS.STAIRWAYS;
  if(['native','regions','region','native-regions','nativeregions'].includes(key))return TELEPORT_PROVIDERS.NATIVE;
  if(allowNone&&['','none','off','disabled'].includes(key))return null;
  return undefined;
}

function versionParts(version){
  return asString(version).replace(/^v/i,'').split(/[.+-]/).slice(0,3).map(part=>Number.parseInt(part,10)||0);
}

export function compareVersions(left,right){
  const a=versionParts(left),b=versionParts(right);
  for(let index=0;index<3;index++){
    const delta=(a[index]??0)-(b[index]??0);
    if(delta)return Math.sign(delta);
  }
  return 0;
}

export function foundryGeneration(game){
  const explicit=Number(game?.release?.generation);
  if(Number.isInteger(explicit)&&explicit>0)return explicit;
  return Number.parseInt(asString(game?.version).split('.')[0],10)||0;
}

function moduleFrom(game,id){
  const modules=game?.modules;
  if(typeof modules?.get==='function')return modules.get(id)??null;
  return Array.from(modules??[]).find(entry=>(entry?.id??entry?.name)===id)??null;
}

export function providerAvailability(game){
  const generation=foundryGeneration(game),isV13=generation===13,isGM=game?.user?.isGM===true;
  const module=moduleFrom(game,'stairways');
  const stairwaysVersion=asString(module?.version??module?.manifest?.version);
  const supportedVersion=compareVersions(stairwaysVersion,'0.11.1')>=0&&compareVersions(stairwaysVersion,'0.12.0')<0;
  const stairwaysActive=module?.active===true;
  const stairwaysAvailable=isV13&&stairwaysActive&&supportedVersion;
  let stairwaysReason=null;
  if(!isV13)stairwaysReason='foundry-version';
  else if(!stairwaysActive)stairwaysReason='module-inactive';
  else if(!supportedVersion)stairwaysReason='module-version';
  else if(!isGM)stairwaysReason='gm-required';
  return {
    stairways:{available:stairwaysAvailable,writable:stairwaysAvailable&&isGM,active:stairwaysActive,version:stairwaysVersion||null,reason:stairwaysReason},
    native:{available:isV13,writable:isV13&&isGM,version:asString(game?.version)||String(generation||''),reason:!isV13?'foundry-version':(!isGM?'gm-required':null)}
  };
}

export function validateTeleportEdge(edge){
  if(!asString(edge?.id))throw Error('A ligação de mapas precisa de um identificador.');
  for(const endpoint of ['from','to']){
    const point=edge?.[endpoint];
    if(!asString(point?.sceneId))throw Error(`A ponta ${endpoint} precisa de uma Scene.`);
    if(!Number.isFinite(asNumber(point?.x))||!Number.isFinite(asNumber(point?.y)))throw Error(`A ponta ${endpoint} precisa de coordenadas válidas.`);
  }
  return edge;
}

export function collectionItems(collection){
  if(Array.isArray(collection))return collection;
  if(Array.isArray(collection?.contents))return collection.contents;
  if(typeof collection?.values==='function')return [...collection.values()];
  if(collection&&typeof collection==='object')return Object.values(collection);
  return [];
}

export function sceneList(game){return collectionItems(game?.scenes);}

export function sceneById(game,id){
  const direct=game?.scenes?.get?.(id);
  return direct??sceneList(game).find(scene=>(scene?.id??scene?._id)===id)??null;
}

export const documentId=document=>document?.id??document?._id??document?._source?._id??null;

export function documentValue(document,key){
  if(document?.[key]!==undefined)return document[key];
  if(document?._source?.[key]!==undefined)return document._source[key];
  return undefined;
}

export function documentFlag(document){
  return documentValue(document,'flags')?.[TELEPORT_FLAG_SCOPE]?.[TELEPORT_FLAG_KEY]??null;
}

function mergedDocuments(primary=[],secondary=[]){
  const merged=[],seen=new Set();
  for(const document of [...primary,...secondary]){
    const id=documentId(document),key=id?`id:${id}`:`object:${merged.length}`;
    if(seen.has(key))continue;
    seen.add(key);merged.push(document);
  }
  return merged;
}

export function stairwaysInScene(scene){
  const runtime=collectionItems(scene?.stairways);
  const stored=Array.isArray(scene?.flags?.stairways?.data)?scene.flags.stairways.data:[];
  return mergedDocuments(runtime,stored);
}

export function regionsInScene(scene){return collectionItems(scene?.regions);}
export function behaviorsInRegion(region){return collectionItems(region?.behaviors??region?._source?.behaviors);}

export function managedStairwayRecords(game,edgeId){
  const records=[];
  for(const scene of sceneList(game))for(const document of stairwaysInScene(scene)){
    const flag=documentFlag(document);
    if(flag?.managed===true&&flag?.provider===TELEPORT_PROVIDERS.STAIRWAYS&&flag?.edgeId===edgeId)records.push({scene,document,flag});
  }
  return records;
}

export function managedNativeRegionRecords(game,edgeId){
  const records=[];
  for(const scene of sceneList(game))for(const document of regionsInScene(scene)){
    const flag=documentFlag(document);
    if(flag?.managed===true&&flag?.provider===TELEPORT_PROVIDERS.NATIVE&&flag?.edgeId===edgeId)records.push({scene,document,flag});
  }
  return records;
}

export function teleportFlag(edgeId,provider,role){
  return {[TELEPORT_FLAG_SCOPE]:{[TELEPORT_FLAG_KEY]:{schemaVersion:TELEPORT_SCHEMA_VERSION,managed:true,edgeId,provider,role}}};
}

function hashText(value){
  let hash=0x811c9dc5;
  for(const character of asString(value)){hash^=character.charCodeAt(0);hash=Math.imul(hash,0x01000193);}
  return (hash>>>0).toString(36);
}

export function stairwayPairName(edge){
  const slug=asString(edge?.id).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,28)||'link';
  return `quedaco-${slug}-${hashText(edge?.id)}`;
}

export function gridSize(scene){
  const size=Number(scene?.grid?.size??scene?.grid?.sizeX??scene?.dimensions?.size);
  return Number.isFinite(size)&&size>0?Math.round(size):100;
}

export function normalizedPoint(point){return {x:Math.round(Number(point?.x)||0),y:Math.round(Number(point?.y)||0)};}

export function landingPoint(scene,point){
  const size=gridSize(scene),base=normalizedPoint(point),width=Number(scene?.width??scene?.dimensions?.width);
  let x=base.x+size;
  if(Number.isFinite(width)&&x+size>width)x=base.x-size;
  x=Math.max(0,Number.isFinite(width)?Math.min(x,Math.max(0,width-size)):x);
  return {x:Math.round(x),y:base.y};
}

export function rectangleShape(scene,point){
  const size=gridSize(scene),{x,y}=normalizedPoint(point);
  return {type:'rectangle',x,y,width:size,height:size,rotation:0,hole:false};
}

export function regionUuid(sceneId,region){return region?.uuid??`Scene.${sceneId}.Region.${documentId(region)}`;}

export function nativeRegionRoles(edge){
  return edge?.bidirectional===false?['from-trigger','to-landing']:['from-trigger','from-landing','to-trigger','to-landing'];
}

function expectedSceneForRole(edge,role){return role.startsWith('from-')?edge.from.sceneId:edge.to.sceneId;}

function stairwayAudit(game,edge,availability){
  const previous=edge?.implementations?.stairways??{},records=managedStairwayRecords(game,edge.id);
  const byRole=Object.fromEntries(['from','to'].map(role=>[role,records.filter(record=>record.flag.role===role)]));
  const from=byRole.from[0],to=byRole.to[0];
  let connectionStatus='unconfigured',problem=null;
  if(records.length||previous?.pairName){
    if(byRole.from.length!==1||byRole.to.length!==1){connectionStatus='missing-endpoint';problem='O par Stairways não possui exatamente uma origem e um destino gerenciados.';}
    else if((from.scene.id??from.scene._id)!==edge.from.sceneId||(to.scene.id??to.scene._id)!==edge.to.sceneId){connectionStatus='wrong-scene';problem='Um endpoint Stairways está em uma Scene diferente da ligação.';}
    else{
      const fromName=documentValue(from.document,'name'),toName=documentValue(to.document,'name');
      const sameScene=edge.from.sceneId===edge.to.sceneId;
      const reciprocal=sameScene
        ? (documentValue(from.document,'scene')==null&&documentValue(to.document,'scene')==null)
        : (documentValue(from.document,'scene')===edge.to.sceneId&&documentValue(to.document,'scene')===edge.from.sceneId);
      if(!fromName||fromName!==toName){connectionStatus='name-mismatch';problem='Os endpoints Stairways não compartilham o mesmo nome.';}
      else if(!reciprocal){connectionStatus='non-reciprocal';problem='Os endpoints Stairways não apontam um para o outro.';}
      else{
        const fromCandidates=stairwaysInScene(sceneById(game,sameScene?edge.from.sceneId:edge.to.sceneId)).filter(document=>documentId(document)!==documentId(from.document)&&documentValue(document,'name')===fromName);
        const toCandidates=stairwaysInScene(sceneById(game,sameScene?edge.to.sceneId:edge.from.sceneId)).filter(document=>documentId(document)!==documentId(to.document)&&documentValue(document,'name')===toName);
        if(fromCandidates.length!==1||toCandidates.length!==1){connectionStatus='ambiguous-name';problem='O nome do par Stairways encontra zero ou mais de um parceiro.';}
        else connectionStatus='connected';
      }
    }
  }
  const fromEnabled=from?documentValue(from.document,'disabled')!==true:false;
  const toEnabled=to?documentValue(to.document,'disabled')!==true:false;
  const runtimeActive=connectionStatus==='connected'&&fromEnabled&&(edge.bidirectional===false?!toEnabled:toEnabled);
  return {
    ...previous,provider:TELEPORT_PROVIDERS.STAIRWAYS,schemaVersion:TELEPORT_SCHEMA_VERSION,managed:true,
    available:availability.available,writable:availability.writable,connectionStatus,status:connectionStatus==='connected'?(runtimeActive?'active':'inactive'):connectionStatus,runtimeActive,problem,
    pairName:from?documentValue(from.document,'name'):(previous.pairName??null),
    endpoints:{
      from:from?{sceneId:edge.from.sceneId,documentId:documentId(from.document),x:documentValue(from.document,'x'),y:documentValue(from.document,'y')}:(previous.endpoints?.from??null),
      to:to?{sceneId:edge.to.sceneId,documentId:documentId(to.document),x:documentValue(to.document,'x'),y:documentValue(to.document,'y')}:(previous.endpoints?.to??null)
    }
  };
}

function behaviorDestination(behavior){return documentValue(behavior,'system')?.destination??null;}

function nativeAudit(game,edge,availability){
  const previous=edge?.implementations?.native??{},records=managedNativeRegionRecords(game,edge.id),expected=nativeRegionRoles(edge);
  const byRole=Object.fromEntries(expected.map(role=>[role,records.filter(record=>record.flag.role===role)]));
  let connectionStatus='unconfigured',problem=null;
  if(records.length||Object.keys(previous?.regions??{}).length){
    const malformed=expected.find(role=>byRole[role].length!==1);
    const extra=records.find(record=>!expected.includes(record.flag.role));
    if(malformed||extra){connectionStatus='missing-region';problem='As Regions nativas gerenciadas não correspondem à ligação.';}
    else if(expected.some(role=>(byRole[role][0].scene.id??byRole[role][0].scene._id)!==expectedSceneForRole(edge,role))){connectionStatus='wrong-scene';problem='Uma Region nativa está em uma Scene diferente da ligação.';}
    else{
      const checks=[['from-trigger','to-landing']];
      if(edge.bidirectional!==false)checks.push(['to-trigger','from-landing']);
      for(const [triggerRole,landingRole] of checks){
        const trigger=byRole[triggerRole][0],landing=byRole[landingRole][0];
        const managed=behaviorsInRegion(trigger.document).filter(behavior=>{
          const flag=documentFlag(behavior);
          return flag?.managed===true&&flag?.provider===TELEPORT_PROVIDERS.NATIVE&&flag?.edgeId===edge.id;
        });
        if(managed.length!==1||documentValue(managed[0],'type')!=='teleportToken'||behaviorDestination(managed[0])!==regionUuid(landing.scene.id??landing.scene._id,landing.document)){
          connectionStatus='broken-behavior';problem='O comportamento teleportToken não aponta para a Region de chegada.';break;
        }
      }
      if(!problem)connectionStatus='connected';
    }
  }
  const triggerRoles=['from-trigger',...(edge.bidirectional===false?[]:['to-trigger'])];
  const triggerBehaviors=triggerRoles.flatMap(role=>(byRole[role]??[]).flatMap(record=>behaviorsInRegion(record.document).filter(behavior=>documentFlag(behavior)?.edgeId===edge.id)));
  const runtimeActive=connectionStatus==='connected'&&triggerBehaviors.length===triggerRoles.length&&triggerBehaviors.every(behavior=>documentValue(behavior,'disabled')!==true);
  const regions={...previous.regions};
  for(const role of expected){
    const record=byRole[role]?.[0];
    if(!record)continue;
    const behavior=behaviorsInRegion(record.document).find(entry=>documentFlag(entry)?.edgeId===edge.id)??null;
    regions[role]={sceneId:record.scene.id??record.scene._id,documentId:documentId(record.document),uuid:regionUuid(record.scene.id??record.scene._id,record.document),...(behavior?{behaviorId:documentId(behavior)}:{})};
  }
  return {
    ...previous,provider:TELEPORT_PROVIDERS.NATIVE,schemaVersion:TELEPORT_SCHEMA_VERSION,managed:true,
    available:availability.available,writable:availability.writable,connectionStatus,status:connectionStatus==='connected'?(runtimeActive?'active':'inactive'):connectionStatus,runtimeActive,problem,regions
  };
}

/** Read-only reconciliation. It never writes Atlas settings or Foundry documents. */
export function auditTeleportEdge(game,edge){
  validateTeleportEdge(edge);
  const result=cloneTeleportEdge(edge),availability=providerAvailability(game);
  result.runtimeProvider=normalizeTeleportProvider(result.runtimeProvider,{allowNone:true})??null;
  result.implementations={...(result.implementations??{})};
  result.implementations.stairways=stairwayAudit(game,result,availability.stairways);
  result.implementations.native=nativeAudit(game,result,availability.native);
  result.audit={
    activeProvider:result.runtimeProvider,
    activeCount:[result.implementations.stairways,result.implementations.native].filter(implementation=>implementation.runtimeActive).length,
    healthy:result.runtimeProvider===null||result.implementations[result.runtimeProvider]?.connectionStatus==='connected'
  };
  return result;
}
