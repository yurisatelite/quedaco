import test from 'node:test';
import assert from 'node:assert/strict';
import {ORGANIZATIONS} from '../src/ambientacao.mjs';
import {baseWorldCatalog, createWorldCatalogService} from '../src/world-catalog.mjs';
import {renderAmbientacao} from '../src/panels/ambientacao.mjs';

test('DIPS e COPA são cadastros de organizações, sem dossiês de NPC no QUEDAÇO',()=>{
  assert.deepEqual(ORGANIZATIONS.map(row=>row.id),['dips','copa']);
  const base=baseWorldCatalog();
  assert.equal(base.organizations.length,2);
  assert.equal('ambientNpcs' in base,false);
  const game={user:{isGM:true},settings:{get:()=>({})}};
  const api=createWorldCatalogService(game);
  assert.equal(api.listOrganizations({regionId:'thurthur'}).length,2);
  assert.equal('listAmbientNpcs' in api,false);
  game.user.isGM=false;
  assert.equal(api.listOrganizations().length,0);
});

test('Ambientação cataloga somente Actors nativos vinculados à organização',()=>{
  const catalog=baseWorldCatalog();
  const api={getWorldCatalog:()=>catalog,listOrganizations:()=>catalog.organizations};
  const actors=[
    {id:'ribs',type:'character',name:'Ribs',flags:{quedaco:{npc:{organizationId:'dips',role:'spy',placeId:'alberich',note:'Ficha nativa.'}}}},
    {id:'sem-vinculo',type:'character',name:'Sem vínculo',flags:{quedaco:{npc:{role:'extra'}}}}
  ];
  const html=renderAmbientacao(api,actors);
  assert.match(html,/1<\/b><span>Actors catalogados/);
  assert.match(html,/Ribs/);
  assert.match(html,/Abrir ficha/);
  assert.doesNotMatch(html,/Sem vínculo/);
  assert.match(html,/Uniformes, equipamento e comportamento/);
  assert.match(html,/Adaptações aos legados/);
  assert.match(html,/Vestígios|custódia|prova/);
});

test('perfis institucionais são campanha; API devolve cópia independente',()=>{
  const game={user:{isGM:true},settings:{get:()=>({})}};
  const api=createWorldCatalogService(game);
  const org=api.getOrganization('dips');
  assert.equal(org.campaignProfile.source,'campaign');
  assert.ok(org.campaignProfile.equipment.every(kit=>kit.items.length&&kit.notes));
  org.campaignProfile.uniform.everyday='alterado';
  assert.notEqual(api.getOrganization('dips').campaignProfile.uniform.everyday,'alterado');
});
