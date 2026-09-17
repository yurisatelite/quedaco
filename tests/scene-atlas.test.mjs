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
