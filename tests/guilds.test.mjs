import test from 'node:test';
import assert from 'node:assert/strict';
import {guildKind,guildsForPlace,npcGuildLabel,guildMembers,guildLevel} from '../src/guilds.mjs';

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

test('guildMembers conta fichas de personagem (não monstros); guildLevel usa o maior nível (mín. 2)',()=>{
  const actors={
    'Actor.pc':{type:'character',hasPlayerOwner:true,system:{level:{value:5}}},
    'Actor.npc':{type:'character',hasPlayerOwner:false,system:{level:{value:9}}},
    'Actor.mob':{type:'npc',hasPlayerOwner:false,system:{level:{value:20}}}
  };
  const resolve=uuid=>actors[uuid]??null;
  const guild={system:{members:[{uuid:'Actor.pc'},{uuid:'Actor.npc'},{uuid:'Actor.mob'}]}};
  assert.deepEqual(guildMembers(guild,resolve).map(m=>m.uuid),['Actor.pc','Actor.npc']);
  assert.equal(guildLevel(guild,resolve),9);
  assert.equal(guildLevel({system:{members:[]}},resolve),2);
  assert.equal(guildLevel({system:{members:[{uuid:'Actor.mob'}]}},resolve),2);
});
