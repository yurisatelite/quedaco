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

// Tamanho de D&D → chave de `system.size` (conferido contra `actorSizes` do sistema:
// tiny/sm/med/lg/huge/grg). Ao criar o Actor, o próprio Skyfall ajusta o token pelo
// tamanho (`_preCreate`); o conversor só precisa acertar `system.size`.
const SIZE_MAP={tiny:'tiny',small:'sm',medium:'med',large:'lg',huge:'huge',gargantuan:'grg'};
export function skyfallSize(text){
  const word=String(text||'').trim().toLowerCase().match(/^(tiny|small|medium|large|huge|gargantuan)\b/)?.[1];
  return word?SIZE_MAP[word]:'';
}

// Perícias do Skyfall não espelham as de D&D 1 a 1 — é uma aproximação nossa
// (não vem de nenhum guia), documentada em docs/T24-MONSTROS-COMPLETOS.md.
const SKILL_MAP={
  'acrobatics':'fitn','athletics':'fitn','animal handling':'natu','arcana':'arca',
  'deception':'rogu','history':'cult','insight':'insi','intimidation':'inti',
  'investigation':'perc','medicine':'medi','nature':'natu','perception':'perc',
  'performance':'pres','persuasion':'dipl','religion':'doct','sleight of hand':'mani',
  'stealth':'stea','survival':'natu'
};
const DND_SKILLS=Object.keys(SKILL_MAP);
// Só os idiomas de D&D com equivalente direto no Skyfall; os demais ficam de fora
// (o texto original, com a lista completa, continua na biografia).
const LANGUAGE_MAP={common:'common',elvish:'elvish',elven:'elvish',draconic:'draconic',celestial:'celestial',abyssal:'abyssal'};
// Condições de D&D citadas em Resistências/Imunidades/Vulnerabilidades — os
// identificadores batem com os status padrão do Foundry (ingleses, sem tradução).
const CONDITIONS=['blinded','charmed','deafened','exhaustion','frightened','grappled','incapacitated','invisible','paralyzed','petrified','poisoned','prone','restrained','stunned','unconscious'];

function wordsIn(text,list){
  const low=String(text||'').toLowerCase();
  return list.filter(word=>new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(low));
}
/** "CON +6, INT +8, WIS +6", "Dex +2, Con +6" ou "strength, wisdom" → ['con','int','wis']. */
export function parseSavingThrows(text){
  const abbr=wordsIn(text,ABILITIES);
  const full=wordsIn(text,Object.values(DND_KEY)).map(name=>ABILITIES[Object.values(DND_KEY).indexOf(name)]);
  return [...new Set([...abbr,...full])];
}
/** Aceita string ("Stealth +6, Survival +2") ou objeto ({stealth:6}) e devolve chaves do Skyfall. */
export function parseMonsterSkills(input){
  if(!input)return [];
  const names=typeof input==='object'?Object.keys(input).map(k=>k.replace(/_/g,' ')):DND_SKILLS.filter(name=>wordsIn(input,[name]).length);
  return [...new Set(names.map(n=>SKILL_MAP[n.toLowerCase().trim()]).filter(Boolean))];
}
/** "Common, Giant" → ['common']; o resto (sem equivalente) fica só no texto original. */
export function parseMonsterLanguages(text){
  return [...new Set(String(text||'').split(',').map(s=>s.trim().toLowerCase()).map(s=>LANGUAGE_MAP[s]).filter(Boolean))];
}
export function parseConditionList(text){return wordsIn(text,CONDITIONS);}
export function parseDamageTypeList(text){return wordsIn(text,Object.keys(DAMAGE_TYPE_MAP)).map(k=>DAMAGE_TYPE_MAP[k]);}

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

// Tipos de dano do Skyfall (vistos em system.modifiers.damage.taken de uma ficha
// nativa) — D&D usa quase os mesmos nomes; "force" não existe no Skyfall, vira "energy".
const DAMAGE_TYPE_MAP={acid:'acid',bludgeoning:'bludgeoning',cold:'cold',fire:'fire',force:'energy',lightning:'lightning',necrotic:'necrotic',piercing:'piercing',poison:'poison',psychic:'psychic',radiant:'radiant',slashing:'slashing',thunder:'thunder'};
function randomKey(len=16){const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';let out='';for(let i=0;i<len;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
/** Lê ataques do texto de Ações do D&D ("Nome. Melee Weapon Attack: +X to hit ... Hit: N (dado) tipo damage."). */
export function parseAttacksFromText(text){
  const raw=String(text||'').replace(/<[^>]*>/g,' ');
  // "reach/range N ft." vem logo depois de "to hit,". Antes o grupo era opcional atrás
  // de um "[\s\S]*?" preguiçoso, que sempre casava vazio — reach e range nunca eram lidos
  // (Estrela da Manhã do Gigante das Nuvens ficava com 1,5 m em vez dos 3 m da ficha).
  const re=/([A-Z][A-Za-z' -]{1,40}?)\.\s*(Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)?\s*Attack:?\s*\+?-?\d+\s*to\s*hit,?\s*(?:reach|range)\s*([\d/]+)\s*ft\.?[\s\S]*?Hit:\s*(\d+)\s*\([^)]*\)\s*([a-z]+)\s*damage/gi;
  const out=[];let m;
  while((m=re.exec(raw))){
    const [,name,kind,rangeFt,avg,type]=m;
    out.push({name:name.trim(),ranged:/ranged/i.test(kind),rangeFt:rangeFt?Number(rangeFt.split('/')[0]):null,damage:Math.max(1,Number(avg)||1),damageType:DAMAGE_TYPE_MAP[type.toLowerCase()]||'mundane'});
  }
  return out;
}
/** Monta um Item `ability` de ataque no molde exato de uma ficha nativa do Skyfall
 * (dano fixo, rolagem de ataque = atributo + proficiência — sem dado de dano). */
export function buildAttackItem(atk){
  const ability=atk.ranged?'dex':'str';
  // Alcance vale para os dois: corpo a corpo tem "reach" (normalmente 1,5 m; criaturas
  // grandes chegam a 3 m), à distância tem "range". Antes só o à distância lia rangeFt.
  const range=atk.rangeFt?feetToMeters(atk.rangeFt)||(atk.ranged?6:1.5):(atk.ranged?6:1.5);
  const hitText=`<p><strong>Acerto:</strong> ${atk.damage} pontos de dano &amp;Reference[${atk.damageType}].</p>`;
  return {
    name:`${atk.name} (Ataque ${atk.ranged?'à Distância':'Corpo a Corpo'})`,
    type:'ability',
    img:atk.ranged?'icons/weapons/bows/shortbow-leather.webp':'icons/weapons/swords/sword-guard-worn-brown.webp',
    system:{
      description:{value:hitText,flavor:''},
      origin:[''],
      descriptors:['attack','weapon',atk.damageType],
      activation:{type:'action',cost:null,repeatable:false,recharge:null},
      trigger:{descriptive:''},
      duration:{descriptive:'',value:null,units:'',event:'',concentration:false},
      target:{descriptive:'',type:'creature',quantity:1,shape:'',length:null,width:null,units:'m'},
      range:{descriptive:'',value:range,units:'m'},
      attack:{descriptive:'',hit:hitText,miss:'',type:null,ability,protection:ability,damage:String(atk.damage)},
      effect:{descriptive:'',damage:''},
      special:{descriptive:''},
      uses:{value:null,max:null,per:null,recovery:''},
      consume:{type:'',target:null,amount:null,scale:false},
      rolls:{
        [randomKey()]:{label:'Ataque',type:'attack',protection:ability,terms:[{expression:`@${ability}`,flavor:'',data:'',source:''},{expression:'@proficiency',flavor:'',data:'',source:''}]},
        [randomKey()]:{label:'Dano',type:'damage',terms:[{expression:String(atk.damage),flavor:'',data:'',source:''}],protection:'str'}
      },
      identifier:'',
      wip:{rolls:{},description:''}
    }
  };
}

/** Item `ability` passivo (traço, sem ataque nem rolagem) — molde da Constructo/Bruto nativas. */
export function buildPassiveItem(name,descriptionHtml,{activation='passive'}={}){
  return {
    name,type:'ability',
    img:'icons/svg/aura.svg',
    system:{
      description:{value:descriptionHtml,flavor:''},
      origin:[''],descriptors:[],
      activation:{type:activation,cost:null,repeatable:false,recharge:null},
      trigger:{descriptive:''},
      duration:{descriptive:'',value:null,units:'',event:'',concentration:false},
      target:{descriptive:'',type:'',quantity:null,shape:'',length:null,width:null,units:'m'},
      range:{descriptive:'',value:null,units:''},
      attack:{descriptive:'',hit:'',miss:'',type:null,ability:'',protection:'',damage:''},
      effect:{descriptive:descriptionHtml,damage:''},
      special:{descriptive:''},
      uses:{value:null,max:null,per:null,recovery:''},
      consume:{type:'',target:null,amount:null,scale:false},
      identifier:'',rolls:{},
      wip:{rolls:{},description:''}
    },
    effects:[]
  };
}

/** "Nome. Descrição." → blocos separados por parágrafo em branco (Open5e já entrega assim,
 * um `special_ability`/`action` por bloco). Não tenta separar traços colados numa linha só
 * (5e.tools às vezes junta tudo — esses ficam só na biografia, como já estava). */
export function parseTraitBlocks(text,{skipNames=[]}={}){
  const raw=String(text||'').replace(/<[^>]*>/g,' ').trim();
  if(!raw)return [];
  const skip=new Set(['actions','legendary actions','reactions','bonus actions',...skipNames.map(n=>n.toLowerCase())]);
  const out=[];
  for(const block of raw.split(/\n{2,}/)){
    const m=block.trim().match(/^([A-Z][A-Za-z' -]{2,60}?)\.\s+([\s\S]+)$/);
    if(!m)continue;
    const [,name,desc]=m;
    if(skip.has(name.trim().toLowerCase()))continue;
    if(/weapon attack:|spell attack:/i.test(desc))continue; // isso é ataque, não traço
    out.push({name:name.trim(),description:desc.trim().replace(/\s+/g,' ')});
  }
  return out;
}

/** Ataque Múltiplo, no molde da Víbora sorrateira do livro: um item de ação citando os
 * ataques que a criatura de fato tem (depois da redução de 1 do guia — ver rdForArchetype). */
export function buildMultiattackItem(mob,attackNames){
  const grab=String(mob.text||'').match(/Multiattack\.\s*([^.]+\.)/i)?.[1]?.trim();
  const desc=grab||`A criatura realiza ${Math.max(1,attackNames.length)} ataque(s): ${attackNames.join(', ')||'ver Itens de ataque'}.`;
  return buildPassiveItem('Ataque Múltiplo',`<p><b>Efeito:</b> ${desc}</p>`,{activation:'action'});
}

/** "Innate Spellcasting... At will: a, b 3/day each: c 1/day each: d" → um item por
 * frequência (à vontade / X por dia), com uses.max/per pros limitados. As magias ficam
 * listadas pelo nome de D&D — o mestre troca pelo equivalente do compêndio se houver. */
export function parseInnateSpellcasting(text){
  const m=String(text||'').match(/Innate Spellcasting\.([\s\S]*?)(?:\n\n|$)/i);
  if(!m)return [];
  const body=m[1];
  const groups=[];
  const atWill=body.match(/at will:\s*([^.]+)\./i);
  if(atWill)groups.push({label:'à vontade',max:null,per:null,spells:atWill[1].split(',').map(s=>s.trim()).filter(Boolean)});
  const perDay=[...body.matchAll(/(\d+)\/day(?: each)?:\s*([^.]+)\./gi)];
  for(const [,n,list] of perDay){
    groups.push({label:`${n}/dia`,max:Number(n),per:'day',spells:list.split(',').map(s=>s.trim()).filter(Boolean)});
  }
  return groups;
}
export function buildSpellcastingItem(group){
  const lista=group.spells.join(', ');
  const desc=`<p><b>Efeito:</b> Magia inata (${group.label}): ${lista}. Nomes de D&amp;D — troque pelo equivalente do compêndio de magias quando houver, ou descreva o efeito.</p>`;
  const item=buildPassiveItem(`Magia Inata (${group.label})`,desc,{activation:'action'});
  if(group.max)item.system.uses={value:group.max,max:group.max,per:group.per,recovery:''};
  return item;
}

export function guessHierarchy(mob){
  if(mob.legendary||/legendary (actions?|resistance)/i.test(mob.text||''))return 'boss';
  if(mob.multiattack||/multiattack/i.test(mob.text||'')||parseCr(mob.cr)>=5)return 'complex';
  return 'simple';
}
export function guessArchetype(mob){
  const text=`${mob.text||''}`.toLowerCase();
  if(/pack tactics|swarm|in a group/.test(text))return 'group';
  // Um arremesso não faz de ninguém "Atirador": só conta como ranged quando a criatura
  // não tem ataque corpo a corpo, ou quando os ataques à distância são maioria.
  const attacks=parseAttacksFromText(mob.text);
  const melee=attacks.filter(a=>!a.ranged).length,ranged=attacks.filter(a=>a.ranged).length;
  const rangedWord=/\b(ranged|longbow|shortbow|crossbow|bolt|javelin|breath weapon|hurl|sling)\b/.test(text);
  if(rangedWord&&(melee===0||ranged>melee))return 'ranged';
  if(/\b(commander|rally|leader|inspiring|marshal)\b/.test(text))return 'leader';
  if(/\b(mount|rider|steed)\b/.test(text))return 'mount';
  if(guessHierarchy(mob)==='boss'||(Number(mob.ac)||0)>=18)return 'sentinel';
  if(/\bguard|protect|sentinel|bodyguard\b/.test(text))return 'defender';
  return 'brute';
}

function buildBiography(mob,nd,{tier,archetype,dr,prof,trained,hpSource,attacksFound,savingThrowsExplicit}){
  const lines=[];
  lines.push(`<p><em>Convertido de D&amp;D 5e${mob.cr!=null&&mob.cr!==''?` — CR ${mob.cr}`:''} → ND ${nd}, seguindo o guia do Movimento RPG.</em></p>`);
  lines.push(`<p><strong>PV:</strong> ${hpSource==='dice'?'máximo dos dados de vida da ficha 5e':'estimado — sem dados de vida no JSON, revise'}. <strong>RD ${dr}</strong> pela faixa de ${tier==='boss'?'chefão':'ameaça'}/arquétipo (${archetype}) — não é derivado da CA; ajuste conforme o papel da criatura na cena.</p>`);
  lines.push(`<p><strong>Proteções treinadas</strong> (10 + atributo + proficiência ${prof}): ${trained.map(k=>k.toUpperCase()).join(' e ')}${savingThrowsExplicit?' — pelos testes de resistência da ficha original':' — pelos dois atributos mais altos (a ficha não listava testes de resistência)'}. Se a Proteção de DES ficar bem abaixo da CA original, considere uma passiva "Armadura Natural" somando a diferença.</p>`);
  if(tier==='boss')lines.push('<p><strong>Chefão:</strong> adicione as passivas "Chefão" (3 iniciativas dividindo o deslocamento) e "Resistência do Chefe" (encerra uma condição no fim do turno) e a ação bônus "Deslocar-se". Ações lendárias de 1–2 ações viram ações normais; as de 3 ações viram habilidade de recarga. Se a criatura tinha ações lendárias, mantenha o nº de ataques; senão, reduza o multiataque em 1 (mín. 1). Habilidades de recarga em área: +2 dados (ou +1 categoria de dado); ataques em área comuns: +1 dado.</p>');
  else lines.push('<p><strong>Ataques:</strong> reduza o nº de multiataques em 1 (mínimo 1 por turno).</p>');
  lines.push(`<p><strong>Itens de ataque:</strong> ${attacksFound?'lidos do texto original (nome, alcance, dano e tipo)':'nenhum ataque reconhecido no texto — foi criado 1 ataque genérico'}. Dano fixo, sem dado — a rolagem de ataque usa atributo + proficiência, como nas fichas nativas do Skyfall. Confira alcance, tipo de dano e nome.</p>`);
  if(mob.ac)lines.push(`<p><strong>CA original (5e):</strong> ${mob.ac}</p>`);
  if(mob.hp)lines.push(`<p><strong>PV original (5e):</strong> ${mob.hp}</p>`);
  if(mob.resistances)lines.push(`<p><strong>Resistências:</strong> ${mob.resistances}</p>`);
  if(mob.immunities)lines.push(`<p><strong>Imunidades:</strong> ${mob.immunities}</p>`);
  if(mob.senses)lines.push(`<p><strong>Sentidos:</strong> ${mob.senses}</p>`);
  if(mob.languages)lines.push(`<p><strong>Idiomas (original):</strong> ${mob.languages}. Os que existem no Skyfall já foram marcados na ficha; o resto fica só aqui de referência.</p>`);
  if(mob.img)lines.push(`<p><strong>Imagem:</strong> a arte de referência do JSON virou o retrato — geralmente vem com fundo próprio (não recortado), então serve pra identificar mas não fica boa como token. O token nasce com o ícone padrão; troque por um pacote de tokens de verdade se quiser um pra mesa.</p>`);
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
  // Testes de resistência listados na ficha mandam; sem lista, treina os DOIS atributos
  // mais altos (empate no 2º lugar = todos os empatados) — só um palpite razoável.
  const savingThrows=parseSavingThrows(mob.savingThrows);
  let trained;
  if(savingThrows.length){
    trained=savingThrows;
  }else{
    const sortedValues=[...ABILITIES.map(k=>abilities[k].value)].sort((a,b)=>b-a);
    const threshold=sortedValues[1]??sortedValues[0];
    trained=ABILITIES.filter(k=>abilities[k].value>=threshold);
  }
  for(const k of trained)abilities[k].proficient=true;
  const prof=(mob.cr!=null&&mob.cr!=='')?dndProficiencyForCr(mob.cr):proficiencyForNd(nd);
  // PV = máximo dos dados de vida (não média, não fórmula própria)
  const diceMax=parseHitDice(mob.hitDice)??parseHitDice(mob.hp);
  const hp=diceMax??Math.max(10,Math.round(nd*8+10));
  const dr=rdForArchetype(tier,archetype,nd);
  const speed=mob.speed||{};
  const parsedAttacks=parseAttacksFromText(mob.text).slice(0,4);
  const attacksFound=parsedAttacks.length>0;
  const fallbackDamage=Math.max(2,Math.round(3+nd*1.5));
  const attackItems=(attacksFound?parsedAttacks:[{name:'Ataque',ranged:archetype==='ranged',rangeFt:archetype==='ranged'?60:null,damage:fallbackDamage,damageType:'mundane'}]).map(buildAttackItem);
  // Ataque Múltiplo, traços e magia inata viram Itens de verdade, não só texto na bio
  // (T24, passo 4) — a redução de 1 ataque do guia continua só anotada na bio: é uma
  // decisão de mesa (qual ataque tirar), não algo pra escolher sozinho.
  const multiattackItems=(mob.multiattack||/multiattack/i.test(mob.text||''))?[buildMultiattackItem(mob,parsedAttacks.map(a=>a.name))]:[];
  const traitItems=parseTraitBlocks(mob.text,{skipNames:['multiattack','innate spellcasting']}).map(t=>buildPassiveItem(t.name,`<p><b>Efeito:</b> ${t.description}</p>`));
  const spellItems=parseInnateSpellcasting(mob.text).map(buildSpellcastingItem);
  const skillKeys=parseMonsterSkills(mob.skills);
  const skills={};
  for(const key of skillKeys)skills[key]={value:1};
  const languages=parseMonsterLanguages(mob.languages);
  const size=skyfallSize(mob.size)||undefined;
  const dmgTaken={};
  for(const key of parseDamageTypeList(mob.dmgResistances))dmgTaken[key]='resistance';
  for(const key of parseDamageTypeList(mob.dmgImmunities))dmgTaken[key]='imunity';
  for(const key of parseDamageTypeList(mob.dmgVulnerabilities))dmgTaken[key]='vulnerability';
  const conditionImmune=parseConditionList(mob.conditionImmunities);
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
      ...(size?{size}:{}),
      ...(skillKeys.length?{skills}:{}),
      ...(languages.length?{languages}:{}),
      ...((Object.keys(dmgTaken).length||conditionImmune.length)?{modifiers:{damage:{taken:dmgTaken},condition:{imune:conditionImmune}}}:{}),
      biography:buildBiography(mob,nd,{tier,archetype,dr,prof,trained,hpSource:diceMax!=null?'dice':'estimado',attacksFound,savingThrowsExplicit:savingThrows.length>0})
    },
    items:[...traitItems,...spellItems,...multiattackItems,...attackItems],
    flags:{quedaco:{convertedFrom:mob.source==='homebrew'?'homebrew':'dnd5e',sourceCr:String(mob.cr??''),sourceName:String(mob.name||'')}}
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
    size:typeof json.size==='string'?json.size:'',
    resistances:[json.damage_resistances,json.condition_immunities].filter(Boolean).join('; ')||'',
    immunities:json.damage_immunities||'',
    dmgResistances:json.damage_resistances||'',
    dmgImmunities:json.damage_immunities||'',
    dmgVulnerabilities:json.damage_vulnerabilities||'',
    conditionImmunities:json.condition_immunities||'',
    savingThrows:['strength_save','dexterity_save','constitution_save','intelligence_save','wisdom_save','charisma_save'].filter(k=>json[k]!=null).map(k=>k.replace('_save','')).join(', '),
    skills:json.skills||'',
    languages:typeof json.languages==='string'?json.languages:'',
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
  const sizeLine=raw.split('\n').map(l=>l.trim()).filter(Boolean)[1]||'';
  return {
    name,cr,abilities,ac:Number.isFinite(ac)?ac:null,hp,
    speed:parseSpeedString(speedLine),
    type,size:sizeLine,
    resistances:grab(/Damage Resistances\s*:?\s*([^\n]+)/i)||'',
    immunities:grab(/Damage Immunities\s*:?\s*([^\n]+)/i)||'',
    dmgResistances:grab(/Damage Resistances\s*:?\s*([^\n]+)/i)||'',
    dmgImmunities:grab(/Damage Immunities\s*:?\s*([^\n]+)/i)||'',
    dmgVulnerabilities:grab(/Damage Vulnerabilities\s*:?\s*([^\n]+)/i)||'',
    conditionImmunities:grab(/Condition Immunities\s*:?\s*([^\n]+)/i)||'',
    savingThrows:grab(/Saving Throws\s*:?\s*([^\n]+)/i)||'',
    skills:grab(/Skills\s*:?\s*([^\n]+)/i)||'',
    languages:grab(/Languages\s*:?\s*([^\n]+)/i)||'',
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
    size:meta||grab5e(json,'size','Size'),
    resistances:parts([grab5e(json,'Damage Resistances','damage_resistances'),grab5e(json,'Condition Immunities','condition_immunities')].filter(Boolean).join('; ')),
    immunities:parts(grab5e(json,'Damage Immunities','damage_immunities')),
    dmgResistances:parts(grab5e(json,'Damage Resistances','damage_resistances')),
    dmgImmunities:parts(grab5e(json,'Damage Immunities','damage_immunities')),
    dmgVulnerabilities:parts(grab5e(json,'Damage Vulnerabilities','damage_vulnerabilities')),
    conditionImmunities:parts(grab5e(json,'Condition Immunities','condition_immunities')),
    savingThrows:parts(grab5e(json,'Saving Throws','saving_throws')),
    skills:parts(grab5e(json,'Skills','skills')),
    languages:parts(grab5e(json,'Languages','languages')),
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
  const mob=is5eTools?normalize5eTools(obj):normalizeOpen5e(obj);
  // "source":"homebrew" no JSON colado marca a criatura como personalizada da mesa, não D&D 5e.
  if(mob&&obj.source==='homebrew')mob.source='homebrew';
  return mob;
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
