import {LOCALITY_GOODS} from './book-world.mjs';
const key=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function localityProfile(place){const kind=key(place?.kind);if(kind.includes('capital'))return 'capital';if(kind.includes('porto')||kind.includes('costeira')||kind.includes('ilha')||kind.includes('mar'))return 'porto';if(kind.includes('deserto'))return 'deserto';if(kind.includes('cordilheira')||kind.includes('montanha')||kind.includes('ruina'))return 'montanha';if(kind.includes('pantano')||kind.includes('lagoa'))return 'pantano';return 'selvagem';}
export function localityStock(place,items=[],{markup=1.15,limit=18}={}){
 const profile=LOCALITY_GOODS[localityProfile(place)]??LOCALITY_GOODS.selvagem;
 return Array.from(items).filter(item=>String(item.uuid??'').startsWith('Compendium.')).map(item=>{const text=key(`${item.name} ${item.category??''}`),category=item.category??item.system?.category??'';const score=(profile.categories.includes(category)?3:0)+profile.keywords.filter(word=>text.includes(key(word))).length;return {item,score};}).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||String(a.item.name).localeCompare(String(b.item.name),'pt-BR')).slice(0,limit).map(({item})=>({uuid:item.uuid,price:Math.max(0,Math.ceil(Number(item.system?.price??item.price??0)*markup)),qty:null,note:`Estoque típico: ${profile.label}`}));
}
