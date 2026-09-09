import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseItem} from '../src/adapter.mjs';

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
