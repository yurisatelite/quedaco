import test from 'node:test';
import assert from 'node:assert/strict';
import {imageKeywords,parseTokenName,pickToken,slugify} from '../src/tokens.mjs';
const index={tokens:[{p:'Humans/blacksmith.png',k:['blacksmith'],t:'humanoide',h:1,n:0},{p:'Dragons/red-dragon.png',k:['red','dragon'],t:'dragao',h:0,n:0},{p:'Beasts/red-wolf.png',k:['red','wolf'],t:'fera',h:0,n:0}]};
test('parser e slug de token são estáveis',()=>{assert.equal(parseTokenName('Humans/Mago Azul 02.png').slug,'mago-azul-02');assert.equal(slugify('Dragão Rubro'),'dragao-rubro');});
test('casamento respeita tipo e desempate estável',()=>{
 assert.equal(pickToken(['red','dragon'],index,{type:'dragão',humanoid:false,seed:'a'}).p,'Dragons/red-dragon.png');
 assert.equal(pickToken(['ferreiro'],index,{humanoid:true,seed:'a'}).p,'Humans/blacksmith.png');
 assert.deepEqual(imageKeywords({name:'Ferreiro de Kravokia'}).includes('blacksmith'),true);
});
