const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

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
