import test from 'node:test';
import assert from 'node:assert/strict';
import {REGIONS,PLACES,BEYOND,COIN_FACES,coinFaces} from '../src/book-world.mjs';
import {MONSTERS} from '../src/book-monsters.mjs';
import {BOOK_ITEMS,CampaignLibrary,DEFAULT_GENERATOR_MACRO,findMatches,generatorMacroName,itemCategoryStyle,itemDescriptors,itemFallback,itemProperties,monsterAudit,monsterCategory,monsterMatches} from '../src/library.mjs';
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

test('região aceita várias cenas vinculadas e mostra os atalhos',async()=>{
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
 assert.match(library.regionDetail(region,false),/data-op="lib-open-scene" data-id="s3"/);
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

test('NPC de região liberada aparece ao jogador sem ter sido liberado um a um',()=>{
 const actor={id:'x',uuid:'Actor.x',name:'Mercador',type:'character',flags:{quedaco:{npc:{role:'merchant',regionId:'mirmir',placeId:'',shop:{stock:[]}}}}};
 const shared={areas:['npcs'],npcs:[],map:[],monsters:[],items:[]};
 const game={user:{isGM:false,character:null},users:[],actors:[actor],settings:{get:(_m,key)=>key==='sharedContent'?shared:key==='npcLocalities'?['region:mirmir']:''}};
 const library=new CampaignLibrary(game,{items:[]});
 assert.match(library.render('npcs',true),/data-op="lib-npc-player-region" data-id="mirmir"/);
 library.state.npcPlayerRegion='mirmir';
 assert.match(library.render('npcs',true),/Mercador/);
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
