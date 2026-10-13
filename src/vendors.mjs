// Reconhecimento (só leitura) dos vendedores do módulo independente
// `quedaco-npcs-de-venda` (E:\RPG\QUEDACO\quedaco-npcs-de-venda, v0.1.0).
//
// Decisão do Yuri, 13/10/2026: o módulo de vendedor age sozinho; o QUEDAÇO NÃO edita
// loja nenhuma, só RECONHECE quem é vendedor pra ele distribuir os vendedores pelos
// locais. Por isso nada aqui escreve em Actor nem em flag.
//
// Formato lido (de `src/trade.mjs` do módulo de vendas):
//   actor.flags['quedaco-npcs-de-venda'].shop =
//     {enabled:false, public:false, markup:1, buyRate:.5, stock:[...], note:''}
// A flag fica no Actor mesmo com o módulo desativado, então lê-se direto de `flags`
// (`getFlag` lançaria erro se o módulo dono não estivesse ativo).
// Acesso a dado de outro módulo: qualquer formato inesperado = "não é vendedor", nunca erro.

export const VENDOR_MODULE_ID='quedaco-npcs-de-venda';

const number=(value,fallback)=>Number.isFinite(Number(value))&&value!==null&&value!==''?Number(value):fallback;

/** `null` se o ator não é vendedor (modo comerciante desligado, ausente ou ilegível). */
export function vendorShop(actor){
  try{
    const raw=actor?.flags?.[VENDOR_MODULE_ID]?.shop;
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.enabled!==true)return null;
    return {
      enabled:true,
      public:raw.public===true,
      items:Array.isArray(raw.stock)?raw.stock.length:0,
      markup:number(raw.markup,1),
      buyRate:number(raw.buyRate,.5),
      note:typeof raw.note==='string'?raw.note.trim():''
    };
  }catch{return null;}
}

export const isVendor=actor=>vendorShop(actor)!==null;

/** O módulo de vendas está ativo neste mundo? (só informativo: o reconhecimento funciona sem ele.) */
export function vendorModuleActive(game){
  try{return Boolean(game?.modules?.get?.(VENDOR_MODULE_ID)?.active);}catch{return false;}
}

/** Texto curto do selo/dica de um vendedor. */
export function vendorLabel(shop){
  if(!shop)return '';
  const itens=`${shop.items} ${shop.items===1?'item':'itens'} no estoque`;
  return `${shop.public?'Loja aberta aos jogadores':'Loja fechada (só a Mestra abre)'} · ${itens}`;
}

/**
 * Onde os vendedores estão. `vendors` = [{placeId, open}]. `regions`/`places` são as listas
 * que a tela mostra (já com o foco da campanha aplicado), então locais sem vendedor
 * aparecem com 0 — é o que mostra onde falta.
 * → {total, open, closed, unplaced, groups:[{regionId,name,total,places:[{id,name,count}]}]}
 */
export function vendorDistribution(vendors=[],{regions=[],places=[]}={}){
  const list=(Array.isArray(vendors)?vendors:[]).filter(Boolean);
  const byPlace=new Map();
  let unplaced=0;
  const known=new Set((Array.isArray(places)?places:[]).map(place=>place?.id));
  for(const vendor of list){
    if(vendor.placeId&&known.has(vendor.placeId))byPlace.set(vendor.placeId,(byPlace.get(vendor.placeId)??0)+1);
    else unplaced++;
  }
  const collator=new Intl.Collator('pt-BR');
  const groups=(Array.isArray(regions)?regions:[]).map(region=>{
    const rows=(places??[]).filter(place=>place.regionId===region.id)
      .map(place=>({id:place.id,name:place.name,count:byPlace.get(place.id)??0}))
      .sort((a,b)=>b.count-a.count||collator.compare(a.name,b.name));
    return {regionId:region.id,name:region.name,total:rows.reduce((sum,row)=>sum+row.count,0),places:rows};
  }).sort((a,b)=>collator.compare(a.name,b.name));
  const open=list.filter(vendor=>vendor.open).length;
  return {total:list.length,open,closed:list.length-open,unplaced,groups};
}
