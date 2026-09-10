import test from 'node:test';
import assert from 'node:assert/strict';
import {crToNd,abilityMod,feetToMeters,skyfallCreatureType,parseCr,guessHierarchy,guessArchetype,toSkyfallNpc,normalizeOpen5e,parseStatblock,normalizeMonsterInput} from '../src/monster-convert.mjs';

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
