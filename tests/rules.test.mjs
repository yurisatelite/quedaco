import test from 'node:test';
import assert from 'node:assert/strict';
import {modifier,wallet,walletTotal,BACKGROUNDS,precoFormatado} from '../src/rules.mjs';
test('conversão inteira de todos os resultados possíveis de 3 a 18',()=>{
  assert.deepEqual(Array.from({length:16},(_,i)=>modifier(i+3)),[-4,-3,-3,-2,-2,-1,-1,0,0,1,1,2,2,3,3,4]);
  assert.throws(()=>modifier(19));assert.throws(()=>modifier(3.5));
});
test('moedas preservam valor e não aceitam saldo negativo ou fracionário',()=>{
  for(const total of [0,9,10,99,999,1000,1010,99999])assert.equal(walletTotal(wallet(total)),total);
  assert.deepEqual(wallet(1027),{k:1,p:2,t:7});assert.throws(()=>wallet(-1));assert.throws(()=>wallet(0.5));
});
test('20 antecedentes do livro continuam catalogados',()=>{
  assert.equal(BACKGROUNDS.length,20);
});
test('preço aparece nas três moedas, da maior pra menor, sem casa vazia',()=>{
  // 10 Trocado = 1 Pila; 1.000 Trocado = 100 Pila = 1 Kurmac (Cap. 3, p. 219)
  assert.equal(precoFormatado(5304),'K$ 5 · P$ 30 · T$ 4');
  assert.equal(precoFormatado(1000),'K$ 1');
  assert.equal(precoFormatado(300),'P$ 30');
  assert.equal(precoFormatado(45),'P$ 4 · T$ 5');
  // abaixo de 10 Trocados não vale a pena quebrar: preço de vela continua em T$
  assert.equal(precoFormatado(9),'T$ 9');
  assert.equal(precoFormatado(0),'T$ 0');
  assert.equal(precoFormatado(null),'T$ 0');
  // o valor sobrevive à ida e volta pela carteira
  for(const total of [7,10,99,250,1001,12345])assert.equal(walletTotal(wallet(total)),total);
});
