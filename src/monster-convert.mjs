// T34/T8 — converte um bloco de criatura de D&D 5e num Actor `npc` do Skyfall.
// Segue os guias do Movimento RPG (movimentorpg.com.br) "Guia para Adaptar
// Ameaças de D&D5e para SkyfallRPG" e "...Chefões/Boss...": PV = máximo dos
// dados de vida, atributo = modificador de D&D, proteção treinada nos dois
// atributos mais altos (empate = ambos), proficiência pela tabela de CR de
// D&D, RD por faixa de arquétipo/chefão. Ataques, recargas e habilidades de
// chefão ficam anotados na biografia — o mestre monta os Itens de ação.

const CREATURE_TYPES=new Set(['celestial','construct','dragon','elemental','fey','beast','giant','ooze','humanoid','fiend','monstrosity','undead','plant']);
const TYPE_ALIASES={aberration:'monstrosity',swarm:'beast',swarms:'beast',monster:'monstrosity'};
const ABILITIES=['str','dex','con','int','wis','cha'];
const DND_KEY={str:'strength',dex:'dexterity',con:'constitution',int:'intelligence',wis:'wisdom',cha:'charisma'};

export function parseCr(cr){
  if(typeof cr==='number')return cr>=0?cr:0;
  const raw=String(cr??'').trim();if(!raw)return 0;
  const frac=raw.match(/^(\d+)\s*\/\s*(\d+)/);if(frac)return Number(frac[2])?Number(frac[1])/Number(frac[2]):0;
  const num=Number(raw.match(/-?\d+(\.\d+)?/)?.[0]);return Number.isFinite(num)&&num>=0?num:0;
}
/** CR de D&D → Nível de Desafio do Skyfall (1–12). */
export function crToNd(cr){
  const value=parseCr(cr);
  if(value<=1)return 1;
  if(value<=4)return Math.round(value);
  const table={5:5,6:5,7:6,8:6,9:7,10:7,11:8,12:8,13:9,14:9,15:10,16:10,17:11,18:11,19:12,20:12};
  return table[Math.min(20,Math.floor(value))]??12;
}
export function abilityMod(score){const n=Number(score);return Number.isFinite(n)?Math.floor((n-10)/2):0;}
export function feetToMeters(feet){const n=Number(String(feet??'').replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n>0?Math.round(n/5)*1.5:0;}
export function skyfallCreatureType(type){
  const tokens=String(type??'').toLowerCase().replace(/\([^)]*\)/g,'').split(/[\s,;]+/).filter(Boolean);
  for(const token of tokens){
    if(CREATURE_TYPES.has(token))return token;
    if(TYPE_ALIASES[token])return TYPE_ALIASES[token];
  }
  return 'monstrosity';
}
function proficiencyForNd(nd){return nd>=17?6:nd>=13?5:nd>=9?4:nd>=5?3:2;}
/** Bônus de proficiência pela tabela de CR de D&D (usado pra treinar proteções). */
export function dndProficiencyForCr(cr){
  const v=parseCr(cr);
  if(v<5)return 2;if(v<9)return 3;if(v<13)return 4;if(v<17)return 5;if(v<21)return 6;if(v<25)return 7;return v<29?8:9;
}
/** PV = máximo dos dados de vida (guia oficial), ex.: "18d10 + 36" → 18×10+36. */
export function parseHitDice(text){
  const m=String(text||'').match(/(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?/i);
  if(!m)return null;
  const n=Number(m[1]),sides=Number(m[2]),bonus=m[3]?Number(m[3].replace(/\s+/g,'')):0;
  return Number.isFinite(n)&&Number.isFinite(sides)?n*sides+bonus:null;
}
/** RD pela faixa de arquétipo/chefão dos dois guias (não é derivado da CA); pega a ponta baixa de cada faixa — o mestre pode subir. */
export function rdForArchetype(tier,archetype,nd){
  const soft=['group','ranged'].includes(archetype),hard=['brute','mount'].includes(archetype);
  if(tier==='boss')return soft?1:hard?4:(nd>=9?9:6);
  return soft?1:hard?3:4;
}

export function guessHierarchy(mob){
  if(mob.legendary||/legendary (actions?|resistance)/i.test(mob.text||''))return 'boss';
  if(mob.multiattack||/multiattack/i.test(mob.text||'')||parseCr(mob.cr)>=5)return 'complex';
  return 'simple';
}
export function guessArchetype(mob){
  const text=`${mob.text||''}`.toLowerCase();
  if(/pack tactics|swarm|in a group/.test(text))return 'group';
  if(/\b(ranged|longbow|shortbow|crossbow|bolt|javelin|breath weapon|hurl|sling)\b/.test(text))return 'ranged';
  if(/\b(commander|rally|leader|inspiring|marshal)\b/.test(text))return 'leader';
  if(/\b(mount|rider|steed)\b/.test(text))return 'mount';
  if(guessHierarchy(mob)==='boss'||(Number(mob.ac)||0)>=18)return 'sentinel';
  if(/\bguard|protect|sentinel|bodyguard\b/.test(text))return 'defender';
  return 'brute';
}

function buildBiography(mob,nd,{tier,archetype,dr,prof,trained,hpSource}){
  const lines=[];
  lines.push(`<p><em>Convertido de D&amp;D 5e${mob.cr!=null&&mob.cr!==''?` — CR ${mob.cr}`:''} → ND ${nd}, seguindo o guia do Movimento RPG.</em></p>`);
  lines.push(`<p><strong>PV:</strong> ${hpSource==='dice'?'máximo dos dados de vida da ficha 5e':'estimado — sem dados de vida no JSON, revise'}. <strong>RD ${dr}</strong> pela faixa de ${tier==='boss'?'chefão':'ameaça'}/arquétipo (${archetype}) — não é derivado da CA; ajuste conforme o papel da criatura na cena.</p>`);
  lines.push(`<p><strong>Proteções treinadas</strong> (10 + atributo + proficiência ${prof}): ${trained.map(k=>k.toUpperCase()).join(' e ')}. Se a Proteção de DES ficar bem abaixo da CA original, considere uma passiva "Armadura Natural" somando a diferença.</p>`);
  if(tier==='boss')lines.push('<p><strong>Chefão:</strong> adicione as passivas "Chefão" (3 iniciativas dividindo o deslocamento) e "Resistência do Chefe" (encerra uma condição no fim do turno) e a ação bônus "Deslocar-se". Ações lendárias de 1–2 ações viram ações normais; as de 3 ações viram habilidade de recarga. Se a criatura tinha ações lendárias, mantenha o nº de ataques; senão, reduza o multiataque em 1 (mín. 1). Habilidades de recarga em área: +2 dados (ou +1 categoria de dado); ataques em área comuns: +1 dado.</p>');
  else lines.push('<p><strong>Ataques:</strong> reduza o nº de multiataques em 1 (mínimo 1 por turno).</p>');
  if(mob.ac)lines.push(`<p><strong>CA original (5e):</strong> ${mob.ac}</p>`);
  if(mob.hp)lines.push(`<p><strong>PV original (5e):</strong> ${mob.hp}</p>`);
  if(mob.resistances)lines.push(`<p><strong>Resistências:</strong> ${mob.resistances}</p>`);
  if(mob.immunities)lines.push(`<p><strong>Imunidades:</strong> ${mob.immunities}</p>`);
  if(mob.senses)lines.push(`<p><strong>Sentidos:</strong> ${mob.senses}</p>`);
  if(mob.text)lines.push(`<hr><p><strong>Traços e ações (texto original):</strong></p><p>${String(mob.text).replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>')}</p>`);
  return lines.join('');
}

/** Recebe o bloco normalizado e devolve o `_source` de um Actor `npc` do Skyfall. */
export function toSkyfallNpc(mob,{hierarchy=null,boss=null}={}){
  if(!mob||typeof mob!=='object')throw Error('Bloco de criatura vazio.');
  const nd=crToNd(mob.cr);
  const abilities={};
  for(const key of ABILITIES)abilities[key]={value:abilityMod(mob.abilities?.[key])};
  const tier=hierarchy||(boss?'boss':guessHierarchy(mob));
  const archetype=guessArchetype(mob);
  // proteção treinada nos DOIS atributos mais altos (empate no 2º lugar = todos os empatados)
  const sortedValues=[...ABILITIES.map(k=>abilities[k].value)].sort((a,b)=>b-a);
  const threshold=sortedValues[1]??sortedValues[0];
  const trained=ABILITIES.filter(k=>abilities[k].value>=threshold);
  for(const k of trained)abilities[k].proficient=true;
  const prof=(mob.cr!=null&&mob.cr!=='')?dndProficiencyForCr(mob.cr):proficiencyForNd(nd);
  // PV = máximo dos dados de vida (não média, não fórmula própria)
  const diceMax=parseHitDice(mob.hitDice)??parseHitDice(mob.hp);
  const hp=diceMax??Math.max(10,Math.round(nd*8+10));
  const dr=rdForArchetype(tier,archetype,nd);
  const speed=mob.speed||{};
  const source={
    name:String(mob.name||'Criatura convertida').trim(),
    type:'npc',
    system:{
      abilities,
      level:{value:nd},
      proficiency:prof,
      resources:{hp:{value:hp,max:hp,temp:0},shadow:{value:5}},
      movement:{
        walk:feetToMeters(speed.walk??30)||9,
        swim:feetToMeters(speed.swim),
        burrow:feetToMeters(speed.burrow),
        flight:feetToMeters(speed.fly??speed.flight)
      },
      creatureType:skyfallCreatureType(mob.type),
      hierarchy:tier,
      archetype:[archetype],
      dr,
      biography:buildBiography(mob,nd,{tier,archetype,dr,prof,trained,hpSource:diceMax!=null?'dice':'estimado'})
    },
    flags:{quedaco:{convertedFrom:'dnd5e',sourceCr:String(mob.cr??''),sourceName:String(mob.name||'')}}
  };
  if(mob.img&&/^https?:|^\w[\w./-]*\.(webp|png|jpe?g)$/i.test(String(mob.img)))source.img=String(mob.img);
  return source;
}

/** Normaliza um JSON do Open5e / 5e.tools / export do sistema dnd5e. */
export function normalizeOpen5e(json){
  if(!json||typeof json!=='object')return null;
  const ab={};
  for(const key of ABILITIES){
    const v=json[key]??json[DND_KEY[key]]??json.abilities?.[key]?.value??json.abilities?.[key]??json.stats?.[key];
    if(v!=null)ab[key]=Number(v);
  }
  const acRaw=json.armor_class??json.ac??json.attributes?.ac?.value;
  const ac=Array.isArray(acRaw)?Number(acRaw[0]?.value??acRaw[0]):Number(typeof acRaw==='object'?acRaw?.value:acRaw);
  const hpRaw=json.hit_points??json.hp??json.attributes?.hp?.max;
  const speed=typeof json.speed==='object'&&json.speed?json.speed:parseSpeedString(json.speed);
  if(!Object.keys(ab).length&&!json.name)return null;
  return {
    name:json.name,
    cr:json.challenge_rating??json.cr??json.details?.cr,
    abilities:ab,
    ac:Number.isFinite(ac)?ac:null,
    hp:hpRaw!=null?String(hpRaw):'',
    hitDice:typeof json.hit_dice==='string'?json.hit_dice:'',
    speed:speed||{},
    type:json.type??json.details?.type?.value??json.details?.type,
    resistances:[json.damage_resistances,json.condition_immunities].filter(Boolean).join('; ')||'',
    immunities:json.damage_immunities||'',
    senses:typeof json.senses==='string'?json.senses:'',
    legendary:Boolean(json.legendary_actions&&(Array.isArray(json.legendary_actions)?json.legendary_actions.length:String(json.legendary_actions).trim())),
    multiattack:JSON.stringify(json.actions||json.special_abilities||'').toLowerCase().includes('multiattack'),
    text:[...(asEntries(json.special_abilities)),...(asEntries(json.actions)),...(asEntries(json.legendary_actions))].join('\n\n')
  };
}
function asEntries(list){
  if(!list)return [];
  if(typeof list==='string')return [list];
  if(Array.isArray(list))return list.map(item=>item?.name?`${item.name}. ${item.desc??item.description??''}`.trim():String(item?.desc??item??'')).filter(Boolean);
  return [];
}
function parseSpeedString(str){
  if(!str||typeof str!=='string')return {};
  const out={};
  for(const part of str.split(',')){
    const m=part.trim().match(/^([a-z]*)\s*(\d+)\s*ft/i);
    if(!m)continue;
    const key=(m[1]||'walk').toLowerCase();out[key==='fly'?'fly':key]=Number(m[2]);
  }
  return out;
}

/** Lê o texto colado de um statblock de D&D 5e (formato do Livro do Mestre / SRD). */
export function parseStatblock(text){
  const raw=String(text||'').replace(/\r/g,'');
  if(!raw.trim())return null;
  const grab=re=>raw.match(re)?.[1]?.trim();
  const name=(raw.split('\n').map(l=>l.trim()).find(Boolean))||'Criatura convertida';
  const TYPE_RE=/aberration|beast|celestial|construct|dragon|elemental|fey|fiend|giant|humanoid|monstrosity|ooze|plant|undead/i;
  const typeLine=raw.split('\n').find(line=>TYPE_RE.test(line))||'';
  const type=typeLine.match(TYPE_RE)?.[0]||'monstrosity';
  const ac=Number(grab(/Armor Class\s*:?\s*(\d+)/i));
  const hp=grab(/Hit Points\s*:?\s*([0-9]+\s*(?:\([^)]*\))?)/i)||'';
  const speedLine=grab(/Speed\s*:?\s*([^\n]+)/i)||'';
  const cr=grab(/Challenge\s*:?\s*([0-9]+(?:\/[0-9]+)?)/i)||grab(/\bCR\s*([0-9]+(?:\/[0-9]+)?)/i)||'';
  const abilities={};
  const blk=raw.match(/STR[^\n]*\n[^\n]*?(\d+)\s*\([+-−]?\d+\)\s*(\d+)\s*\([+-−]?\d+\)\s*(\d+)\s*\([+-−]?\d+\)\s*(\d+)\s*\([+-−]?\d+\)\s*(\d+)\s*\([+-−]?\d+\)\s*(\d+)\s*\([+-−]?\d+\)/i);
  if(blk)['str','dex','con','int','wis','cha'].forEach((k,i)=>abilities[k]=Number(blk[i+1]));
  else{
    for(const k of ['str','dex','con','int','wis','cha']){
      const m=raw.match(new RegExp(`\\b${k}\\b[^0-9]*(\\d{1,2})`,'i'));if(m)abilities[k]=Number(m[1]);
    }
  }
  const actionsIdx=raw.search(/\n\s*Actions\s*\n/i);
  const traitsText=actionsIdx>0?raw.slice(raw.search(/Challenge[^\n]*\n/i)>0?raw.search(/Challenge[^\n]*\n/i):0):raw;
  return {
    name,cr,abilities,ac:Number.isFinite(ac)?ac:null,hp,
    speed:parseSpeedString(speedLine),
    type,
    resistances:grab(/Damage Resistances\s*:?\s*([^\n]+)/i)||'',
    immunities:grab(/Damage Immunities\s*:?\s*([^\n]+)/i)||'',
    senses:grab(/Senses\s*:?\s*([^\n]+)/i)||'',
    legendary:/legendary (actions?|resistance)/i.test(raw),
    multiattack:/multiattack/i.test(raw),
    text:traitsText.trim()
  };
}

/** Aceita JSON (objeto ou string) ou texto de statblock e devolve o bloco normalizado. */
const CAP=/^[A-Z]/;
const num=v=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null;};
const grab5e=(json,...keys)=>{for(const k of keys)if(json[k]!=null&&json[k]!=='')return json[k];return null;};

/** Normaliza o JSON exportado do 5e.tools / statblock5e (chaves "Armor Class", "STR", "Challenge"...). */
export function normalize5eTools(json){
  if(!json||typeof json!=='object')return null;
  const ab={};
  for(const key of ABILITIES){
    const v=grab5e(json,key.toUpperCase(),key.toUpperCase()+'_score',DND_KEY[key]);
    if(v!=null&&v!=='')ab[key]=Number(v);
  }
  if(!Object.keys(ab).length)return null;
  const meta=String(grab5e(json,'meta','Meta','size_type_alignment')||'');
  const parts=t=>t?String(t).replace(/<[^>]*>/g,' ').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim():'';
  return {
    name:grab5e(json,'name','Name'),
    cr:String(grab5e(json,'Challenge','challenge_rating','CR','cr')||'').split(/[\s(]/)[0],
    abilities:ab,
    ac:num(grab5e(json,'Armor Class','armor_class','AC','ac')),
    hp:String(grab5e(json,'Hit Points','hit_points','HP','hp')||''),
    speed:parseSpeedString(grab5e(json,'Speed','speed')),
    type:meta||grab5e(json,'type','Type'),
    resistances:parts([grab5e(json,'Damage Resistances','damage_resistances'),grab5e(json,'Condition Immunities','condition_immunities')].filter(Boolean).join('; ')),
    immunities:parts(grab5e(json,'Damage Immunities','damage_immunities')),
    senses:parts(grab5e(json,'Senses','senses')),
    legendary:Boolean(grab5e(json,'Legendary Actions','legendary_actions')),
    multiattack:/multiattack/i.test(parts(grab5e(json,'Actions','actions'))),
    text:[grab5e(json,'Traits','traits'),grab5e(json,'Actions','actions'),grab5e(json,'Legendary Actions','legendary_actions'),grab5e(json,'Reactions','reactions')].map(parts).filter(Boolean).join('\n\n'),
    img:grab5e(json,'img_url','image','img','token_url')||''
  };
}

export function tryParseJson(str){
  try{return JSON.parse(str);}catch{}
  // remove vírgulas sobrando antes de } ou ] (erro comum ao copiar do 5e.tools),
  // comentários // e /* */, e BOM/again cerca de crase
  let s=String(str).replace(/^﻿/,'').trim()
    .replace(/^```(?:json)?/i,'').replace(/```$/,'')
    .replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/[^\n\r]*/g,'$1')
    .trim().replace(/,\s*$/,'');
  const declutter=x=>x.replace(/,(\s*[}\]])/g,'$1');
  const tries=[s,declutter(s),declutter(s)+']',declutter(s)+'}',declutter('['+s+']'),declutter('['+s.replace(/,\s*$/,'')+']')];
  for(const t of tries){try{return JSON.parse(t);}catch{}}
  return undefined;
}

function normalizeOneJson(obj){
  if(!obj||typeof obj!=='object')return null;
  // 5e.tools tem chaves capitalizadas com espaço; Open5e tem snake_case.
  const is5eTools='STR' in obj||'Armor Class' in obj||'Challenge' in obj||'Hit Points' in obj;
  return is5eTools?normalize5eTools(obj):normalizeOpen5e(obj);
}
export function normalizeMonsterInput(input){
  if(input&&typeof input==='object'&&!Array.isArray(input))return normalizeOneJson(input);
  const list=normalizeMonsterList(input);
  return list[0]??null;
}
/** Aceita 1 objeto, uma lista [ ... ] inteira, ou texto de statblock. Devolve array normalizado. */
export function normalizeMonsterList(input){
  let json=input&&typeof input==='object'?input:null;
  if(!json){
    const str=String(input||'').trim();
    if(!str)return [];
    const bare=str.replace(/^﻿/,'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    if(bare.startsWith('{')||bare.startsWith('['))json=tryParseJson(str);
    if(json===undefined)return [];
    if(!json){const one=parseStatblock(str);return one?[one]:[];}
  }
  const arr=Array.isArray(json)?json:(Array.isArray(json?.monsters)?json.monsters:[json]);
  return arr.map(normalizeOneJson).filter(mob=>mob&&mob.name);
}
