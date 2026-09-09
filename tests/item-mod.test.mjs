import test from 'node:test';
import assert from 'node:assert/strict';
import {modifiedItemCost,modifiedItemSheet} from '../src/item-mod.mjs';

test('montador soma material, linhas progressivas de sigilo e imbuir',()=>{
  const sigils=[
    {name:'Um',grade:1,slot:'Prefixo',imbue:true},
    {name:'Dois',grade:2,slot:'Sufixo',imbue:false},
    {name:'Três',grade:3,slot:'Prefixo',imbue:true},
    {name:'Quatro',grade:4,slot:'Sufixo',imbue:true}
  ];
  const result=modifiedItemCost({basePrice:15,material:'Nácar',sigils});
  assert.equal(result.total,15+300+50+250+375+2050+5000+11900);
  assert.equal(result.unknown,true);assert.equal(result.warnings.length,1);
  assert.deepEqual(result.lines.filter(line=>line.kind==='sigil').map(line=>[line.row,line.column,line.cost]),[[0,1,50],[1,2,375],[2,3,2050],[3,4,11900]]);
  assert.match(modifiedItemSheet({price:15},{name:'Nácar'},sigils).text,/linha 0, coluna 1/);
});

test('montador rejeita quinto sigilo e terceiro prefixo',()=>{
  const sigil={name:'X',grade:1,slot:'Prefixo'};
  assert.throws(()=>modifiedItemCost({sigils:Array(5).fill(sigil)}),/quatro/);
  assert.throws(()=>modifiedItemCost({sigils:Array(3).fill(sigil)}),/dois prefixos/);
});
