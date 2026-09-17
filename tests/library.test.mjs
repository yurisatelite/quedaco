import test from 'node:test';
import assert from 'node:assert/strict';
import {REGIONS,PLACES,BEYOND,COIN_FACES,coinFaces} from '../src/book-world.mjs';
import {MONSTERS} from '../src/book-monsters.mjs';
import {BOOK_ITEMS,CampaignLibrary,DEFAULT_GENERATOR_MACRO,findMatches,generatorMacroName,itemCategoryStyle,itemDescriptors,itemFallback,itemProperties,monsterAudit,monsterCategory,monsterMatches,shouldAskReleaseOnActivate} from '../src/library.mjs';
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
  assert.doesNotMatch(library.render('map'),/data-map-viewport/);
  assert.match(library.render('map'),/Configure “Imagem do mapa de Opath”/);
  await library.action('lib-region','mirmir');assert.match(library.render('map'),/Ir à capital: Kravokia/);
  await library.action('lib-place','kravokia');const html=library.render('map');assert.match(html,/data-id="mirmir"/);assert.match(html,/Kravokia/);assert.match(html,/icons\/svg\/village\.svg/);
  await library.action('lib-map','scenes');assert.match(library.render('map'),/seleção manual/);
});
test('biblioteca esconde ataque desarmado e fornece imagens padrão por categoria',()=>{
  const library=new CampaignLibrary({user:{isGM:true}},{items:[]});
  assert.doesNotMatch(library.render('items'),/>Ataque desarmado</);
  assert.match(itemFallback({category:'Munição'}),/ammunition/);
  assert.match(itemFallback({category:'Consumíveis'}),/potions/);
  assert.match(itemFallback({category:'Armas marciais'}),/sword/);
  assert.match(library.render('monsters'),/icons\/svg\/mystery-man\.svg/);
});
test('imagens de região e local ficam em settings separados e aparecem nos cartões',async()=>{
  const store={regionImages:{},placeImages:{}};
  const settings={get:(_m,key)=>store[key]??{},set:async(_m,key,value)=>{store[key]=value;}};
  const library=new CampaignLibrary({user:{isGM:true},settings},{items:[]});
  await library.setRegionImage('mirmir','worlds/teste/mirmir.webp');
  await library.setPlaceImage('kravokia','worlds/teste/kravokia.webp');
  assert.equal(store.regionImages.mirmir,'worlds/teste/mirmir.webp');
  assert.equal(store.placeImages.kravokia,'worlds/teste/kravokia.webp');
  assert.match(library.render('map'),/mirmir\.webp/);
  await library.action('lib-place','kravokia');
  assert.match(library.render('map'),/kravokia\.webp/);
});
test('aba Quests é pública e segue os documentos observáveis do Forien',async()=>{
  const API={DB:{getAllQuests:()=>[{id:'q1',name:'Salvar Kravokia',status:'available',location:'Kravokia',giverData:{name:'Guia Rubra'},tasks:[],rewards:[],subquests:[]}],hooks:{}},open({questId}){this.opened=questId;}};
  const game={user:{isGM:false},actors:[{id:'guia',uuid:'Actor.guia',name:'Guia Rubra'}],modules:new Map([['forien-quest-log',{active:true,public:{QuestAPI:API}}]]),settings:{get:(_module,key)=>key==='sharedContent'?{areas:[],map:[],monsters:[],items:[],npcs:[]}:false}};
  const player=new CampaignLibrary(game,{items:[]});
  const html=player.render('quests',true);
  assert.match(html,/Salvar Kravokia/);assert.match(html,/Abrir quest/);assert.doesNotMatch(html,/Nova quest/);
  assert.match(html,/sy-card-figure-full/);assert.match(html,/src="icons\/svg\/book\.svg"/);
  assert.match(html,/draggable="true" data-drag-actor="Actor\.guia"/);
  await player.action('lib-quest-open','q1');assert.equal(API.opened,'q1');
});
test('mapa configurado usa visor único, foca região e abre detalhe de cidade',async()=>{
  const store={opathMapImage:'worlds/teste/opath.webp',regionImages:{mirmir:'worlds/teste/mirmir.webp'},placeImages:{},sharedContent:{areas:['map'],map:['mirmir'],monsters:[],items:[],npcs:[]}};
  const settings={get:(_module,key)=>store[key],set:async(_module,key,value)=>{store[key]=value;}};
  const gm=new CampaignLibrary({user:{isGM:true},settings,actors:[],scenes:[]},{items:[]});
  assert.match(gm.render('map'),/data-map-viewport/);
  assert.match(gm.render('map'),/data-op="lib-map-focus" data-id="mirmir"/);
  await gm.action('lib-map-focus','mirmir',{viewW:800,viewH:500});
  assert.equal(gm.state.map.focus,'mirmir');
  assert.match(gm.render('map'),/mirmir\.webp/);
  assert.match(gm.render('map'),/data-op="lib-place" data-id="kravokia"/);
  await gm.action('lib-place','kravokia');
  assert.match(gm.render('map'),/Taverna do Morcego Perneta/);

  const player=new CampaignLibrary({user:{isGM:false},settings,actors:[],scenes:[]},{items:[]});
  const playerMap=player.render('map',true);
  assert.match(playerMap,/data-id="mirmir"/);
  assert.doesNotMatch(playerMap,/data-id="huma"/);
  await player.action('lib-map-focus','huma',{viewW:800,viewH:500});
  assert.equal(player.state.map.focus,null);
});
test('filtro de monstros usa OU na faceta e E entre facetas',()=>{
  const entry={creatureType:'Fera',role:'Complexo · Atirador, Bruto',movement:['terrestrial','aerial'],nd:6,status:'found'};
  assert.equal(monsterMatches(entry,{tipo:['Fera'],papel:['Defensor','Atirador'],desloc:['aerial']}),true);
  assert.equal(monsterMatches(entry,{tipo:['Fera'],papel:['Defensor'],desloc:[]}),false);
  assert.equal(monsterMatches(entry,{tipo:[],papel:[],porte:[],desloc:[],nd:[],conf:[]}),true);
  assert.equal(monsterMatches(entry,{tipo:['Fera'],nd:['ND 1–4']}),false);
  assert.match(monsterCategory(entry),/tipo:Fera\|papel:Atirador\|papel:Bruto\|porte:Complexo\|desloc:terrestrial\|desloc:aerial\|nd:ND 5–8\|conf:found/);
});
test('nome da macro geradora usa setting e fallback seguro',()=>{
  assert.equal(generatorMacroName({get:()=>''}),DEFAULT_GENERATOR_MACRO);
  assert.equal(generatorMacroName({get:()=> 'Minha macro'}),'Minha macro');
});
test('mensagem de candidato de outro tipo permanece legível',()=>{
  const library=new CampaignLibrary({user:{isGM:true},settings:{get:()=>({areas:[],map:[],monsters:[],items:[],npcs:[]})},actors:[]},{items:[]});
  library.actors=[{name:'Kraken',type:'character',uuid:'Actor.kraken',source:'Mundo'}];library.loaded=true;
  const html=library.render('monsters');
  assert.match(html,/Há documento com esse nome, mas de outro tipo de ficha/);
  assert.doesNotMatch(html,/com\?/);
});
test('monstros usam imagem inteira e facetas recolhíveis preservam seleção',()=>{
  const library=new CampaignLibrary({user:{isGM:true},actors:[]},{items:[]});
  let html=library.render('monsters');
  assert.match(html,/sy-card-figure-full/);
  assert.match(html,/<details class="sy-facet"/);
  assert.doesNotMatch(html,/<fieldset/);
  library.state.monsterFacets.papel=['Atirador'];
  html=library.render('monsters');
  assert.match(html,/data-monster-facet-group="papel" open/);
  assert.match(html,/data-monster-facet="papel" value="Atirador" checked/);
  assert.match(html,/Papel<span class="sy-facet-count"> \(1\)<\/span>/);
  library.actors=[{name:'Kraken',type:'npc',uuid:'Actor.kraken',img:'kraken.webp',source:'Mundo'}];
  library.loaded=true;
  assert.match(library.render('monsters'),/draggable="true" data-drag-actor="Actor\.kraken"/);
});
test('itens usam miniatura compacta e Imbuir fica em área própria',()=>{
  const store={areas:['imbue'],map:[],monsters:[],items:[],npcs:[]};
  const settings={get:(_module,key)=>key==='sharedContent'?store:''};
  const gm=new CampaignLibrary({user:{isGM:true},settings},{items:[]});
  const items=gm.render('items');
  assert.match(items,/sy-library-thumb/);
  assert.doesNotMatch(items,/Montar item modificado/);
  assert.doesNotMatch(items,/sy-card-figure-compact/);
  assert.match(gm.render('imbue'),/Calculadora \(não altera Item da mesa\)/);
  assert.match(gm.render('imbue'),/Prefixos 0\/2/);
  gm.modBuilder.baseId='book-item-1';
  assert.match(gm.render('imbue'),/data-op="lib-mod-tab"/);
  assert.match(gm.render('imbue'),/Aba Imbuir visível aos jogadores/);
  const player=new CampaignLibrary({user:{isGM:false},settings},{items:[]});
  const readonly=player.render('imbue',true);
  assert.match(readonly,/O que é imbuir/);
  assert.doesNotMatch(readonly,/Bancada de item modificado/);
});

test('item com cópia de compêndio emite drag-data de Item',()=>{
  const catalog={items:[{name:'Roupas (finas)',type:'equipment',uuid:'Compendium.skyfall.items.Item.roupas',img:'roupas.webp'}]};
  const html=new CampaignLibrary({user:{isGM:true}},catalog).render('items');
  assert.match(html,/draggable="true" data-drag-item="Compendium\.skyfall\.items\.Item\.roupas"/);
});
test('todo NPC gerado aparece direto, edita sem adoção e protege Actor com dono jogador',async()=>{
  const root={id:'root',name:'🤖 Criados pela IA'},folder={id:'npcs',name:'NPCs',folder:root};
  const makeActor=(id,hasPlayerOwner=false)=>({id,uuid:`Actor.${id}`,name:id==='a'?'Guia de Kravokia':'Companheiro',type:'character',folder,flags:{},hasPlayerOwner,
    async update(change){const value=change['flags.quedaco.npc'];if(value)this.flags={quedaco:{npc:value}};},sheet:{render(){}}});
  const first=makeActor('a'),owned=makeActor('b',true),library=new CampaignLibrary({user:{isGM:true},actors:[first,owned]},{items:[]});
  const html=library.render('npcs');
  assert.match(html,/Guia de Kravokia/);assert.doesNotMatch(html,/Detectados nas pastas|Adotar todos|Ativar|Inativo/);
  assert.match(html,/draggable="true" data-drag-actor="Actor\.a"/);assert.match(html,/sy-npc-portrait-card/);
  assert.match(html,/data-op="lib-npc-edit" data-id="a"/);
  assert.match(html,/data-op="lib-npc-delete" data-id="a"/);
  assert.doesNotMatch(html,/data-op="lib-npc-delete" data-id="b"/);
  assert.doesNotMatch(html,/Escolha um Actor/);
  await library.action('lib-npc-edit','a');
  assert.equal(first.flags.quedaco,undefined);
  assert.equal(library.state.npcActor,'a');
  assert.match(library.render('npcs'),/Fechar edição/);
  await library.action('lib-npc-close','a');
  assert.equal(library.state.npcActor,null);
});
test('salvar NPC concede visão limitada sem rebaixar proprietários',async()=>{
  const previousUi=globalThis.ui;globalThis.ui={notifications:{info(){}}};
  try{
    const actor={id:'a',uuid:'Actor.a',name:'Guia',type:'character',flags:{},ownership:{default:0,player1:3},async update(change){this.last=change;this.flags={quedaco:{npc:change['flags.quedaco.npc']}};}};
    const library=new CampaignLibrary({user:{isGM:true},actors:[actor]},{items:[]});
    await library.saveNpc('a',{role:'extra',regionId:'mirmir',placeId:'',tokenVisible:true,markup:1,forgeMarkup:1});
    assert.equal(actor.last.ownership.default,1);assert.equal(actor.last.ownership.player1,3);assert.equal(actor.last['flags.quedaco.npc'].tokenVisible,true);
  }finally{globalThis.ui=previousUi;}
});
test('exclusão de NPC confirma, limpa o editor e recusa Actor de jogador',async()=>{
  let deleted=false;
  const actor={id:'npc',uuid:'Actor.npc',name:'NPC temporário',type:'character',flags:{quedaco:{npc:{role:'extra',placeId:'',active:false,shop:{stock:[]}}}},hasPlayerOwner:false,async delete(){deleted=true;}};
  const owned={...actor,id:'pc',uuid:'Actor.pc',name:'Personagem',hasPlayerOwner:true};
  const previousFoundry=globalThis.foundry;
  globalThis.foundry={applications:{api:{DialogV2:{confirm:async()=>true}}}};
  try{
    const library=new CampaignLibrary({user:{isGM:true},actors:[actor,owned]},{items:[]});library.state.npcActor='npc';
    await library.action('lib-npc-delete','npc');
    assert.equal(deleted,true);assert.equal(library.state.npcActor,null);
    await assert.rejects(library.action('lib-npc-delete','pc'),/pertence a um jogador/);
  }finally{globalThis.foundry=previousFoundry;}
});
test('filtro de NPC por local usa local manual ou inferido',()=>{
  const flag=placeId=>({quedaco:{npc:{role:'extra',placeId,active:false,note:'',shop:{stock:[]}}}});
  const actors=[
    {id:'k',uuid:'Actor.k',name:'Morador de Kravokia',type:'character',flags:flag('kravokia')},
    {id:'f',uuid:'Actor.f',name:'Morador da Foice',type:'character',flags:flag('foice')},
    {id:'i',uuid:'Actor.i',name:'Guia de Kravokia',type:'character',flags:{},folder:{id:'npcs',name:'NPCs',folder:{id:'root',name:'🤖 Criados pela IA'}}}
  ];
  const library=new CampaignLibrary({user:{isGM:true},actors},{items:[]});library.state.npcPlaceFilter='kravokia';
  const html=library.render('npcs');
  assert.match(html,/Morador de Kravokia/);assert.match(html,/Guia de Kravokia/);assert.doesNotMatch(html,/Morador da Foice/);
});

test('detalhes de região e cidade listam NPCs relacionados e arrastáveis',()=>{
 const regionFolder={id:'r',name:'Deserto de Mirmir',folder:{id:'root',name:'🤖 NPCs por Região'}},cityFolder={id:'c',name:'Kravokia',folder:regionFolder};
 const regionNpc={id:'wanderer',uuid:'Actor.wanderer',name:'Peregrino',type:'character',folder:regionFolder,flags:{}},cityNpc={id:'city',uuid:'Actor.city',name:'Morador',type:'character',folder:cityFolder,flags:{}};
 const library=new CampaignLibrary({user:{isGM:true},actors:[regionNpc,cityNpc],folders:[]},{items:[]});
 assert.match(library.regionDetail({id:'mirmir',name:'Deserto de Mirmir',page:1,summary:'',government:'',trade:'',highlights:[]},true),/Actor\.wanderer/);
 assert.match(library.placeDetail({id:'kravokia',regionId:'mirmir',name:'Kravokia',page:1,kind:'Capital',summary:'',highlights:[]},true),/Actor\.city/);
});

test('camadas do mapa revelam cidades no zoom e compartilhamento em massa',async()=>{
 const store={opathMapImage:'opath.webp',mapHotspots:{regions:{},places:{}},sharedContent:{areas:[],map:[],monsters:[],items:[],npcs:[]}};
 const game={user:{isGM:true},actors:[],folders:[],settings:{get:(_m,key)=>store[key],set:async(_m,key,value)=>store[key]=value}};
 const library=new CampaignLibrary(game,{items:[]});library.state.map.scale=2;
 assert.match(library.render('map'),/data-pin-kind="places"/);
 await library.action('lib-map-layer','regions');assert.doesNotMatch(library.render('map'),/data-pin-kind="places"/);
 await library.action('lib-map-share-all','all');assert.ok(store.sharedContent.map.includes('kravokia'));assert.ok(store.sharedContent.map.includes('mirmir'));
 await library.action('lib-map-share-all','none');assert.equal(store.sharedContent.map.length,0);
});

test('região aceita várias cenas vinculadas sem revelar mapas ao jogador',async()=>{
 const store={regionScenes:{},sharedContent:{areas:[],map:[],monsters:[],items:[],npcs:[]}};
 const scenes=[{id:'s1',name:'Duna Norte'},{id:'s2',name:'Oásis'},{id:'s3',name:'Ruína'}];
 const game={user:{isGM:true},actors:[],folders:[],scenes,settings:{get:(_m,key)=>store[key],set:async(_m,key,value)=>store[key]=value}};
 const library=new CampaignLibrary(game,{items:[]});
 await library.action('lib-region-scene','mirmir:s1');
 await library.action('lib-region-scene','mirmir:s3');
 assert.deepEqual(store.regionScenes.mirmir,['s1','s3']);
 await library.action('lib-region-scene','mirmir:s1');
 assert.deepEqual(store.regionScenes.mirmir,['s3']);
 const region={id:'mirmir',name:'Deserto de Mirmir',page:1,summary:'',government:'',trade:'',highlights:[]};
 assert.match(library.regionDetail(region,true),/data-op="lib-region-scene" data-id="mirmir:s2"/);
 assert.doesNotMatch(library.regionDetail(region,false),/data-op="lib-open-scene" data-id="s3"/);
 assert.doesNotMatch(library.regionDetail(region,false),/data-op="lib-region-scene"/);
});

test('aba do jogador entra por região e só então mostra a forja do ferreiro',()=>{
 const actor={id:'smith',uuid:'Actor.smith',name:'Ferreiro',type:'character',flags:{quedaco:{npc:{role:'smith',regionId:'mirmir',placeId:'',forge:{enabled:true,markup:1},shop:{stock:[]}}}}};
 const shared={areas:['npcs'],npcs:['Actor.smith'],map:[],monsters:[],items:[]},game={user:{isGM:false,character:null},users:[],actors:[actor],settings:{get:(_m,key)=>key==='sharedContent'?shared:''}};
 const library=new CampaignLibrary(game,{items:[]});
 const indice=library.render('npcs',true);
 assert.match(indice,/data-op="lib-npc-player-region" data-id="mirmir"/);
 assert.doesNotMatch(indice,/sy-forge/);
 library.state.npcPlayerRegion='mirmir';
 assert.match(library.render('npcs',true),/sy-forge/);
});

test('abrir região não revela localidade nem NPC; abrir o local libera seu morador',()=>{
 const place=PLACES.find(p=>p.regionId==='mirmir');
 const actor={id:'x',uuid:'Actor.x',name:'Mercador',type:'character',ownership:{default:1},flags:{quedaco:{npc:{role:'merchant',regionId:'mirmir',placeId:place.id,shop:{stock:[]}}}}};
 const shared={areas:['npcs','map'],npcs:[],map:['mirmir'],monsters:[],items:[]};
 let localities=['region:mirmir'];
 const game={user:{isGM:false,character:null},users:[],actors:[actor],settings:{get:(_m,key)=>key==='sharedContent'?shared:key==='npcLocalities'?localities:''}};
 const library=new CampaignLibrary(game,{items:[]});
 assert.equal(library.sharedPlaceIds().has(place.id),false);
 assert.equal(library.npcOpenToPlayers(actor,actor.flags.quedaco.npc),false);
 assert.doesNotMatch(library.renderMap(true),new RegExp(`data-id="${place.id}"`));
 library.state.region='mirmir';
 assert.doesNotMatch(library.renderMap(true),new RegExp(place.name));
 localities=['region:mirmir',`place:${place.id}`];
 assert.equal(library.npcOpenToPlayers(actor,actor.flags.quedaco.npc),true);
});

test('NPC conhecido permanece na lista depois de fechar o local, sem interação',async()=>{
 const place=PLACES.find(p=>p.regionId==='mirmir');
 const actor={id:'x',uuid:'Actor.x',name:'Mercador',type:'character',ownership:{default:1},flags:{quedaco:{npc:{role:'merchant',regionId:'mirmir',placeId:place.id,shop:{stock:[]}}}}};
 const settings={npcLocalities:[],npcKnown:[],sharedContent:{areas:['npcs'],npcs:[],map:[],monsters:[],items:[]}};
 const game={user:{isGM:true,character:null},users:[],actors:[actor],settings:{get:(_m,key)=>settings[key],set:async(_m,key,value)=>{settings[key]=value;}}};
 const library=new CampaignLibrary(game,{items:[]});
 await library.setNpcLocality('place',place.id,true);
 assert.deepEqual(settings.npcKnown,['Actor.x']);
 await library.setNpcLocality('place',place.id,false);
 game.user.isGM=false;
 library.state.npcPlayerRegion='mirmir';
 const html=library.renderNpcsPlayer();
 assert.match(html,/Mercador/);
 assert.match(html,/Conhecido · fora de alcance/);
 assert.doesNotMatch(html,/data-op="lib-npc-sell/);
 assert.doesNotMatch(html,/data-op="lib-npc-role2/);
 settings.npcLocalities=[`place:${place.id}`];
 assert.doesNotMatch(library.renderNpcsPlayer(),/Conhecido · fora de alcance/);
});

test('papel secundário mais recente dos jogadores aparece ao mestre só no editor',()=>{
 const actor={id:'x',uuid:'Actor.x',name:'Abel',type:'character',items:[],system:{level:{value:2}},flags:{quedaco:{npc:{role:'smith',regionId:'mirmir',placeId:''}}}};
 const users=[
  {id:'gm',isGM:true,flags:{quedaco:{npcRoles2:{'Actor.x':'healer'}}}},
  {id:'p1',isGM:false,flags:{quedaco:{npcRoles2:{'Actor.x':{role:'merchant',at:10}}}}},
  {id:'p2',isGM:false,flags:{quedaco:{npcRoles2:{'Actor.x':{role:'guard',at:20}}}}},
 ];
 const game={user:users[0],users,actors:[actor],settings:{get:()=>null}};
 const library=new CampaignLibrary(game,{items:[]});
 assert.equal(library.npcRoleSecondary(actor.uuid),'guard');
 assert.doesNotMatch(library.npcCard(actor),/Guarda/);
 const editor=library.renderNpcEditor(actor);
 assert.match(editor,/Papel secundário · jogadores/);
 assert.match(editor,/option value="guard" selected/);
 assert.match(library.playerNpcCard(actor,actor.flags.quedaco.npc),/Guarda/);
 assert.match(library.playerNpcCard(actor,actor.flags.quedaco.npc),/data-op="lib-npc-role2"/);
 assert.doesNotMatch(library.playerNpcCard(actor,actor.flags.quedaco.npc,true),/data-op="lib-npc-role2"/);
});

test('cartão e editor usam a imagem do Item de cada classe do Skyfall',()=>{
 const classes=['Combatente','Especialista','Ocultista'];
 const catalog={items:classes.map(name=>({type:'class',name,img:`modules/skyfall-core/classes/${name.toLowerCase()}.webp`}))};
 const library=new CampaignLibrary({user:{isGM:true},users:[],actors:[],settings:{get:()=>null}},catalog);
 for(const name of classes){
  const actor={id:name,uuid:`Actor.${name}`,name:'Abel',type:'character',items:[{type:'class',name,img:'icons/svg/item-bag.svg'}],flags:{quedaco:{npc:{role:'smith',regionId:'mirmir'}}}};
  const path=`modules/skyfall-core/classes/${name.toLowerCase()}.webp`;
  assert.match(library.npcCard(actor),new RegExp(`<img src="${path}" alt=""`));
  assert.match(library.renderNpcEditor(actor),new RegExp(`<img src="${path}" alt=""`));
  assert.doesNotMatch(library.npcClassBadge(actor),new RegExp(`>${name}</span>`));
  actor.items[0].img=`worlds/mesa/classes/${name.toLowerCase()}.webp`;
  assert.match(library.npcClassBadge(actor),new RegExp(`src="${actor.items[0].img}"`));
 }
 library.catalog.items=[];
 const semArte={items:[{type:'class',name:'Combatente',img:'icons/svg/sword.svg'}]};
 assert.equal(library.npcClassBadge(semArte),'');
});

test('cartão de item: cor por categoria, grade só com o que o item tem e selos',()=>{
  // toda categoria do catálogo tem cor própria; nada cai no cinza de reserva
  const categorias=[...new Set(BOOK_ITEMS.map(item=>item.category))];
  for(const categoria of categorias)assert.notEqual(itemCategoryStyle(categoria).color,'#7f8c9b',`categoria sem cor: ${categoria}`);
  assert.equal(itemCategoryStyle('Categoria inventada').color,'#7f8c9b');

  const espada=BOOK_ITEMS.find(item=>item.name==='Espada longa');
  const linhas=itemProperties(espada);
  assert.deepEqual(linhas.filter(row=>row.key==='damage'),[{key:'damage',label:'Dano',value:'1d8'}]);
  assert.equal(linhas.some(row=>row.key==='reduction'),false,'arma não ganha linha de RD vazia');
  assert.equal(linhas.find(row=>row.key==='volume').value,'2');

  // volume 0 é um valor de verdade (Funda), não um campo ausente
  const funda=BOOK_ITEMS.find(item=>item.name==='Funda');
  assert.equal(itemProperties(funda).find(row=>row.key==='volume').value,'0');
  assert.equal(itemProperties({}).length,0);

  const malha=itemDescriptors(BOOK_ITEMS.find(item=>item.name==='Cota de malha'));
  assert.deepEqual(malha.map(item=>item.label),['Pesada','Barulhenta']);
  assert.ok(malha.every(item=>item.tone==='is-warn'));
  assert.equal(itemDescriptors({descriptors:'Quebradiço, leve'})[0].tone,'is-danger');
  assert.deepEqual(itemDescriptors({}),[]);
});

test('faces da moeda saem da Tabela 3-2 e batem com as regiões do livro',()=>{
  // valor igual em toda Opath: a tabela é sabor, não uma segunda economia
  const conhecidas=new Set([...REGIONS,...BEYOND].map(entry=>entry.id));
  for(const id of Object.keys(COIN_FACES))assert.ok(conhecidas.has(id),`região fora do índice: ${id}`);
  assert.deepEqual(coinFaces('thurthur'),[{moeda:'T$',face:'Uma luva'},{moeda:'P$',face:'Perfil de águia'},{moeda:'K$',face:'Perfil de um urso'}]);
  // Kravokia só tem o Trocado na tabela; as faces que faltam não são inventadas
  assert.deepEqual(coinFaces('mirmir'),[{moeda:'T$',face:'Dois frascos cruzados'}]);
  assert.deepEqual(coinFaces('regiao-inexistente'),[]);
  assert.deepEqual(coinFaces(null),[]);
});

/** Vendinha mínima para exercitar carrinho, atitude e venda pela camada de ações. */
function vendinha({attitude='indiferente',placeId='alberich'}={}){
  const stock=[{uuid:'Compendium.x.Item.a',price:100,qty:2}];
  const merchant={id:'m1',uuid:'Actor.m1',name:'Vendinha',type:'character',system:{},items:[],
    flags:{quedaco:{npc:{role:'merchant',placeId,regionId:'thurthur',shop:{markup:1,attitude,stock}}}},
    async update(change){const npc=change['flags.quedaco.npc'];if(npc)this.flags.quedaco.npc=npc;}};
  const catalog={items:[{uuid:'Compendium.x.Item.a',name:'Espada',type:'weapon',system:{price:100}}],entry(uuid){return this.items.find(item=>item.uuid===uuid);}};
  return {merchant,stock,catalog};
}
const mesaVazia=(user,actors)=>({user,actors,settings:{get:(_m,key)=>key==='sharedContent'?{}:[]}});

test('carrinho junta as linhas da mesma visita e usa a cotação da loja',async()=>{
  const {merchant,stock,catalog}=vendinha({attitude:'hostil'});
  const library=new CampaignLibrary(mesaVazia({isGM:true},[merchant]),catalog);
  await library.action('lib-cart-add','m1|Compendium.x.Item.a',{qty:1});
  await library.action('lib-cart-add','m1|Compendium.x.Item.a',{qty:1});
  assert.deepEqual(library.state.cart,{actorId:'m1',lines:[{uuid:'Compendium.x.Item.a',qty:2}]},'a mesma linha soma em vez de duplicar');

  const linha=library.shopLineQuote(merchant,merchant.flags.quedaco.npc,stock[0],2);
  assert.equal(linha.quote.unit,125,'hostil encarece 25%');
  assert.equal(linha.quote.total,250,'o total do carrinho já vem cotado');

  // trocar de mercador zera: a cotação (atitude, condição, pechincha) é de uma loja só
  assert.deepEqual(library.cartFor('outro'),{actorId:'outro',lines:[]});
  await library.action('lib-cart-remove','m1|Compendium.x.Item.a');
  assert.equal(library.state.cart.lines.length,0);
  await library.action('lib-cart-add','m1|Compendium.x.Item.a',{qty:1});
  await library.action('lib-cart-clear','');
  assert.deepEqual(library.state.cart,{actorId:'',lines:[]});
});

test('carrinho recusa item fora do estoque e loja que não está aberta',async()=>{
  const {merchant,catalog}=vendinha();
  const library=new CampaignLibrary(mesaVazia({isGM:true},[merchant]),catalog);
  await assert.rejects(library.action('lib-cart-add','m1|Compendium.x.Item.zzz',{qty:1}),/fora do estoque/);
  await assert.rejects(library.action('lib-cart-buy','m1'),/vazio/);
  merchant.flags.quedaco.npc.role='guard';
  await assert.rejects(library.action('lib-cart-add','m1|Compendium.x.Item.a',{qty:1}),/não está disponível/);
});

test('loja liberada por localidade também deixa o jogador comprar',async()=>{
  const {merchant,catalog}=vendinha();
  const settings={get:(_m,key)=>key==='npcLocalities'?['place:alberich']:key==='sharedContent'?{}:[]};
  const jogador=new CampaignLibrary({user:{isGM:false},actors:[merchant],settings},catalog);
  // antes só valia a liberação individual: o cartão da loja aparecia e a compra era recusada
  await jogador.action('lib-cart-add','m1|Compendium.x.Item.a',{qty:1});
  assert.equal(jogador.state.cart.lines.length,1);

  const fechada=new CampaignLibrary(mesaVazia({isGM:false},[merchant]),catalog);
  await assert.rejects(fechada.action('lib-cart-add','m1|Compendium.x.Item.a',{qty:1}),/não está disponível/);
});

test('atitude muda ao vivo pelo mestre, e só por ele',async()=>{
  const {merchant,catalog}=vendinha();
  const mestre=new CampaignLibrary(mesaVazia({isGM:true},[merchant]),catalog);
  await mestre.action('lib-npc-attitude','m1',{attitude:'aliado'});
  assert.equal(merchant.flags.quedaco.npc.shop.attitude,'aliado');
  assert.deepEqual(merchant.flags.quedaco.npc.shop.stock.length,1,'mexer na atitude não apaga o estoque');
  await mestre.action('lib-npc-attitude','m1',{attitude:'inventada'});
  assert.equal(merchant.flags.quedaco.npc.shop.attitude,'indiferente','atitude fora da escala volta ao padrão');

  const jogador=new CampaignLibrary(mesaVazia({isGM:false},[merchant]),catalog);
  await assert.rejects(jogador.action('lib-npc-attitude','m1',{attitude:'aliado'}),/somente/);
});

test('venda abre para qualquer NPC liberado, e não para NPC fora de alcance',async()=>{
  const {merchant,catalog}=vendinha();
  merchant.flags.quedaco.npc.role='guard';// não tem loja, mas compra do grupo
  const settings={get:(_m,key)=>key==='npcLocalities'?['place:alberich']:key==='sharedContent'?{}:[]};
  const jogador=new CampaignLibrary({user:{isGM:false},actors:[merchant],settings},catalog);
  await jogador.action('lib-npc-sell-open','m1');
  assert.equal(jogador.state.sellActorId,'m1');
  await jogador.action('lib-npc-sell-open','m1');
  assert.equal(jogador.state.sellActorId,'','clicar de novo fecha');
  await assert.rejects(jogador.action('lib-npc-sell','m1|it1',{qty:1}),/personagem/);

  const fechada=new CampaignLibrary(mesaVazia({isGM:false},[merchant]),catalog);
  await assert.rejects(fechada.action('lib-npc-sell','m1|it1',{qty:1}),/não está disponível/);
});

test('Monstros saem em ordem alfabética única, com selo de origem no cartão',()=>{
  const convertido={id:'x1',name:'Aardvark de Aço',type:'npc',
    system:{level:{value:3},creatureType:'construct',hierarchy:'simple',archetype:[],movement:{walk:true}},
    getFlag:(_m,k)=>k==='convertedFrom'?'dnd5e':null,uuid:'Actor.x1'};
  const game={user:{isGM:true},actors:[convertido],users:[],packs:[],folders:[],scenes:[],
    settings:{get:(_m,k)=>(k==='sharedContent'?{}:[])}};
  const library=new CampaignLibrary(game,{items:[],entry:()=>null});
  library.loaded=true;
  const html=library.renderMonsters(false);
  const nomes=[...html.matchAll(/<strong>([^<]+)<\/strong><span class="sy-origin-badge/g)].map(m=>m[1]);

  assert.ok(nomes.length>MONSTERS.length,'o convertido entra na mesma lista dos do livro');
  assert.deepEqual(nomes,[...nomes].sort((a,b)=>a.localeCompare(b,'pt-BR')),'uma ordem alfabética só');
  // o convertido não fica mais empurrado para o fim: "Aardvark" vem antes de "Alpaca"
  assert.equal(nomes[0],'Aardvark de Aço');
  assert.equal((html.match(/sy-origin-badge is-custom/g)??[]).length,1,'só o convertido é "Adaptado"');
  assert.ok(html.includes('>Oficial<'),'os do livro ficam marcados como oficiais');
});

test('filtro de guilda separa ficha vinculada, nome livre e quem não tem nenhuma',()=>{
  const pipi={id:'g1',uuid:'Actor.g1',name:'P.I.P.I.',type:'guild',items:[],
    system:{motto:'',abilities:{}},flags:{quedaco:{appendix:{kind:'guilda',seals:['Dragão prateado']}}}};
  const npc=(id,npcFlag)=>({id,uuid:`Actor.${id}`,name:`NPC ${id}`,type:'character',img:'',items:[],
    system:{level:{value:1}},flags:{quedaco:{npc:{role:'extra',...npcFlag}}}});
  const daPipi=npc('a',{guildUuid:'Actor.g1'});
  const daHansa=npc('b',{guild:'Hansa do Sal'});
  const semGuilda=npc('c',{});
  const game={user:{isGM:true},actors:[pipi,daPipi,daHansa,semGuilda],users:[],packs:[],folders:[],scenes:[],
    settings:{get:(_m,k)=>(k==='sharedContent'?{}:[])}};
  const library=new CampaignLibrary(game,{items:[],entry:()=>null});
  const nomesEm=html=>[...html.matchAll(/data-drag-actor="Actor\.([abc])"/g)].map(m=>m[1]).sort();

  // a lista de opções sai das guildas que os NPCs realmente têm, não do apêndice inteiro
  const todos=library.renderNpcs(false);
  assert.ok(todos.includes('name="npcGuildFilter"'));
  assert.ok(todos.includes('>P.I.P.I.<'),'a ficha vinculada entra pelo nome do Actor');
  assert.ok(todos.includes('>Hansa do Sal<'),'o nome livre também vira opção');
  assert.deepEqual(nomesEm(todos),['a','b','c']);

  library.state.npcGuildFilter='Actor.g1';
  assert.deepEqual(nomesEm(library.renderNpcs(false)),['a']);

  library.state.npcGuildFilter='none';
  assert.deepEqual(nomesEm(library.renderNpcs(false)),['c'],'"Sem guilda" pega só quem não tem nenhuma');
});

test('região e localidade usam o mesmo cartão de NPC, com filtro de papel e legado',()=>{
  const npc=(id,nome,role)=>({id,uuid:`Actor.${id}`,name:nome,type:'character',img:'',items:[],
    system:{level:{value:3}},flags:{quedaco:{npc:{role,regionId:'thurthur',placeId:'alberich'}}}});
  const game={user:{isGM:true},actors:[npc('a','Brida','merchant'),npc('b','Tore','smith')],
    users:[],packs:[],folders:[],scenes:[],settings:{get:(_m,k)=>(k==='sharedContent'?{}:[])}};
  const library=new CampaignLibrary(game,{items:[],entry:()=>null});

  const lista=library.npcsForLocation('thurthur','alberich',false);
  // T11: é o mesmo cartão das outras abas, não uma terceira renderização mais pobre
  assert.ok(lista.includes('sy-npc-card'),'usa o cartão compartilhado');
  assert.ok(lista.includes('sy-npc-portrait-card'),'usa o mesmo retrato');
  assert.ok(lista.includes('sy-npc-grid'),'entra na grade que o regulador controla');
  assert.ok(lista.includes('name="localNpcRole"'),'T6: ganhou filtro de papel');

  library.state.localNpcRole='smith';
  const filtrada=library.npcsForLocation('thurthur','alberich',false);
  assert.ok(filtrada.includes('Tore')&&!filtrada.includes('Brida'));
  assert.ok(filtrada.includes('1 de 2'),'o cabeçalho diz quantos sobraram do total');
});

test('Guildas em abas: em jogo e guardadas, e a guilda da mesa não tem botão de guardar',async()=>{
  const jogador={id:'pc',uuid:'Actor.pc',name:'Kael',type:'character',hasPlayerOwner:true,items:[],system:{level:{value:3}}};
  const npc={id:'n1',uuid:'Actor.n1',name:'Tore',type:'character',hasPlayerOwner:false,items:[],system:{level:{value:2}}};
  const guilda=(id,nome,membros)=>({id,uuid:`Actor.${id}`,name:nome,type:'guild',items:[],
    system:{motto:'',abilities:{},members:membros.map(uuid=>({uuid}))},flags:{quedaco:{appendix:{kind:'guilda',seals:[]}}}});
  const pipi=guilda('g1','P.I.P.I.',['Actor.pc']);
  const ativa=guilda('g2','Ordem Ativa',['Actor.n1']);
  const guardada=guilda('g3','Ordem Guardada',[]);
  const store={guildArchived:['Actor.g3']};
  const game={user:{isGM:true},actors:[jogador,npc,pipi,ativa,guardada],users:[],packs:[],folders:[],scenes:[],
    settings:{get:(_m,k)=>(k==='sharedContent'?{}:(store[k]??[])),set:async(_m,k,v)=>{store[k]=v;}}};
  const library=new CampaignLibrary(game,{items:[],entry:()=>null});
  const nomes=html=>[...html.matchAll(/>(P\.I\.P\.I\.|Ordem Ativa|Ordem Guardada)</g)].map(m=>m[1]);

  // aba padrão: só o que está em jogo, com as duas contagens
  const emJogo=library.renderGuilds(false);
  assert.ok(emJogo.includes('Em jogo · 2')&&emJogo.includes('Guardadas · 1'));
  assert.ok(nomes(emJogo).includes('Ordem Ativa'));
  assert.ok(!nomes(emJogo).includes('Ordem Guardada'),'guardada não aparece em jogo');

  // a guilda com ficha de jogador é "da mesa" e não oferece guardar
  assert.equal(library.tableGuildIds().has('Actor.g1'),true);
  assert.equal(library.tableGuildIds().has('Actor.g2'),false,'NPC não conta como mesa, mesmo o mestre sendo dono de tudo');
  assert.ok(emJogo.includes('★ da mesa'));
  assert.ok(!emJogo.includes('lib-guild-archive" data-id="Actor.g1'),'sem botão de guardar na guilda da mesa');

  // aba guardadas: só as guardadas, com o botão de trazer de volta
  await library.action('lib-guild-tab','guardadas');
  const guardadas=library.renderGuilds(false);
  assert.deepEqual([...new Set(nomes(guardadas))],['Ordem Guardada']);
  assert.ok(guardadas.includes('↩ Pôr em jogo'));
});

test('atlas de cenas: aba no Mapa, cada botão com ação, e as ações da ligação gravam no atlas',async()=>{
  const scenes=[{id:'s1',name:'Alberich — Praça',img:''},{id:'s2',name:'Taverna do Porto',img:''}];
  const store={sceneAtlas:{schema:1,providers:{stairways:false,native:false},scenes:{},edges:{}}};
  const criadas=[];
  globalThis.Scene={create:async data=>{const scene={id:`novo${criadas.length}`,name:data.name,img:''};criadas.push(scene);scenes.push(scene);return scene;}};
  const game={user:{isGM:true},actors:[],users:[],packs:[],folders:[],version:'13.351',
    scenes:Object.assign(scenes,{get:id=>scenes.find(s=>s.id===id)}),modules:{get:()=>null},
    settings:{get:(_m,k)=>(k==='sharedContent'?{}:(store[k]??(k==='placeScenes'||k==='regionScenes'?{}:[]))),set:async(_m,k,v)=>{store[k]=v;}}};
  const library=new CampaignLibrary(game,{items:[],entry:()=>null});
  try{
    // o mestre alterna entre as duas vistas; o jogador nunca vê o atlas
    assert.ok(library.renderMap(false).includes('Mapa Imersivo'));
    assert.ok(!library.renderMap(true).includes('sy-scene-atlas'));
    await library.action('lib-map-display','atlas');
    assert.ok(library.renderMap(false).includes('sy-scene-atlas'));

    // criar cena já pendurada num local
    await library.action('lib-atlas-scene-create','place:alberich',{name:'Porão da Guilda'});
    assert.equal(criadas.length,1);
    assert.equal(store.sceneAtlas.scenes[criadas[0].id]?.parentId,'place:alberich');
    await assert.rejects(library.action('lib-atlas-scene-create','place:alberich',{name:'  '}),/nome/);

    // ligação: nasce, e construir exige um mecanismo ligado
    await library.action('lib-atlas-edge-add','',{fromSceneId:'s1',toSceneId:'s2',label:'Porta',bidirectional:true});
    const edgeId=Object.keys(store.sceneAtlas.edges)[0];
    assert.ok(edgeId,'a ligação foi gravada');
    await assert.rejects(library.action('lib-atlas-build',edgeId),/Ligue o Stairways ou as Regiões/);
    await assert.rejects(library.action('lib-atlas-build-all'),/posicionadas/);
  }finally{delete globalThis.Scene;}
});
/** Mundo pequeno, mas com conteúdo suficiente para abrir os controles condicionais das
 * abas: loja com estoque, guilda da personagem, duas cenas ligadas e uma quest. */
function mundoDasAcoes(isGM){
  const equipamento={id:'espada',uuid:'Actor.pc.Item.espada',name:'Espada longa',type:'weapon',img:'espada.webp',system:{natural:false,price:100}};
  const personagem={id:'pc',uuid:'Actor.pc',name:'Iara',type:'character',isOwner:true,hasPlayerOwner:true,img:'iara.webp',items:[equipamento],flags:{},system:{level:{value:3},currency:{t:2000,p:0,k:0},fragments:{max:5}},sheet:{render(){}}};
  const mercador={id:'mercador',uuid:'Actor.mercador',name:'Brida',type:'character',isOwner:false,hasPlayerOwner:false,img:'brida.webp',items:[],ownership:{default:1},system:{level:{value:2}},sheet:{render(){}},
    flags:{quedaco:{npc:{role:'merchant',regionId:'thurthur',placeId:'alberich',tokenVisible:true,note:'',shop:{markup:1,attitude:'indiferente',stock:[{uuid:'Compendium.teste.Item.espada',price:100,qty:2,qtyMax:2}]}}}}};
  const guilda={id:'guilda',uuid:'Actor.guilda',name:'Companhia do Porto',type:'guild',img:'guilda.webp',items:[],system:{motto:'Sempre adiante',abilities:{},members:[{uuid:'Actor.pc'}]},flags:{quedaco:{appendix:{kind:'guilda',seals:[]}}},sheet:{render(){}}};
  const listaCenas=[
    {id:'praca',name:'Alberich — Praça',img:'praca.webp',background:{src:'praca.webp'},view(){}},
    {id:'taverna',name:'Taverna do Porto',img:'taverna.webp',background:{src:'taverna.webp'},view(){}}
  ];
  const scenes=Object.assign(listaCenas,{get:id=>listaCenas.find(scene=>scene.id===id)});
  const sharedContent={
    areas:['npcs','guilds','map','monsters','items','imbue'],
    map:['thurthur','alberich'],monsters:MONSTERS.map(entry=>entry.id),items:BOOK_ITEMS.map(entry=>entry.id),
    npcs:['Actor.mercador'],guilds:['Actor.guilda']
  };
  const store={
    sharedContent,npcLocalities:['place:alberich'],npcKnown:['Actor.mercador'],npcHidden:[],npcLinks:[],npcGraph:{},
    placeScenes:{alberich:'praca'},regionScenes:{thurthur:['praca']},regionImages:{},placeImages:{},opathMapImage:'opath.webp',
    mapHotspots:{regions:{},places:{}},mapHidden:[],monsterHabitats:{},monsterPlaces:{},monsterAnywhere:[],
    regionRumors:{thurthur:[{id:'rumor-1',text:'Navios somem ao anoitecer.',shared:true}]},regionMainScene:{thurthur:'praca'},regionSceneInfo:{},guildArchived:[],generatedArchetypes:{},
    sceneAtlas:{schema:1,providers:{stairways:true,native:true},scenes:{praca:{parentId:'place:alberich'},taverna:{parentId:'scene:praca'}},edges:{porta:{id:'porta',label:'Porta da taverna',bidirectional:true,from:{sceneId:'praca',x:100,y:120},to:{sceneId:'taverna',x:80,y:90},runtimeProvider:'stairways',implementations:{stairways:{status:'ready'},native:{status:'ready'}}}}}
  };
  const questAPI={DB:{getAllQuests:()=>[{id:'q1',name:'Entrega no porto',status:'active',location:'Alberich',giverData:{name:'Brida'},tasks:[{uuidv4:'t1',name:'Levar o pacote'}],rewards:[],subquests:[]}],hooks:{}},open(){}};
  const modules=new Map([
    ['forien-quest-log',{active:true,public:{QuestAPI:questAPI}}],
    ['stairways',{active:true,version:'0.11.1'}]
  ]);
  const user={id:isGM?'gm':'jogador',name:isGM?'Mestra':'Jogadora',isGM,character:personagem,flags:{quedaco:{}},setFlag:async()=>{}};
  return {
    user,users:[user],actors:[personagem,mercador,guilda],folders:[],packs:[],scenes,modules,version:'13.351',canvas:{tokens:{controlled:[]}},
    settings:{get:(module,key)=>module==='forien-quest-log'?false:store[key],set:async(_module,key,value)=>{store[key]=value;}}
  };
}

test('todo data-op das abas do mestre e da visão do jogador tem ação',async()=>{
  const catalog={items:[{uuid:'Compendium.teste.Item.espada',name:'Espada longa',type:'weapon',img:'espada.webp',system:{price:100}}],entry(uuid){return this.items.find(item=>item.uuid===uuid);}};
  const mestre=new CampaignLibrary(mundoDasAcoes(true),catalog);
  const jogador=new CampaignLibrary(mundoDasAcoes(false),catalog);
  mestre.state.npcActor='mercador';
  jogador.state.npcPlayerRegion='thurthur';
  const areas=['npcs','guilds','map','monsters','items','imbue','quests'];
  const telas=areas.map(area=>[`mestre/${area}`,mestre.render(area)]);
  mestre.state.mapDisplay='atlas';
  telas.push(['mestre/map-atlas',mestre.render('map')]);
  for(const area of areas)telas.push([`jogador/${area}`,jogador.render(area,true)]);

  const aparicoes=new Map();
  for(const [tela,html] of telas){
    for(const match of html.matchAll(/\bdata-op=(["'])(lib-[a-z0-9-]+)\1/g)){
      const op=match[2],lista=aparicoes.get(op)??[];
      if(!lista.includes(tela))lista.push(tela);
      aparicoes.set(op,lista);
    }
  }
  const fonte=(await import('node:fs')).readFileSync(new URL('../src/library.mjs',import.meta.url),'utf8');
  const tratadas=new Set([...fonte.matchAll(/\bop\s*===\s*(["'])(lib-[a-z0-9-]+)\1/g)].map(match=>match[2]));
  const ausentes=[...aparicoes].filter(([op])=>!tratadas.has(op)).sort(([a],[b])=>a.localeCompare(b));
  assert.equal(ausentes.length,0,`Ações ausentes em CampaignLibrary.action():\n${ausentes.map(([op,vistas])=>`- ${op} (${vistas.join(', ')})`).join('\n')}`);
});

const guildFixture=(id,name,{kind='guilda',members=[],seals=[]}={})=>({
  id,uuid:`Actor.${id}`,name,type:'guild',items:[],hasPlayerOwner:false,
  system:{level:2,motto:'',abilities:{},members:members.map(uuid=>({uuid,founder:false,retired:false}))},
  flags:{quedaco:{appendix:{kind,seals}}}
});
const redistributionNpc=(id,guildUuid='Actor.antiga')=>({
  id,uuid:`Actor.${id}`,name:`NPC ${id}`,type:'character',hasPlayerOwner:false,items:[],
  system:{level:{value:1+(Number(id.replace(/\D/g,''))||0)%8}},
  flags:{quedaco:{npc:{role:'extra',regionId:'thurthur',placeId:'',guildUuid,guild:'Antiga',shop:{stock:[]}}}}
});

test('guildas protegidas por nome, jogador ou selo nunca podem ser guardadas',async()=>{
  const pc={id:'pc',uuid:'Actor.pc',name:'Jogador',type:'character',hasPlayerOwner:true,system:{level:{value:5}},flags:{}};
  const porNome=guildFixture('pipi','P. I. P. I.'),porJogador=guildFixture('grupo','Companhia da Mesa',{members:['Actor.pc']});
  const porSelo=guildFixture('prata','Sentinelas',{seals:['Dragão prateado']}),comum=guildFixture('comum','Guilda Vazia');
  const store={guildArchived:[]},game={user:{isGM:true},actors:[pc,porNome,porJogador,porSelo,comum],settings:{get:(_m,k)=>store[k]??(k==='sharedContent'?{}:[]),set:async(_m,k,v)=>{store[k]=v;}}};
  const library=new CampaignLibrary(game,{items:[]});
  assert.deepEqual([...library.tableGuildIds()].sort(),['Actor.grupo','Actor.pipi','Actor.prata']);
  await assert.rejects(library.setGuildArchived(porNome.uuid,true),/guilda da mesa/i);
  await assert.rejects(library.setGuildArchived(porSelo.uuid,true),/Dragão prateado/i);
  assert.deepEqual(store.guildArchived,[],'recusa não grava o setting');
  assert.equal(await library.archiveEmptyGuilds(),1);
  assert.deepEqual(store.guildArchived,['Actor.comum'],'guardar vazias pula todas as protegidas');
});

test('botão de redistribuir aparece somente para Mestra na aba Em jogo',async()=>{
  const pipi=guildFixture('pipi','P.I.P.I.'),outra=guildFixture('g1','Guilda Um');
  const store={guildArchived:['Actor.g1'],sharedContent:{guilds:['Actor.pipi','Actor.g1']}};
  const game={user:{isGM:true},actors:[pipi,outra],settings:{get:(_m,k)=>store[k]??[]}};
  const library=new CampaignLibrary(game,{items:[]});
  assert.match(library.renderGuilds(false),/data-op="lib-guild-redistribute"[^>]*>Redistribuir membros/);
  library.state.guildTab='guardadas';
  assert.doesNotMatch(library.renderGuilds(false),/lib-guild-redistribute/);
  game.user.isGM=false;library.state.guildTab='ativas';
  assert.doesNotMatch(library.renderGuilds(true),/lib-guild-redistribute/);
});

test('cancelar redistribuição não grava Actor nem lista de guardadas',async()=>{
  const pipi=guildFixture('pipi','P.I.P.I.'),ativa=guildFixture('g1','Guilda Um');
  const npc=redistributionNpc('n1'),store={guildArchived:[]},writes=[];
  const game={user:{isGM:true},actors:[pipi,ativa,npc],settings:{get:(_m,k)=>store[k]??(k==='sharedContent'?{}:[]),set:async(_m,k,v)=>{writes.push([k,v]);store[k]=v;}}};
  const previousFoundry=globalThis.foundry,previousActor=globalThis.Actor;
  let dialog=null,actorWrites=0;
  globalThis.foundry={applications:{api:{DialogV2:{confirm:async options=>{dialog=options;return false;}}}}};
  globalThis.Actor={updateDocuments:async()=>{actorWrites++;}};
  try{
    const result=await new CampaignLibrary(game,{items:[]}).action('lib-guild-redistribute');
    assert.equal(result,undefined,'action encerra normalmente quando a Mestra cancela');
    assert.match(dialog.window.title,/Redistribuir membros/);
    assert.match(dialog.content,/P\.I\.P\.I\./);
    assert.equal(actorWrites,0);assert.deepEqual(writes,[]);
  }finally{globalThis.foundry=previousFoundry;globalThis.Actor=previousActor;}
});

test('redistribuição confirma resumo, grava NPCs e guildas em lotes de 50 e setting por último',async()=>{
  const pc={id:'pc',uuid:'Actor.pc',name:'Jogador',type:'character',hasPlayerOwner:true,system:{level:{value:7}},flags:{}};
  const pipi=guildFixture('pipi','P.I.P.I.',{members:['Actor.pc']}),guilds=Array.from({length:70},(_,i)=>guildFixture(`g${i}`,`Guilda ${i}`));
  const hansas=Array.from({length:20},(_,i)=>guildFixture(`h${i}`,`Hansa ${i}`,{kind:'hansa'}));
  const npcs=Array.from({length:120},(_,i)=>redistributionNpc(`n${i}`));
  const store={guildArchived:[]},events=[],settingsWrites=[];
  const game={user:{isGM:true},actors:[pc,pipi,...guilds,...hansas,...npcs],settings:{get:(_m,k)=>store[k]??(k==='sharedContent'?{}:[]),set:async(_m,k,v)=>{events.push('setting');settingsWrites.push([k,v]);store[k]=v;}}};
  const previousFoundry=globalThis.foundry,previousActor=globalThis.Actor,previousUi=globalThis.ui;
  const batches=[];let dialog=null;
  globalThis.foundry={applications:{api:{DialogV2:{confirm:async options=>{dialog=options;return true;}}}}};
  globalThis.Actor={updateDocuments:async batch=>{events.push('actors');batches.push(batch);return batch;}};
  globalThis.ui={notifications:{info(){}}};
  try{
    const plan=await new CampaignLibrary(game,{items:[]}).redistributeGuildMembers();
    assert.ok(plan?.counts?.changedNpcs>50);assert.ok(plan?.counts?.changedGuilds>50);
    assert.ok(batches.length>=4,'há mais de um lote tanto para NPCs quanto para guildas');
    assert.ok(batches.every(batch=>batch.length>0&&batch.length<=50),'nenhum lote ultrapassa 50 updates');
    const npcBatches=batches.filter(batch=>Object.hasOwn(batch[0],'flags.quedaco.npc'));
    const guildBatches=batches.filter(batch=>Object.hasOwn(batch[0],'system.members'));
    assert.ok(npcBatches.length>=2);assert.ok(guildBatches.length>=2);
    assert.equal(npcBatches.flat().length,plan.counts.changedNpcs);
    assert.equal(guildBatches.flat().length,plan.counts.changedGuilds);
    assert.equal(settingsWrites.length,1);assert.equal(settingsWrites[0][0],'guildArchived');
    assert.equal(events.at(-1),'setting','lista de guardadas só grava depois de todos os Actors');
    assert.match(dialog.content,new RegExp(`<strong>${plan.counts.changedNpcs}</strong> NPC`));
    assert.match(dialog.content,/em guilda/);assert.match(dialog.content,/em hansa/);assert.match(dialog.content,/sem nenhuma/);
    assert.match(dialog.content,/P\.I\.P\.I\./);assert.match(dialog.content,/ficha de jogador|nome/i);
    const allNpcUpdates=npcBatches.flat();assert.ok(allNpcUpdates.every(update=>update['flags.quedaco.npc'].guild===''));
    const allGuildUpdates=guildBatches.flat();assert.ok(allGuildUpdates.every(update=>Array.isArray(update['system.members'])&&Number.isFinite(update['system.level'])));
  }finally{globalThis.foundry=previousFoundry;globalThis.Actor=previousActor;globalThis.ui=previousUi;}
});

test('painel da cena ativa (T6, Mapa Imersivo): junta NPCs, guilda, mercador e rumor da localidade da cena ativa',async()=>{
  const mercador={id:'mercador',uuid:'Actor.mercador',name:'Brida',type:'character',isOwner:false,hasPlayerOwner:false,img:'brida.webp',items:[],ownership:{default:1},system:{level:{value:2}},sheet:{render(){}},
    flags:{quedaco:{npc:{role:'merchant',regionId:'thurthur',placeId:'alberich',tokenVisible:true,note:'',shop:{markup:1,attitude:'indiferente',stock:[{uuid:'Compendium.teste.Item.espada',price:100,qty:2,qtyMax:2}]}}}}};
  const guilda={id:'guilda',uuid:'Actor.guilda',name:'Companhia do Porto',type:'guild',img:'guilda.webp',items:[],system:{motto:'',abilities:{},members:[]},flags:{quedaco:{npc:{guildUuid:'Actor.guilda'}}}};
  // a própria flag de guildUuid do mercador é o que o liga à guilda — guildsForPlace lê isso
  mercador.flags.quedaco.npc.guildUuid='Actor.guilda';
  const cenaInativa={id:'taverna',name:'Taverna do Porto',active:false};
  const cenaAtiva={id:'praca',name:'Alberich — Praça',active:true};
  const scenes=Object.assign([cenaAtiva,cenaInativa],{get:id=>[cenaAtiva,cenaInativa].find(s=>s.id===id)});
  const store={
    sceneAtlas:{schema:1,providers:{stairways:false,native:false},scenes:{praca:{parentId:'place:alberich'}},edges:{}},
    npcLocalities:[],regionRumors:{thurthur:[{id:'r1',text:'Navios somem ao anoitecer.',shared:true}]},
    regionRumorRoll:null,placeScenes:{},regionScenes:{}
  };
  const game={user:{isGM:true},actors:[mercador,guilda],users:[],packs:[],folders:[],version:'13.351',scenes,modules:{get:()=>null},
    settings:{get:(_m,k)=>(k==='sharedContent'?{}:(store[k]??{})),set:async(_m,k,v)=>{store[k]=v;}}};
  const library=new CampaignLibrary(game,{items:[]});
  const painel=library.renderMap(false);
  assert.match(painel,/CENA ATIVA/);
  assert.match(painel,/Alberich — Praça/);
  assert.match(painel,/Brida/); // NPC da localidade
  assert.match(painel,/Companhia do Porto/); // guilda presente
  assert.match(painel,/sy-active-scene-merchant/); // tira de atitude do mercador
  assert.match(painel,/Liberar esta localidade/);
  // sem cena ativa nenhuma: painel não aparece
  cenaAtiva.active=false;
  assert.doesNotMatch(library.renderMap(false),/CENA ATIVA/);
  cenaAtiva.active=true;
  // cena ativa fora do atlas: avisa e não quebra
  store.sceneAtlas={schema:1,providers:{stairways:false,native:false},scenes:{},edges:{}};
  const semAtlas=library.renderMap(false);
  assert.match(semAtlas,/ainda não está no Mapa Imersivo/);
  // jogador nunca vê o painel
  assert.doesNotMatch(library.renderMap(true),/CENA ATIVA/);
});

test('shouldAskReleaseOnActivate (T7): configuração desligada, sem localidade e localidade já liberada não perguntam',()=>{
  const locality={regionId:'thurthur',placeId:'alberich'};
  const vazio=new Set();
  const liberado=new Set(['place:alberich']);
  assert.equal(shouldAskReleaseOnActivate({askEnabled:false,locality,npcLocalities:vazio}),false);
  assert.equal(shouldAskReleaseOnActivate({askEnabled:true,locality:null,npcLocalities:vazio}),false);
  assert.equal(shouldAskReleaseOnActivate({askEnabled:true,locality,npcLocalities:liberado}),false);
  assert.equal(shouldAskReleaseOnActivate({askEnabled:true,locality,npcLocalities:vazio}),true);
  // só região (sem local): confere pela chave region:
  assert.equal(shouldAskReleaseOnActivate({askEnabled:true,locality:{regionId:'thurthur',placeId:''},npcLocalities:new Set(['region:thurthur'])}),false);
  assert.equal(shouldAskReleaseOnActivate({askEnabled:true,locality:{regionId:'thurthur',placeId:''},npcLocalities:vazio}),true);
});

test('conferência da região conta cada pendência, abre os documentos certos e marca a região pronta',()=>{
  const region=REGIONS.find(entry=>entry.id==='thurthur'),places=PLACES.filter(place=>place.regionId===region.id);
  const guild={id:'guilda',uuid:'Actor.guilda',name:'Companhia',type:'guild',system:{members:[]},flags:{quedaco:{appendix:{}}}};
  const flag=(placeId,extra={})=>({role:'extra',regionId:region.id,placeId,guildUuid:guild.uuid,guild:'',shop:{stock:[{uuid:'Item.x'}]},...extra});
  const actor=(id,items,placeId,extra={},img='retrato.webp')=>({id,uuid:`Actor.${id}`,name:id,type:'character',img,items,system:{level:{value:2}},flags:{quedaco:{npc:flag(placeId,extra)}}});
  const complete=[{type:'legacy',name:'Legado'},{type:'heritage',name:'Herança'}];
  const cases=[
    actor('sem-legado',[{type:'heritage',name:'Herança'}],places[0].id),
    actor('sem-heranca',[{type:'legacy',name:'Legado'}],places[0].id),
    actor('sem-local',complete,''),
    actor('sem-guilda',complete,places[1].id,{guildUuid:'',guild:''}),
    actor('retrato-provisorio',complete,places[2].id,{},'icons/svg/mystery-man.svg'),
    actor('mercador-vazio',complete,places[3].id,{role:'merchant',shop:{stock:[]}})
  ];
  const sceneByPlace=Object.fromEntries(places.map((place,index)=>[place.id,`cena-${index}`]));
  const scenes=Object.values(sceneByPlace).map(id=>({id,name:id}));scenes.push({id:'fora-atlas',name:'Cena fora do atlas'});
  const store={placeScenes:sceneByPlace,regionScenes:{[region.id]:['fora-atlas']},regionRumors:{},sceneAtlas:{schema:1,providers:{stairways:false,native:false},scenes:{},edges:{}}};
  const game={user:{isGM:true},actors:[...cases,guild],scenes,settings:{get:(_m,key)=>store[key]??{}}};
  const library=new CampaignLibrary(game,{items:[]});
  library.rumorSeeds=()=>[];
  const report=library.regionReadiness(region);
  assert.deepEqual(report.noLegacy.map(actor=>actor.id),['sem-legado']);
  assert.deepEqual(report.noHeritage.map(actor=>actor.id),['sem-heranca']);
  assert.deepEqual(report.noPlace.map(actor=>actor.id),['sem-local']);
  assert.deepEqual(report.noGuild.map(actor=>actor.id),['sem-guilda']);
  assert.deepEqual(report.placeholderPortrait.map(actor=>actor.id),['retrato-provisorio']);
  assert.deepEqual(report.merchantEmptyStock.map(actor=>actor.id),['mercador-vazio']);
  assert.equal(report.missingScenePlaces.length,0);
  assert.deepEqual(report.scenesOutsideAtlas.map(scene=>scene.id),['fora-atlas']);
  assert.ok(report.localitiesWithoutRumor.some(place=>place.id===places[0].id));
  const html=library.renderRegionReadiness(region);
  assert.match(html,/CONFERÊNCIA DA REGIÃO/);assert.match(html,/data-op="lib-npc-edit" data-id="sem-legado"/);assert.match(html,/data-op="lib-place"/);assert.match(html,/data-op="lib-open-scene" data-id="fora-atlas"/);

  const readyStore={placeScenes:sceneByPlace,regionScenes:{},regionRumors:{},sceneAtlas:{schema:1,providers:{stairways:false,native:false},scenes:{},edges:{}}};
  const ready=new CampaignLibrary({user:{isGM:true},actors:[],scenes,settings:{get:(_m,key)=>readyStore[key]??{}}},{items:[]});
  assert.match(ready.renderRegionReadiness(region),/Região pronta para servir de modelo/);
});
