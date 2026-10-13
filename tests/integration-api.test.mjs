import test from 'node:test';
import assert from 'node:assert/strict';
import {registeredNpcs,publicRegions} from '../src/integration.mjs';

test('API pública organiza NPCs registrados por região sem alterar Actors',()=>{
  const root={id:'root',name:'🤖 NPCs por Região'};
  const region={id:'region',name:'Deserto de Mirmir',folder:root};
  const city={id:'city',name:'Kravokia',folder:region};
  const actor={id:'a1',uuid:'Actor.a1',name:'Mara',img:'mara.webp',type:'character',folder:city,flags:{}};
  const rows=registeredNpcs({actors:[actor]});
  assert.equal(rows.length,1);
  assert.equal(rows[0].regionId,'mirmir');
  assert.equal(rows[0].placeId,'kravokia');
  assert.equal(actor.flags.quedaco,undefined);
});

test('API pública fornece regiões estáveis para módulos satélites',()=>{
  const regions=publicRegions();
  assert.ok(regions.some(region=>region.id==='mirmir'&&region.name==='Deserto de Mirmir'));
  assert.ok(regions.every(region=>Object.keys(region).sort().join(',')==='color,id,name'));
});

import {explorerCatalog,setNpcExplorerLocation} from '../src/integration.mjs';
test('catálogo do Explorador expõe só ids e nomes',()=>{
  const c=explorerCatalog();
  assert.ok(c.regions.some(r=>r.id==='mirmir'));
  assert.ok(c.places.every(p=>Object.keys(p).sort().join()==='id,name,regionId'));
  assert.ok(c.tags.every(t=>t.id.startsWith('role:')));
});
test('atribuir NPC a uma área exige Mestra e NPC cadastrado',async()=>{
  const updates=[];
  const actor={id:'a1',flags:{quedaco:{npc:{role:'merchant'}}},update:async u=>updates.push(u)};
  const game=gm=>({user:{isGM:gm},actors:{get:id=>id==='a1'?actor:null}});
  await assert.rejects(()=>setNpcExplorerLocation(game(false),'Actor.a1',{hexId:'h',sceneId:'s'}),/Mestra/);
  await assert.rejects(()=>setNpcExplorerLocation(game(true),'Actor.zz',{hexId:'h',sceneId:'s'}),/cadastrado/);
  await setNpcExplorerLocation(game(true),'Actor.a1',{hexId:'s:1:1',sceneId:'s',regionId:'mirmir'});
  assert.deepEqual(updates[0]['flags.quedaco.npc.explorerLocation'],{hexId:'s:1:1',sceneId:'s'});
  assert.equal(updates[0]['flags.quedaco.npc.regionId'],'mirmir');
  await setNpcExplorerLocation(game(true),'Actor.a1',null);
  assert.equal(updates[1]['flags.quedaco.npc.explorerLocation'],null);
});
