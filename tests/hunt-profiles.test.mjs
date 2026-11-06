import {test} from 'node:test';
import assert from 'node:assert/strict';
import {huntEligibility,analyzeHuntCreature,enrichedHuntBiography,createHuntProfileService} from '../src/hunt-profiles.mjs';
const creature=(hierarchy='complex')=>({id:'monster',uuid:'Actor.monster',name:'Ameaça',type:'npc',flags:{},system:{hierarchy,biography:'<p><strong>Habitat em Opath:</strong> Floresta</p>',abilities:{int:{value:1}},archetype:['brute'],movement:{walk:9}},items:[]});
test('somente Chefes e Complexos; Bruto simples não tem caçada',()=>{
  assert.equal(huntEligibility(creature('complex')),true);assert.equal(huntEligibility(creature('boss')),true);assert.equal(huntEligibility(creature('simple')),false);
  assert.equal(huntEligibility({...creature(),type:'character'}),false);
});
test('bio parcial mantém desconhecidos e não inventa veneno, covil ou matilha',()=>{
  const actor=creature(),before=structuredClone(actor),profile=analyzeHuntCreature(actor);
  assert.equal(profile.fields.habitat.value,'Floresta');assert.equal(profile.fields.lair.certainty,'unknown');assert.equal(profile.fields.diet.value,'');assert.deepEqual(actor,before);
  actor.flags.quedaco={convertedFrom:'dnd5e'};assert.equal(analyzeHuntCreature(actor).fields.habitat.certainty,'inferred');
});
test('enriquecimento por prévia preserva mecânica, cria backup e fica idempotente',async()=>{
  const actor=creature(),mechanics=structuredClone(actor.system.abilities);let writes=0;
  const game={user:{isGM:true},actors:[actor,creature('simple')]};game.actors[1].id='simple';
  const api=createHuntProfileService(game,{makeId:()=> 'preview',updateActors:async changes=>{writes++;for(const row of changes){actor.system.biography=row['system.biography'];actor.flags.quedaco={huntProfile:row['flags.quedaco.huntProfile'],huntProfileBackup:row['flags.quedaco.huntProfileBackup']};}}});
  const preview=api.previewMonsterHuntProfiles();assert.equal(writes,0);assert.equal(preview.total,1);assert.equal(preview.excludedSimple,1);
  preview.rows[0].biography='Adulterado';await api.applyMonsterHuntProfiles(preview.id);assert.equal(writes,1);assert.deepEqual(actor.system.abilities,mechanics);assert.notEqual(actor.system.biography,'Adulterado');
  assert.equal(actor.flags.quedaco.huntProfileBackup.biography,'<p><strong>Habitat em Opath:</strong> Floresta</p>');
  const second=api.previewMonsterHuntProfiles();assert.equal((await api.applyMonsterHuntProfiles(second.id)).updated,0);assert.equal(writes,1);
});
test('ficha alterada invalida lote e jogador não prepara nem aplica',async()=>{
  const actor=creature(),game={user:{isGM:true},actors:[actor]};const api=createHuntProfileService(game,{makeId:()=> 'preview',updateActors:async()=>assert.fail('não deve gravar')});
  api.previewMonsterHuntProfiles();actor.system.hierarchy='simple';await assert.rejects(api.applyMonsterHuntProfiles('preview'),/mudou/);
  game.user.isGM=false;assert.throws(()=>api.previewMonsterHuntProfiles(),/Mestra/);await assert.rejects(api.applyMonsterHuntProfiles('preview'),/Mestra/);
});
test('bloco derivado não se acumula na biografia e texto é escapado',()=>{
  const actor=creature(),profile=analyzeHuntCreature(actor);profile.fields.habitat.value='<script>';
  actor.system.biography=enrichedHuntBiography(actor,profile);assert(!actor.system.biography.includes('<script>'));const second=enrichedHuntBiography(actor,analyzeHuntCreature(actor));assert.equal((second.match(/data-quedaco-hunt-profile/g)??[]).length,1);
});
