import { BACKGROUNDS, normalize } from './rules.mjs';
export const BOOK_CONTENT = {
  legacy: ['Anuro','Draco','Elfe','Gnomo','Humani','Kishin','Sanguir','Tatsunoko','Tôra','Urodelo','Walshie','Herculen','Petalin','Jotun','Naga','Querub'],
  background: BACKGROUNDS.map(b=>b.name),
  class: ['Combatente','Especialista','Ocultista'],
  curse: ['Aetherídeo','Górgon','Retornado','Sombrio'],
  path: ['Alquimista','Artesão de Guilda','Assassino','Cavaleiro Tóptero','Comandante','Devoto','Elementalista','Guerreiro Koi','Herdeiro Ancestral','Magitécnico','Malandro','Mestre das Armas','Mestre das Feras','Necromante','Pactuado','Protetor dos Ermos','Pugilista','Vendedor Ambulante']
};
const aliases = { sanguirs:'sanguir',herculens:'herculen',petalins:'petalin',jotuns:'jotun',nagas:'naga',querubs:'querub',detetive:'detetive',detetivo:'detetive' };
export const canonicalName = name => aliases[normalize(name)] ?? normalize(name);
export function auditCatalog(items) {
  const groups = Object.entries(BOOK_CONTENT).map(([type,names]) => {
    const available = items.filter(i=>i.type===type);
    const missing = names.filter(name=>!available.some(i=>canonicalName(i.name)===canonicalName(name)));
    return { type, expected: names.length, available: available.length, missing };
  });
  return { groups, missing: groups.flatMap(g=>g.missing.map(name=>({type:g.type,name}))), counts: items.reduce((acc,item)=>{acc[item.type]=(acc[item.type]??0)+1;return acc},{}), unillustrated: items.filter(i=>!i.img || i.img.startsWith('icons/svg/')).map(i=>({uuid:i.uuid,name:i.name,type:i.type})) };
}
