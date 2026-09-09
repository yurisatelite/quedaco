import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNpcLinks,npcLinkSummary} from '../src/npcs.mjs';

test('vínculos sociais eliminam duplicata em qualquer direção',()=>{
  const links=normalizeNpcLinks([
    {from:'Actor.a',to:'Actor.b',type:'aliado',note:'primeiro'},
    {from:'Actor.b',to:'Actor.a',type:'aliado',note:'duplicado'},
    {from:'Actor.b',to:'Actor.a',type:'inimigo'}
  ]);
  assert.equal(links.length,2);
  assert.deepEqual([links[0].from,links[0].to],['Actor.a','Actor.b']);
});

test('relações familiares mantêm direção e geram resumo por NPC',()=>{
  const links=normalizeNpcLinks([
    {from:'Actor.pai',to:'Actor.filho',type:'pai'},
    {from:'Actor.filho',to:'txt:Noemi',type:'irmão'}
  ]);
  const names={'Actor.pai':'Aron','Actor.filho':'Bento'};
  const nameFor=key=>names[key]??key.replace(/^txt:/,'');
  assert.deepEqual(npcLinkSummary('Actor.pai',links,nameFor),['Pai de Bento']);
  assert.deepEqual(npcLinkSummary('Actor.filho',links,nameFor),['Filho de Aron','Irmão de Noemi']);
});
