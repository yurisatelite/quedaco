import test from 'node:test';
import assert from 'node:assert/strict';
import {FQL_MODULE_ID,ForienQuestIntegration,bindForienQuestHooks,forienHiddenFromPlayers,forienQuestAPI,plainQuestText,questCounts,questView,visibleForienQuests} from '../src/forien-quests.mjs';

const quest=(overrides={})=>({
  id:'q1',name:'A Coroa Perdida',status:'active',description:'<p>Procure a <strong>coroa</strong>&nbsp;em Kravokia.</p>',
  giverData:{name:'Prefeita',img:'portrait.webp'},location:'Kravokia',priority:2,isPersonal:true,isPrimary:false,
  tasks:[{uuidv4:'t1',name:'Investigar',completed:true},{uuidv4:'t2',name:'Segredo do mestre',hidden:true}],
  rewards:[{name:'T$ 100'},{name:'Segredo',hidden:true}],subquests:['q2'],...overrides
});

const gameWith=(quests,user={isGM:false})=>{
  const API={DB:{getAllQuests:()=>quests,hooks:{updateQuestEntry:'fql-update'}},open(){},async createQuest(){}};
  return {user,modules:new Map([[FQL_MODULE_ID,{active:true,public:{QuestAPI:API}}]])};
};

test('integração só usa a API pública de um Forien ativo',()=>{
  assert.equal(forienQuestAPI({modules:new Map()}),null);
  assert.equal(forienQuestAPI({modules:new Map([[FQL_MODULE_ID,{active:false,public:{QuestAPI:{DB:{getAllQuests(){}}}}}]])}),null);
  const game=gameWith([]);assert.equal(forienQuestAPI(game),game.modules.get(FQL_MODULE_ID).public.QuestAPI);
});

test('configuração do Forien que oculta jogadores é respeitada',()=>{
  assert.equal(forienHiddenFromPlayers({user:{isGM:true},settings:{get:()=>true}}),false);
  assert.equal(forienHiddenFromPlayers({user:{isGM:false},settings:{get:()=>true}}),true);
});

test('cartão de jogador omite objetivos e recompensas ocultos',()=>{
  const view=questView(quest());
  assert.equal(view.description,'Procure a coroa em Kravokia.');
  assert.equal(view.tasks.length,1);assert.equal(view.completed,1);assert.equal(view.rewardCount,1);
  assert.equal(view.giver,'Prefeita');assert.equal(view.image,'portrait.webp');assert.equal(view.personal,true);
  const gm=questView(quest(),{gm:true});assert.equal(gm.tasks.length,2);assert.equal(gm.rewardCount,2);
});

test('consulta preserva apenas quests observáveis devolvidas pelo banco público',()=>{
  const game=gameWith([quest(),quest({id:'q2',name:'Disponível',status:'available',priority:0})]);
  const result=visibleForienQuests(game);assert.deepEqual(result.map(item=>item.id),['q1','q2']);
  assert.deepEqual(questCounts(result),{all:2,available:1,active:1,completed:0,failed:0,inactive:0});
});

test('adaptador abre e cria quests pela API do Forien',async()=>{
  const calls=[],created=quest({id:'new'}),game=gameWith([],{isGM:true}),api=forienQuestAPI(game);
  api.open=options=>calls.push(['open',options.questId]);api.DB.createQuest=async()=>{calls.push(['create']);return created;};
  const integration=new ForienQuestIntegration(game);integration.open('q1');await integration.create();
  assert.deepEqual(calls,[['open','q1'],['create'],['open','new']]);
});

test('hooks públicos do banco e ciclo de vida re-renderizam sem duplicar nomes',()=>{
  const game=gameWith([]),bound=[],hooks={on:(name,callback)=>{bound.push([name,callback]);return name;}};
  const callback=()=>{};const ids=bindForienQuestHooks(game,callback,hooks);
  assert.deepEqual(ids,['fql-update','ForienQuestLog.Lifecycle.ready']);assert.ok(bound.every(([,fn])=>fn===callback));
});

test('texto de quest vira resumo simples sem HTML executável',()=>{
  assert.equal(plainQuestText('<p>A &amp; B</p><script>alert(1)</script>'),'A & B alert(1)');
});
