// Converte um item de D&D 5e (JSON do 5e.tools/Open5e) num Item do Skyfall.
// Skyfall não tem dado de dano/CA por item (é narrativo: descritores, preço T$,
// capacidade/volume). Por isso a conversão cria só o que é seguro de inferir —
// nome, categoria/tipo, imagem padrão, preço 0 e volume estimado pelo peso — e
// guarda o statblock original em flags para o mestre revisar e completar à mão.
import {tryParseJson} from './monster-convert.mjs';

const TYPE5E_CATEGORY={
  M:'Armas corpo a corpo',R:'Armas de longo alcance',A:'Armas de longo alcance',AF:'Armas de longo alcance',
  LA:'Armaduras e escudos',MA:'Armaduras e escudos',HA:'Armaduras e escudos',S:'Armaduras e escudos',
  P:'Consumíveis',SC:'Consumíveis',
  RD:'Materiais especiais',WD:'Materiais especiais',RG:'Materiais especiais',
  G:'Equipamento geral',$:'Equipamento geral',T:'Equipamento geral',AT:'Equipamento geral',TG:'Equipamento geral',INS:'Equipamento geral',GS:'Equipamento geral',
};
const FALLBACK_ICON={
  'Armas corpo a corpo':'icons/svg/sword.svg','Armas de longo alcance':'icons/svg/bow.svg',
  'Armaduras e escudos':'icons/equipment/chest/breastplate-layered-steel.webp',
  'Consumíveis':'icons/consumables/potions/bottle-bulb-corked-glowing-red.webp',
  'Materiais especiais':'icons/svg/gem.svg',
};
export function itemConvertFallback(category){return FALLBACK_ICON[category]||'icons/containers/bags/pack-leather-white-tan.webp';}

const grab=(json,...keys)=>{for(const k of keys)if(json[k]!=null&&json[k]!=='')return json[k];return null;};
function textOf(entries){
  if(!entries)return '';
  if(typeof entries==='string')return entries;
  if(Array.isArray(entries))return entries.map(item=>typeof item==='string'?item:(Array.isArray(item?.items)?item.items.join(' '):(item?.entries?textOf(item.entries):''))).filter(Boolean).join('\n\n');
  return '';
}

export function normalizeOneItem(json){
  if(!json||typeof json!=='object')return null;
  const name=grab(json,'name','Name');if(!name)return null;
  const type5e=String(grab(json,'type','Type')||'').toUpperCase().split(',')[0].trim();
  const category=TYPE5E_CATEGORY[type5e]||(json.armor||json.ac?'Armaduras e escudos':json.weaponCategory?'Armas corpo a corpo':'Equipamento geral');
  const weightLb=Number(String(grab(json,'weight','Weight')||'').replace(/[^0-9.]/g,''))||0;
  const valueCp=Number(grab(json,'value','Value'));
  return {
    name:String(name).trim(),
    category,
    weightLb,
    valueCp:Number.isFinite(valueCp)?valueCp:null,
    costStr:String(grab(json,'cost','Cost')||''),
    rarity:String(grab(json,'rarity','Rarity')||''),
    attune:Boolean(grab(json,'reqAttune','Requires Attunement','attunement')),
    text:textOf(grab(json,'entries','Entries','desc','description'))
  };
}
/** Aceita 1 objeto ou uma lista [ ... ] inteira. Devolve array normalizado. */
export function normalizeItemList(input){
  let json=input&&typeof input==='object'?input:null;
  if(!json){
    const str=String(input||'').trim();if(!str)return [];
    const bare=str.replace(/^﻿/,'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    if(!(bare.startsWith('{')||bare.startsWith('[')))return [];
    json=tryParseJson(str);if(json===undefined||!json)return [];
  }
  const arr=Array.isArray(json)?json:(Array.isArray(json?.item)?json.item:(Array.isArray(json?.items)?json.items:[json]));
  return arr.map(normalizeOneItem).filter(Boolean);
}
export const estimateVolume=weightLb=>Math.max(0,Math.round((Number(weightLb)||0)/5));
/** Recebe a entrada normalizada e devolve o `_source` de um Item do Skyfall. */
export function toSkyfallItemSource(entry,itemTypeForCategory){
  return {
    name:entry.name,
    type:itemTypeForCategory(entry.category),
    img:itemConvertFallback(entry.category),
    system:{price:0,quantity:1,capacity:estimateVolume(entry.weightLb)},
    flags:{quedaco:{convertedFrom:'dnd5e',sourceCategory:entry.category,sourceWeightLb:entry.weightLb||0,sourceValueCp:entry.valueCp,sourceCost:entry.costStr||'',sourceRarity:entry.rarity||'',sourceAttune:Boolean(entry.attune),sourceText:entry.text||''}}
  };
}
