import test from 'node:test';
import assert from 'node:assert/strict';
import {generatorPrompt,generatorScope} from '../src/generator.mjs';
import {CampaignLibrary} from '../src/library.mjs';

const mirmir={id:'mirmir',name:'Deserto de Mirmir',government:'Proteção de Kravokia'};
const kravokia={id:'kravokia',name:'Kravokia',summary:'Capital de laboratórios alquímicos.'};

test('prompt gerador inclui região, local e orientação do arquétipo',()=>{
  const prompt=generatorPrompt('ferreiro',mirmir,kravokia);
  assert.match(prompt,/ferreiro/i);assert.match(prompt,/Kravokia/);assert.match(prompt,/Deserto de Mirmir/);assert.match(prompt,/forja e sigilos/i);
});

test('arquétipo desconhecido usa orientação genérica e monstro vira criatura',()=>{
  assert.match(generatorPrompt('cartógrafo',mirmir),/ocupação coerente/i);
  const prompt=generatorPrompt('aquático',mirmir,null,'monster');assert.match(prompt,/criatura ou ameaça/i);assert.match(prompt,/nível de desafio/i);
});

test('escopo normaliza contagem e preserva todos os campos esperados pela macro',()=>{
  assert.deepEqual(generatorScope({region:mirmir,place:kravokia,archetype:'mago',count:2.9}),{
    kind:'npc',regionId:'mirmir',regionName:'Deserto de Mirmir',placeId:'kravokia',placeName:'Kravokia',archetype:'mago',count:2,prompt:generatorPrompt('mago',mirmir,kravokia,'npc')
  });
});

test('botão de cobertura chama a macro com o contexto completo',async()=>{
  const calls=[],game={user:{isGM:true},actors:[],macros:{getName:()=>({execute:async scope=>calls.push(scope)})},settings:{get:()=>''}};
  const library=new CampaignLibrary(game,{items:[]});
  await library.action('lib-generate-npc','mirmir||ferreiro');
  assert.equal(calls.length,1);assert.equal(calls[0].quedaco.regionName,'Deserto de Mirmir');assert.equal(calls[0].quedaco.placeId,'');assert.match(calls[0].quedaco.prompt,/ferreiro/i);
  assert.match(library.render('npcs'),/data-op="lib-generate-npc-batch"/);
});

test('lote limita a cinco lacunas e informa cada chamada à macro',async()=>{
  const calls=[],messages=[],previousUi=globalThis.ui;globalThis.ui={notifications:{info:text=>messages.push(text),warn:text=>messages.push(text)}};
  try{
    const game={user:{isGM:true},actors:[],macros:{getName:()=>({execute:async scope=>calls.push(scope)})},settings:{get:()=>''}};
    const library=new CampaignLibrary(game,{items:[]});await library.action('lib-generate-npc-batch','5');
    assert.equal(calls.length,5);assert.ok(calls.every(call=>call.quedaco.count===1&&call.quedaco.prompt));assert.match(messages.at(-1),/5 NPC/);
  }finally{globalThis.ui=previousUi;}
});
