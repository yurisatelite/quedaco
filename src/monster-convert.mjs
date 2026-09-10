// T34/T8 — converte um bloco de criatura de D&D 5e num Actor `npc` do Skyfall.
// Skyfall vai até ND 12 (equivale a ~CR 20 / nível 20 de D&D). A conversão é uma
// aproximação: atributos e movimento saem certos; PV, RD e ataques são estimados
// e ficam anotados na biografia para o mestre ajustar na ficha.

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

function buildBiography(mob,nd){
  const lines=[];
  lines.push(`<p><em>Convertido de D&amp;D 5e${mob.cr!=null&&mob.cr!==''?` — CR ${mob.cr}`:''} → ND ${nd}.</em> Revise PV, RD, deslocamento e ataques.</p>`);
  if(mob.ac)lines.push(`<p><strong>CA original:</strong> ${mob.ac}</p>`);
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
  const conMod=abilities.con.value;
  let hp=Math.round(nd*(9+conMod)+10);
  if(tier==='boss')hp=Math.round(hp*1.6);
  else if(tier==='complex')hp=Math.round(hp*1.15);
  hp=Math.max(10,hp);
  const dr=Math.max(0,Math.min(8,Math.round(((Number(mob.ac)||12)-12)/2)));
  const speed=mob.speed||{};
  return {
    name:String(mob.name||'Criatura convertida').trim(),
    type:'npc',
    system:{
      abilities,
      level:{value:nd},
      proficiency:proficiencyForNd(nd),
      resources:{hp:{value:hp,max:hp,temp:0},shadow:{value:5}},
      movement:{
        walk:feetToMeters(speed.walk??30)||9,
        swim:feetToMeters(speed.swim),
        burrow:feetToMeters(speed.burrow),
        flight:feetToMeters(speed.fly??speed.flight)
      },
      creatureType:skyfallCreatureType(mob.type),
      hierarchy:tier,
      archetype:[guessArchetype(mob)],
      dr,
      biography:buildBiography(mob,nd)
    },
    flags:{quedaco:{convertedFrom:'dnd5e',sourceCr:String(mob.cr??''),sourceName:String(mob.name||'')}}
  };
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
export function normalizeMonsterInput(input){
  if(input&&typeof input==='object')return normalizeOpen5e(input);
  const str=String(input||'').trim();
  if(!str)return null;
  if(str.startsWith('{')||str.startsWith('[')){
    try{const json=JSON.parse(str);return normalizeOpen5e(Array.isArray(json)?json[0]:json);}catch{/* cai no parser de texto */}
  }
  return parseStatblock(str);
}
