import test from 'node:test';
import assert from 'node:assert/strict';
import {AMBIENT_NPCS, ORGANIZATIONS, ambientNpcById, organizationRoster} from '../src/ambientacao.mjs';
import {baseWorldCatalog, createWorldCatalogService} from '../src/world-catalog.mjs';

test('DIPS e COPA têm um núcleo de dez dossiês consistentes',()=>{
  assert.deepEqual(ORGANIZATIONS.map(row=>row.id),['dips','copa']);
  assert.equal(AMBIENT_NPCS.length,10);
  assert.equal(organizationRoster('dips').length,6);
  assert.equal(organizationRoster('copa').length,4);
  assert.equal(ambientNpcById('ribs').canonical,true);
  for(const npc of AMBIENT_NPCS){
    assert.ok(ORGANIZATIONS.some(org=>org.id===npc.organizationId));
    assert.ok(npc.legacy&&npc.heritage&&npc.characterClass&&npc.level>0);
  }
});

test('catálogo expõe Ambientação à Mestra e não revela dossiês privados ao jogador',()=>{
  const base=baseWorldCatalog();
  assert.equal(base.organizations.length,2);
  assert.equal(base.ambientNpcs.length,10);
  const game={user:{isGM:true},settings:{get:()=>({})}};
  const api=createWorldCatalogService(game);
  assert.equal(api.listOrganizations({regionId:'thurthur'}).length,2);
  assert.equal(api.listAmbientNpcs({organizationId:'dips'}).length,6);
  game.user.isGM=false;
  assert.equal(api.listOrganizations().length,0);
  assert.equal(api.listAmbientNpcs().length,0);
});
