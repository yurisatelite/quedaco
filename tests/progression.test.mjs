import test from 'node:test';
import assert from 'node:assert/strict';
import {classProgression,requiresSpellcasting} from '../src/progression.mjs';
import {itemVolume,totalVolume} from '../src/equipment.mjs';

test('progressão apresenta todos os níveis escolhidos e marcos de classe',()=>{
  const combatente=classProgression('Combatente',12);
  assert.equal(combatente.length,12);
  assert.match(combatente[4].feature,/Ataque em Sequência/);
  assert.equal(combatente[11].emphasis,36);
  assert.equal(combatente[8].proficiency,4);
});

test('conjuração só é exigida quando a classe ou os benefícios usam magia',()=>{
  assert.equal(requiresSpellcasting('Ocultista',{groups:[],included:[]}),true);
  assert.equal(requiresSpellcasting('Combatente',{groups:[],included:[]}),false);
  assert.equal(requiresSpellcasting('Especialista',{groups:[{granting:'spell'}],included:[]}),true);
});

test('volume aceita campo numérico ou objeto do sistema',()=>{
  const a={system:{capacity:{value:3}}},b={system:{capacity:2}};
  assert.equal(itemVolume(a),3);
  assert.equal(totalVolume([{entry:a,quantity:2},{entry:b,quantity:1}]),8);
});
