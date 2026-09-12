// Heranças por legado — a particularidade que separa dois NPCs do mesmo legado
// (elfe de Corte do Outono não é elfe Sem Corte). Extraído dos vínculos oficiais
// do compêndio da mesa, não transcrito do livro.
export const HERITAGES={
  Walshie:['Alpaqueira','Desbravadora'],
  Elfe:['Corte do Verão','Corte do Outono','Corte do Inverno','Corte da Primavera','Sem Corte'],
  Jotun:['Herança Óssea','Herança Cristalizada'],
  Gnomo:['2 Heranças Maiores','1 Herança Maior e 2 Menores'],
  Herculen:['Herança Polyph','Herança Myxo'],
  Tatsunoko:['Herança Metálica','Herança Cromática','Herança Mineral'],
  Sanguir:['Byotr','Shtarik'],
  Draco:['Escamas Azuis','Escamas Brancas','Escamas Pretas','Escamas Verdes','Escamas Vermelhas'],
  Humani:['Herança Mortalha','Herança Maresia'],
  Querub:['Herança Dominari','Herança Virturi'],
  Petalin:['Herança Gemni','Herança Angio'],
  Kishin:['Fenix (Família)','Gargula (Família)','Hipocampo (Família)','Grifo (Família)','Corvo (Família)'],
  'Tôra':['Noatorenho','Törmundiano'],
  Naga:['Herança Rastejadora','Herança Altiva'],
  Anuro:['Bufonin','Ranin'],
  Urodelo:['Herança Ácida','Herança Elétrica','Herança Gélida','Herança Ígnea'],
};
export const LEGACIES=Object.keys(HERITAGES);
const chave=value=>String(value??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
/** Descobre o legado a partir do nome da herança, pra taguear NPC que só tem a herança na ficha. */
export function legacyOfHeritage(heritage){
  const alvo=chave(heritage);if(!alvo)return null;
  for(const [legacy,list] of Object.entries(HERITAGES))if(list.some(item=>chave(item)===alvo))return legacy;
  return null;
}
/** Heranças válidas de um legado, tolerando acento e caixa diferentes no nome. */
export function heritagesOf(legacy){
  const alvo=chave(legacy);if(!alvo)return [];
  const achado=Object.keys(HERITAGES).find(name=>chave(name)===alvo);
  return achado?HERITAGES[achado]:[];
}
