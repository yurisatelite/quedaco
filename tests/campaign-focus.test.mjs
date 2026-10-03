import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CAMPAIGN_FOCUS,focusedGuilds,focusedLegacies,focusedNpcs,focusedPlaces,focusedRegions,normalizeCampaignFocus} from '../src/campaign-focus.mjs';
import {CampaignLibrary} from '../src/library.mjs';
test('foco padrão concentra a campanha em Thur Thur sem apagar dados',()=>{const f=normalizeCampaignFocus(DEFAULT_CAMPAIGN_FOCUS),regions=[{id:'thurthur'},{id:'huma'}],places=[{id:'alberich',regionId:'thurthur'},{id:'foice',regionId:'huma'}],actors=[{id:'a',flags:{quedaco:{npc:{regionId:'thurthur'}}}},{id:'b',flags:{quedaco:{npc:{placeId:'foice'}}}}];assert.deepEqual(focusedRegions(regions,f).map(x=>x.id),['thurthur']);assert.deepEqual(focusedPlaces(places,f).map(x=>x.id),['alberich']);assert.deepEqual(focusedNpcs(actors,f,{places}).map(x=>x.id),['a']);assert.equal(actors.length,2);});
test('dez guildas sorteadas e P.I.P.I. protegida ficam visíveis',()=>{const f=normalizeCampaignFocus(DEFAULT_CAMPAIGN_FOCUS),guilds=[...f.guildNames.map((name,i)=>({id:`g${i}`,uuid:`Actor.g${i}`,name})),{id:'pipi',uuid:'Actor.pipi',name:'P.I.P.I.'},{id:'fora',uuid:'Actor.fora',name:'Outra'}],visible=focusedGuilds(guilds,f,new Set(['Actor.pipi']));assert.equal(visible.length,11);assert.ok(visible.some(g=>g.name==='P.I.P.I.'));assert.ok(!visible.some(g=>g.name==='Outra'));assert.equal(guilds.length,12);});
test('somente quatro legados sorteados aparecem',()=>assert.deepEqual(focusedLegacies(['Walshie','Tôra','Gnomo','Urodelo','Draco'],DEFAULT_CAMPAIGN_FOCUS),['Walshie','Tôra','Gnomo','Urodelo']));
test('desligar foco restaura listas',()=>{const f={...DEFAULT_CAMPAIGN_FOCUS,enabled:false};assert.deepEqual(focusedRegions([{id:'a'},{id:'b'}],f).map(x=>x.id),['a','b']);assert.deepEqual(focusedLegacies(['Walshie','Draco'],f),['Walshie','Draco']);assert.deepEqual(focusedGuilds([{name:'A'},{name:'B'}],f).map(x=>x.name),['A','B']);});

test('CampaignLibrary aplica e desliga o foco sem editar Actors',async()=>{
  const thur={id:'n1',uuid:'Actor.n1',name:'Thur',type:'character',flags:{quedaco:{npc:{role:'extra',regionId:'thurthur'}}},items:[],system:{level:{value:1}}};
  const fora={id:'n2',uuid:'Actor.n2',name:'Fora',type:'character',flags:{quedaco:{npc:{role:'extra',regionId:'huma'}}},items:[],system:{level:{value:1}}};
  const escolhida={id:'g1',uuid:'Actor.g1',name:'Latrun',type:'guild',system:{members:[]}};
  const pipi={id:'pipi',uuid:'Actor.pipi',name:'P.I.P.I.',type:'guild',system:{members:[]}};
  const outra={id:'g2',uuid:'Actor.g2',name:'Outra',type:'guild',system:{members:[]}};
  const actors=[thur,fora,escolhida,pipi,outra],store={campaignFocus:{...DEFAULT_CAMPAIGN_FOCUS}};
  const game={user:{isGM:true},actors,settings:{get:(_module,key)=>store[key]??{},set:async(_module,key,value)=>{store[key]=value;}}};
  const lib=new CampaignLibrary(game,{items:[]});
  assert.deepEqual(lib.npcActors().map(actor=>actor.id),['n1']);
  assert.deepEqual(lib.guildActors().map(actor=>actor.id),['g1','pipi']);
  assert.match(lib.campaignFocusBanner(false),/Foco da campanha: Thur Thur/);
  await lib.action('lib-campaign-focus','off');
  assert.deepEqual(lib.npcActors().map(actor=>actor.id),['n1','n2']);
  assert.equal(lib.guildActors().length,3);
  assert.equal(actors.length,5);
});

test('Mapa Imersivo focado mostra apenas cenas de Thur Thur e mantém cenas internas',()=>{
  const sceneRows=[{id:'alberich',name:'Alberich'},{id:'taverna',name:'Taverna de Alberich'},{id:'foice',name:'Foice'}];
  const scenes=Object.assign(sceneRows,{get:id=>sceneRows.find(scene=>scene.id===id)});
  const store={
    campaignFocus:{...DEFAULT_CAMPAIGN_FOCUS},
    sceneAtlas:{schema:1,providers:{stairways:false,native:false},scenes:{alberich:{parentId:'place:alberich'},taverna:{parentId:'scene:alberich'},foice:{parentId:'place:foice'}},edges:{}},
    placeScenes:{},regionScenes:{},mapBankFiles:{}
  };
  const game={user:{isGM:true},actors:[],scenes,folders:[],modules:{get:()=>null},version:'13.351',settings:{get:(_module,key)=>store[key]??{}}};
  const html=new CampaignLibrary(game,{items:[]}).renderMap(false);
  assert.match(html,/Thur Thur/);
  assert.match(html,/Taverna de Alberich/);
  assert.doesNotMatch(html,/>Huma</);
  assert.doesNotMatch(html,/>Foice</);
  assert.match(html,/<b>2<\/b> cenas/);
});
