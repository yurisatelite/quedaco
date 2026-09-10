const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export const guildKind=actor=>actor?.type==='guild';

export function npcGuildLabel(flag={},guilds=[]){
  const guild=guilds.find(actor=>actor?.uuid===flag.guildUuid||actor?.id===flag.guildUuid);
  return guild?.name||String(flag.guild??'').trim();
}

export function guildsForPlace({npcs=[],guilds=[],placeId='',regionId='',places=[]}={}){
  const localIds=new Set(places.filter(place=>place.regionId===regionId).map(place=>place.id));
  const relevant=npcs.filter(npc=>placeId?npc.placeId===placeId:(npc.regionId===regionId||localIds.has(npc.placeId)));
  const uuids=new Set(relevant.map(npc=>npc.guildUuid).filter(Boolean));
  const names=new Set(relevant.map(npc=>normalize(npc.guild)).filter(Boolean));
  return guilds.filter(guild=>uuids.has(guild.uuid)||uuids.has(guild.id)||names.has(normalize(guild.name)));
}
