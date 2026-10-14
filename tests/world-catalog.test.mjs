import test from 'node:test';
import assert from 'node:assert/strict';
import {baseWorldCatalog,buildWorldCatalog,updateCatalogRecord,createWorldCatalogService,registerWorldCatalog} from '../src/world-catalog.mjs';
import {CampaignLibrary} from '../src/library.mjs';

test('catálogo preserva IDs, hierarquia e não inventa clima regional',()=>{
  const c=baseWorldCatalog();assert.equal(c.regions.length,10);assert.equal(c.places.length,48);
  assert.equal(c.places.find(p=>p.id==='casebres').parentId,'alberich');assert.ok(c.regions.every(r=>r.climateId===''));
  c.regions[0].name='x';assert.notEqual(baseWorldCatalog().regions[0].name,'x');
});
test('novos cadastros e overrides preservam fontes e rejeitam referências/ciclos',()=>{
  let s=updateCatalogRecord({},'places',{id:'adega',name:'Adega',regionId:'thurthur',parentId:'alberich',aliases:['Bar','Bar']});
  assert.equal(s.places[0].source,'world');assert.deepEqual(s.places[0].aliases,['Bar']);
  s=updateCatalogRecord(s,'places',{id:'alberich',name:'Alberich',climateId:'temperado'});
  assert.equal(buildWorldCatalog(s).places.find(p=>p.id==='alberich').source,'skyfall-book');
  assert.throws(()=>updateCatalogRecord(s,'places',{id:'alberich',parentId:'adega'}),/ciclos/);
  assert.throws(()=>updateCatalogRecord(s,'places',{id:'adega',regionId:'norvak'}),/mesma região/);
  assert.throws(()=>updateCatalogRecord(s,'places',{id:'adega',tags:['nao-existe']}),/Tag/);
  assert.throws(()=>updateCatalogRecord(s,'places',{id:'adega',climateId:'nao-existe'}),/Clima/);
  assert.throws(()=>updateCatalogRecord(s,'places',{id:'__proto__',name:'X'}),/ID/);
});
test('inativação conserva ID e relações; jogadores não recebem segredos por relações',()=>{
  let s=updateCatalogRecord({},'places',{id:'adega',name:'Adega secreta',regionId:'thurthur',parentId:'alberich'});
  s=updateCatalogRecord(s,'places',{id:'sala',name:'Sala',regionId:'thurthur',parentId:'adega',visibility:'public'});
  assert.equal(buildWorldCatalog(s,{isGM:false}).places.some(p=>p.id==='adega'||p.id==='sala'),false);
  s=updateCatalogRecord(s,'places',{id:'adega',active:false});
  assert.ok(buildWorldCatalog(s,{includeInactive:true}).places.some(p=>p.id==='adega'));
});
test('API valida permissão, evita perda de edições e resolve aliases ambíguos',async()=>{
  let stored={};let writes=0;const events=[];
  const game={user:{isGM:true},settings:{get:()=>stored,set:async(_m,_k,v)=>{stored=v;writes++;},register:(_m,_k,c)=>{game.config=c;}}};
  registerWorldCatalog(game,{callAll:(...a)=>events.push(a)});
  const api=createWorldCatalogService(game);
  await Promise.all([api.upsertCatalogRecord('tags',{id:'content:rumor',name:'Rumor'}),api.upsertCatalogRecord('tags',{id:'content:noticia',name:'Notícia'})]);
  assert.equal(writes,2);assert.ok(api.listTags().some(t=>t.id==='content:rumor'));
  await assert.rejects(api.upsertCatalogRecord('tags',{id:'content:x',name:'X'},{expectedRevision:0}),/mudou/);
  await api.upsertCatalogRecord('places',{id:'adega',name:'Adega',regionId:'thurthur',aliases:['Bar']});
  assert.equal(api.resolveLocality('bar').id,'adega');
  await api.upsertCatalogRecord('places',{id:'taverna',name:'Taverna',regionId:'thurthur',aliases:['Bar']});
  assert.equal(api.resolveLocality('bar'),null);
  game.config.onChange(stored);assert.equal(events[0][0],'quedaco:catalog-updated');
  game.user.isGM=false;await assert.rejects(api.upsertCatalogRecord('tags',{id:'content:y',name:'Y'}),/Mestra/);
  assert.equal(api.getPlace('adega'),null);
});
test('cenas são consultadas por chave do atlas e respeitam permissão',()=>{
  const game={user:{isGM:true},settings:{get:(_m,k)=>k==='sceneAtlas'?{scenes:{one:{parentId:'place:alberich'},two:{parentId:'place:alberich'}}}:{}},scenes:[{id:'one',name:'Praça',visible:true},{id:'two',name:'Segredo',visible:false}]};
  assert.deepEqual(createWorldCatalogService(game).getMapLinks('alberich').map(s=>s.id),['one']);
});

test('clima herda do ancestral/região e o Mapa Imersivo reconhece novos locais',()=>{
  let stored=updateCatalogRecord({},'regions',{id:'thurthur',climateId:'temperado'});
  stored=updateCatalogRecord(stored,'places',{id:'adega',name:'Adega',regionId:'thurthur',parentId:'alberich',visibility:'public'});
  const game={user:{isGM:true},actors:[],scenes:[],folders:[],settings:{get:(_m,k)=>k==='worldCatalog'?stored:{}}};
  const api=createWorldCatalogService(game);assert.equal(api.getEnvironment('adega').climate.id,'temperado');
  assert.equal(api.getEnvironment('adega').sourceId,'thurthur');
  const library=new CampaignLibrary(game,{items:[]});
  assert.match(library.sceneAtlasParentOptions(),/Adega/);
  assert.ok(library.catalogPlaces.some(p=>p.id==='adega'));
  assert.ok(library.catalogRegions.find(r=>r.id==='thurthur').summary);
});
