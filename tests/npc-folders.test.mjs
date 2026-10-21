import test from 'node:test';
import assert from 'node:assert/strict';
import {planNpcFolderOrganization} from '../src/npc-folders.mjs';

test('plano de pastas usa região e localidade e preserva jogadores',()=>{
  const root={id:'r',name:'NPCs por Região',type:'Actor'},region={id:'t',name:'Thur Thur',type:'Actor',folder:root},old={id:'old',name:'Antiga',type:'Actor',folder:root};
  const actors=[{id:'npc',name:'Mara',type:'character',flags:{quedaco:{npc:{regionId:'thurthur',placeId:'alberich'}}},folder:old},{id:'player',name:'P.I.P.I.',type:'character',hasPlayerOwner:true,flags:{quedaco:{npc:{regionId:'thurthur'}}},folder:old}];
  const plan=planNpcFolderOrganization({actors,folders:[root,region,old]});
  assert.equal(plan.rows.length,1);assert.deepEqual(plan.rows[0].target,['NPCs por Região','Thur Thur','Alberich']);
});

test('plano não inventa pasta para NPC sem região',()=>{
  const actor={id:'x',name:'Sem local',type:'character',flags:{quedaco:{npc:{}}}};
  assert.equal(planNpcFolderOrganization({actors:[actor],folders:[]}).rows.length,0);
});
