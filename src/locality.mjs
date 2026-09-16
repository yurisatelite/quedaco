import {LOCALITY_GOODS} from './book-world.mjs';
const key=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function localityProfile(place){const kind=key(place?.kind);if(kind.includes('capital'))return 'capital';if(kind.includes('porto')||kind.includes('costeira')||kind.includes('ilha')||kind.includes('mar'))return 'porto';if(kind.includes('deserto'))return 'deserto';if(kind.includes('cordilheira')||kind.includes('montanha')||kind.includes('ruina'))return 'montanha';if(kind.includes('pantano')||kind.includes('lagoa'))return 'pantano';return 'selvagem';}
export function localityStock(place,items=[],{markup=1.15,limit=18}={}){
 const profile=LOCALITY_GOODS[localityProfile(place)]??LOCALITY_GOODS.selvagem;
 return Array.from(items).filter(item=>String(item.uuid??'').startsWith('Compendium.')).map(item=>{const text=key(`${item.name} ${item.category??''}`),category=item.category??item.system?.category??'';const score=(profile.categories.includes(category)?3:0)+profile.keywords.filter(word=>text.includes(key(word))).length;return {item,score};}).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||String(a.item.name).localeCompare(String(b.item.name),'pt-BR')).slice(0,limit).map(({item})=>({uuid:item.uuid,price:Math.max(0,Math.ceil(Number(item.system?.price??item.price??0)*markup)),qty:null,note:`Estoque típico: ${profile.label}`}));
}

/** Peso de uma localidade: quanta gente ela concentra em relação às outras da
 *  mesma região. A capital vale pelo topo da escala. Dosagem de mesa, não regra
 *  do livro — está aqui para ser conferida e mexida num lugar só. */
export const PLACE_WEIGHTS=[[/capital/i,6],[/cidade/i,4],[/porto|vila|fortaleza/i,2]];
export const DEFAULT_PLACE_WEIGHT=1;
export function placeWeight(place,capitalId=''){
 if(capitalId&&place?.id===capitalId)return Math.max(DEFAULT_PLACE_WEIGHT,...PLACE_WEIGHTS.map(([,peso])=>peso));
 const kind=String(place?.kind??'');
 for(const [re,peso] of PLACE_WEIGHTS)if(re.test(kind))return peso;
 return DEFAULT_PLACE_WEIGHT;
}
/**
 * Quantos NPCs cabem em cada localidade de uma região, proporcional ao peso.
 * Garante que a capital fique **estritamente** acima de qualquer outra sozinha —
 * é a regra da T20: lugar central sempre concentra mais gente.
 * Devolve Map(placeId → cota). A soma das cotas é exatamente `total`.
 */
export function localityQuotas(places=[],total=0,capitalId=''){
 const lista=Array.from(places).filter(Boolean);
 const cotas=new Map();
 if(!lista.length||total<=0){for(const place of lista)cotas.set(place.id,0);return cotas;}
 const peso=new Map(lista.map(place=>[place.id,placeWeight(place,capitalId)]));
 const soma=[...peso.values()].reduce((a,b)=>a+b,0);
 // ordem estável: mais pesado primeiro, desempate pelo id
 const porPeso=[...lista].sort((a,b)=>peso.get(b.id)-peso.get(a.id)||String(a.id).localeCompare(String(b.id)));
 let dado=0;
 for(const place of porPeso){const cota=Math.floor(total*peso.get(place.id)/soma);cotas.set(place.id,cota);dado+=cota;}
 // a sobra do arredondamento vai para os mais pesados, na mesma ordem
 for(let i=0;dado<total;i=(i+1)%porPeso.length,dado++)cotas.set(porPeso[i].id,cotas.get(porPeso[i].id)+1);
 const capital=lista.find(place=>place.id===capitalId);
 if(!capital)return cotas;
 // empate ou perda da capital: puxa da maior das outras até desempatar
 let guarda=0;
 while(guarda++<=total){
  const outras=porPeso.filter(place=>place.id!==capital.id);
  if(!outras.length)break;
  const maior=outras.sort((a,b)=>cotas.get(b.id)-cotas.get(a.id)||String(a.id).localeCompare(String(b.id)))[0];
  if(cotas.get(capital.id)>cotas.get(maior.id)||cotas.get(maior.id)===0)break;
  cotas.set(maior.id,cotas.get(maior.id)-1);
  cotas.set(capital.id,cotas.get(capital.id)+1);
 }
 return cotas;
}
