import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignLibrary,navAreaEntries} from '../src/library.mjs';
import {PLACES,REGIONS} from '../src/book-world.mjs';

// T29 (13/10/2026) — o painel virou ferramenta só da Mestra: sem "consulta da campanha",
// sem liberar aba/localidade aos jogadores, sem "ver como jogador"; o Imbuir fica guardado
// atrás do ⋯ e os Itens ganham um liga/desliga de detalhes.

function mesa(extra={}){
  const store={...extra};
  const game={user:{isGM:true},actors:[],users:[],packs:[],folders:[],scenes:[],modules:{get:()=>null},
    settings:{get:(_m,key)=>key==='sharedContent'?{}:(key==='guildArchived'?[]:(store[key]??'')),set:async(_m,key,value)=>{store[key]=value;}}};
  return {store,game,library:new CampaignLibrary(game,{items:[],entry:()=>null})};
}

test('a tela de NPCs começa no título e nas tags; nada de consulta, foco, liberação ou "ver como jogador"',()=>{
  const {game}=mesa();
  game.actors=[{id:'n1',uuid:'Actor.n1',name:'Brida',type:'character',items:[],system:{level:{value:2}},flags:{quedaco:{npc:{role:'merchant',regionId:'thurthur',placeId:'alberich'}}}}];
  const html=new CampaignLibrary(game,{items:[],entry:()=>null}).render('npcs');
  assert.match(html,/^<main class="sy-library"><h2>NPCs<\/h2><section class="sy-panel-header">/);
  for(const velho of [/CONSULTA DA CAMPANHA/,/Foco da campanha/,/Mostrar tudo temporariamente/,/Reindexar imagens/,/Exportar fichas para casar tokens/,/Liberar a aba NPCs/,/Ver como jogador/,/Liberar NPCs por localidade/,/NPCs ligados a cidades, lojas/]){
    assert.doesNotMatch(html,velho,`não pode sobrar ${velho}`);
  }
  assert.match(html,/sy-npc-role-tabs/);
  assert.match(html,/>Pesquisar</);
});

test('nenhuma aba da Mestra oferece liberar nada aos jogadores, e a Cena Atual não existe mais',()=>{
  const {game}=mesa();
  game.actors=[
    {id:'g1',uuid:'Actor.g1',name:'Guilda do Porto',type:'guild',items:[],system:{level:2,motto:'',abilities:{},members:[]},flags:{quedaco:{appendix:{kind:'guilda',seals:[]}}}},
    {id:'n1',uuid:'Actor.n1',name:'Brida',type:'character',items:[],system:{level:{value:2}},flags:{quedaco:{npc:{role:'merchant',regionId:'thurthur',placeId:'alberich'}}}}
  ];
  const library=new CampaignLibrary(game,{items:[],entry:()=>null});
  const liberar=/data-op="lib-(share|share-locality|map-share-all|npc-locality)"|Liberar a aba|visível aos jogadores|Liberar aos jogadores|Liberada aos jogadores/;
  for(const area of ['npcs','guilds','map','monsters','items','imbue']){
    const html=library.render(area);
    assert.doesNotMatch(html,liberar,`${area} ainda oferece liberar`);
    assert.doesNotMatch(html,/CONSULTA DA CAMPANHA/,`${area} ainda mostra o rótulo antigo`);
  }
  // mapa de Opath: a lista lateral e os detalhes de região e de local
  assert.doesNotMatch(library.renderAtlas(),liberar);
  assert.doesNotMatch(library.regionDetail(REGIONS[0],true),liberar);
  assert.doesNotMatch(library.placeDetail(PLACES[0],true),liberar);
  // Cena Atual saiu: nem método nem título
  assert.equal(typeof library.renderActiveScenePanel,'undefined');
});

test('Imbuir fica guardado; o ⋯ traz de volta a aba e as ferramentas de manutenção',async()=>{
  const entradas=[['npcs','NPCs'],['items','Itens'],['imbue','Imbuir'],['quests','Quests']];
  assert.deepEqual(navAreaEntries(entradas,{isGM:true,showStored:false}).map(([id])=>id),['npcs','items','quests']);
  assert.deepEqual(navAreaEntries(entradas,{isGM:true,showStored:true}).map(([id])=>id),['npcs','items','imbue','quests']);
  assert.equal(navAreaEntries(entradas,{isGM:false,showStored:false}).length,4,'a regra é só da barra da Mestra');

  const {store,game,library}=mesa();
  assert.equal(library.showStoredTools,false);
  assert.equal(library.storedToolsStrip(),'');
  await library.action('lib-stored-toggle','');
  assert.equal(store.showStoredTools,true);
  const faixa=library.storedToolsStrip();
  assert.match(faixa,/Reindexar imagens/);
  assert.match(faixa,/data-op="lib-campaign-focus"/);
  await library.action('lib-stored-toggle','');
  assert.equal(library.storedToolsStrip(),'');

  store.showStoredTools=true;
  const jogador=new CampaignLibrary({...game,user:{isGM:false}},{items:[]});
  assert.equal(jogador.storedToolsStrip(),'','jogador nunca recebe a faixa');
});

test('Itens tem um liga/desliga que abre os detalhes de todos os cartões',async()=>{
  const {store,library}=mesa();
  const fechado=library.render('items');
  assert.match(fechado,/data-op="lib-items-details"[^>]*aria-checked="false"/);
  assert.doesNotMatch(fechado,/<details class="sy-library-card sy-item-card"[^>]* open/,'desligado: cartões fechados');
  await library.action('lib-items-details','');
  assert.equal(store.itemDetails,true);
  const aberto=library.render('items');
  assert.match(aberto,/aria-checked="true"/);
  assert.match(aberto,/<details class="sy-library-card sy-item-card"[^>]* open/,'ligado: cartões abertos');
  await library.action('lib-items-details','');
  assert.equal(store.itemDetails,false);
});
