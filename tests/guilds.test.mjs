import test from 'node:test';
import assert from 'node:assert/strict';
import {guildKind,guildsForPlace,npcGuildLabel} from '../src/guilds.mjs';

test('guild helpers recognize native Skyfall guild actors and labels',()=>{
  const guild={id:'g1',uuid:'Actor.g1',type:'guild',name:'Hansa Rubra'};
  assert.equal(guildKind(guild),true);assert.equal(guildKind({type:'character'}),false);
  assert.equal(npcGuildLabel({guildUuid:'Actor.g1'},[guild]),'Hansa Rubra');
  assert.equal(npcGuildLabel({guild:'Companhia Livre'},[]),'Companhia Livre');
});

test('guildsForPlace resolves uuid and free-text memberships without duplicates',()=>{
  const guilds=[{uuid:'Actor.g1',name:'Hansa Rubra'},{uuid:'Actor.g2',name:'Ordem Azul'}];
  const places=[{id:'p1',regionId:'r1'},{id:'p2',regionId:'r2'}];
  const npcs=[{placeId:'p1',guildUuid:'Actor.g1'},{regionId:'r1',guild:'Ordem Azul'},{placeId:'p2',guild:'Hansa Rubra'}];
  assert.deepEqual(guildsForPlace({npcs,guilds,regionId:'r1',places}).map(g=>g.name),['Hansa Rubra','Ordem Azul']);
  assert.deepEqual(guildsForPlace({npcs,guilds,placeId:'p2',places}).map(g=>g.name),['Hansa Rubra']);
});
