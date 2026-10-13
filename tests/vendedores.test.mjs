import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignLibrary} from '../src/library.mjs';
import {VENDOR_MODULE_ID,isVendor,vendorDistribution,vendorLabel,vendorModuleActive,vendorShop} from '../src/vendors.mjs';

// T30 (13/10/2026) — o módulo `quedaco-npcs-de-venda` age sozinho; o painel só RECONHECE
// quem é vendedor (selo, filtro e quadro por local). Nada aqui grava em ficha.

const loja=(extra={})=>({[VENDOR_MODULE_ID]:{shop:{enabled:true,public:true,markup:1,buyRate:.5,stock:[{id:'a'},{id:'b'}],note:'Entrem!',...extra}}});
const npc=(id,name,placeId,flags={})=>({id,uuid:`Actor.${id}`,name,type:'character',img:'',items:[],ownership:{default:1},system:{level:{value:2}},
  flags:{quedaco:{npc:{role:'extra',regionId:'thurthur',placeId,note:''}},...flags}});

test('vendorShop lê o formato do módulo de vendas e nunca lança erro com dado estranho',()=>{
  assert.deepEqual(vendorShop({flags:loja()}),{enabled:true,public:true,items:2,markup:1,buyRate:.5,note:'Entrem!'});
  assert.equal(vendorShop({flags:loja({public:false})}).public,false);
  assert.equal(vendorShop({flags:loja({enabled:false})}),null,'modo comerciante desligado não é vendedor');
  assert.equal(vendorShop({flags:loja({enabled:'sim'})}),null,'só `true` de verdade conta');
  for(const estranho of [undefined,null,{},{flags:{}},{flags:{[VENDOR_MODULE_ID]:'x'}},{flags:{[VENDOR_MODULE_ID]:{shop:[]}}},{flags:{[VENDOR_MODULE_ID]:{shop:null}}}])assert.equal(vendorShop(estranho),null);
  const armadilha={};Object.defineProperty(armadilha,'flags',{get(){throw Error('boom');}});
  assert.equal(vendorShop(armadilha),null);
  const torto=vendorShop({flags:loja({stock:'lixo',markup:'abc',buyRate:null,note:7})});
  assert.deepEqual([torto.items,torto.markup,torto.buyRate,torto.note],[0,1,.5,''],'campo ilegível cai no padrão do módulo');
  assert.equal(isVendor({flags:loja()}),true);
});

test('vendorLabel e vendorModuleActive',()=>{
  assert.match(vendorLabel(vendorShop({flags:loja()})),/aberta aos jogadores · 2 itens/);
  assert.match(vendorLabel(vendorShop({flags:loja({public:false,stock:[{id:'x'}]})})),/fechada.* · 1 item no estoque/);
  assert.equal(vendorLabel(null),'');
  assert.equal(vendorModuleActive({modules:{get:id=>id===VENDOR_MODULE_ID?{active:true}:null}}),true);
  assert.equal(vendorModuleActive({modules:{get:()=>{throw Error('x');}}}),false);
  assert.equal(vendorModuleActive(undefined),false);
});

test('vendorDistribution mostra por local, inclusive onde não há vendedor',()=>{
  const regions=[{id:'thur',name:'Thur Thur'},{id:'huma',name:'Huma'}];
  const places=[{id:'alberich',regionId:'thur',name:'Alberich'},{id:'casebres',regionId:'thur',name:'Casebres'},{id:'foice',regionId:'huma',name:'Foice'}];
  const d=vendorDistribution([{placeId:'alberich',open:true},{placeId:'alberich',open:false},{placeId:'foice',open:true},{placeId:'',open:true},{placeId:'sumiu',open:true}],{regions,places});
  assert.deepEqual([d.total,d.open,d.closed,d.unplaced],[5,4,1,2],'sem local e local desconhecido contam como "sem local"');
  assert.deepEqual(d.groups.map(g=>g.name),['Huma','Thur Thur'],'regiões em ordem alfabética');
  const thur=d.groups.find(g=>g.regionId==='thur');
  assert.deepEqual(thur.places.map(p=>[p.name,p.count]),[['Alberich',2],['Casebres',0]],'quem tem mais vem primeiro; local vazio aparece com 0');
  assert.equal(thur.total,2);
  assert.deepEqual(vendorDistribution(undefined,{}),{total:0,open:0,closed:0,unplaced:0,groups:[]});
});

function mesa(npcs){
  const store={};
  const game={user:{isGM:true},actors:npcs,users:[],packs:[],folders:[],scenes:[],modules:{get:()=>null},
    settings:{get:(_m,key)=>key==='sharedContent'?{}:(store[key]??''),set:async(_m,key,value)=>{store[key]=value;}}};
  return {store,library:new CampaignLibrary(game,{items:[],entry:()=>null})};
}
const idsNaTela=html=>[...html.matchAll(/data-drag-actor="Actor\.(\w+)"/g)].map(m=>m[1]).sort();

test('o cartão de NPC mostra o selo Vendedor (e "fechada" quando a loja não é pública)',()=>{
  const {library}=mesa([
    npc('v1','Brida','alberich',loja()),
    npc('v2','Oskar','casebres',loja({public:false})),
    npc('p1','Passante','alberich',loja({enabled:false})),
    npc('p2','Outro','alberich')
  ]);
  const html=library.render('npcs');
  assert.equal((html.match(/<span class="sy-npc-role sy-vendor-badge/g)??[]).length,2,'só os dois com modo comerciante ligado');
  assert.match(html,/Vendedor · fechada/);
  assert.match(html,/title="Loja aberta aos jogadores · 2 itens no estoque"/);
});

test('filtro Vendedor lista só vendedores e abre o quadro por local; clicar num local filtra',async()=>{
  const {library}=mesa([
    npc('v1','Brida','alberich',loja()),
    npc('v2','Oskar','alberich',loja({public:false})),
    npc('v3','Mina','casebres',loja()),
    npc('p2','Outro','alberich')
  ]);
  assert.doesNotMatch(library.render('npcs'),/sy-vendor-summary/,'sem o filtro não há quadro');
  assert.deepEqual(idsNaTela(library.render('npcs')),['p2','v1','v2','v3']);
  await library.action('lib-npc-vendor-filter','');
  const ligado=library.render('npcs');
  assert.deepEqual(idsNaTela(ligado),['v1','v2','v3'],'só vendedores');
  assert.match(ligado,/sy-vendor-summary/);
  assert.match(ligado,/3 no total · 2 abertos aos jogadores · 1 fechados/);
  assert.match(ligado,/Alberich <b>2<\/b>/);
  assert.match(ligado,/Casebres <b>1<\/b>/);
  assert.match(ligado,/sy-vendor-place is-empty/,'local sem vendedor aparece vazio');
  await library.action('lib-npc-place-filter','alberich');
  assert.deepEqual(idsNaTela(library.render('npcs')),['v1','v2'],'clicar em Alberich filtra');
  await library.action('lib-npc-place-filter','alberich');
  assert.deepEqual(idsNaTela(library.render('npcs')),['v1','v2','v3'],'clicar de novo desfaz');
  await library.action('lib-npc-vendor-filter','');
  assert.doesNotMatch(library.render('npcs'),/sy-vendor-summary/);
});

test('reconhecer não escreve nada: nenhum Actor, flag ou setting é gravado',async()=>{
  const atores=[npc('v1','Brida','alberich',loja())];
  let escritas=0;
  atores[0].update=async()=>{escritas++;};atores[0].setFlag=async()=>{escritas++;};
  const {store,library}=mesa(atores);
  library.render('npcs');
  await library.action('lib-npc-vendor-filter','');
  library.render('npcs');
  assert.equal(escritas,0);
  assert.deepEqual(store,{},'nem settings (o filtro é só estado da tela)');
});

test('o quadro de vendedores não usa <header> (a regra do cabeçalho do aplicativo vazaria para ele) e o CSS desgruda cabeçalhos do conteúdo',async()=>{
  const {library}=mesa([npc('v1','Brida','alberich',loja())]);
  await library.action('lib-npc-vendor-filter','');
  const html=library.render('npcs');
  const quadro=html.slice(html.indexOf('sy-vendor-summary')-20,html.indexOf('sy-library-grid'));
  assert.match(quadro,/sy-vendor-head/);
  assert.doesNotMatch(quadro,/<header/);
  const {readFileSync}=await import('node:fs');
  const css=readFileSync(new URL('../styles/library.css',import.meta.url),'utf8');
  assert.match(css,/\.sy-creator \.sy-library header\{position:static;z-index:auto\}/,'cabeçalho dentro do conteúdo do painel não pode grudar no topo');
});
