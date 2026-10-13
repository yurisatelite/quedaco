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
