import test from 'node:test';
import assert from 'node:assert/strict';
import {modifier,conventionalRoll,validateAttributes,hitPoints,wallet,walletTotal,startingMoney,BACKGROUNDS,backgroundRules,moneyResult,carryingCapacity} from '../src/rules.mjs';
test('conversão inteira de todos os resultados possíveis de 3 a 18',()=>{
  assert.deepEqual(Array.from({length:16},(_,i)=>modifier(i+3)),[-4,-3,-3,-2,-2,-1,-1,0,0,1,1,2,2,3,3,4]);
  assert.throws(()=>modifier(19));assert.throws(()=>modifier(3.5));
});
test('4d6 descarta só um menor, inclusive em empate',()=>{
  assert.deepEqual(conventionalRoll([1,1,6,6]),{dice:[1,1,6,6],discarded:1,total:13,value:1});
  assert.throws(()=>conventionalRoll([0,6,6,6]));
});
test('distribuição fixa, limite +3 e mínimo dos métodos rolados',()=>{
  assert.deepEqual(validateAttributes([3,3,1,1,0,-1],'fixed',[3,2,1,1,0,-1],1),[]);
  assert.ok(validateAttributes([4,2,1,1,0,-1],'fixed',[3,2,1,1,0,-1],0).length);
  assert.ok(validateAttributes([1,1,1,1,0,0],'conventional').length);
  assert.deepEqual(validateAttributes([1,1,1,1,0,0],'ordered'),[]);
  assert.ok(validateAttributes([1,1,1,1,0,0],'fixed',[1,1,1,1,0,0],0).length);
});
test('PV de nível 1 e progressão pelo livro, sem erro de arredondamento',()=>{
  assert.equal(hitPoints('Combatente',2),12);assert.equal(hitPoints('Especialista',2),10);assert.equal(hitPoints('Ocultista',2),8);
  assert.equal(hitPoints('Combatente',2,3),28);assert.equal(hitPoints('Especialista',2,2),17);assert.equal(hitPoints('Ocultista',2,2),14);
  assert.equal(hitPoints('Combatente',2,3,[1,10]),27);assert.throws(()=>hitPoints('Combatente',2,3,[1]));
});
test('moedas preservam valor e não aceitam saldo negativo ou fracionário',()=>{
  for(const total of [0,9,10,99,999,1000,1010,99999])assert.equal(walletTotal(wallet(total)),total);
  assert.deepEqual(wallet(1027),{k:1,p:2,t:7});assert.throws(()=>wallet(-1));assert.throws(()=>wallet(0.5));
});
test('20 antecedentes incluindo exceções de dados, dívida e verba',()=>{
  assert.equal(BACKGROUNDS.length,20);
  const aristocrat=backgroundRules('Aristocrata');assert.equal(aristocrat.sides,10);assert.equal(moneyResult(aristocrat,30),60);
  assert.equal(startingMoney('Ocultista','Aristocrata',10,30).cash,85);
  const debtor=startingMoney('Combatente','Devedor',10,40);assert.equal(debtor.cash,90);assert.equal(debtor.debt,700);
  const traveler=startingMoney('Especialista','Viajante Intrépido',10,20);assert.equal(traveler.cash,20);assert.equal(traveler.equipmentBudget,50);
  assert.equal(startingMoney('Combatente','Artista',3,3).cash,16);
  assert.throws(()=>startingMoney('Combatente','Militar',2,10));assert.throws(()=>startingMoney('Combatente','Militar',null,10));
});
test('capacidade de volume segue a tabela de FOR',()=>{assert.deepEqual([-3,-2,-1,0,1,2,3,4].map(carryingCapacity),[10,12,14,16,19,22,25,28]);});
