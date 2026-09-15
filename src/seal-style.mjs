import {normalize} from './rules.mjs';

/** Selo exclusivo da mesa, sem correspondente no Livro Básico. */
export const SILVER_DRAGON_SEAL='Dragão Prateado';

const DRAGONS={
  'dragao azul':'#3487e2',
  'dragao branco':'#dce9f4',
  'dragao verde':'#42a568',
  'dragao prateado':'#b8c9d8',
  'dragonesa negra':'#675b79',
  'dragonesa preta':'#675b79',
  'dragonesa vermelha':'#d95a56',
};
const COURTS={
  'corte da primavera':'#71b86f',
  'corte de primavera':'#71b86f',
  'corte do verao':'#e4ad5c',
  'corte de verao':'#e4ad5c',
  'corte do outono':'#b97448',
  'corte de outono':'#b97448',
  'corte do inverno':'#7aa7d5',
  'corte de inverno':'#7aa7d5',
};
const OTHERS={
  'senado de alberich':{icon:'fa-landmark',color:'#c6a66b'},
  'familias nobres de alberich':{icon:'fa-crown',color:'#c6a66b'},
  'universidade arcana de opath':{icon:'fa-book-sparkles',color:'#a487d8'},
  'frota rompante':{icon:'fa-ship',color:'#58a9c9'},
  'associacao de pescadores':{icon:'fa-fish',color:'#58a9c9'},
};
const FALLBACK_COLORS=['#67a8c7','#b598d2','#8cbe8b','#d0a56a','#c8849a'];
export function sealStyle(name){
  const key=normalize(name);
  if(DRAGONS[key])return {icon:'fa-dragon',color:DRAGONS[key],homebrew:key==='dragao prateado'};
  if(COURTS[key])return {icon:'fa-crown',color:COURTS[key],homebrew:false};
  if(key.startsWith('necari'))return {icon:'fa-gem',color:'#519fdb',homebrew:false};
  if(OTHERS[key])return {...OTHERS[key],homebrew:false};
  let hash=0;for(const char of key)hash=(hash*31+char.charCodeAt(0))>>>0;
  return {icon:'fa-stamp',color:FALLBACK_COLORS[hash%FALLBACK_COLORS.length],homebrew:false};
}
