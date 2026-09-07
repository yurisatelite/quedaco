import {normalize} from './rules.mjs';

const find=(catalog,name)=>catalog.items.find(item=>normalize(item.name)===normalize(name));
const itemOption=entry=>({id:`item:${entry.uuid}`,label:entry.name,items:[{entry,quantity:1}]});
const bundle=(id,label,items)=>({id:`bundle:${id}`,label,items});
const group=(id,title,count,options,autoAmmo=false)=>({id,title,count,options,autoAmmo});

function required(catalog,name,quantity=1){const entry=find(catalog,name);if(!entry)throw Error(`Equipamento do livro não localizado no compêndio: ${name}.`);return {entry,quantity};}

export async function buildClassEquipmentPlan(catalog,className,choices={}) {
  const weapons=[];
  for(const entry of catalog.list('weapon')){const system=entry.system?.category?entry.system:(await catalog.document(entry.uuid)).system;if(['simple','martial'].includes(system?.category))weapons.push({entry,system});}
  const simple=weapons.filter(item=>item.system.category==='simple').map(item=>itemOption(item.entry));
  const martial=weapons.filter(item=>item.system.category==='martial').map(item=>itemOption(item.entry));
  const fixed=[];const groups=[];const key=normalize(className);
  if(key==='combatente'){
    groups.push(group('fighter-armor','Conjunto de armadura',1,[
      bundle('mail','Cota de malha',[required(catalog,'Cota de Malha')]),
      bundle('archer','Couro batido, arco longo e flechas',[required(catalog,'Armadura de Couro Batido'),required(catalog,'Arco Longo'),required(catalog,'Flechas')])
    ]));
    groups.push(group('fighter-martial-mode','Armas marciais',1,[bundle('shield-mode','Uma arma marcial e escudo leve',[required(catalog,'Escudo Leve')]),bundle('two-mode','Duas armas marciais',[])]));
    const mode=choices['fighter-martial-mode']?.[0];groups.push(group('class-weapons','Escolha de armas marciais',mode==='bundle:two-mode'?2:1,martial,true));
    groups.push(group('fighter-last-kit','Último conjunto',1,[bundle('crossbow','Besta leve e virotes',[required(catalog,'Besta Leve'),required(catalog,'Virotes de besta')]),bundle('axes','Duas machadinhas',[required(catalog,'Machadinha',2)])]));
  } else if(key==='especialista'){
    fixed.push(required(catalog,'Armadura de Couro'),required(catalog,'Adaga',2));groups.push(group('class-weapons','Quatro armas simples',4,simple,true));
  } else if(key==='ocultista'){
    fixed.push(required(catalog,'Bolsa para Componentes'));groups.push(group('class-weapons','Uma arma simples',1,simple,true));
  } else throw Error('Classe sem equipamento inicial mapeado.');
  return {fixed,groups,weapons};
}

function ammoName(weapon){if(weapon.name.includes('Besta'))return 'Virotes de besta';if(weapon.name.includes('Arco'))return 'Flechas';if(weapon.name==='Funda')return 'Balas de funda';return null;}

export async function resolveEquipmentPlan(catalog,plan,choices={}) {
  const errors=[];const items=[];
  items.push(...plan.fixed);
  for(const g of plan.groups){const selected=(choices[g.id]??[]).filter(Boolean);if(selected.length!==g.count)errors.push(`${g.title}: escolha ${g.count===1?'uma opção':`${g.count} opções`}.`);for(const id of selected){const option=g.options.find(value=>value.id===id);if(!option){errors.push(`${g.title}: opção inválida.`);continue;}items.push(...option.items);if(g.autoAmmo){for(const owned of option.items){const system=owned.entry.system?.purpose?owned.entry.system:(await catalog.document(owned.entry.uuid)).system;if(system?.purpose!=='ranged')continue;const ammo=ammoName(owned.entry);if(ammo)items.push(required(catalog,ammo));}}}}
  const merged=new Map();for(const item of items){const current=merged.get(item.entry.uuid)??{entry:item.entry,quantity:0};current.quantity+=item.quantity;merged.set(item.entry.uuid,current);}
  return {errors,items:[...merged.values()]};
}
export const resolveClassEquipment=resolveEquipmentPlan;

const BACKGROUND_NOTES={
  'agente de organizacao':'Item com o símbolo da organização (até T$30) e contato capaz de marcar uma conferência com figura importante.',
  'agouro':'Materiais ritualísticos que servem de componentes para magias de CONTROLE.',
  'aristocrata':'Carta de linhagem, roupas finas e presente de outro aristocrata (até T$30).',
  'artista':'Itens para sua arte (total T$20), uma obra própria e roupas ou fantasias adequadas.',
  'assistente magitec':'Kit de magitec, componente alquímico não identificado e projeto incompleto; também recebe uma engenhoca magitec de T$50.',
  'cacador':'Roupas de viagem, armadilha de caça e corrente de 3 metros.',
  'comerciante':'Baú com cadeado e tesouro para venda no valor de até T$80.',
  'contrabandista':'Engenhoca contrabandeada de até T$150 com mau funcionamento definido pela Mestra.',
  'cosmopolita':'Ingresso para festa exclusiva, anel com insígnia de família importante e roupas chiques.',
  'detetive':'Documentos de casos, identificação oficial, roupas discretas e uma Lampadinha quebrada (conserto T$50).',
  'devedor':'Não recebe objetos adicionais; a dívida é registrada separadamente.',
  'erudito':'Mochila para livros, compêndio de estudos e lanterna com fluido para 5 cenas.',
  'estudioso feerico':'Asas preservadas de uma fada guerreira e componentes para magias UTILITÁRIAS.',
  'heroi do povo':'Presente recebido por um ato heroico e um equipamento inicial com Sigilo de 1º grau e somente uma carga.',
  'juramentado':'Objeto que comprova seu juramento de proteção.',
  'militar':'Insígnia militar de alguém importante que treinou ao seu lado.',
  'navegante':'Veículo pequeno quebrado guardado em local seguro e uma lanterna.',
  'procurado':'Item de até T$20 ligado ao motivo de ser procurado.',
  'proletario':'Mochila de ferramentas de trabalho (até T$20) e objeto importante fruto do próprio esforço.',
  'viajante intrepido':'Roupas de viajante e verba exclusiva de 5d6+30 para equipamentos de exploração.'
};

export async function buildBackgroundEquipmentPlan(catalog,backgroundName,proficiencies=[]) {
  const key=normalize(backgroundName);if(!(key in BACKGROUND_NOTES))throw Error('Antecedente sem equipamento mapeado.');
  const fixed=[];const groups=[];const notes=[BACKGROUND_NOTES[key]];
  const allWeapons=[];for(const entry of catalog.list('weapon')){const system=entry.system?.category?entry.system:(await catalog.document(entry.uuid)).system;allWeapons.push({entry,system});}
  const weaponOptions=(categories=['simple'],cap=Infinity)=>allWeapons.filter(({system})=>categories.includes(system?.category)&&Number.isFinite(system?.price)&&system.price<=cap).map(({entry})=>itemOption(entry));
  const categories=['simple',...(proficiencies.includes('martial')?['martial']:[])];
  const exact=(name,quantity=1)=>{const entry=find(catalog,name);if(entry)fixed.push({entry,quantity});};
  const chooseWeapon=(id,title,cap=Infinity)=>groups.push(group(id,title,1,weaponOptions(categories,cap),true));
  if(key==='agente de organizacao'||key==='aristocrata'||key==='procurado'){
    const cap=key==='procurado'?20:30;const options=[];for(const entry of catalog.items.filter(item=>['weapon','armor','equipment','consumable','loot'].includes(item.type))){const price=entry.system?.price;if(Number.isFinite(price)&&price<=cap)options.push(itemOption(entry));}groups.push(group('background-keepsake',`Item de antecedente de até T$${cap}`,1,options));
  }
  if(key==='agouro')exact('Poção de Cura');
  if(key==='cacador')chooseWeapon('background-weapon','Arma simples do Caçador');
  if(key==='comerciante'){
    groups.push(group('background-weapon','Arma para venda de até T$15',1,weaponOptions(categories,15),true));
    const armor=[];for(const entry of catalog.list('armor')){const system=entry.system?.type?entry.system:(await catalog.document(entry.uuid)).system;if(Number.isFinite(system?.price)&&system.price<=20&&['light','shield'].includes(system?.type))armor.push(itemOption(entry));}groups.push(group('background-armor','Armadura ou escudo para venda de até T$20',1,armor));
  }
  if(key==='contrabandista')chooseWeapon('background-weapon','Arma simples de até T$20',20);
  if(key==='erudito')exact('Lanterna');
  if(key==='juramentado'){exact('Kit de Curandeiro');const shields=[];for(const entry of catalog.list('armor')){const system=entry.system?.type?entry.system:(await catalog.document(entry.uuid)).system;if(system?.type==='shield')shields.push(itemOption(entry));}groups.push(group('background-shield','Escudo do juramento',1,shields));}
  if(key==='militar'){chooseWeapon('background-weapon','Arma do Militar');exact('Kit de Curandeiro');}
  if(key==='navegante'){groups.push(group('background-weapon','Arma simples de até T$20',1,weaponOptions(['simple'],20),true));exact('Lanterna');}
  if(key==='proletario')chooseWeapon('background-weapon','Arma relacionada ao trabalho');
  return {fixed,groups,notes};
}

export function mergeEquipmentResults(...results){const merged=new Map(),errors=[];for(const result of results){errors.push(...result.errors);for(const item of result.items){const current=merged.get(item.entry.uuid)??{entry:item.entry,quantity:0};current.quantity+=item.quantity;merged.set(item.entry.uuid,current);}}return{errors,items:[...merged.values()]};}

export function shopItems(catalog,query=''){
  const needle=normalize(query);return catalog.items.filter(entry=>['weapon','armor','equipment','consumable','loot'].includes(entry.type)&&Number.isFinite(entry.system?.price)&&entry.system.price>0&&(!needle||normalize(entry.name).includes(needle))).sort((a,b)=>a.system.price-b.system.price||a.name.localeCompare(b.name,'pt-BR'));
}
export function resolvePurchases(catalog,cash,equipmentBudget,cashCart=new Map(),budgetCart=new Map()){
  const errors=[],items=[];let cashSpent=0,budgetSpent=0;
  const consume=(cart,fund)=>{for(const [uuid,quantity] of cart){const entry=catalog.items.find(item=>item.uuid===uuid),qty=Number(quantity);if(!entry||!Number.isSafeInteger(qty)||qty<1||!Number.isFinite(entry.system?.price)){errors.push('Há uma compra inválida na cesta.');continue;}if(fund==='budget'&&!['equipment','consumable','loot'].includes(entry.type)){errors.push(`A verba de exploração não pode comprar ${entry.name}.`);continue;}const cost=entry.system.price*qty;if(fund==='cash')cashSpent+=cost;else budgetSpent+=cost;items.push({entry,quantity:qty});}};
  consume(cashCart,'cash');consume(budgetCart,'budget');
  if(cashSpent>cash)errors.push(`Compras excedem a bolsa em T$ ${cashSpent-cash}.`);if(budgetSpent>equipmentBudget)errors.push(`Compras de exploração excedem a verba em T$ ${budgetSpent-equipmentBudget}.`);
  return{errors,items,cashSpent,budgetSpent,cashRemaining:cash-cashSpent,budgetRemaining:equipmentBudget-budgetSpent};
}
export function totalVolume(items=[]){return items.reduce((total,item)=>total+(Number(item.entry.system?.capacity)||0)*item.quantity,0);}
