import test from 'node:test';
import assert from 'node:assert/strict';
import {crToNd,abilityMod,feetToMeters,skyfallCreatureType,parseCr,guessHierarchy,guessArchetype,toSkyfallNpc,normalizeOpen5e,parseStatblock,normalizeMonsterInput,parseHitDice,dndProficiencyForCr,rdForArchetype,parseAttacksFromText,skyfallSize,parseSavingThrows,parseMonsterSkills,parseMonsterLanguages,parseConditionList,parseDamageTypeList,parseTraitBlocks,parseInnateSpellcasting,buildSpellcastingItem,buildMultiattackItem} from '../src/monster-convert.mjs';
import {attachCreatureRoleItems,NPC_CREATION_PACK} from '../src/adapter.mjs';

test('CR de D&D vira ND do Skyfall com teto 12',()=>{
  assert.equal(crToNd('1/4'),1);
  assert.equal(crToNd(1),1);
  assert.equal(crToNd(3),3);
  assert.equal(crToNd(5),5);
  assert.equal(crToNd(10),7);
  assert.equal(crToNd(20),12);
  assert.equal(crToNd(30),12);
  assert.equal(parseCr('1/8'),0.125);
});

test('modificador e conversão de deslocamento',()=>{
  assert.equal(abilityMod(10),0);
  assert.equal(abilityMod(18),4);
  assert.equal(abilityMod(7),-2);
  assert.equal(feetToMeters(30),9);
  assert.equal(feetToMeters(0),0);
  assert.equal(feetToMeters('40 ft.'),12);
});

test('tipo de criatura mapeia e cai em monstrosity quando desconhecido',()=>{
  assert.equal(skyfallCreatureType('Large dragon, chaotic evil'),'dragon');
  assert.equal(skyfallCreatureType('aberration'),'monstrosity');
  assert.equal(skyfallCreatureType('humanoid (any race)'),'humanoid');
  assert.equal(skyfallCreatureType('bugbear'),'monstrosity');
});

test('hierarquia e arquétipo por pistas do texto',()=>{
  assert.equal(guessHierarchy({text:'Legendary Actions'}),'boss');
  assert.equal(guessHierarchy({text:'Multiattack. The orc makes two attacks.'}),'complex');
  assert.equal(guessHierarchy({cr:1,text:'Bite. Melee attack.'}),'simple');
  assert.equal(guessArchetype({text:'Pack Tactics. The wolf has advantage.'}),'group');
  assert.equal(guessArchetype({text:'Longbow. Ranged Weapon Attack.'}),'ranged');
});

test('toSkyfallNpc monta um _source válido e escalado',()=>{
  const src=toSkyfallNpc({name:'Gigante da Colina',cr:5,abilities:{str:21,dex:8,con:19,int:5,wis:9,cha:6},ac:13,hp:'105 (10d12+40)',speed:{walk:40},type:'Huge giant',text:'Multiattack. The giant makes two greatclub attacks.'});
  assert.equal(src.type,'npc');
  assert.equal(src.name,'Gigante da Colina');
  assert.equal(src.system.level.value,5);
  assert.equal(src.system.abilities.str.value,5);
  assert.equal(src.system.abilities.con.value,4);
  assert.equal(src.system.creatureType,'giant');
  assert.equal(src.system.hierarchy,'complex');
  assert.equal(src.system.movement.walk,12);
  assert.ok(src.system.resources.hp.max>0&&src.system.resources.hp.value===src.system.resources.hp.max);
  assert.equal(src.flags.quedaco.convertedFrom,'dnd5e');
  assert.match(src.system.biography,/CR 5.*ND 5|ND 5/s);
});

test('normalizeOpen5e lê o formato da API',()=>{
  const mob=normalizeOpen5e({name:'Goblin',challenge_rating:'1/4',strength:8,dexterity:14,constitution:10,intelligence:10,wisdom:8,charisma:8,armor_class:15,hit_points:7,speed:{walk:30},type:'humanoid (goblinoid)',actions:[{name:'Scimitar',desc:'Melee Weapon Attack: +4 to hit.'}]});
  assert.equal(mob.name,'Goblin');
  assert.equal(mob.abilities.dex,14);
  assert.equal(mob.ac,15);
  const src=toSkyfallNpc(mob);
  assert.equal(src.system.level.value,1);
  assert.equal(src.system.creatureType,'humanoid');
});

test('parseStatblock extrai os campos essenciais do texto colado',()=>{
  const text=`Bugbear\nMedium humanoid (goblinoid), chaotic evil\nArmor Class 16 (hide armor, shield)\nHit Points 27 (5d8 + 5)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n15 (+2) 14 (+2) 13 (+1) 8 (-1) 11 (+0) 9 (-1)\nSkills Stealth +6, Survival +2\nSenses darkvision 60 ft.\nChallenge 1 (200 XP)\nActions\nMorningstar. Melee Weapon Attack: +4 to hit.`;
  const mob=parseStatblock(text);
  assert.equal(mob.name,'Bugbear');
  assert.equal(mob.ac,16);
  assert.equal(mob.abilities.str,15);
  assert.equal(mob.abilities.cha,9);
  assert.equal(mob.cr,'1');
  assert.equal(mob.type,'humanoid');
  const src=toSkyfallNpc(mob);
  assert.equal(src.system.level.value,1);
  assert.equal(src.system.abilities.str.value,2);
});

test('normalizeMonsterInput aceita JSON string ou texto',()=>{
  assert.equal(normalizeMonsterInput('{"name":"Ogre","challenge_rating":2,"strength":19}').name,'Ogre');
  assert.equal(normalizeMonsterInput('Ogre\nLarge giant\nArmor Class 11\nChallenge 2').name,'Ogre');
  assert.equal(normalizeMonsterInput(''),null);
});

test('normaliza JSON do 5e.tools (chaves "Armor Class", "STR", "Challenge")',()=>{
  const j={name:'Aboleth',meta:'Large aberration','Armor Class':'17 (Natural Armor)','Hit Points':'135 (18d10+36)',Speed:'10 ft., swim 40 ft.',STR:'21',DEX:'9',CON:'15',INT:'18',WIS:'15',CHA:'18',Challenge:'10 (5,900 XP)',Actions:'<p>Multiattack.</p>','Legendary Actions':'<p>x</p>',img_url:'https://a/b.jpg'};
  const m=normalizeMonsterInput(j);
  assert.equal(m.name,'Aboleth');
  assert.equal(m.ac,17);
  assert.equal(m.cr,'10');
  assert.equal(m.abilities.str,21);
  assert.equal(m.legendary,true);
  assert.equal(m.img,'https://a/b.jpg');
  const src=toSkyfallNpc(m);
  assert.equal(src.system.level.value,7);
  assert.equal(src.system.creatureType,'monstrosity');
  assert.equal(src.system.hierarchy,'boss');
  assert.equal(src.system.movement.swim,12);
  assert.equal(src.img,'https://a/b.jpg');
});

test('recupera JSON colado sem fechar o colchete / com vírgula solta',()=>{
  const raw='[\n  {"name":"Ogre","STR":"19","DEX":"8","CON":"16","INT":"5","WIS":"7","CHA":"7","Armor Class":"11","Challenge":"2"},\n';
  const m=normalizeMonsterInput(raw);
  assert.equal(m?.name,'Ogre');
  assert.equal(m.abilities.str,19);
});

test('PV usa o máximo dos dados de vida (guia do Movimento RPG), não uma fórmula própria',()=>{
  assert.equal(parseHitDice('18d10 + 36'),216);
  assert.equal(parseHitDice('7d8+21'),77);
  assert.equal(parseHitDice('sem dados aqui'),null);
});

test('bônus de proficiência segue a tabela de CR de D&D',()=>{
  assert.equal(dndProficiencyForCr(2),2);
  assert.equal(dndProficiencyForCr(5),3);
  assert.equal(dndProficiencyForCr(10),4);
  assert.equal(dndProficiencyForCr(17),6);
  assert.equal(dndProficiencyForCr(30),9);
});

test('RD vem da faixa de arquétipo/chefão do guia, não da CA',()=>{
  assert.equal(rdForArchetype('complex','group',2),1);
  assert.equal(rdForArchetype('complex','brute',2),3);
  assert.equal(rdForArchetype('complex','defender',2),4);
  assert.equal(rdForArchetype('boss','brute',5),4);
  assert.equal(rdForArchetype('boss','defender',12),9);
});

test('exemplo do guia (Dragão das Cavernas): PV 77, proficiência +2, RD 3, FOR e CON treinados',()=>{
  const mob={name:'Dragão das Cavernas',cr:2,abilities:{str:18,dex:12,con:16,int:8,wis:10,cha:12},ac:16,hp:'52 (7d8 + 21)',speed:{walk:30,swim:20,fly:20},type:'dragon',text:'Multiattack. The dragon makes two attacks.'};
  const src=toSkyfallNpc(mob);
  assert.equal(src.system.resources.hp.max,77);
  assert.equal(src.system.proficiency,2);
  assert.equal(src.system.dr,3);
  assert.equal(src.system.abilities.str.proficient,true);
  assert.equal(src.system.abilities.con.proficient,true);
  assert.equal(src.system.abilities.dex.proficient,undefined);
  assert.equal(src.system.movement.walk,9);
  assert.equal(src.system.movement.swim,6);
  assert.equal(src.system.movement.flight,6);
});

test('Aboleth colado do gist (formato 5e.tools) converte de ponta a ponta',()=>{
  const raw='[ {"name":"Aboleth","meta":"Large aberration, lawful evil","Armor Class":"17 (Natural Armor)","Hit Points":"135 (18d10 + 36)","Speed":"10 ft., swim 40 ft.","STR":"21","DEX":"9","CON":"15","INT":"18","WIS":"15","CHA":"18","Saving Throws":"CON +6, INT +8, WIS +6","Challenge":"10 (5,900 XP)","Traits":"<p>x</p>","Actions":"<p>Multiattack.</p>","Legendary Actions":"<p>y</p>"}, ]';
  const mob=normalizeMonsterInput(raw);
  assert.equal(mob.name,'Aboleth');
  const src=toSkyfallNpc(mob);
  assert.equal(src.system.resources.hp.max,216);
  assert.equal(src.system.hierarchy,'boss');
  assert.ok(src.system.dr>0);
});

test('toSkyfallNpc cria Itens de ataque no molde da ficha nativa (dano fixo, sem dado)',()=>{
  const text='Multiattack. The bandit makes two melee attacks.\n\nScimitar. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage.\n\nLight Crossbow. Ranged Weapon Attack: +3 to hit, range 80/320 ft., one target. Hit: 5 (1d8 + 1) piercing damage.';
  const mob={name:'Bandido D&D',cr:'1/8',abilities:{str:11,dex:12,con:12,int:10,wis:10,cha:10},ac:12,hp:'11 (2d8 + 2)',speed:{walk:30},type:'humanoid',text};
  const src=toSkyfallNpc(mob);
  // "Multiattack." no texto agora também vira um Item de ação (T24, passo 4).
  assert.ok(src.items.some(i=>i.name==='Ataque Múltiplo'));
  const [melee,ranged]=src.items.filter(i=>i.name.includes('(Ataque'));
  assert.equal(melee.name,'Scimitar (Ataque Corpo a Corpo)');
  assert.equal(melee.type,'ability');
  assert.equal(melee.system.attack.ability,'str');
  assert.equal(melee.system.attack.damage,'4');
  assert.equal(melee.system.descriptors.includes('slashing'),true);
  assert.equal(ranged.system.attack.ability,'dex');
  assert.equal(ranged.system.attack.damage,'5');
  const rolls=Object.values(melee.system.rolls);
  assert.equal(rolls.find(r=>r.type==='attack').terms[0].expression,'@str');
  assert.equal(rolls.find(r=>r.type==='damage').terms[0].expression,'4');
});

test('sem ataque reconhecível no texto, cria 1 ataque genérico com dano fixo',()=>{
  const src=toSkyfallNpc({name:'Coisa Estranha',cr:2,abilities:{str:14,dex:14,con:14,int:8,wis:8,cha:8},ac:13,hp:'30 (4d8+12)',speed:{walk:30},type:'ooze',text:'Sem ações descritas.'});
  assert.equal(src.items.length,1);
  assert.match(src.items[0].name,/^Ataque/);
  assert.ok(Number(src.items[0].system.attack.damage)>=2);
});

test('parseAttacksFromText separa múltiplos ataques por nome, alcance e tipo de dano',()=>{
  const atks=parseAttacksFromText('Bite. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage.\n\nClaw. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 2) slashing damage.');
  assert.equal(atks.length,2);
  assert.equal(atks[0].name,'Bite');
  assert.equal(atks[0].damageType,'piercing');
  assert.equal(atks[1].name,'Claw');
  assert.equal(atks[1].damageType,'slashing');
});

test('parseAttacksFromText lê o alcance de verdade (reach do corpo a corpo, range do à distância)',()=>{
  const atks=parseAttacksFromText('Morningstar. Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage.\n\nRock. Ranged Weapon Attack: +12 to hit, range 60/240 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage.');
  assert.equal(atks[0].rangeFt,10);
  assert.equal(atks[1].rangeFt,60);
});

test('Gigante das Nuvens (SRD): caso de estudo da T24 — alcance, arquétipo, proteções, perícias, idiomas e tamanho',()=>{
  const mob={
    name:'Cloud Giant',cr:9,abilities:{str:27,dex:10,con:22,int:12,wis:16,cha:16},
    ac:14,hp:'200 (16d12 + 96)',speed:{walk:40},
    type:'Huge giant, neutral good (50%) or neutral evil (50%)',size:'Huge',
    savingThrows:'Con +10, Wis +7, Cha +7',skills:'Insight +7, Perception +7',
    senses:'passive Perception 17',languages:'Common, Giant',
    text:'Keen Smell. The giant has advantage on Wisdom (Perception) checks that rely on smell.\n\nActions\nMultiattack. The giant makes two morningstar attacks.\n\nMorningstar. Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage.\n\nRock. Ranged Weapon Attack: +12 to hit, range 60/240 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage.'
  };
  const src=toSkyfallNpc(mob);
  assert.equal(src.system.size,'huge');
  assert.equal(src.system.resources.hp.max,288);
  // Um arremesso não faz de ninguém "Atirador": tem corpo a corpo, então é Bruto.
  assert.deepEqual(src.system.archetype,['brute']);
  // A ficha lista os testes de CON/WIS/CHA — eles mandam, não os dois atributos mais altos.
  assert.deepEqual(Object.entries(src.system.abilities).filter(([,v])=>v.proficient).map(([k])=>k).sort(),['cha','con','wis']);
  assert.deepEqual(src.system.skills,{insi:{value:1},perc:{value:1}});
  assert.deepEqual(src.system.languages,['common']);
  const [melee,ranged]=src.items.filter(i=>i.name.includes('(Ataque'));
  assert.equal(melee.system.range.value,3);
  assert.equal(ranged.system.range.value,18);
  // Traço e Ataque Múltiplo agora também são Itens (T24, passo 4), não só texto.
  assert.ok(src.items.some(i=>i.name==='Keen Smell'));
  assert.ok(src.items.some(i=>i.name==='Ataque Múltiplo'));
});

test('skyfallSize mapeia o tamanho de D&D pra chave do Skyfall',()=>{
  assert.equal(skyfallSize('Huge'),'huge');
  assert.equal(skyfallSize('Large humanoid (goblinoid)'),'lg');
  assert.equal(skyfallSize('Medium giant, chaotic evil'),'med');
  assert.equal(skyfallSize(''),'');
});

test('parseSavingThrows aceita abreviação ou nome por extenso',()=>{
  assert.deepEqual(parseSavingThrows('CON +10, WIS +7, CHA +7').sort(),['cha','con','wis']);
  assert.deepEqual(parseSavingThrows('strength, wisdom').sort(),['str','wis']);
  assert.deepEqual(parseSavingThrows(''),[]);
});

test('parseMonsterSkills aceita texto ("Stealth +6") ou objeto ({perception:5})',()=>{
  assert.deepEqual(parseMonsterSkills('Stealth +6, Survival +2').sort(),['natu','stea']);
  assert.deepEqual(parseMonsterSkills({perception:5,stealth:3}).sort(),['perc','stea']);
  assert.deepEqual(parseMonsterSkills(''),[]);
});

test('parseMonsterLanguages só traz os que existem no Skyfall; o resto fica de fora',()=>{
  assert.deepEqual(parseMonsterLanguages('Common, Giant'),['common']);
  assert.deepEqual(parseMonsterLanguages('Giant, Undercommon'),[]);
});

test('parseConditionList e parseDamageTypeList lêem a lista pelo nome',()=>{
  assert.deepEqual(parseConditionList('charmed, exhaustion, frightened, paralyzed, petrified, poisoned').sort(),['charmed','exhaustion','frightened','paralyzed','petrified','poisoned']);
  assert.deepEqual(parseDamageTypeList('bludgeoning, piercing, and slashing from nonmagical attacks').sort(),['bludgeoning','piercing','slashing']);
});

test('resistências, imunidades e condição imune viram system.modifiers',()=>{
  const mob={name:'Golem de Teste',cr:5,abilities:{str:18,dex:8,con:18,int:3,wis:8,cha:3},ac:17,hp:'60 (8d10+16)',speed:{walk:30},type:'construct',
    dmgResistances:'bludgeoning, piercing, and slashing from nonmagical attacks',
    dmgImmunities:'poison, psychic',
    conditionImmunities:'charmed, exhaustion, frightened, paralyzed, petrified, poisoned',
    text:'Slam. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (2d6+3) bludgeoning damage.'};
  const src=toSkyfallNpc(mob);
  assert.equal(src.system.modifiers.damage.taken.psychic,'imunity');
  assert.equal(src.system.modifiers.damage.taken.poison,'imunity');
  assert.equal(src.system.modifiers.damage.taken.bludgeoning,'resistance');
  assert.deepEqual(src.system.modifiers.condition.imune.sort(),['charmed','exhaustion','frightened','paralyzed','petrified','poisoned']);
});

test('normalize5eTools e parseStatblock também repassam tamanho, perícias, idiomas e testes de resistência',()=>{
  const tools=normalizeOpen5e({name:'X',strength_save:6,skills:{perception:5},languages:'Common',size:'Large',damage_immunities:'poison'});
  assert.equal(tools.savingThrows,'strength');
  assert.deepEqual(tools.skills,{perception:5});
  assert.equal(tools.languages,'Common');
  assert.equal(tools.size,'Large');
  const stat=parseStatblock('Bugbear\nMedium humanoid (goblinoid), chaotic evil\nArmor Class 16\nHit Points 27 (5d8 + 5)\nSpeed 30 ft.\nSaving Throws Dex +2, Con +3\nSkills Stealth +6, Survival +2\nSenses darkvision 60 ft.\nLanguages Common, Goblin\nChallenge 1 (200 XP)\nActions\nMorningstar. Melee Weapon Attack: +4 to hit.');
  assert.equal(stat.size,'Medium humanoid (goblinoid), chaotic evil');
  assert.equal(stat.savingThrows,'Dex +2, Con +3');
  assert.equal(stat.skills,'Stealth +6, Survival +2');
  assert.equal(stat.languages,'Common, Goblin');
});

test('parseTraitBlocks lê "Nome. Descrição." por parágrafo e pula ataque, Multiattack e Innate Spellcasting',()=>{
  const text=[
    'Keen Smell. The giant has advantage on Wisdom (Perception) checks that rely on smell.',
    'Innate Spellcasting. The giant can cast spells.',
    'Multiattack. The giant makes two attacks.',
    'Actions',
    'Morningstar. Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage.'
  ].join('\n\n');
  const traits=parseTraitBlocks(text,{skipNames:['multiattack','innate spellcasting']});
  assert.deepEqual(traits.map(t=>t.name),['Keen Smell']);
  assert.match(traits[0].description,/advantage on Wisdom/);
});

test('parseTraitBlocks não confunde uma frase qualquer com um traço (sem texto depois do ponto final)',()=>{
  assert.deepEqual(parseTraitBlocks('Sem ações descritas.'),[]);
});

test('parseInnateSpellcasting separa por frequência (à vontade, X/dia) com a lista de magias',()=>{
  const text='Innate Spellcasting. The giant can innately cast the following spells: At will: detect magic, fog cloud, light. 3/day each: feather fall, fly, misty step, telekinesis. 1/day each: control weather, gaseous form.';
  const groups=parseInnateSpellcasting(text);
  assert.equal(groups.length,3);
  assert.deepEqual(groups[0],{label:'à vontade',max:null,per:null,spells:['detect magic','fog cloud','light']});
  assert.deepEqual(groups[1].spells,['feather fall','fly','misty step','telekinesis']);
  assert.equal(groups[1].max,3);
  assert.equal(groups[2].max,1);
});

test('parseInnateSpellcasting não perde a lista quando o Open5e bota uma linha em branco antes de "At will:" (achado rodando contra a API de verdade)',()=>{
  const text='Keen Smell. The giant has advantage.\n\nInnate Spellcasting. The giant\'s innate spellcasting ability is Charisma. It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic, fog cloud, light\n3/day each: feather fall, fly, misty step, telekinesis\n1/day each: control weather, gaseous form\n\nMultiattack. The giant makes two morningstar attacks.';
  const groups=parseInnateSpellcasting(text);
  assert.equal(groups.length,3);
  assert.deepEqual(groups[0].spells,['detect magic','fog cloud','light']);
  assert.deepEqual(groups[2].spells,['control weather','gaseous form']);
  // não pode ter engolido o próximo bloco
  assert.ok(!groups.some(g=>g.spells.some(s=>s.includes('Multiattack'))));
});

test('sem "Innate Spellcasting" no texto, não gera nenhum grupo de magia',()=>{
  assert.deepEqual(parseInnateSpellcasting('Bite. Melee Weapon Attack: +4 to hit.'),[]);
});

test('buildSpellcastingItem grava uses.max/per só nos grupos limitados; à vontade fica sem limite',()=>{
  const aVontade=buildSpellcastingItem({label:'à vontade',max:null,per:null,spells:['light']});
  assert.deepEqual(aVontade.system.uses,{value:null,max:null,per:null,recovery:''});
  const limitado=buildSpellcastingItem({label:'3/dia',max:3,per:'day',spells:['fly']});
  assert.deepEqual(limitado.system.uses,{value:3,max:3,per:'day',recovery:''});
});

test('buildMultiattackItem usa a frase original do "Multiattack." quando existe, senão lista os ataques',()=>{
  const comTexto=buildMultiattackItem({text:'Multiattack. The giant makes two morningstar attacks.'},['Morningstar']);
  assert.match(comTexto.system.description.value,/two morningstar attacks/);
  const semTexto=buildMultiattackItem({text:''},['Garra','Mordida']);
  assert.match(semTexto.system.description.value,/Garra, Mordida/);
});

test('Gigante das Nuvens (SRD): traços, magia inata e Ataque Múltiplo viram Itens (T24, passo 4)',()=>{
  const text=[
    'Keen Smell. The giant has advantage on Wisdom (Perception) checks that rely on smell.',
    "Innate Spellcasting. The giant's innate spellcasting ability is Charisma. It can innately cast the following spells, requiring no material components: At will: detect magic, fog cloud, light. 3/day each: feather fall, fly, misty step, telekinesis. 1/day each: control weather, gaseous form.",
    'Multiattack. The giant makes two morningstar attacks.',
    'Morningstar. Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage.',
    'Rock. Ranged Weapon Attack: +12 to hit, range 60/240 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage.'
  ].join('\n\n');
  const mob={name:'Cloud Giant',cr:9,abilities:{str:27,dex:10,con:22,int:12,wis:16,cha:16},ac:14,hp:'200 (16d12 + 96)',speed:{walk:40},type:'Huge giant',size:'Huge',text};
  const src=toSkyfallNpc(mob);
  assert.deepEqual(src.items.map(i=>i.name),['Keen Smell','Magia Inata (à vontade)','Magia Inata (3/dia)','Magia Inata (1/dia)','Ataque Múltiplo','Morningstar (Ataque Corpo a Corpo)','Rock (Ataque à Distância)']);
  const tresDia=src.items.find(i=>i.name==='Magia Inata (3/dia)');
  assert.deepEqual(tresDia.system.uses,{value:3,max:3,per:'day',recovery:''});
});

// ── T24, passo 5: Itens de hierarquia/arquétipo copiados do compêndio ──────────────────
function fakeItemDoc(id,data){return {_id:id,toObject:()=>({_id:id,...structuredClone(data)})};}
function fakePack(entries){
  const byId=new Map(entries.map(e=>[e._id,fakeItemDoc(e._id,e)]));
  return {getIndex:async()=>entries.map(({_id,type,system})=>({_id,type,system:{identifier:system.identifier}})),getDocument:async id=>byId.get(id)};
}
test('attachCreatureRoleItems copia o Item de hierarquia/arquétipo e os benefícios que ele concede',async()=>{
  const pack=fakePack([
    {_id:'h-boss',type:'hierarchy',name:'Chefão',system:{identifier:'boss',benefits:[{type:'ability',uuid:'Compendium.x.Item.chefao-passiva'}]}},
    {_id:'a-brute',type:'archetype',name:'Bruto',system:{identifier:'brute',benefits:[{type:'ability',uuid:'Compendium.x.Item.bruto-passiva'}]}},
  ]);
  const benefitDocs={'Compendium.x.Item.chefao-passiva':fakeItemDoc('chefao-passiva',{type:'ability',name:'Chefão'}),'Compendium.x.Item.bruto-passiva':fakeItemDoc('bruto-passiva',{type:'ability',name:'Bruto'})};
  const game={packs:{get:id=>id===NPC_CREATION_PACK?pack:null}};
  const resolveDocument=async uuid=>benefitDocs[uuid]??null;
  const source={system:{hierarchy:'boss',archetype:['brute']},items:[{name:'Ataque',type:'ability'}]};
  const result=await attachCreatureRoleItems(game,source,resolveDocument);
  assert.deepEqual(result.items.map(i=>i.name),['Chefão','Chefão','Bruto','Bruto','Ataque']);
  assert.equal(result.items[0].type,'hierarchy');
  assert.equal(result.items[1].type,'ability');
  assert.ok(!('_id' in result.items[0]));
});
test('attachCreatureRoleItems sem o compêndio instalado devolve o source intacto, sem travar',async()=>{
  const source={system:{hierarchy:'boss',archetype:['brute']},items:[]};
  const result=await attachCreatureRoleItems({packs:{get:()=>null}},source);
  assert.equal(result,source);
});
test('attachCreatureRoleItems sem identificador correspondente no compêndio, segue sem essa peça',async()=>{
  const pack=fakePack([{_id:'h-simple',type:'hierarchy',name:'Simples',system:{identifier:'simple',benefits:[]}}]);
  const source={system:{hierarchy:'boss',archetype:['ranged']},items:[]}; // nem 'boss' nem 'ranged' existem no fake pack
  const result=await attachCreatureRoleItems({packs:{get:()=>pack}},source);
  assert.deepEqual(result.items,[]);
});

// ── T24 §3 — biografia em ficha de campo ──
import {alignmentPhrase,buildFieldSheet,tacticsFromItems} from '../src/monster-convert.mjs';

test('ficha de campo: temperamento sai da tendência real do SRD, sem nome de plano ou deus',()=>{
  assert.match(alignmentPhrase('neutral good (50%) or neutral evil (50%)'),/^Metade .*ajudar.*outra metade .*cruel.*Role 1d2/);
  assert.match(alignmentPhrase('lawful evil'),/regras.*cruel/);
  assert.match(alignmentPhrase('unaligned'),/instinto/);
  assert.match(alignmentPhrase('any non-good alignment'),/nunca é bondoso/);
  assert.match(alignmentPhrase('any alignment'),/Varia/);
  assert.equal(alignmentPhrase(''),'');
});

test('ficha de campo: blocos na ordem do T24, táticas dos Itens, "—" sem ficha escrita e original recolhido',()=>{
  const mob=normalizeOpen5e({name:'Gigante de Teste',challenge_rating:'9',size:'Huge',type:'giant',alignment:'neutral good (50%) or neutral evil (50%)',strength:27,dexterity:10,constitution:22,intelligence:12,wisdom:16,charisma:16,hit_dice:'16d12+96',
    actions:[{name:'Multiattack',desc:'The giant makes two morningstar attacks.'},{name:'Morningstar',desc:'Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage.'},{name:'Rock',desc:'Ranged Weapon Attack: +12 to hit, range 60/240 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage.'}],
    special_abilities:[{name:'Keen Smell',desc:'The giant has advantage on Wisdom (Perception) checks that rely on smell.'}]});
  const src=toSkyfallNpc(mob,{habitat:'Espinha de Vorax'});
  const bio=src.system.biography;
  const ordem=['Habitat em Opath','Aparência','Temperamento','Comportamento','Táticas','O que quer','Ganchos','Notas de conversão'].map(t=>bio.indexOf(t));
  assert.ok(ordem.every((pos,i)=>pos>=0&&(i===0||pos>ordem[i-1])),'blocos na ordem da seção 3');
  assert.match(bio,/Habitat em Opath:<\/strong> Espinha de Vorax/);
  assert.match(bio,/Aparência:<\/strong> —/);
  assert.match(bio,/Táticas:<\/strong> Abre com Rock de longe\. Em corpo a corpo: Morningstar — mais de um ataque por turno/);
  assert.match(bio,/Keen Smell/);
  assert.match(bio,/<details><summary>Original \(D&amp;D 5e\)/);
  // com ficha escrita à parte, os quatro blocos vêm dela (texto escapado)
  const ficha=buildFieldSheet(mob,{items:src.items,sheet:{appearance:'Alto <b>demais</b>',behavior:'Aposta tudo',wants:'Tesouro',hooks:['Um','Dois'],temperament:'Vaidoso.'}});
  assert.match(ficha,/Aparência:<\/strong> Alto &lt;b&gt;demais&lt;\/b&gt;/);
  assert.match(ficha,/Temperamento:<\/strong> Vaidoso\. Metade/);
  assert.match(ficha,/Ganchos:<\/strong> Um · Dois/);
  assert.equal(tacticsFromItems([]),'');
});
