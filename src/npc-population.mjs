/** Planejador regional reutilizável. Sorteia propostas, nunca cria Actors. */
import {npcTemplateCreator} from './npc-models.mjs';
import {assertContentObject} from './catalog-content.mjs';
const norm=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),n=>n.toString(16).padStart(2,'0')).join('');
function random(seed){let state=2166136261;for(const char of seed)state=Math.imul(state^char.charCodeAt(0),16777619);return ()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return ((n^n>>>14)>>>0)/4294967296;};}
const inScope=(profile,regionId,placeId)=>(!profile.regionIds?.length||profile.regionIds.includes(regionId))&&(!profile.placeIds?.length||profile.placeIds.includes(placeId));
function weights(value,label){
  if(value===undefined)return undefined;
  assertContentObject(value);
  const entries=Object.entries(value).sort(([a],[b])=>a.localeCompare(b));
  if(!entries.length||entries.length>200||entries.some(([id,weight])=>!id.trim()||!Number.isFinite(weight)||weight<=0||weight>100000))throw Error(`${label}: informe pesos positivos para até 200 opções.`);
  return Object.fromEntries(entries);
}
function pick(rows,rng,distribution){
  const weighted=rows.map(row=>({row,weight:distribution?.[row.id]??1}));
  let roll=rng()*weighted.reduce((sum,row)=>sum+row.weight,0);
  for(const row of weighted){roll-=row.weight;if(roll<0)return row.row;}
  return weighted.at(-1).row;
}
export function createNpcPopulationService(game,catalog,requests){
  const requireGM=()=>{if(!game.user?.isGM)throw Error('Somente a Mestra planeja a população.');if(game.users?.activeGM&&game.users.activeGM.id!==game.user.id)throw Error('Use a sessão da Mestra ativa.');};
  async function planNpcPopulation(input){
    requireGM();assertContentObject(input);
    const allowed=['regionId','count','minLevel','maxLevel','seed','text','sourceModule','teamId','placeWeights','purposeWeights','legacyWeights'];
    if(Object.keys(input).some(key=>!allowed.includes(key)))throw Error('Campo desconhecido no planejamento de população.');
    const config={regionId:input.regionId,count:input.count,minLevel:input.minLevel??1,maxLevel:input.maxLevel??1,seed:input.seed??crypto.randomUUID(),text:input.text??'',sourceModule:input.sourceModule??'quedaco'};
    if(input.teamId!==undefined){if(typeof input.teamId!=='string'||input.teamId.length>100)throw Error('Equipe inválida.');config.teamId=input.teamId;}
    if(typeof config.seed!=='string'||!config.seed.trim()||config.seed.length>100)throw Error('Semente precisa de texto com até 100 caracteres.');
    if(!Number.isInteger(config.count)||config.count<1||config.count>200)throw Error('Quantidade deve estar entre 1 e 200.');
    if(!Number.isInteger(config.minLevel)||!Number.isInteger(config.maxLevel)||config.minLevel<1||config.maxLevel>12||config.minLevel>config.maxLevel)throw Error('Faixa de níveis deve estar entre 1 e 12, em ordem crescente.');
    if(typeof config.text!=='string'||config.text.length>16000||typeof config.sourceModule!=='string'||config.sourceModule.length>100)throw Error('Contexto ou módulo de origem inválido.');
    for(const field of ['placeWeights','purposeWeights','legacyWeights'])config[field]=weights(input[field],field);
    if(!config.legacyWeights)throw Error('Escolha os legados permitidos para esta população.');
    const data=catalog.getWorldCatalog(),region=data.regions.find(row=>row.id===config.regionId&&row.active!==false);
    if(!region)throw Error('Escolha uma região ativa do Cadastro.');
    const places=data.places.filter(row=>row.regionId===region.id&&row.active!==false).sort((a,b)=>a.id.localeCompare(b.id));
    if(!places.length)throw Error('Cadastre localidades ativas para esta região.');
    for(const id of Object.keys(config.placeWeights??{}))if(!places.some(row=>row.id===id))throw Error(`Localidade fora da região ou indisponível: ${id}.`);
    const eligiblePlaces=config.placeWeights?places.filter(row=>Object.hasOwn(config.placeWeights,row.id)):places;
    const profiles=data.npcGenerationProfiles.filter(row=>row.active!==false);
    for(const id of Object.keys(config.purposeWeights??{}))if(!profiles.some(row=>row.kind==='purpose'&&row.id===id&&eligiblePlaces.some(place=>inScope(row,region.id,place.id))))throw Error(`Perfil de propósito fora do escopo ou indisponível: ${id}.`);
    const creator=npcTemplateCreator(game);
    if(!creator?.capabilities?.npcDescription||!creator.capabilities.npcProfileSelection||typeof creator.getNpcCreationCatalog!=='function')throw Error('Atualize o Criador para 0.3.0+ com seleção explícita de perfis.');
    const mechanics=await creator.getNpcCreationCatalog();
    const legacies=Object.keys(config.legacyWeights).map(name=>{const matches=mechanics.items.filter(row=>row.type==='legacy'&&norm(row.name)===norm(name));if(matches.length!==1)throw Error(`Legado não disponível ou ambíguo: ${name}.`);return {id:name,name:matches[0].name};});
    const purposesFor=place=>profiles.filter(row=>row.kind==='purpose'&&inScope(row,region.id,place.id)&&(!config.purposeWeights||Object.hasOwn(config.purposeWeights,row.id)));
    for(const place of eligiblePlaces){
      if(!purposesFor(place).length)throw Error(`Sem perfil de propósito para ${place.name}.`);
      if(legacies.some(row=>norm(row.name)==='gnomo')&&!profiles.some(row=>row.kind==='animal'&&inScope(row,region.id,place.id)))throw Error(`Gnomo exige perfis de ânima para ${place.name}.`);
    }
    const rng=random(config.seed),batchId=`pop:${(await digest(config)).slice(0,24)}`,rows=[],summary={places:{},purposes:{},legacies:{},levels:{}};
    for(let i=0;i<config.count;i++){
      const place=pick(eligiblePlaces,rng,config.placeWeights),purpose=pick(purposesFor(place),rng,config.purposeWeights),legacy=pick(legacies,rng,config.legacyWeights),level=config.minLevel+Math.floor(rng()*(config.maxLevel-config.minLevel+1));
      const animal=norm(legacy.name)==='gnomo'?pick(profiles.filter(row=>row.kind==='animal'&&inScope(row,region.id,place.id)),rng):null;
      // Um marcador explícito fixa o perfil sorteado, inclusive quando há perfis
      // regionais e genéricos com o mesmo vocabulário.
      const request={id:`${batchId}:${i+1}`,sourceModule:config.sourceModule,batchId,regionId:region.id,placeId:place.id,legacy:legacy.name,level,purpose:purpose.terms[0],purposeProfileId:purpose.id,...(animal?{anima:animal.terms[0]}:{}),text:`${legacy.name}, nível ${level}, função ${purpose.name}, em ${place.name} (${region.name}).${animal?` Ânima de ${animal.terms[0]}.`:''}${config.text?`\nOrientação da Mestra: ${config.text}`:''}`,tags:['populacao-regional']};
      if(config.teamId)request.teamId=config.teamId;
      rows.push(request);
      for(const [key,value] of [['places',place.id],['purposes',purpose.id],['legacies',legacy.name],['levels',String(level)]])summary[key][value]=(summary[key][value]??0)+1;
    }
    const payload={schemaVersion:1,config,batchId,catalogRevision:data.revision,requests:rows,summary,catalogItems:mechanics.items};
    return {...payload,signature:await digest(payload),warnings:['Distribuição sorteada por pesos, não proporção populacional canônica.','Texto adicional orienta a proposta; não altera os pesos automaticamente.','As fichas e escolhas mecânicas ainda precisam ser preparadas e revisadas.'],catalogFailures:mechanics.failures??[]};
  }
  return {
    planNpcPopulation,
    async prepareNpcGroup(input){
      requireGM();
      if(typeof input==='string'){
        let text=input.trim().replace(/^\uFEFF/,'');
        const fenced=/^```(?:json)?\s*\n([\s\S]*?)\n```$/.exec(text);if(fenced)text=fenced[1];
        if(text.length>2_000_000)throw Error('Documento do grupo muito grande.');
        try{input=JSON.parse(text);}catch{throw Error('Envie o documento JSON do grupo conforme getNpcBatchInstructions().populationEngine. Prosa livre deve ser estruturada pela IA.');}
      }
      assertContentObject(input);
      if(input.format!=='quedaco-grupo-npcs'||input.schemaVersion!==1||Object.keys(input).some(key=>!['format','schemaVersion','population','requests'].includes(key))||Boolean(input.population)===Boolean(input.requests))throw Error('Documento de grupo inválido: use formato quedaco-grupo-npcs, schemaVersion 1 e population OU requests.');
      let staged,plan;
      if(input.population){plan=await planNpcPopulation(input.population);staged=await requests.stageNpcRequests(plan.requests);}
      else{if(!Array.isArray(input.requests))throw Error('requests precisa ser uma lista de integrantes.');staged=await requests.stageNpcRequests(input.requests);}
      const ids=staged.map(row=>row.request.id),prepared=await requests.prepareNpcRequests({ids});
      return {...prepared,ids,...(plan?{population:{batchId:plan.batchId,config:plan.config,summary:plan.summary,warnings:plan.warnings}}:{})};
    },
    async createPreparedNpcGroup(prepared){
      requireGM();if(!Array.isArray(prepared?.ids)||!prepared.signature)throw Error('Prepare o documento do grupo antes de criar.');
      return requests.createPreparedNpcRequests({ids:prepared.ids},{expectedSignature:prepared.signature});
    },
    async stageNpcPopulation(plan,{expectedSignature}={}){
      requireGM();if(!expectedSignature||plan?.signature!==expectedSignature)throw Error('Revise o elenco sorteado antes de guardar.');
      const fresh=await planNpcPopulation(plan.config);
      if(fresh.signature!==expectedSignature||JSON.stringify(plan.requests)!==JSON.stringify(fresh.requests))throw Error('O plano, Cadastro ou catálogo mudou. Sorteie e revise novamente.');
      return requests.stageNpcRequests(fresh.requests);
    }
  };
}
