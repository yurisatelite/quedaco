import test from 'node:test';
import assert from 'node:assert/strict';
import {safeImage,classOrigins} from '../src/adapter.mjs';
import {auditCatalog,BOOK_CONTENT} from '../src/coverage.mjs';
import {Catalog} from '../src/catalog.mjs';
test('conteúdo ausente é reportado, universos alternativos incluídos',()=>{
  const items=Object.entries(BOOK_CONTENT).flatMap(([type,names])=>names.map(name=>({type,name,img:'art.webp'})));
  assert.equal(auditCatalog(items).missing.length,0);assert.equal(auditCatalog(items.filter(i=>i.name!=='Naga')).missing[0].name,'Naga');assert.equal(BOOK_CONTENT.legacy.length,16);
});
test('falha de pack e documento invisível não somem silenciosamente',async()=>{
  const game={items:[],packs:[{collection:'hidden',documentName:'Item',visible:false},{collection:'broken',documentName:'Item',visible:true,metadata:{system:'skyfall'},getIndex:async()=>{throw Error('offline')}},{collection:'ok',documentName:'Item',visible:true,metadata:{system:'skyfall',label:'Livro'},getIndex:async()=>[{_id:'1',type:'legacy',name:'Humani',img:'art.webp'}]}]};
  const catalog=await new Catalog(game).load();assert.equal(catalog.failures.length,2);assert.equal(catalog.items.length,1);assert.equal(catalog.items[0].uuid,'Compendium.ok.Item.1');
  await assert.rejects(()=>catalog.document('Compendium.other.Item.secret'));
});

test('catálogo ignora Mundo e escolhe a cópia de criação de personagem',async()=>{
  const makePack=(collection,label,id)=>({collection,documentName:'Item',visible:true,metadata:{system:'skyfall',label},getIndex:async()=>[{_id:id,type:'legacy',name:'Anuro',img:'anuro.webp',uuid:`Compendium.${collection}.Item.${id}`,system:{identifier:'anuro'}}]});
  const game={version:'13.351',system:{id:'skyfall',version:'1.0.1'},items:[{type:'legacy',name:'Anuro',uuid:'Item.world'}],packs:[makePack('world-copy','Mundo','1'),makePack('creation','Criação de Personagem','2')]};
  const catalog=await new Catalog(game).load();
  assert.equal(catalog.items.length,1);
  assert.equal(catalog.items[0].source,'Criação de Personagem');
  assert.equal(catalog.entry('Compendium.world-copy.Item.1').uuid,'Compendium.creation.Item.2');
  assert.equal(catalog.report().duplicatesRemoved,1);
});
test('caminhos de imagem recusam protocolos executáveis e locais',()=>{
  assert.equal(safeImage('javascript:alert(1)'),'icons/svg/mystery-man.svg');assert.equal(safeImage('modules/art/portrait.webp'),'modules/art/portrait.webp');
});
test('catálogo resolve somente heranças vinculadas pelo benefício do legado',async()=>{
  const legacyUuid='Compendium.skyfall-core.character-creation.Item.legacy';
  const heritageUuid='Compendium.skyfall-core.character-creation.Item.heritage';
  const legacy={uuid:legacyUuid,visible:true,system:{benefits:[{type:'heritage',level:0,uuid:heritageUuid}]}};
  const heritage={uuid:heritageUuid,visible:true};
  const previous=globalThis.fromUuid;
  globalThis.fromUuid=async uuid=>uuid===legacyUuid?legacy:heritage;
  try {
    const catalog=new Catalog({items:[],packs:[],version:'13.351',system:{id:'skyfall',version:'1.0.1'}});
    catalog.items=[{uuid:legacyUuid,type:'legacy',name:'Legado'},{uuid:heritageUuid,type:'heritage',name:'Herança'}];
    assert.deepEqual((await catalog.linkedItems(legacyUuid,{type:'heritage',level:0})).map(i=>i.name),['Herança']);
  } finally {globalThis.fromUuid=previous;}
});
test('auditoria do grafo acusa herança solta e não confunde grant sem UUID',async()=>{
  const legacyUuid='Compendium.skyfall-core.character-creation.Item.legacy';
  const linkedUuid='Compendium.skyfall-core.character-creation.Item.linked';
  const looseUuid='Compendium.skyfall-core.character-creation.Item.loose';
  const docs=new Map([[legacyUuid,{uuid:legacyUuid,visible:true,system:{benefits:[{type:'heritage',uuid:linkedUuid},{type:'grant',uuid:'',query:'legacy;curse'}]}}],[linkedUuid,{uuid:linkedUuid,visible:true,system:{benefits:[]}}],[looseUuid,{uuid:looseUuid,visible:true,system:{benefits:[]}}]]);
  const previous=globalThis.fromUuid;globalThis.fromUuid=async uuid=>docs.get(uuid);
  try {
    const catalog=new Catalog({items:[],packs:[],version:'13.351',system:{id:'skyfall',version:'1.0.1'}});
    catalog.items=[{uuid:legacyUuid,type:'legacy',name:'Legado'},{uuid:linkedUuid,type:'heritage',name:'Ligada'},{uuid:looseUuid,type:'heritage',name:'Solta'}];
    const audit=await catalog.auditBenefits(['legacy','heritage']);
    assert.equal(audit.missing.length,0);assert.deepEqual(audit.unlinkedHeritages.map(i=>i.name),['Solta']);assert.equal(audit.benefits,2);
  } finally {globalThis.fromUuid=previous;}
});
test('níveis de classe usam as origens nativas que a ficha Skyfall exibe manualmente',()=>{
  assert.deepEqual(classOrigins(4),['class-01','class-02','class-03','class-04']);
  assert.deepEqual(classOrigins(99).slice(-1),['class-12']);
});
