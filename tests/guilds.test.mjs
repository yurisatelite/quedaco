import test from 'node:test';
import assert from 'node:assert/strict';
import {guildKind,guildsForPlace,npcGuildLabel,guildMembers,guildLevel,guildProtectionMap,guildProtectionReasons,planGuildRedistribution} from '../src/guilds.mjs';

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

function redistributionWorld({tableName='P.I.P.I.',withPlayer=true,withSeal=false}={}){
  const actors=[],add=actor=>(actors.push(actor),actor);
  const player=add({id:'pc1',uuid:'Actor.pc1',name:'Kael',type:'character',hasPlayerOwner:true,system:{level:{value:5}},flags:{}});
  const npcs=[];
  for(let index=0;index<60;index++)npcs.push(add({id:`n${index}`,uuid:`Actor.n${index}`,name:`NPC ${index}`,type:'character',hasPlayerOwner:false,
    system:{level:{value:1+(index%8)}},flags:{quedaco:{npc:{role:'extra',guildUuid:'',guild:''}}}}));
  const makeGuild=(id,name,kind,members=[])=>add({id,uuid:`Actor.${id}`,name,type:'guild',
    system:{members:members.map(uuid=>({uuid,founder:false,retired:false})),level:2},
    flags:{quedaco:{appendix:kind?{kind}:undefined}}});
  const table=makeGuild('pipi',tableName,null,[...(withPlayer?['Actor.pc1']:[]),'Actor.n0','Actor.n1']);
  if(withSeal)table.flags.quedaco.appendix={seals:['Dragão prateado']};
  npcs[0].flags.quedaco.npc.guildUuid=table.uuid;npcs[1].flags.quedaco.npc.guildUuid=table.uuid;
  const guilds=[],hansas=[];
  for(let index=0;index<14;index++)guilds.push(makeGuild(`g${index}`,`Guilda ${String.fromCharCode(65+index)}`,'guilda'));
  for(let index=0;index<7;index++)hansas.push(makeGuild(`h${index}`,`Hansa ${index}`,'hansa'));
  npcs.slice(2).forEach((npc,index)=>{
    const target=index%4===3?hansas[index%hansas.length]:guilds[index%guilds.length];
    target.system.members.push({uuid:npc.uuid,founder:false,retired:false});npc.flags.quedaco.npc.guildUuid=target.uuid;
  });
  const allGuilds=[table,...guilds,...hansas],byUuid=new Map(actors.map(actor=>[actor.uuid,actor]));
  return {actors,player,npcs,table,guilds,hansas,allGuilds,resolve:uuid=>byUuid.get(uuid)??null};
}

const currentArchive=(world,guildCount=6,hansaCount=4)=>[
  ...world.guilds.slice(guildCount).map(guild=>guild.uuid),
  ...world.hansas.slice(hansaCount).map(guild=>guild.uuid)
];

function currentPlan(world,{archived=currentArchive(world),guilds=world.allGuilds,npcs=world.npcs}={}){
  const protection=guildProtectionMap(world.allGuilds,world.resolve);
  return planGuildRedistribution({guilds,npcs,archived,protectedIds:protection,parts:{guild:.6,hansa:.2},resolve:world.resolve});
}

test('redistribuição atual aplica cotas, esvazia guardadas e mantém membros, flags e níveis coerentes',()=>{
  const world=redistributionWorld(),archived=currentArchive(world),before=JSON.stringify(world.actors);
  const plan=currentPlan(world,{archived});
  assert.equal(JSON.stringify(world.actors),before,'planejar não muta os documentos recebidos');
  assert.equal(plan.counts.candidates,58);assert.equal(plan.counts.inGuild,35);assert.equal(plan.counts.inHansa,12);assert.equal(plan.counts.unassigned,11);
  assert.equal(plan.counts.activeGuilds,6);assert.equal(plan.counts.activeHansas,4);assert.equal(plan.counts.archivedGuilds,11);assert.equal(plan.counts.protectedGuilds,1);
  assert.equal(plan.counts.changedNpcs,plan.npcPlans.filter(row=>row.changed).length);
  assert.equal(plan.counts.changedGuilds,plan.guildPlans.filter(row=>row.state!=='protected'&&row.membersChanged).length);

  const tablePlan=plan.guildPlans.find(row=>row.guild===world.table);
  assert.equal(tablePlan.state,'protected');
  assert.deepEqual(tablePlan.afterMembers,world.table.system.members,'a guilda da mesa fica intocada');
  assert.equal(tablePlan.membersChanged,false);
  assert.ok(!plan.archivedAfter.includes(world.table.uuid),'a guilda protegida nunca fica guardada');

  const archivedPlans=plan.guildPlans.filter(row=>row.state==='archived');
  assert.ok(archivedPlans.every(row=>row.afterMembers.length===0),'toda guardada fica sem membros');
  const archivedIds=new Set(archivedPlans.map(row=>row.guild.uuid));
  assert.ok(plan.npcPlans.every(row=>!row.newGuildUuid||!archivedIds.has(row.newGuildUuid)),'nenhum NPC aponta para guardada');

  const guildPlanById=new Map(plan.guildPlans.map(row=>[row.guild.uuid,row]));
  for(const npc of plan.npcPlans){
    if(!npc.newGuildUuid)continue;
    assert.ok(guildPlanById.get(npc.newGuildUuid).afterMembers.some(member=>member.uuid===npc.actor.uuid),'flag e lista de membros concordam');
  }
  for(const guild of plan.guildPlans.filter(row=>row.state==='active')){
    const levels=guild.afterMembers.map(member=>world.resolve(member.uuid)?.system?.level?.value??0);
    assert.equal(guild.levelAfter,Math.max(2,...levels),'nível depois é o maior nível dos membros');
  }
  assert.ok(plan.guildPlans.some(row=>row.state==='active'&&row.levelAfter>2));
});

test('redistribuição é determinística por hash do id, mesmo com entradas invertidas',()=>{
  const world=redistributionWorld(),archived=currentArchive(world);
  const first=currentPlan(world,{archived});
  const second=currentPlan(world,{archived,guilds:[...world.allGuilds].reverse(),npcs:[...world.npcs].reverse()});
  const snapshot=plan=>({
    npcs:plan.npcPlans.map(row=>[row.actor.uuid,row.newGuildUuid]).sort(([a],[b])=>a.localeCompare(b)),
    guilds:plan.guildPlans.map(row=>[row.guild.uuid,row.afterMembers.map(member=>member.uuid).sort()]).sort(([a],[b])=>a.localeCompare(b)),
    counts:plan.counts
  });
  assert.deepEqual(snapshot(second),snapshot(first));
});

test('nome diferente não impede proteção quando a guilda tem ficha de jogador',()=>{
  const world=redistributionWorld({tableName:'Nome Errado',withPlayer:true});
  const protection=guildProtectionMap(world.allGuilds,world.resolve);
  assert.deepEqual(protection.get(world.table.uuid),['tem ficha de jogador']);
  const plan=planGuildRedistribution({guilds:world.allGuilds,npcs:world.npcs,archived:currentArchive(world),protectedIds:protection,resolve:world.resolve});
  assert.equal(plan.guildPlans.find(row=>row.guild===world.table).state,'protected');
});

test('ficha de jogador sozinha mantém guilda e seus NPCs completamente intactos',()=>{
  const world=redistributionWorld({tableName:'Companhia sem apelido',withPlayer:true}),before=JSON.stringify(world.table.system.members);
  const protection=guildProtectionMap(world.allGuilds,world.resolve),plan=currentPlan(world);
  assert.deepEqual(protection.get(world.table.uuid),['tem ficha de jogador']);
  assert.equal(JSON.stringify(plan.guildPlans.find(row=>row.guild===world.table).afterMembers),before);
  assert.ok(!plan.npcPlans.some(row=>row.actor===world.npcs[0]||row.actor===world.npcs[1]),'membros protegidos nem entram no pool');
});

test('seleção atual usa exatamente as três guildas e duas hansas não guardadas',()=>{
  const world=redistributionWorld(),archived=currentArchive(world,3,2),plan=currentPlan(world,{archived});
  assert.equal(plan.counts.activeGuilds,3);assert.equal(plan.counts.activeHansas,2);
  const allowed=new Set([...world.guilds.slice(0,3),...world.hansas.slice(0,2)].map(guild=>guild.uuid));
  assert.ok(plan.npcPlans.every(row=>!row.newGuildUuid||allowed.has(row.newGuildUuid)));
  assert.deepEqual(new Set(plan.archivedAfter),new Set(archived),'planejar não troca a seleção atual');
});

test('PIPI, PiPis, P.I.P.I e P I P I são protegidas só pelo nome compacto',()=>{
  for(const tableName of ['PIPI','PiPis','P.I.P.I','P I P I']){
    const world=redistributionWorld({tableName,withPlayer:false}),protection=guildProtectionMap(world.allGuilds,world.resolve);
    assert.deepEqual(protection.get(world.table.uuid),['nome "P.I.P.I."'],tableName);
    const plan=currentPlan(world);
    assert.equal(plan.guildPlans.find(row=>row.guild===world.table).state,'protected',tableName);
  }
});

test('selo Dragão prateado protege uma guilda renomeada e sem jogador',()=>{
  const world=redistributionWorld({tableName:'Companhia Prateada',withPlayer:false,withSeal:true});
  assert.deepEqual(guildProtectionReasons(world.table,world.resolve),['selo "Dragão prateado"']);
  const plan=currentPlan(world),tablePlan=plan.guildPlans.find(row=>row.guild===world.table);
  assert.equal(tablePlan.state,'protected');assert.deepEqual(tablePlan.afterMembers,world.table.system.members);
});

test('redistribuição recusa o mundo quando nenhum dos três sinais acha a guilda da mesa',()=>{
  const world=redistributionWorld({tableName:'Outra Coisa',withPlayer:false,withSeal:false}),before=JSON.stringify(world.actors);
  const protection=guildProtectionMap(world.allGuilds,world.resolve);
  assert.equal(protection.size,0);
  assert.throws(()=>planGuildRedistribution({guilds:world.allGuilds,npcs:world.npcs,archived:currentArchive(world),protectedIds:protection,resolve:world.resolve}),/Nenhuma guilda protegida/);
  assert.equal(JSON.stringify(world.actors),before,'a recusa não altera nada');
});
