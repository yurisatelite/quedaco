import test from 'node:test';
import assert from 'node:assert/strict';
import {localityProfile,localityQuotas,localityStock} from '../src/locality.mjs';
test('perfil de localidade reconhece capital, porto e pântano',()=>{assert.equal(localityProfile({kind:'Capital'}),'capital');assert.equal(localityProfile({kind:'Cidade costeira'}),'porto');assert.equal(localityProfile({kind:'Pântano'}),'pantano');});
test('estoque típico usa somente compêndio e aplica margem',()=>{
 const items=[{uuid:'Compendium.sky.Item.a',name:'Corda',category:'Equipamentos',system:{price:10}},{uuid:'Item.world',name:'Corda',category:'Equipamentos',system:{price:10}}];
 const stock=localityStock({kind:'Porto'},items,{markup:1.2});assert.equal(stock.length,1);assert.equal(stock[0].price,12);assert.match(stock[0].uuid,/^Compendium/);
});

test('cotas por importância: a capital fica sempre acima de qualquer outra sozinha',()=>{
  const lugares=[
    {id:'alberich',kind:'Capital'},{id:'porto',kind:'Porto'},
    {id:'vila',kind:'Vila'},{id:'ruina',kind:'Ruínas'},{id:'bosque',kind:'Bosque'}
  ];
  const soma=cotas=>[...cotas.values()].reduce((a,b)=>a+b,0);
  const maiorOutra=cotas=>Math.max(...[...cotas.entries()].filter(([id])=>id!=='alberich').map(([,v])=>v));

  // a soma bate exatamente com o total, em qualquer tamanho de mesa
  for(const total of [0,1,2,3,5,13,47,400]){
    const cotas=localityQuotas(lugares,total,'alberich');
    assert.equal(soma(cotas),total,`total ${total}`);
    if(total>=2)assert.ok(cotas.get('alberich')>maiorOutra(cotas),`capital não liderou com ${total}`);
  }

  // peso manda: capital > cidade > porto/vila > ermo
  const cotas=localityQuotas([...lugares,{id:'cidade',kind:'Cidade'}],100,'alberich');
  assert.ok(cotas.get('alberich')>cotas.get('cidade'));
  assert.ok(cotas.get('cidade')>cotas.get('porto'));
  assert.ok(cotas.get('porto')>cotas.get('bosque'));

  // sem capital declarada não quebra, e continua distribuindo tudo
  const semCapital=localityQuotas(lugares,30,'');
  assert.equal(soma(semCapital),30);

  // é determinística: a prévia da macro tem que bater com a aplicação
  assert.deepEqual([...localityQuotas(lugares,37,'alberich')],[...localityQuotas(lugares,37,'alberich')]);

  // caso degenerado: uma localidade só fica com tudo
  assert.deepEqual([...localityQuotas([{id:'so',kind:'Vila'}],9,'')],[['so',9]]);
  assert.deepEqual([...localityQuotas([],5,'')],[]);
});
