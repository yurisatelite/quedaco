import {test} from 'node:test';
import assert from 'node:assert/strict';
import {idleHourglass,createHourglassService,hourglassRemaining,formatHourglass,validateHourglass} from '../src/hourglass.mjs';
test('contagem usa prazo absoluto e retoma com o tempo restante, mesmo após recarga',async()=>{
  let stored=idleHourglass(),time=1000;
  const game={user:{isGM:true},settings:{get:()=>stored,set:async(_m,_k,value)=>{stored=value;}}};
  const service=createHourglassService(game,{now:()=>time,makeId:()=> 'timer'});
  await service.startHourglass({seconds:60,label:'Decidam!'});time=16000;assert.equal(service.getHourglass().displayRemainingMs,45000);
  await service.pauseHourglass();time=99000;assert.equal(service.getHourglass().displayRemainingMs,45000);
  await service.resumeHourglass();time+=5000;
  const reloaded=createHourglassService(game,{now:()=>time});assert.equal(reloaded.getHourglass().displayRemainingMs,40000);
  time+=99000;assert.equal(reloaded.getHourglass().displayRemainingMs,0);assert.equal(formatHourglass(0),'00:00');
  await reloaded.stopHourglass();assert.equal(stored.status,'idle');assert.equal(stored.revision,4);
});
test('jogadores consultam mas não alteram o cronômetro; valores inválidos não gravam',async()=>{
  let writes=0;const game={user:{isGM:false},settings:{get:()=>idleHourglass(),set:async()=>writes++}};
  const service=createHourglassService(game);
  assert.equal(service.getHourglass().status,'idle');await assert.rejects(service.startHourglass(),/Mestra/);
  game.user.isGM=true;for(const seconds of [0,-1,NaN,1.5,86401])await assert.rejects(service.startHourglass({seconds}),/duração/);
  await assert.rejects(service.resumeHourglass(),/pausada/);assert.equal(writes,0);
});
test('tempo restante nunca fica negativo e schema futuro não é aceito',()=>{
  const state={...idleHourglass(),durationMs:1000,endsAt:100,status:'running'};
  assert.equal(hourglassRemaining(state,1000),0);assert.equal(formatHourglass(61500),'01:02');
  assert.throws(()=>validateHourglass({...state,schemaVersion:2}),/inválido/);
});
