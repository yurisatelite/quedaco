import test from 'node:test';
import assert from 'node:assert/strict';
import {ATTITUDES,CONDITIONS,attitudeModifier,buyerConditions,itemKind,quote,sellQuote} from '../src/negotiation.mjs';

const ficha=(...nomes)=>({items:nomes.map(name=>({name}))});

test('escala de atitude é a do livro, com indiferente neutro',()=>{
  assert.deepEqual(Object.keys(ATTITUDES),['hostil','negativo','indiferente','prestativo','aliado']);
  assert.equal(ATTITUDES.indiferente.modifier,0);
  assert.ok(ATTITUDES.aliado.modifier<0,'aliado concede desconto');
  assert.ok(ATTITUDES.hostil.modifier>0,'hostil encarece');
  // a Mestra pode sobrescrever o sugerido, já que o livro não tabela
  assert.equal(attitudeModifier('aliado',-.3),-.3);
  assert.equal(attitudeModifier('aliado'),ATTITUDES.aliado.modifier);
  assert.equal(attitudeModifier('inexistente'),0);
});

test('condições são lidas da ficha pelo nome, tolerando acento e caixa',()=>{
  assert.deepEqual(buyerConditions(ficha('Artimanha de Diplomacia')).map(c=>c.id),['diplomacia']);
  assert.deepEqual(buyerConditions(ficha('NA MINHA MÃO É MAIS BARATO!')).map(c=>c.id),['ambulante']);
  assert.deepEqual(buyerConditions(ficha('Espada curta')).map(c=>c.id),[]);
  assert.equal(buyerConditions(ficha('Crime que Compensa','Contatinhos')).length,2);
});

test('condição que depende de teste não entra sem o teste passar',()=>{
  const cond=buyerConditions(ficha('Artimanha de Diplomacia'));
  const semTeste=quote({unitBase:100,conditions:cond});
  assert.equal(semTeste.unit,100,'sem pechinchar, preço cheio');
  assert.equal(semTeste.ignoradas.length,1,'a condição aparece como ignorada, pra avisar na tela');
  const comTeste=quote({unitBase:100,conditions:cond,haggleWon:true});
  assert.equal(comTeste.unit,90,'10% do livro');
});

test('Crime que Compensa só pega arma, armadura e escudo — e marca quebradiço',()=>{
  const cond=buyerConditions(ficha('Crime que Compensa'));
  const arma=quote({unitBase:100,conditions:cond,kind:'weapon'});
  assert.equal(arma.unit,75,'25% do livro');
  assert.equal(arma.brittle,true,'o item comprado assim vem QUEBRADIÇO');
  const pocao=quote({unitBase:100,conditions:cond,kind:'consumable'});
  assert.equal(pocao.unit,100,'consumível fica fora do recorte');
  assert.equal(pocao.brittle,false);
  assert.equal(itemKind({type:'armor',system:{slot:'shield'}}),'shield');
  assert.equal(itemKind({type:'armor',system:{}}),'armor');
});

test('desconto não empilha: vale a melhor condição, somada à atitude',()=>{
  const cond=buyerConditions(ficha('Artimanha de Diplomacia','Na minha mão é mais barato!'));
  const r=quote({unitBase:100,conditions:cond,haggleWon:true});
  assert.equal(r.unit,80,'fica o 20% do Vendedor Ambulante, não 10+20');
  assert.equal(r.linhas.filter(l=>l.id!=='atitude').length,1);
  const comAliado=quote({unitBase:100,attitude:'aliado',conditions:cond,haggleWon:true});
  assert.equal(comAliado.unit,65,'atitude soma por fora: -15% -20%');
  assert.equal(quote({unitBase:100,attitude:'hostil'}).unit,125);
});

test('preço nunca fica negativo e a conta multiplica pela quantidade',()=>{
  assert.equal(quote({unitBase:10,attitudeOverride:-5}).unit,0);
  assert.equal(quote({unitBase:50,qty:3}).total,150);
});

test('venda usa metade do preço, e Crime que Compensa devolve o preço cheio',()=>{
  assert.equal(sellQuote({unitBase:100}).unit,50,'regra base do capítulo de Equipamento');
  const crime=buyerConditions(ficha('Crime que Compensa'));
  assert.equal(sellQuote({unitBase:100,conditions:crime}).unit,100);
  const diplo=buyerConditions(ficha('Artimanha de Diplomacia'));
  assert.equal(sellQuote({unitBase:100,conditions:diplo}).unit,50,'sem passar no teste, continua metade');
  assert.equal(sellQuote({unitBase:100,conditions:diplo,haggleWon:true}).unit,60,'metade + 10% do livro');
});

test('Contatinhos não entra sozinho na conta: vale uma vez, a Mestra aplica',()=>{
  const cond=buyerConditions(ficha('Contatinhos'));
  assert.equal(quote({unitBase:100,conditions:cond}).unit,100);
  assert.ok(CONDITIONS.find(c=>c.id==='contatinhos').manual);
});
