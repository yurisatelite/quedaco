/** Fila da Mestra em Journals privados. Nenhum prompt/segredo é salvo em settings. */
import {CREATOR_ID,npcTemplateCreator} from './npc-models.mjs';
import {catalogCreatedNpc} from './adapter.mjs';
import {assertContentObject} from './catalog-content.mjs';
const ID='quedaco',KEY='npcRequest';
const norm=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const has=(text,term)=>Boolean(norm(term))&&` ${norm(text)} `.includes(` ${norm(term)} `);
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),n=>n.toString(16).padStart(2,'0')).join('');

export function generationContext(catalog,request){
  const data=catalog.getWorldCatalog(),issues=[],text=request.text;
  const choose=(rows,explicit)=>{
    if(explicit){const matches=rows.filter(row=>row.id===explicit||[row.name,...row.aliases??[]].some(name=>norm(name)===norm(explicit)));if(matches.length!==1)issues.push(`Local/região não encontrado ou ambíguo: ${explicit}.`);return matches[0];}
    const matches=rows.filter(row=>[row.id,row.name,...row.aliases??[]].some(name=>has(text,name)));
    if(matches.length>1)issues.push('Há mais de uma localidade/região no pedido. Defina regionId/placeId.');return matches.length===1?matches[0]:null;
  };
  let place=choose(data.places,request.placeId),region=choose(data.regions,request.regionId);
  const environment=request.environmentId&&data.environments.find(row=>row.id===request.environmentId);
  const organization=request.organizationId&&data.organizations.find(row=>row.id===request.organizationId);
  if(request.environmentId&&!environment)issues.push('Ambiente não cadastrado.');
  if(request.organizationId&&!organization)issues.push('Organização não cadastrada.');
  if(environment){
    if(place&&environment.placeId&&place.id!==environment.placeId)issues.push('Ambiente e localidade não correspondem.');
    if(region&&environment.regionId&&region.id!==environment.regionId)issues.push('Ambiente e região não correspondem.');
    place??=data.places.find(row=>row.id===environment.placeId);region??=data.regions.find(row=>row.id===environment.regionId);
  }
  // Alias de ditado declarado, sem criar uma nova região ou alterar o cânone.
  if(!region&&has(text,'arquipelago de uma'))region=data.regions.find(row=>row.id==='huma');
  if(place){const parent=data.regions.find(row=>row.id===place.regionId);if(region&&parent?.id!==region.id)issues.push('Localidade e região não correspondem.');region??=parent;}
  if(!place&&!region)issues.push('Informe uma localidade/região presente no Cadastro, ou cadastre o local.');
  const organizations=data.organizations.filter(row=>(!region||row.regionIds?.includes(region.id))&&(!place||row.placeIds?.includes(place.id)));
  const environments=environment?[environment]:data.environments.filter(row=>place?row.placeId===place.id:region&&row.regionId===region.id).slice(0,5);
  return {regionId:region?.id??'',placeId:place?.id??'',organizationId:organization?.id??environment?.organizationId??'',environmentId:environment?.id??'',issues,summary:[region?.name,region?.description,region?.trade,region?.government,place?.name,place?.description,organization?.name,...environments.map(row=>`${row.name}: ${row.description??''}`)].filter(Boolean).join('\n').slice(0,24000),generationHints:region?.generationHints??[],organizations:organizations.map(row=>({id:row.id,name:row.name,functions:row.functions})),revision:data.revision};
}

export function createNpcRequestService(game,catalog,{JournalClass=globalThis.JournalEntry}={}){
  let queue=Promise.resolve();
  const requireGM=()=>{if(!game.user?.isGM)throw Error('Somente a Mestra acessa os pedidos de NPCs.');if(game.users?.activeGM&&game.users.activeGM.id!==game.user.id)throw Error('Use a sessão da Mestra ativa para preparar pedidos.');};
  const exclusive=task=>{const result=queue.then(task);queue=result.catch(()=>{});return result;};
  const docs=()=>Array.from(game.journal??[]).filter(doc=>doc.flags?.[ID]?.[KEY]?.schemaVersion===1);
  const read=doc=>{const stored=doc.flags[ID][KEY];return typeof stored.payload==='string'?JSON.parse(stored.payload):structuredClone(stored);};
  // Grupos de benefícios usam UUIDs com pontos nas chaves. JSON preserva esses
  // identificadores sem depender da expansão de caminhos do Document.update.
  const encode=value=>({schemaVersion:1,payload:JSON.stringify(value)});
  const docFor=id=>{const matches=docs().filter(doc=>read(doc).request.id===id);if(matches.length!==1)throw Error(`Pedido não encontrado ou duplicado: ${id}.`);return matches[0];};
  const write=(doc,value)=>doc.update({[`flags.${ID}.${KEY}`]:encode(value)});
  const apiFor=()=>{const api=npcTemplateCreator(game);if(!api?.capabilities?.npcDescription||typeof api.prepareNpcDescription!=='function')throw Error('Ative o Criador com motor de descrição (0.2.0 ou superior).');return api;};
  const select=(selection={})=>{
    requireGM();if(selection.ids!==undefined&&(!Array.isArray(selection.ids)||!selection.ids.length||new Set(selection.ids).size!==selection.ids.length))throw Error('Selecione IDs de pedidos sem repetição.');
    const rows=docs().filter(doc=>{const row=read(doc);return (!selection.ids||selection.ids.includes(row.request.id))&&(!selection.batchId||row.request.batchId===selection.batchId)&&(!selection.sourceModule||row.request.sourceModule===selection.sourceModule);});
    if(!rows.length||rows.length>200||selection.ids&&rows.length!==selection.ids.length)throw Error('Selecione de 1 a 200 pedidos existentes.');return rows;
  };
  const prepare=async selection=>{
    const documents=select(selection),api=apiFor(),rows=[];
    for(const doc of documents){
      const stored=read(doc),context=generationContext(catalog,stored.request);
      const profiles=catalog.getWorldCatalog().npcGenerationProfiles;
      let prepared;
      try{if(stored.request.purposeProfileId&&!api.capabilities.npcProfileSelection)throw Error('Atualize o Criador para 0.3.0+ para fixar o perfil do pedido.');prepared=await api.prepareNpcDescription(stored.request,{context,profiles});}
      catch(error){prepared={state:'needs-choices',id:stored.request.id,issues:[error.message]};}
      if(read(doc).revision!==stored.revision)throw Error('O pedido mudou durante a preparação. Prepare novamente.');
      rows.push({id:stored.request.id,revision:stored.revision,prepared,contextRevision:context.revision});
    }
    const names=new Map();
    for(const row of rows){const name=norm(row.prepared.model?.name??row.prepared.name);if(name){const group=names.get(name)??[];group.push(row);names.set(name,group);}}
    for(const group of names.values())if(group.length>1)for(const row of group){row.prepared.state='needs-choices';row.prepared.issues=[...row.prepared.issues??[],'Há nomes repetidos no grupo. Defina nomes distintos antes de criar.'];}
    const signature=await digest(rows);
    return {signature,rows,total:rows.length,ready:rows.filter(row=>row.prepared.state==='ready').length,issues:rows.filter(row=>row.prepared.state!=='ready')};
  };
  return {
    listNpcRequests(options={}){
      requireGM();return docs().map(read).filter(row=>(!options.sourceModule||row.request.sourceModule===options.sourceModule)&&(!options.batchId||row.request.batchId===options.batchId)&&(!options.state||row.state===options.state));
    },
    stageNpcRequests(input,{expectedRevision}={}){return exclusive(async()=>{
      requireGM();const requests=Array.isArray(input)?input:[typeof input==='string'?{text:input}:input];
      if(!requests.length||requests.length>200)throw Error('Envie de 1 a 200 pedidos.');
      const normalized=[];
      for(const raw of requests){
        assertContentObject(raw);const request=structuredClone(raw);
        const allowed=['id','text','name','level','purpose','purposeProfileId','legacy','heritage','anima','characterClass','background','attributes','cash','inventory','benefitChoices','sourceModule','batchId','teamId','organizationId','environmentId','regionId','placeId','relations','tags','appearance','clothes','behavior','desire','spellcasting'];
        if(Object.keys(request).some(key=>!allowed.includes(key)))throw Error('Campo desconhecido no pedido.');
        if(typeof request.text!=='string'||!request.text.trim()||request.text.length>24000)throw Error('Descreva cada NPC em até 24 mil caracteres.');
        request.sourceModule??='manual';request.batchId??='manual';
        if(request.purposeProfileId!==undefined&&(typeof request.purposeProfileId!=='string'||request.purposeProfileId.length>100))throw Error('ID de perfil inválido.');
        for(const field of ['sourceModule','batchId','name','purpose','legacy','heritage','anima','characterClass','background','organizationId','environmentId','regionId','placeId','teamId','appearance','clothes','behavior','desire','spellcasting'])if(request[field]!==undefined&&(typeof request[field]!=='string'||request[field].length>2000))throw Error(`Pedido: ${field} precisa de texto.`);
        if(request.level!==undefined&&(!Number.isInteger(request.level)||request.level<1||request.level>12))throw Error('Nível deve estar entre 1 e 12.');
        request.id??=`pedido:${(await digest(request)).slice(0,24)}`;
        if(!/^[a-z0-9][a-z0-9:-]{0,99}$/.test(request.id)||normalized.some(row=>row.id===request.id))throw Error('ID de pedido inválido ou repetido.');
        if(new TextEncoder().encode(JSON.stringify(request)).byteLength>100000)throw Error('Pedido estruturado muito grande.');
        normalized.push(request);
      }
      const results=[];
      for(const request of normalized){
        const matches=docs().filter(doc=>read(doc).request.id===request.id);
        if(matches.length>1)throw Error('Pedidos duplicados; revise os Journals.');
        const doc=matches[0],before=doc&&read(doc);
        if(expectedRevision!==undefined&&before?.revision!==expectedRevision)throw Error('O pedido mudou. Reabra antes de editar.');
        if(before?.state==='created'){
          if(JSON.stringify(before.request)!==JSON.stringify(request))throw Error('Pedido já criado; use outro ID para outra ficha.');
          results.push(before);continue;
        }
        const same=before&&JSON.stringify(before.request)===JSON.stringify(request);
        if(same){results.push(before);continue;}
        if(before&&expectedRevision===undefined)throw Error('Para alterar um pedido existente, informe expectedRevision.');
        const stored={schemaVersion:1,request,revision:(before?.revision??0)+1,state:'draft',prepared:null,actorUuid:null};
        if(doc)await write(doc,stored);
        else{
          if(!JournalClass?.create)throw Error('O Foundry não disponibilizou JournalEntry para guardar o pedido.');
          await JournalClass.create({name:`NPC preparado · ${request.name??request.id}`,ownership:{default:0},flags:{[ID]:{[KEY]:encode(stored)}},pages:[]});
        }
        results.push(stored);
      }
      return results;
    });},
    prepareNpcRequests(selection={}){return exclusive(async()=>{
      const report=await prepare(selection);
      for(const row of report.rows){const doc=docFor(row.id),stored=read(doc);if(stored.revision!==row.revision)throw Error('O pedido mudou.');if(stored.state!=='created')await write(doc,{...stored,state:row.prepared.state,prepared:row.prepared});}
      return report;
    });},
    createPreparedNpcRequests(selection={}, {expectedSignature}={}){return exclusive(async()=>{
      requireGM();if(!expectedSignature)throw Error('Prepare e revise os pedidos antes de criar.');
      const report=await prepare(selection);
      if(report.signature!==expectedSignature)throw Error('Pedido, Cadastro ou compêndio mudou. Prepare novamente.');
      if(report.issues.length)throw Error('Há pedidos com escolhas pendentes. Corrija antes de criar.');
      const api=apiFor(),results=[];
      for(const row of report.rows){
        const doc=docFor(row.id),stored=read(doc);
        if(stored.revision!==row.revision||catalog.getWorldCatalog().revision!==row.contextRevision){results.push({id:row.id,status:'error',error:'Pedido ou Cadastro mudou durante a criação. Prepare novamente.'});continue;}
        try{
          const result=await api.createNpcFromTemplate(row.prepared.model,{expectedSignature:row.prepared.signature});
          const actors=Array.from(game.actors??[]).filter(actor=>actor.flags?.[CREATOR_ID]?.npcModel?.id===row.id);
          if(!['created','existing'].includes(result.status)||actors.length!==1||actors[0].uuid!==result.actorUuid)throw Error('Ficha com pendência ou não confirmada no mundo.');
          let catalogError;
          if(result.status==='created')try{await catalogCreatedNpc(actors[0],row.prepared.model);}catch(error){catalogError=error.message;}
          await write(doc,{...stored,state:'created',actorUuid:result.actorUuid,prepared:row.prepared,lastError:null});
          results.push({id:row.id,...result,...(catalogError?{catalogError}:{})});
        }catch(error){await write(doc,{...stored,state:'needs-review',lastError:error.message});results.push({id:row.id,status:'error',error:error.message});}
      }
      return {results,created:results.filter(row=>row.status==='created').length,existing:results.filter(row=>row.status==='existing').length,errors:results.filter(row=>row.status==='error').length};
    });},
    async auditNpcGeneration(){
      requireGM();const data=catalog.getWorldCatalog();let mechanics=null;
      try{const api=apiFor();mechanics=await api.getNpcCreationCatalog();}catch(error){mechanics={items:[],failures:[{reason:error.message}]};}
      const gaps=[];
      for(const profile of data.npcGenerationProfiles){
        if(mechanics.training)for(const key of profile.skillPriority??[])if(!Object.hasOwn(mechanics.training.skills,key))gaps.push({kind:'skill',id:profile.id,missing:key});
        if(mechanics.training)for(const key of profile.languagePriority??[])if(!Object.hasOwn(mechanics.training.languages,key))gaps.push({kind:'language',id:profile.id,missing:key});
        for(const [field,type] of [['characterClass','class'],['background','background'],['heritage','heritage']])if(profile[field]&&!mechanics.items.some(item=>item.type===type&&norm(item.name)===norm(profile[field])))gaps.push({kind:'profile-reference',id:profile.id,field,missing:profile[field]});
        for(const name of profile.choicePriority??[])if(!mechanics.items.some(item=>norm(item.name)===norm(name)))gaps.push({kind:'animal-choice',id:profile.id,missing:name});
        for(const item of profile.inventory??[])if(!mechanics.items.some(entry=>['weapon','armor','equipment','clothing','consumable','loot'].includes(entry.type)&&norm(entry.name)===norm(item.name)))gaps.push({kind:'equipment',id:profile.id,missing:item.name});
      }
      const noLore=data.places.filter(place=>!place.description);
      const profileCoverage={purposes:data.npcGenerationProfiles.filter(row=>row.kind==='purpose').map(row=>row.name),animals:data.npcGenerationProfiles.filter(row=>row.kind==='animal').map(row=>row.name),scoped:data.npcGenerationProfiles.filter(row=>row.regionIds?.length||row.placeIds?.length).length};
      return {mode:'local-rules',regions:data.regions.length,places:data.places.length,organizations:data.organizations.length,models:data.npcModels.length,profiles:data.npcGenerationProfiles.length,profileCoverage,legacies:mechanics.items.filter(item=>item.type==='legacy').map(item=>item.name),catalogFailures:mechanics.failures,missingPlaceDescriptions:noLore.map(row=>({id:row.id,name:row.name})),gaps,recommendations:['Cadastrar perfis de profissões ainda ausentes e vocabulário de reconhecimento.','Revisar propostas de ânima e seus nomes exatos nos compêndios.','Adicionar nomes, costumes e vestuário em perfis específicos por regionIds/placeIds; ambientes e descrição guardam referências adicionais.','Cadastrar uma ficha-base de Tritão se esse povo for usado na mesa.','Conferir escolhas descritas apenas em prosa, requisitos de talentos e conteúdo de níveis 2–12 no Foundry.'],revision:data.revision};
    }
  };
}
