import test from 'node:test';
import assert from 'node:assert/strict';
import {localityProfile,localityStock} from '../src/locality.mjs';
test('perfil de localidade reconhece capital, porto e pântano',()=>{assert.equal(localityProfile({kind:'Capital'}),'capital');assert.equal(localityProfile({kind:'Cidade costeira'}),'porto');assert.equal(localityProfile({kind:'Pântano'}),'pantano');});
test('estoque típico usa somente compêndio e aplica margem',()=>{
 const items=[{uuid:'Compendium.sky.Item.a',name:'Corda',category:'Equipamentos',system:{price:10}},{uuid:'Item.world',name:'Corda',category:'Equipamentos',system:{price:10}}];
 const stock=localityStock({kind:'Porto'},items,{markup:1.2});assert.equal(stock.length,1);assert.equal(stock[0].price,12);assert.match(stock[0].uuid,/^Compendium/);
});
