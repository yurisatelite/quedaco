import test from 'node:test';
import assert from 'node:assert/strict';
import {regionColor,NEUTRAL_REGION_COLOR} from '../src/regions.mjs';
const regions=[{id:'mirmir',name:'Deserto de Mirmir',color:'#book'}];
test('cor da pasta de Actor prevalece sobre a paleta regional',()=>{
 assert.equal(regionColor('mirmir',[{type:'Actor',name:'Deserto de Mirmir',color:'#foundry'}],regions),'#foundry');
 assert.equal(regionColor('mirmir',[],regions),'#book');
 assert.equal(regionColor('ausente',[],regions),NEUTRAL_REGION_COLOR);
});
