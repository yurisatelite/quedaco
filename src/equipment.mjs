import {normalize} from './rules.mjs';

const find=(catalog,name)=>catalog.items.find(item=>normalize(item.name)===normalize(name));
const itemOption=entry=>({id:`item:${entry.uuid}`,label:entry.name,items:[{entry,quantity:1}]});
const bundle=(id,label,items)=>({id:`bundle:${id}`,label,items});
const group=(id,title,count,options)=>({id,title,count,options});

function required(catalog,name,quantity=1){const entry=find(catalog,name);if(!entry)throw Error(`Equipamento do livro não localizado no compêndio: ${name}.`);return {entry,quantity};}

export async function buildClassEquipmentPlan(catalog,className,choices={}) {
  const weapons=[];
  for(const entry of catalog.list('weapon')){const document=await catalog.document(entry.uuid);if(['simple','martial'].includes(document.system?.category))weapons.push({entry,document});}
  const simple=weapons.filter(item=>item.document.system.category==='simple').map(item=>itemOption(item.entry));
  const martial=weapons.filter(item=>item.document.system.category==='martial').map(item=>itemOption(item.entry));
  const fixed=[];const groups=[];const key=normalize(className);
  if(key==='combatente'){
    groups.push(group('fighter-armor','Conjunto de armadura',1,[
      bundle('mail','Cota de malha',[required(catalog,'Cota de Malha')]),
      bundle('archer','Couro batido, arco longo e flechas',[required(catalog,'Armadura de Couro Batido'),required(catalog,'Arco Longo'),required(catalog,'Flechas')])
    ]));
    groups.push(group('fighter-martial-mode','Armas marciais',1,[bundle('shield-mode','Uma arma marcial e escudo leve',[required(catalog,'Escudo Leve')]),bundle('two-mode','Duas armas marciais',[])]));
    const mode=choices['fighter-martial-mode']?.[0];groups.push(group('class-weapons','Escolha de armas marciais',mode==='bundle:two-mode'?2:1,martial));
    groups.push(group('fighter-last-kit','Último conjunto',1,[bundle('crossbow','Besta leve e virotes',[required(catalog,'Besta Leve'),required(catalog,'Virotes de besta')]),bundle('axes','Duas machadinhas',[required(catalog,'Machadinha',2)])]));
  } else if(key==='especialista'){
    fixed.push(required(catalog,'Armadura de Couro'),required(catalog,'Adaga',2));groups.push(group('class-weapons','Quatro armas simples',4,simple));
  } else if(key==='ocultista'){
    fixed.push(required(catalog,'Bolsa para Componentes'));groups.push(group('class-weapons','Uma arma simples',1,simple));
  } else throw Error('Classe sem equipamento inicial mapeado.');
  return {fixed,groups,weapons};
}

function ammoName(weapon){if(weapon.name.includes('Besta'))return 'Virotes de besta';if(weapon.name.includes('Arco'))return 'Flechas';if(weapon.name==='Funda')return 'Balas de funda';return null;}

export async function resolveClassEquipment(catalog,plan,choices={}) {
  const errors=[];const items=[];
  items.push(...plan.fixed);
  for(const g of plan.groups){const selected=(choices[g.id]??[]).filter(Boolean);if(selected.length!==g.count)errors.push(`${g.title}: escolha ${g.count===1?'uma opção':`${g.count} opções`}.`);for(const id of selected){const option=g.options.find(value=>value.id===id);if(!option){errors.push(`${g.title}: opção inválida.`);continue;}items.push(...option.items);if(g.id==='class-weapons'){for(const owned of option.items){const document=await catalog.document(owned.entry.uuid);if(document.system?.purpose!=='ranged')continue;const ammo=ammoName(owned.entry);if(ammo)items.push(required(catalog,ammo));}}}}
  const merged=new Map();for(const item of items){const current=merged.get(item.entry.uuid)??{entry:item.entry,quantity:0};current.quantity+=item.quantity;merged.set(item.entry.uuid,current);}
  return {errors,items:[...merged.values()]};
}
