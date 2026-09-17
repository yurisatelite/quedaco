const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const compact=value=>normalize(value).replace(/\s+/g,'');

export const TABLE_GUILD_NAME='P.I.P.I.';
export const TABLE_GUILD_SEAL='Dragão prateado';

export const guildKind=actor=>actor?.type==='guild';

// Estrutura: membro de guilda é ficha de personagem (type "character" — PC ou NPC).
// Ficha de monstro (type "npc") não conta e não dá parâmetros/pontos.
export const isGuildMemberActor=actor=>Boolean(actor)&&actor.type==='character';
export function guildMembers(guild,resolve){
  const list=Array.isArray(guild?.system?.members)?guild.system.members:[];
  return list.filter(entry=>isGuildMemberActor(entry?.uuid?resolve?.(entry.uuid):null));
}
// Nível da guilda = maior nível entre os membros (fichas de personagem), mínimo 2.
export function guildLevel(guild,resolve){
  let max=0;
  for(const entry of guildMembers(guild,resolve)){
    const level=Number(resolve?.(entry.uuid)?.system?.level?.value)||0;
    if(level>max)max=level;
  }
  return Math.max(2,max);
}

/** Motivos que tornam uma guilda intocável. Qualquer um dos três basta. */
export function guildProtectionReasons(guild,resolve){
  const reasons=[];
  if(compact(guild?.name).startsWith(compact(TABLE_GUILD_NAME)))reasons.push(`nome "${TABLE_GUILD_NAME}"`);
  const members=Array.isArray(guild?.system?.members)?guild.system.members:[];
  if(members.some(member=>resolve?.(member?.uuid)?.hasPlayerOwner))reasons.push('tem ficha de jogador');
  const seals=Array.isArray(guild?.flags?.quedaco?.appendix?.seals)?guild.flags.quedaco.appendix.seals:[];
  if(seals.some(seal=>compact(cleanSeal(seal))===compact(TABLE_GUILD_SEAL)))reasons.push(`selo "${TABLE_GUILD_SEAL}"`);
  return reasons;
}

/** Mapa UUID -> motivos, pronto para a interface explicar a proteção. */
export function guildProtectionMap(guilds=[],resolve){
  const result=new Map();
  for(const guild of guilds){
    const reasons=guildProtectionReasons(guild,resolve);
    if(reasons.length)result.set(guild.uuid??guild.id,reasons);
  }
  return result;
}

const distributionHash=value=>{
  let hash=2166136261;
  for(const char of String(value??'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
};
const guildId=guild=>String(guild?.uuid??guild?.id??'');
const isHansa=guild=>guild?.flags?.quedaco?.appendix?.kind==='hansa';
const cloneMember=member=>({...member});
const sameMemberIds=(left,right)=>{
  const ids=list=>list.map(member=>String(member?.uuid??'')).sort();
  return JSON.stringify(ids(left))===JSON.stringify(ids(right));
};
const npcRow=value=>{
  const actor=value?.actor??value;
  const flag=value?.flag??actor?.flags?.quedaco?.npc??{};
  return {actor,flag};
};

/**
 * Planeja a redistribuição da seleção atual sem gravar nem mutar documentos.
 * `npcs` contém os candidatos; a camada Foundry decide quais Actors são NPCs gerados.
 * `resolve` é opcional, mas permite calcular o nível quando uma guilda preserva alguém
 * que não aparece em `npcs`.
 */
export function planGuildRedistribution({guilds=[],npcs=[],archived=[],protectedIds=[],parts={guild:.6,hansa:.2},resolve}={}){
  const allGuilds=Array.from(guilds??[]).filter(guildKind);
  const archivedBefore=new Set(archived??[]);
  const rawProtected=protectedIds instanceof Map?protectedIds.keys():protectedIds;
  const requestedProtected=new Set(rawProtected??[]);
  const isProtected=guild=>requestedProtected.has(guildId(guild))||requestedProtected.has(guild?.id);
  const protectedGuilds=allGuilds.filter(isProtected);
  if(!protectedGuilds.length)throw Error('Nenhuma guilda protegida foi encontrada; a redistribuição foi recusada.');

  const ratios={guild:Number(parts?.guild??.6),hansa:Number(parts?.hansa??.2)};
  if(!Number.isFinite(ratios.guild)||!Number.isFinite(ratios.hansa)||ratios.guild<0||ratios.hansa<0||ratios.guild+ratios.hansa>1){
    throw Error('As proporções de guilda e hansa precisam ser positivas e somar no máximo 1.');
  }

  // Ordenar os alvos também torna o plano estável se a coleção de Actors mudar de ordem.
  const byId=(a,b)=>String(a?.id??a?.uuid??'').localeCompare(String(b?.id??b?.uuid??''));
  const active=allGuilds.filter(guild=>!isProtected(guild)&&!archivedBefore.has(guildId(guild)));
  const activeGuilds=active.filter(guild=>!isHansa(guild)).sort(byId);
  const activeHansas=active.filter(isHansa).sort(byId);
  if(!activeGuilds.length)throw Error('Nenhuma guilda está em jogo para receber os NPCs.');

  const localActors=new Map();
  const rows=[];
  for(const value of Array.from(npcs??[])){
    const row=npcRow(value),actor=row.actor;
    if(!actor?.uuid||actor.type!=='character'||actor.hasPlayerOwner||localActors.has(actor.uuid))continue;
    localActors.set(actor.uuid,actor);rows.push(row);
  }
  const resolveActor=uuid=>resolve?.(uuid)??localActors.get(uuid)??null;
  const protectedKeys=new Set(protectedGuilds.flatMap(guild=>[guildId(guild),String(guild.id??'')]).filter(Boolean));
  const protectedMembers=new Set(protectedGuilds.flatMap(guild=>(Array.isArray(guild.system?.members)?guild.system.members:[]).map(member=>member?.uuid)).filter(Boolean));
  const candidates=rows.filter(({actor,flag})=>!protectedMembers.has(actor.uuid)&&!protectedKeys.has(String(flag.guildUuid??'')))
    .sort((a,b)=>distributionHash(a.actor.id)-distributionHash(b.actor.id)||String(a.actor.id).localeCompare(String(b.actor.id)));

  const guildQuota=activeGuilds.length?Math.min(candidates.length,Math.round(candidates.length*ratios.guild)):0;
  const hansaQuota=activeHansas.length?Math.min(candidates.length-guildQuota,Math.round(candidates.length*ratios.hansa)):0;
  const destinations=new Map();
  candidates.forEach(({actor},index)=>{
    let target=null;
    if(index<guildQuota)target=activeGuilds[index%activeGuilds.length];
    else if(index<guildQuota+hansaQuota)target=activeHansas[(index-guildQuota)%activeHansas.length];
    destinations.set(actor.uuid,target);
  });

  const npcPlans=candidates.map(({actor,flag})=>{
    const target=destinations.get(actor.uuid)??null;
    const oldGuildUuid=String(flag.guildUuid??''),newGuildUuid=target?guildId(target):'';
    const changed=oldGuildUuid!==newGuildUuid||String(flag.guild??'').trim()!=='';
    return {actor,flag,target,oldGuildUuid,newGuildUuid,changed};
  });
  const candidateIds=new Set(npcPlans.map(plan=>plan.actor.uuid));
  const assignedByGuild=new Map();
  for(const plan of npcPlans){
    if(!plan.newGuildUuid)continue;
    const list=assignedByGuild.get(plan.newGuildUuid)??[];list.push(plan);assignedByGuild.set(plan.newGuildUuid,list);
  }

  const guildPlans=allGuilds.map(guild=>{
    const key=guildId(guild),beforeMembers=(Array.isArray(guild.system?.members)?guild.system.members:[]).map(cloneMember);
    const protectedState=isProtected(guild),activeState=!protectedState&&!archivedBefore.has(key);
    let afterMembers;
    if(protectedState)afterMembers=beforeMembers.map(cloneMember);
    else if(activeState){
      const kept=beforeMembers.filter(member=>!candidateIds.has(member?.uuid)).map(cloneMember);
      const assigned=(assignedByGuild.get(key)??[]).map(({actor})=>{
        const existing=beforeMembers.find(member=>member?.uuid===actor.uuid);
        return existing?cloneMember(existing):{uuid:actor.uuid,founder:false,retired:false};
      });
      afterMembers=[...kept,...assigned];
    }else{
      // Salvaguarda da macro: uma ficha de jogador nunca é retirada, mesmo se a
      // lista de protegidas tiver sido montada incorretamente pela integração.
      afterMembers=beforeMembers.filter(member=>resolveActor(member?.uuid)?.hasPlayerOwner).map(cloneMember);
    }
    const state=protectedState?'protected':activeState?'active':'archived';
    return {guild,state,kind:isHansa(guild)?'hansa':'guild',beforeMembers,afterMembers,
      levelAfter:guildLevel({system:{members:afterMembers}},resolveActor),membersChanged:!sameMemberIds(beforeMembers,afterMembers)};
  });

  const archivedAfter=new Set(archivedBefore);
  for(const plan of guildPlans){
    const key=guildId(plan.guild);
    if(plan.state==='archived')archivedAfter.add(key);else archivedAfter.delete(key);
  }
  const counts={
    candidates:npcPlans.length,
    changedNpcs:npcPlans.filter(plan=>plan.changed).length,
    inGuild:npcPlans.filter(plan=>plan.target&&!isHansa(plan.target)).length,
    inHansa:npcPlans.filter(plan=>plan.target&&isHansa(plan.target)).length,
    unassigned:npcPlans.filter(plan=>!plan.target).length,
    activeGuilds:activeGuilds.length,
    activeHansas:activeHansas.length,
    archivedGuilds:guildPlans.filter(plan=>plan.state==='archived').length,
    protectedGuilds:protectedGuilds.length,
    changedGuilds:guildPlans.filter(plan=>plan.state!=='protected'&&plan.membersChanged).length
  };
  return {guildPlans,npcPlans,archivedAfter:[...archivedAfter],protectedIds:protectedGuilds.map(guildId),parts:ratios,counts};
}

export function npcGuildLabel(flag={},guilds=[]){
  const guild=guilds.find(actor=>actor?.uuid===flag.guildUuid||actor?.id===flag.guildUuid);
  return guild?.name||String(flag.guild??'').trim();
}

export const cleanSeal=s=>String(s??'').replace(/[’‘`´]/g,"'").replace(/\s*\.\s*$/,'').trim();
export const GUILD_STANCES={aliada:{label:'Aliada',color:'#50b878'},neutra:{label:'Neutra',color:'#9aa5b1'},rival:{label:'Rival',color:'#d8ad4c'},hostil:{label:'Hostil',color:'#d95858'},desconhecida:{label:'Desconhecida',color:'#5a6b7d'}};
const THEME_RE=[
  ['comercio',/com[ée]rci|mercado|neg[óo]ci|lucro|mercador|guilda comercial/i],
  ['contrabando',/contraband|ilegal|pirat|roub|assalt|m[áa]fia|clandestin|crime organizado/i],
  ['informacao',/informa[çc]|espion|segred|rumor|not[íi]ci|conhecim|bibliotec|arquiv|illuminati/i],
  ['militar',/mercen[áa]ri|mil[íi]ci|ex[ée]rci|guerr|combat|soldad|paramilitar|prote[çc][ãa]o|guarda/i],
  ['arcano',/arcan|magi|feiti[çc]|ritual|sigil|encant|m[íi]stic|necr/i],
  ['maritimo',/mar[íi]tim|navio|frota|pescar|ocean|\bporto\b|marinh/i]
];
export function guildThemes(text=''){return THEME_RE.filter(([,re])=>re.test(String(text))).map(([k])=>k);}

export function guildsForPlace({npcs=[],guilds=[],placeId='',regionId='',places=[]}={}){
  const localIds=new Set(places.filter(place=>place.regionId===regionId).map(place=>place.id));
  const relevant=npcs.filter(npc=>placeId?npc.placeId===placeId:(npc.regionId===regionId||localIds.has(npc.placeId)));
  const uuids=new Set(relevant.map(npc=>npc.guildUuid).filter(Boolean));
  const names=new Set(relevant.map(npc=>normalize(npc.guild)).filter(Boolean));
  return guilds.filter(guild=>uuids.has(guild.uuid)||uuids.has(guild.id)||names.has(normalize(guild.name)));
}
