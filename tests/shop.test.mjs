import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseCart,purchaseItem,sellItem} from '../src/adapter.mjs';

function fixture({money=100,stock=5}={}){
  const buyer={isOwner:true,system:{currency:{k:0,p:10,t:0}},updates:[],created:[],async update(change){this.updates.push(change);if(change['system.currency'])this.system.currency=change['system.currency'];},async createEmbeddedDocuments(_type,sources){this.created.push(...sources);return sources;}};
  buyer.system.currency={k:Math.floor(money/1000),p:Math.floor(money%1000/10),t:money%10};
  const entry={uuid:'Compendium.skyfall.equipment.Item.sword',price:20,qty:stock};
  const merchant={flags:{quedaco:{npc:{shop:{markup:1.5,stock:[entry]}}}},updates:[],async update(change){this.updates.push(change);this.flags.quedaco.npc.shop.stock=change['flags.quedaco.npc.shop.stock'];}};
  const document={uuid:entry.uuid,type:'weapon',name:'Espada',system:{price:15,quantity:1},toObject(){return {type:this.type,name:this.name,system:{...this.system},_stats:{}};}};
  return {buyer,entry,merchant,document};
}

test('compra debita, entrega source de compêndio e reduz estoque finito',async()=>{
  const f=fixture();const result=await purchaseItem(f.buyer,f.merchant,f.entry,2,async()=>f.document);
  assert.equal(result.total,40);assert.deepEqual(f.buyer.system.currency,{k:0,p:6,t:0});
  assert.equal(f.buyer.created[0].system.quantity,2);
  assert.equal(f.buyer.created[0]._stats.compendiumSource,f.entry.uuid);
  assert.equal(f.merchant.flags.quedaco.npc.shop.stock[0].qty,3);
});

test('compra insuficiente ou sem compêndio não altera comprador',async()=>{
  const f=fixture({money:10});
  await assert.rejects(purchaseItem(f.buyer,f.merchant,f.entry,1,async()=>f.document),/Moeda insuficiente/);
  assert.equal(f.buyer.updates.length,0);assert.equal(f.buyer.created.length,0);
  await assert.rejects(purchaseItem(f.buyer,f.merchant,{...f.entry,uuid:'Item.world'},1,async()=>f.document),/compêndio/);
});

test('falha na entrega devolve a moeda debitada',async()=>{
  const f=fixture();f.buyer.createEmbeddedDocuments=async()=>{throw Error('falhou');};
  await assert.rejects(purchaseItem(f.buyer,f.merchant,f.entry,1,async()=>f.document),/falhou/);
  assert.deepEqual(f.buyer.system.currency,{k:0,p:10,t:0});
});

/** Loja de duas linhas, para o carrinho: espada a 20 e poção a 5, estoque finito. */
function carrinho({money=200}={}){
  let seq=0;
  const buyer={isOwner:true,system:{currency:{k:0,p:0,t:0}},itens:[],apagados:[],
    async update(change){if(change['system.currency'])this.system.currency=change['system.currency'];},
    async createEmbeddedDocuments(_type,sources){const criados=sources.map(source=>({...source,id:`i${++seq}`}));this.itens.push(...criados);return criados;},
    async deleteEmbeddedDocuments(_type,ids){this.apagados.push(...ids);this.itens=this.itens.filter(item=>!ids.includes(item.id));return ids;}};
  buyer.system.currency={k:Math.floor(money/1000),p:Math.floor(money%1000/10),t:money%10};
  const stock=[{uuid:'Compendium.skyfall.equipment.Item.sword',price:20,qty:4},{uuid:'Compendium.skyfall.equipment.Item.potion',price:5,qty:2}];
  const merchant={flags:{quedaco:{npc:{shop:{markup:1,stock}}}},async update(change){this.flags.quedaco.npc.shop.stock=change['flags.quedaco.npc.shop.stock'];}};
  const docs={'Compendium.skyfall.equipment.Item.sword':{uuid:stock[0].uuid,type:'weapon',name:'Espada',system:{price:20,quantity:1},toObject(){return {type:this.type,name:this.name,system:{...this.system},_stats:{}};}},
    'Compendium.skyfall.equipment.Item.potion':{uuid:stock[1].uuid,type:'consumable',name:'Poção',system:{price:5,quantity:1},toObject(){return {type:this.type,name:this.name,system:{...this.system},_stats:{}};}}};
  return {buyer,merchant,stock,resolve:async uuid=>docs[uuid]};
}

test('carrinho cobra as linhas de uma visita só e baixa cada estoque',async()=>{
  const f=carrinho();
  const resultado=await purchaseCart(f.buyer,f.merchant,[{entry:f.stock[0],qty:2},{entry:f.stock[1],qty:1}],f.resolve);
  assert.equal(resultado.total,45,'2×20 + 1×5');
  assert.equal(resultado.remaining,155);
  assert.equal(f.buyer.itens.length,2);
  assert.deepEqual(f.merchant.flags.quedaco.npc.shop.stock.map(item=>item.qty),[2,1]);
});

test('carrinho é tudo ou nada: linha que falha devolve moeda, itens e estoque',async()=>{
  const f=carrinho({money:30});
  // 2 espadas (40) já não cabem em 30; a poção sozinha caberia
  await assert.rejects(purchaseCart(f.buyer,f.merchant,[{entry:f.stock[1],qty:1},{entry:f.stock[0],qty:2}],f.resolve),/Moeda insuficiente/);
  assert.deepEqual(f.buyer.system.currency,{k:0,p:3,t:0},'a bolsa volta ao que era');
  assert.equal(f.buyer.itens.length,0,'nenhum item fica na ficha');
  assert.equal(f.buyer.apagados.length,1,'a poção já entregue é recolhida');
  assert.deepEqual(f.merchant.flags.quedaco.npc.shop.stock.map(item=>item.qty),[4,2],'o estoque volta ao que era');
  await assert.rejects(purchaseCart(f.buyer,f.merchant,[],f.resolve),/vazio/);
});

/** Ficha do grupo com um item de preço conhecido, para a área de vendas. */
function vendedor({price=100,quantity=1,items=[]}={}){
  const item={id:'it1',type:'weapon',name:'Espada longa',system:{price,quantity}};
  const seller={isOwner:true,system:{currency:{k:0,p:0,t:0}},items:[item,...items],apagados:[],alterados:[],
    async update(change){if(change['system.currency'])this.system.currency=change['system.currency'];},
    async deleteEmbeddedDocuments(_type,ids){this.apagados.push(...ids);return ids;},
    async updateEmbeddedDocuments(_type,changes){this.alterados.push(...changes);return changes;}};
  return {seller,item};
}

test('venda paga metade do livro, tira o item da ficha e credita a bolsa',async()=>{
  const f=vendedor();
  const venda=await sellItem(f.seller,{},f.item,1);
  assert.equal(venda.total,50,'metade do preço: o equipamento conta como usado');
  assert.deepEqual(f.seller.system.currency,{k:0,p:5,t:0});
  assert.deepEqual(f.seller.apagados,['it1'],'vendeu tudo que tinha, então o item sai da ficha');
});

test('venda parcial só baixa a quantidade, e Crime que Compensa paga o preço cheio',async()=>{
  const parcial=vendedor({quantity:3});
  await sellItem(parcial.seller,{},parcial.item,2);
  assert.deepEqual(parcial.seller.alterados,[{_id:'it1','system.quantity':1}]);
  assert.equal(parcial.seller.apagados.length,0);

  const crime=vendedor({items:[{name:'Crime que Compensa'}]});
  assert.equal((await sellItem(crime.seller,{},crime.item,1)).total,100);
});

test('venda recusa quantidade maior que a da ficha e item sem preço de tabela',async()=>{
  const f=vendedor();
  await assert.rejects(sellItem(f.seller,{},f.item,2),/quantidade/);
  await assert.rejects(sellItem(f.seller,{},{id:'x',system:{price:0,quantity:1}},1),/preço de tabela/);
  await assert.rejects(sellItem({...f.seller,isOwner:false},{},f.item,1),/acesso de edição/);
  assert.deepEqual(f.seller.system.currency,{k:0,p:0,t:0},'nenhuma recusa mexe na bolsa');
});

test('falha ao tirar o item da ficha devolve a moeda creditada',async()=>{
  const f=vendedor();
  f.seller.deleteEmbeddedDocuments=async()=>{throw Error('falhou');};
  await assert.rejects(sellItem(f.seller,{},f.item,1),/falhou/);
  assert.deepEqual(f.seller.system.currency,{k:0,p:0,t:0});
});
