import test from 'node:test';
import assert from 'node:assert/strict';
import {createFamilyRegistry,isFamilyDescriptor,activeCapabilities,missingKnownModules} from '../src/family.mjs';
import {renderFamilyArea} from '../src/family-view.mjs';

const descriptor=(over={})=>({family:'quedaco',contractVersion:1,id:'quedaco-tabelas',title:'QUEDAÇO - Tabelas',version:'0.4.0',capabilities:{tables:true,off:false},open(){this.opened=true;},getStatus:()=>({ready:true}),...over});
const hooks=()=>{const l={};return {on:(n,f)=>(l[n]??=[]).push(f),call:(n,...a)=>(l[n]??[]).forEach(f=>f(...a))};};

test('contrato v1: exige family, contractVersion, id quedaco-*, open e getStatus',()=>{
  assert.ok(isFamilyDescriptor(descriptor()));
  for(const bad of [null,{},descriptor({family:'x'}),descriptor({contractVersion:2}),descriptor({id:'outro'}),descriptor({open:null}),descriptor({capabilities:null})])assert.equal(isFamilyDescriptor(bad),false);
});
test('só capabilities verdadeiras são listadas',()=>{assert.deepEqual(activeCapabilities(descriptor()),['tables']);});
test('registra por quedaco:register e por varredura de módulos ativos',()=>{
  const h=hooks(),a=descriptor(),b=descriptor({id:'quedaco-calendario',title:'QUEDAÇO - Calendário',capabilities:{calendar:true}});
  const game={modules:new Map([['quedaco-calendario',{active:true,api:b}],['quedaco-explorador',{active:false,api:descriptor({id:'quedaco-explorador'})}]])};
  const reg=createFamilyRegistry({game,hooks:h});
  h.call('quedaco:register',a);h.call('quedaco:register',{family:'outra'});
  reg.scan();
  assert.deepEqual(reg.list().map(m=>m.id),['quedaco-calendario','quedaco-tabelas']);
  assert.deepEqual(reg.withCapability('calendar'),['quedaco-calendario']);
});
test('open chama a API do módulo; id desconhecido devolve false; getStatus que falha = não pronto',async()=>{
  const reg=createFamilyRegistry({game:{modules:new Map()},hooks:hooks()});
  const a=descriptor({getStatus(){throw Error('x');}});reg.register(a);
  assert.equal(await reg.open('quedaco-tabelas'),true);assert.equal(a.opened,true);
  assert.equal(await reg.open('nao-existe'),false);
  assert.equal(reg.list()[0].ready,false);
});
test('lista ausentes e a aba escapa HTML',()=>{
  const reg=createFamilyRegistry({game:{modules:new Map()},hooks:hooks()});
  reg.register(descriptor({title:'<b>x</b>'}));
  const game={modules:{get:id=>id==='quedaco-explorador'?{active:false}:undefined}};
  const missing=missingKnownModules(reg,game);
  assert.equal(missing.find(m=>m.id==='quedaco-explorador').installed,true);
  assert.equal(missing.some(m=>m.id==='quedaco-tabelas'),false);
  const html=renderFamilyArea(reg,game);
  assert.ok(!html.includes('<b>x</b>'));assert.ok(html.includes('data-op="family-open"'));
});
test('o painel não escreve em dado de outro módulo (registro é só leitura)',()=>{
  const reg=createFamilyRegistry({game:{modules:new Map()},hooks:hooks()});const a=descriptor();Object.freeze(a);
  assert.doesNotThrow(()=>{reg.register(a);reg.list();});
});
