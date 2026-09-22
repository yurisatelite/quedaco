import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignAtlasScene,
  buildSceneAtlasTree,
  cloneSceneAtlas,
  createAtlasEdge,
  createSceneAtlas,
  normalizeSceneAtlas,
  registerAtlasScene,
  removeAtlasEdge,
  removeAtlasScene,
  resolveSceneLocality,
  sceneAtlasCounts,
  setAtlasEdgeRuntimeProvider,
  setAtlasEndpointCoordinates,
  setSceneAtlasProvider,
  syncAtlasScenes,
  updateAtlasEdge
} from '../src/scene-atlas.mjs';

const edge={
  id:'porta-a-b',label:'Porta A/B',bidirectional:true,
  from:{sceneId:'a'},to:{sceneId:'b'},runtimeProvider:'none',implementations:{}
};

test('normalização gera clone seguro, corrige ciclos e descarta campos inválidos',()=>{
  const raw={
    schema:99,
    providers:{stairways:1,native:0,extra:true},
    scenes:{a:{parentId:'scene:b'},b:{parentId:'scene:a'},c:{parentId:'inválido'},'':{parentId:'region:x'}},
    edges:{x:{...edge,from:{sceneId:'a',x:12,y:'não'},implementations:{native:{regionId:'r1'}},extra:true}},
    extra:true
  };
  const normalized=normalizeSceneAtlas(raw);
  assert.equal(normalized.schema,1);
  assert.deepEqual(normalized.providers,{stairways:true,native:false});
  assert.deepEqual(normalized.scenes,{a:{parentId:'unassigned'},b:{parentId:'unassigned'},c:{parentId:'unassigned'}});
  assert.deepEqual(normalized.edges.x.from,{sceneId:'a',x:12});
  assert.equal(normalized.edges.x.extra,undefined);
  normalized.edges.x.implementations.native.regionId='alterado';
  assert.equal(raw.edges.x.implementations.native.regionId,'r1');
  assert.deepEqual(cloneSceneAtlas(null),createSceneAtlas());
});

test('registro, sincronização e remoção preservam Scenes ausentes até remoção explícita',()=>{
  let atlas=registerAtlasScene(createSceneAtlas(),'antiga','region:r1');
  atlas=syncAtlasScenes(atlas,[{id:'nova',name:'Nova'}]);
  assert.deepEqual(atlas.scenes,{antiga:{parentId:'region:r1'},nova:{parentId:'unassigned'}});
  atlas=assignAtlasScene(atlas,'nova','scene:antiga');
  assert.throws(()=>assignAtlasScene(atlas,'antiga','scene:nova'),/ciclo/i);
  assert.throws(()=>assignAtlasScene(atlas,'nova','qualquer'),/Pai de Scene inválido/);
  atlas=removeAtlasScene(atlas,'antiga');
  assert.deepEqual(atlas.scenes,{nova:{parentId:'unassigned'}});
});

test('arestas têm ciclo de vida imutável e registram coordenadas dos endpoints',()=>{
  const base=createSceneAtlas();
  let atlas=createAtlasEdge(base,edge);
  assert.deepEqual(base,createSceneAtlas());
  assert.deepEqual(Object.keys(atlas.scenes),['a','b']);
  assert.throws(()=>createAtlasEdge(atlas,edge),/já registrada/);
  atlas=setAtlasEndpointCoordinates(atlas,'porta-a-b','from',{x:100,y:200});
  atlas=setAtlasEndpointCoordinates(atlas,'porta-a-b','to',{x:300,y:400});
  atlas=updateAtlasEdge(atlas,'porta-a-b',{label:'Escadaria',implementations:{native:{trigger:'r1'}}});
  atlas=setAtlasEdgeRuntimeProvider(atlas,'porta-a-b','native');
  atlas=setSceneAtlasProvider(atlas,'native',true);
  assert.equal(atlas.edges['porta-a-b'].label,'Escadaria');
  assert.deepEqual(atlas.edges['porta-a-b'].from,{sceneId:'a',x:100,y:200});
  assert.equal(atlas.edges['porta-a-b'].runtimeProvider,'native');
  assert.equal(atlas.providers.native,true);
  assert.deepEqual(sceneAtlasCounts(atlas,[{id:'a'},{id:'b'}]),{
    scenes:2,actualScenes:2,assignedScenes:0,unassignedScenes:2,missingScenes:0,
    edges:1,bidirectionalEdges:1,positionedEdges:1,
    runtimeProviders:{none:0,stairways:0,native:1},providers:{stairways:false,native:true}
  });
  atlas=removeAtlasEdge(atlas,'porta-a-b');
  assert.equal(Object.keys(atlas.edges).length,0);
});

test('árvore combina livro, cenas reais, hierarquia de Scene e settings legados',()=>{
  const regions=[{id:'r1',name:'Região Um'},{id:'r2',name:'Região Dois'}];
  const places=[
    {id:'cidade',regionId:'r1',name:'Cidade',kind:'Cidade'},
    {id:'taverna',regionId:'r1',parentId:'cidade',name:'Taverna',kind:'Local'}
  ];
  let atlas=createSceneAtlas();
  atlas=registerAtlasScene(atlas,'interior');
  atlas=registerAtlasScene(atlas,'andar');
  atlas=assignAtlasScene(atlas,'andar','scene:interior');
  atlas=registerAtlasScene(atlas,'fantasma','region:r2');
  atlas=createAtlasEdge(atlas,{...edge,from:{sceneId:'cidade-map'},to:{sceneId:'interior'}});
  const tree=buildSceneAtlasTree({
    atlas,regions,places,
    scenes:[{id:'cidade-map',name:'Mapa da Cidade'},{id:'interior',name:'Interior'},{id:'andar',name:'Segundo andar'},{id:'solta',name:'Cena solta'}],
    placeScenes:{cidade:'cidade-map',taverna:'interior'},
    regionScenes:{r2:['regional']}
  });
  const r1=tree.children.find(node=>node.id==='region:r1');
  const city=r1.children.find(node=>node.id==='place:cidade');
  const tavern=city.children.find(node=>node.id==='place:taverna');
  const interior=tavern.children.find(node=>node.id==='scene:interior');
  assert.equal(city.children.find(node=>node.id==='scene:cidade-map').label,'Mapa da Cidade');
  assert.equal(interior.children[0].id,'scene:andar');
  assert.equal(tree.children.find(node=>node.id==='region:r2').counts.scenes,2);
  assert.equal(tree.children.find(node=>node.id==='unassigned').children[0].id,'scene:solta');
  assert.equal(tree.summary.missingScenes,1);
  assert.equal(tree.summary.conceptualScenes,6);
  assert.equal(tree.summary.legacyAssignedScenes,3);
  assert.equal(tree.counts.edges,1);
});

test('resolveSceneLocality (T6): local direto, cena aninhada, só região, e nada — nos quatro casos do "pronto quando"',()=>{
  const atlas={schema:1,providers:{stairways:false,native:false},edges:{},scenes:{
    praca:{parentId:'place:foice'},
    taverna:{parentId:'scene:praca'}, // cena dentro de outra cena
    posto:{parentId:'region:huma'},
    solta:{parentId:'unassigned'}
  }};
  assert.deepEqual(resolveSceneLocality(atlas,'praca'),{regionId:'huma',placeId:'foice'});
  assert.deepEqual(resolveSceneLocality(atlas,'taverna'),{regionId:'huma',placeId:'foice'});
  assert.deepEqual(resolveSceneLocality(atlas,'posto'),{regionId:'huma',placeId:''});
  assert.equal(resolveSceneLocality(atlas,'solta'),null);
  assert.equal(resolveSceneLocality(atlas,'nao-cadastrada'),null);
});

test('resolveSceneLocality cai nos mapas legados (placeScenes/regionScenes) quando a cena não está no atlas',()=>{
  const atlas=createSceneAtlas();
  assert.deepEqual(resolveSceneLocality(atlas,'cena-antiga',{placeScenes:{foice:'cena-antiga'}}),{regionId:'huma',placeId:'foice'});
  assert.deepEqual(resolveSceneLocality(atlas,'cena-regiao',{regionScenes:{huma:['cena-regiao']}}),{regionId:'huma',placeId:''});
  assert.equal(resolveSceneLocality(atlas,'cena-antiga',{placeScenes:{foice:'cena-antiga'},includeLegacy:false}),null,'auditoria distingue vínculo legado de cena organizada no atlas');
  assert.equal(resolveSceneLocality(atlas,'nunca-vinculada'),null);
});

// ── T13 §2 — quebra-cabeça por região ──
import {buildRegionPuzzle,regionLocalityTree,resetAtlasLayout,sceneNeighborhood,setAtlasLayoutPosition} from '../src/scene-atlas.mjs';
import {suggestSceneParents} from '../src/scene-atlas.mjs';
import {missingPlaceScenePlan} from '../src/scene-atlas.mjs';
import {MAP_BANK_SELECTION,mapBuildProgress,mapPortalDrafts,mapSourceFor} from '../src/map-bank.mjs';
import {PLACES} from '../src/book-world.mjs';

test('layout do quebra-cabeça: normaliza, grava, limpa e some junto com a cena removida',()=>{
  const sujo=normalizeSceneAtlas({layout:{deserto:{'place:kravokia':{x:10.6,y:-5},'scene:a':{x:'1',y:2},'lixo':{x:1,y:1},'scene:b':{x:99999,y:3}},vazio:{}}});
  assert.deepEqual(sujo.layout,{deserto:{'place:kravokia':{x:11,y:0},'scene:b':{x:6000,y:3}}});
  let atlas=registerAtlasScene(createSceneAtlas(),'a','place:kravokia');
  atlas=setAtlasLayoutPosition(atlas,'deserto','scene:a',{x:120,y:80});
  assert.deepEqual(atlas.layout.deserto['scene:a'],{x:120,y:80});
  assert.throws(()=>setAtlasLayoutPosition(atlas,'deserto','qualquer',{x:1,y:1}),/Caixa/);
  assert.throws(()=>setAtlasLayoutPosition(atlas,'deserto','scene:a',{x:'1',y:1}),/Posição/);
  // gravar posição não mexe na hierarquia
  assert.equal(atlas.scenes.a.parentId,'place:kravokia');
  assert.equal(removeAtlasScene(atlas,'a').layout.deserto,undefined);
  assert.equal(setAtlasLayoutPosition(atlas,'deserto','scene:a',null).layout.deserto,undefined);
  assert.deepEqual(resetAtlasLayout(atlas,'deserto').layout,{});
});

test('buildRegionPuzzle: caixas do que já existe, ligadas pela hierarquia, portal tracejado e posição lembrada',()=>{
  const regions=[{id:'deserto',name:'Deserto de Mirmir'},{id:'outra',name:'Outra'}];
  const places=[{id:'kravokia',regionId:'deserto',name:'Kravokia'},{id:'porto',regionId:'deserto',name:'Porto de Kravokia',parentId:'kravokia'},{id:'atoleiro',regionId:'deserto',name:'Atoleiro'},{id:'longe',regionId:'outra',name:'Longe'}];
  const scenes=[{id:'cidade',name:'Kravokia'},{id:'cais',name:'Cais'},{id:'masmorra',name:'Masmorra'},{id:'fora',name:'Fora'}];
  let atlas=createSceneAtlas();
  for(const [id,parent] of [['cidade','place:kravokia'],['cais','place:porto'],['masmorra','scene:cidade'],['fora','place:longe']])atlas=registerAtlasScene(atlas,id,parent);
  atlas=createAtlasEdge(atlas,{id:'tunel',label:'Túnel',bidirectional:true,from:{sceneId:'cais'},to:{sceneId:'masmorra'}});
  atlas=createAtlasEdge(atlas,{id:'estrada',label:'Estrada',from:{sceneId:'cidade'},to:{sceneId:'fora'}});
  const tree=buildSceneAtlasTree({atlas,regions,places,scenes});
  const puzzle=buildRegionPuzzle({tree,regionId:'deserto',atlas});
  const ids=puzzle.nodes.map(node=>node.id).sort();
  assert.deepEqual(ids,['place:atoleiro','place:kravokia','place:porto','region:deserto','scene:cais','scene:cidade','scene:masmorra']);
  const has=(from,to,kind)=>puzzle.links.some(link=>link.from===from&&link.to===to&&link.kind===kind);
  assert.ok(has('region:deserto','place:kravokia','hierarchy'));
  assert.ok(has('place:kravokia','place:porto','hierarchy'),'sub-local liga no local-pai');
  assert.ok(has('scene:cidade','scene:masmorra','hierarchy'),'cena dentro de cena');
  assert.ok(has('scene:cais','scene:masmorra','portal'),'teletransporte é outra linha');
  assert.deepEqual(puzzle.externals.map(link=>[link.nodeId,link.otherSceneId]),[['scene:cidade','fora']]);
  // arranjo inicial: ninguém empilhado no mesmo ponto
  assert.equal(new Set(puzzle.nodes.map(node=>`${node.x},${node.y}`)).size,puzzle.nodes.length);
  const region=puzzle.nodes.find(node=>node.id==='region:deserto');
  assert.ok(puzzle.nodes.filter(node=>node!==region).every(node=>node.y>region.y),'região fica no topo');
  // posição guardada vence o arranjo inicial, e o quadro cresce pra caber
  const moved=setAtlasLayoutPosition(atlas,'deserto','scene:masmorra',{x:1500,y:900});
  const again=buildRegionPuzzle({tree:buildSceneAtlasTree({atlas:moved,regions,places,scenes}),regionId:'deserto',atlas:moved});
  const masmorra=again.nodes.find(node=>node.id==='scene:masmorra');
  assert.deepEqual([masmorra.x,masmorra.y,masmorra.saved],[1500,900,true]);
  assert.ok(again.width>=1500+again.box.w&&again.height>=900+again.box.h);
  assert.equal(buildRegionPuzzle({tree,regionId:'nao-existe',atlas}),null);
});

test('sceneNeighborhood: portais nos dois sentidos, mapa-pai e mapas internos',()=>{
  let atlas=createSceneAtlas();
  for(const [id,parent] of [['cidade','place:x'],['taverna','scene:cidade'],['porao','scene:taverna'],['ilha','region:y']])atlas=registerAtlasScene(atlas,id,parent);
  atlas=createAtlasEdge(atlas,{id:'barco',label:'Barco',bidirectional:true,from:{sceneId:'ilha'},to:{sceneId:'taverna'}});
  atlas=createAtlasEdge(atlas,{id:'alcapao',label:'Alçapão',from:{sceneId:'taverna'},to:{sceneId:'porao'}});
  const viz=sceneNeighborhood(atlas,'taverna');
  assert.equal(viz.parentSceneId,'cidade');
  assert.deepEqual(viz.childSceneIds,['porao']);
  assert.deepEqual(viz.portals.map(p=>[p.sceneId,p.direction]),[['ilha','both'],['porao','out']]);
  assert.deepEqual(sceneNeighborhood(atlas,'porao').portals.map(p=>p.direction),['in']);
  assert.deepEqual(sceneNeighborhood(atlas,''),{portals:[],parentSceneId:'',childSceneIds:[]});
});

test('regionLocalityTree: NPC vai pro local dele, sub-local aninha, região solta separada',()=>{
  const places=[{id:'alberich',regionId:'thur',name:'Alberich'},{id:'casebres',regionId:'thur',name:'Casebres',parentId:'alberich'},{id:'fora',regionId:'thur',name:'Lado de Fora'},{id:'longe',regionId:'outra',name:'Longe'}];
  const entries=[{id:'a',placeId:'alberich',regionId:'thur'},{id:'b',placeId:'casebres',regionId:'thur'},{id:'c',placeId:'',regionId:'thur'},{id:'d',placeId:'longe',regionId:'outra'},{id:'e',placeId:'sumiu',regionId:'thur'}];
  const tree=regionLocalityTree({regionId:'thur',places,entries});
  assert.deepEqual(tree.places.map(node=>node.place.id),['alberich','fora']);
  const alberich=tree.places[0];
  assert.deepEqual(alberich.entries.map(n=>n.id),['a']);
  assert.deepEqual(alberich.children.map(node=>node.place.id),['casebres']);
  assert.equal(alberich.total,2,'conta o sub-local');
  assert.deepEqual(tree.loose.map(n=>n.id),['c','e'],'sem local (ou local desconhecido) fica solto na região');
  assert.equal(tree.total,4,'NPC de outra região não entra');
});

test('revisão T16: quebra-cabeça preserva região vazia, cena regional, local apagado, 30 locais e ciclos',()=>{
  const regions=[{id:'r',name:'Região'}],places=Array.from({length:31},(_,i)=>({id:`p${i}`,name:`Local ${i}`,regionId:'r'}));
  places.push({id:'c1',name:'Ciclo 1',regionId:'r',parentId:'c2'},{id:'c2',name:'Ciclo 2',regionId:'r',parentId:'c1'});
  const atlas={schema:1,providers:{stairways:false,native:false},scenes:{direta:{parentId:'region:r'},perdida:{parentId:'place:apagado'}},edges:{}};
  const tree=buildSceneAtlasTree({atlas,regions,places,scenes:[{id:'direta',name:'Direta'}]});
  const puzzle=buildRegionPuzzle({tree,regionId:'r',atlas});
  assert.ok(puzzle.nodes.some(node=>node.id==='scene:direta'));
  assert.ok(puzzle.nodes.every((node,i,nodes)=>nodes.findIndex(other=>other.x===node.x&&other.y===node.y)===i),'arranjo não sobrepõe caixas');
  assert.equal(buildRegionPuzzle({tree,regionId:'ausente',atlas}),null);
  const locals=regionLocalityTree({regionId:'r',places,entries:[{placeId:'c1',regionId:'r'}]});
  assert.equal(locals.total,1,'ciclo não perde NPCs da árvore');
});

test('suggestSceneParents usa nome longo, acento, pasta aninhada e ignora conflito, atlas e legado',()=>{
 const places=[{id:'alberich',name:'Alberich'},{id:'velha',name:'Velha Alberich'}],regions=[{id:'thur',name:'Thur Thur'}];
 const scenes=[{id:'a',name:'Velha Alberich — Praça'},{id:'b',name:'Sem pista',folder:{id:'child'}},{id:'c',name:'Alberich',folder:{id:'g'}},{id:'d',name:'Alberich'},{id:'e',name:'Alberích — cena'},{id:'f',name:'Alberich'},{id:'h',name:'Velha Alberich',folder:{id:'velha'}}];
 const found=suggestSceneParents({atlas:{scenes:{d:{parentId:'place:alberich'}}},scenes,folders:[{id:'f0',name:'Thur Thur'},{id:'child',name:'Mapas',folder:'f0'},{id:'g',name:'Thur Thur'},{id:'velha',name:'Velha Alberich'}],places,regions,placeScenes:{alberich:'f'}});
 assert.deepEqual(found.map(x=>[x.sceneId,x.parentId,x.reason,x.confidence]),[['a','place:velha','nome','média'],['b','region:thur','pasta','média'],['e','place:alberich','nome','média'],['h','place:velha','nome+pasta','alta']]);
});

test('banco de mapas cobre todas as localidades e saídas planejadas seguem só hierarquia do livro',()=>{
 assert.deepEqual(Object.keys(MAP_BANK_SELECTION).sort(),PLACES.map(place=>place.id).sort());
 assert.ok(PLACES.every(place=>mapSourceFor(place.id)?.url.startsWith('https://')));
 const exits=mapPortalDrafts(PLACES);
 assert.equal(exits.length,PLACES.filter(place=>place.parentId).length);
 assert.ok(exits.every(exit=>exit.status==='aguarda cenas e posições'));
});

test('régua do banco separa seleção, arquivo, cena e trabalho de mesa ainda pendente',()=>{
 const places=[{id:'a'},{id:'b'}];
 const progress=mapBuildProgress({places,files:{a:'mapa.webp'},mappedPlaceIds:['a']});
 assert.deepEqual(progress.steps.map(step=>[step.id,step.count,step.percent]),[['catalogo',0,0],['arquivos',1,50],['cenas',1,50],['npcs',0,0],['ambiente',0,0],['passagens',0,0]]);
 assert.equal(progress.percent,30,'arquivo e cena contam, mas NPCs, ambiente e passagens não são fingidos como feitos');
});

test('plano de cenas ignora local com mapa direto, herdado ou em sublocal',()=>{
 const tree=buildSceneAtlasTree({atlas:{scenes:{direta:{parentId:'place:p1'},filha:{parentId:'place:p2b'}}},regions:[{id:'r',name:'R'}],places:[{id:'p1',name:'P1',regionId:'r'},{id:'p2',name:'P2',regionId:'r'},{id:'p2b',name:'P2b',regionId:'r',parentId:'p2'},{id:'p3',name:'P3',regionId:'r'},{id:'p4',name:'P4',regionId:'r'}],scenes:[{id:'direta',name:'Direta'},{id:'filha',name:'Filha'},{id:'legada',name:'Legada'}],placeScenes:{p4:'legada'}});
 const plan=missingPlaceScenePlan({tree,regionId:'r',files:{p3:'mapa.webp'}});
 assert.deepEqual(plan.map(row=>[row.placeId,row.background]),[['p3','mapa.webp']]);
});
