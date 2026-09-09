import test from 'node:test';
import assert from 'node:assert/strict';
import {REGIONS,PLACES,BEYOND} from '../src/book-world.mjs';
import {MONSTERS} from '../src/book-monsters.mjs';
import {BOOK_ITEMS,CampaignLibrary,findMatches,monsterAudit} from '../src/library.mjs';
import {IMBUE_COSTS} from '../src/book-items.mjs';

test('every region, capital and local breadcrumb resolves within the geographic index',()=>{
  assert.equal(REGIONS.length,10);assert.equal(MONSTERS.length,44);
  const all=[...REGIONS,...PLACES,...BEYOND];assert.equal(new Set(all.map(i=>i.id)).size,all.length);
  for(const region of REGIONS){assert.ok(PLACES.some(i=>i.regionId===region.id));if(region.capital)assert.ok(PLACES.some(i=>i.id===region.capital&&i.regionId===region.id));}
  for(const place of [...PLACES,...BEYOND]){if(place.regionId)assert.ok(REGIONS.some(i=>i.id===place.regionId));let cursor=place;const visited=new Set();while(cursor.parentId){assert.ok(!visited.has(cursor.id));visited.add(cursor.id);cursor=all.find(i=>i.id===cursor.parentId);assert.ok(cursor);}}
  for(const entry of [...all,...BOOK_ITEMS,...MONSTERS]){assert.ok(entry.summary);assert.ok(entry.page>0&&entry.page<=514);}
});
test('catalog covers table entries and keeps ambiguity instead of inventing prices',()=>{
  assert.equal(BOOK_ITEMS.length,214);assert.equal(new Set(BOOK_ITEMS.map(i=>i.id)).size,214);
  assert.equal(BOOK_ITEMS.find(i=>i.name==='Armadura acolchoada').reduction,1);
  assert.equal(BOOK_ITEMS.find(i=>i.name==='Veneno de Serpe Silvestre').price,12000);
  assert.equal(IMBUE_COSTS[3],null);
  assert.match(BOOK_ITEMS.find(i=>i.name==='+1 (escudo)').note,/2º.*3º/);
  assert.equal(BOOK_ITEMS.filter(i=>i.category==='Sigilos').length,58);
});
test('matching preserves distinct swarms, equipment bonuses and actor types',()=>{
  const docs=[{name:'Bicho-papão',type:'npc'},{name:'Bicho papão',type:'character'},{name:'Besouro de aetherium',type:'npc'}];
  const report=monsterAudit(docs);
  assert.equal(report.find(i=>i.name==='Bicho papão').matches.length,1);
  assert.equal(report.find(i=>i.name==='Bicho papão').candidates.length,1);
  assert.equal(report.find(i=>i.name==='Nuvem de besouros de aetherium').status,'missing');
  assert.equal(findMatches({name:'+1 (arma)'},[{name:'+1 (escudo)',type:'sigil'},{name:'+2 (arma)',type:'sigil'}],['sigil']).length,0);
  assert.equal(findMatches({name:'Águalin',aliases:['Filtro de Água de Purificação Elemental']},[{name:'Filtro de Água de Purificação Elemental',type:'equipment'}]).length,1);
  assert.equal(monsterAudit([{name:'Kraken',type:'character'}]).find(i=>i.name==='Kraken').status,'missing');
  assert.equal(monsterAudit([],['failed']).every(i=>i.status==='unverified'),true);
});
test('GM audit reads world and actor pack indexes without creating or updating documents',async()=>{
  const pack={documentName:'Actor',collection:'skyfall.ameacas',metadata:{label:'Ameaças'},async getIndex(){return [{_id:'a',name:'Kraken',type:'npc'}];}};
  const game={user:{isGM:true},actors:[{id:'b',name:'Bandido',type:'npc'}],packs:[pack,{documentName:'Actor',collection:'broken',async getIndex(){throw Error('offline');}}]};
  const library=new CampaignLibrary(game,{items:[]});await library.loadActors();
  assert.equal(library.report().found.length,2);assert.equal(library.report().missing.length,0);assert.equal(library.report().unverified.length,42);
  game.packs=[pack];await library.loadActors(true);assert.equal(library.report().missing.length,42);assert.equal(library.report().found.length,2);
  const before=JSON.stringify(game.actors);library.render('monsters');library.render('items');assert.equal(JSON.stringify(game.actors),before);
});
test('player cannot mutate the GM library or read unshared content',async()=>{
  const player=new CampaignLibrary({user:{isGM:false},settings:{get:()=>({areas:[],map:[],monsters:[],items:[]})}},{items:[]});
  assert.throws(()=>player.render('map'),/somente/);assert.throws(()=>player.report(),/somente/);
  await assert.rejects(player.loadActors(),/somente/);
  await assert.rejects(player.action('lib-refresh'),/somente/);
  await assert.rejects(player.action('lib-share','map:foice'),/somente/);
  await assert.rejects(player.open('Actor.x'),/somente/);
  const locked=player.render('map',true);
  assert.match(locked,/não liberou/);assert.doesNotMatch(locked,/Kravokia/);
  await player.action('lib-place','foice');// navegar é permitido dentro da vista liberada
});
test('GM sharing exposes only the chosen entries to players',async()=>{
  const store={areas:[],map:[],monsters:[],items:[]};
  const settings={get:()=>store,set:async(_m,_k,value)=>{Object.assign(store,value);}};
  const gm=new CampaignLibrary({user:{isGM:true},settings},{items:[]});
  await gm.setShare('map','mirmir');
  assert.ok(store.areas.includes('map'));assert.ok(store.map.includes('mirmir'));
  const player=new CampaignLibrary({user:{isGM:false},settings},{items:[]});
  const view=player.render('map',true);
  assert.match(view,/Deserto de Mirmir/);assert.doesNotMatch(view,/Arquipélago de Huma/);assert.doesNotMatch(view,/Liberar/);
  await gm.setShare('map','mirmir');// alterna de novo: remove
  assert.equal(store.map.length,0);
});
test('region and city navigation produces working breadcrumbs; no image or scene import',async()=>{
  const library=new CampaignLibrary({user:{isGM:true}},{items:[]});
  await library.action('lib-region','mirmir');assert.match(library.render('map'),/Ir à capital: Kravokia/);
  await library.action('lib-place','kravokia');const html=library.render('map');assert.match(html,/data-id="mirmir"/);assert.match(html,/Kravokia/);assert.doesNotMatch(html,/<img/);
  await library.action('lib-map','scenes');assert.match(library.render('map'),/seleção manual/);
});
