// Foco reversível: só filtra o que o QUEDAÇO mostra; não altera documentos do mundo.
export const DEFAULT_CAMPAIGN_FOCUS=Object.freeze({
  enabled:true,regionId:'thurthur',
  guildNames:Object.freeze(['Artífices do Amanhã','Latrun','Segredos','Conselho dos Cavaleiros','Chá da Meia-Noite','Associação Magina','Corruptores','Serviços Gerais de Opath','Pilares de Op','Ratos de Taverna']),
  legacyNames:Object.freeze(['Walshie','Tôra','Gnomo','Urodelo'])
});
const key=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const strings=value=>Array.isArray(value)?value.map(item=>String(item??'').trim()).filter(Boolean):[];
export function normalizeCampaignFocus(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!('enabled' in value||'regionId' in value||'guildNames' in value||'legacyNames' in value))return {...DEFAULT_CAMPAIGN_FOCUS,enabled:false,guildNames:[...DEFAULT_CAMPAIGN_FOCUS.guildNames],legacyNames:[...DEFAULT_CAMPAIGN_FOCUS.legacyNames]};
  return {enabled:value.enabled!==false,regionId:String(value.regionId||DEFAULT_CAMPAIGN_FOCUS.regionId),guildNames:strings(value.guildNames).length?strings(value.guildNames):[...DEFAULT_CAMPAIGN_FOCUS.guildNames],legacyNames:strings(value.legacyNames).length?strings(value.legacyNames):[...DEFAULT_CAMPAIGN_FOCUS.legacyNames]};
}
export function focusedRegions(regions,focus){const f=normalizeCampaignFocus(focus);return f.enabled?(regions??[]).filter(row=>row.id===f.regionId):[...(regions??[])];}
export function focusedPlaces(places,focus){const f=normalizeCampaignFocus(focus);return f.enabled?(places??[]).filter(row=>row.regionId===f.regionId):[...(places??[])];}
export function npcRegionId(actor,places=[],inferRegion=()=>null){const flag=actor?.flags?.quedaco?.npc??{};return String(flag.regionId||places.find(place=>place.id===flag.placeId)?.regionId||inferRegion(actor)||'');}
export function focusedNpcs(actors,focus,{places=[],inferRegion=()=>null}={}){const f=normalizeCampaignFocus(focus);return f.enabled?(actors??[]).filter(actor=>npcRegionId(actor,places,inferRegion)===f.regionId):[...(actors??[])];}
export function focusedGuilds(guilds,focus,protectedIds=new Set()){const f=normalizeCampaignFocus(focus);if(!f.enabled)return [...(guilds??[])];const allowed=new Set(f.guildNames.map(key));return (guilds??[]).filter(guild=>protectedIds.has(guild.uuid)||protectedIds.has(guild.id)||allowed.has(key(guild.name)));}
export function focusedLegacies(entries,focus,nameOf=entry=>entry?.name??entry){const f=normalizeCampaignFocus(focus);if(!f.enabled)return [...(entries??[])];const allowed=new Set(f.legacyNames.map(key));return (entries??[]).filter(entry=>allowed.has(key(nameOf(entry))));}
