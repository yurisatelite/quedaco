export const HOURGLASS_KEY='hourglass';
export const idleHourglass=()=>({schemaVersion:1,revision:0,id:'',label:'Ampulheta',status:'idle',durationMs:0,remainingMs:0,endsAt:null});
export function validateHourglass(value){
  const state={...idleHourglass(),...value};
  if(state.schemaVersion!==1||!['idle','running','paused'].includes(state.status)||!Number.isSafeInteger(state.revision)||state.revision<0)throw Error('Estado de ampulheta inválido.');
  if(!Number.isFinite(state.durationMs)||state.durationMs<0||state.durationMs>86400000||!Number.isFinite(state.remainingMs)||state.remainingMs<0||state.remainingMs>state.durationMs)throw Error('Duração de ampulheta inválida.');
  if(state.status==='running'&&(!Number.isFinite(state.endsAt)||state.durationMs<=0))throw Error('Prazo de ampulheta inválido.');
  if(typeof state.label!=='string'||state.label.length>100||typeof state.id!=='string')throw Error('Identificação da ampulheta inválida.');
  return state;
}
export function hourglassRemaining(value,now){const state=validateHourglass(value);return state.status==='running'?Math.max(0,Math.min(state.durationMs,state.endsAt-now)):state.status==='paused'?state.remainingMs:0;}
export function formatHourglass(ms){const total=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;}
export function createHourglassService(game,{now=()=>game.time?.serverTime??Date.now(),makeId=()=>globalThis.crypto.randomUUID()}={}){
  let queue=Promise.resolve();
  const read=()=>validateHourglass(game.settings.get('quedaco',HOURGLASS_KEY));
  const update=command=>{
    if(!game.user?.isGM)return Promise.reject(Error('Somente a Mestra controla a ampulheta.'));
    const task=queue.then(async()=>{if(!game.user?.isGM)throw Error('Somente a Mestra controla a ampulheta.');const current=read(),next=command(current);next.revision=current.revision+1;await game.settings.set('quedaco',HOURGLASS_KEY,validateHourglass(next));return next;});queue=task.catch(()=>{});return task;
  };
  return Object.freeze({getHourglass:()=>({...read(),displayRemainingMs:hourglassRemaining(read(),now())}),
    startHourglass:({seconds=60,label='Ampulheta'}={})=>update(()=>{if(!Number.isInteger(seconds)||seconds<1||seconds>86400)throw Error('Use uma duração inteira entre 1 e 86400 segundos.');return {...idleHourglass(),id:makeId(),label:label.trim()||'Ampulheta',durationMs:seconds*1000,remainingMs:seconds*1000,endsAt:now()+seconds*1000,status:'running'};}),
    pauseHourglass:()=>update(state=>{if(state.status!=='running')throw Error('A ampulheta não está em andamento.');return {...state,status:'paused',remainingMs:hourglassRemaining(state,now()),endsAt:null};}),
    resumeHourglass:()=>update(state=>{if(state.status!=='paused'||state.remainingMs<=0)throw Error('Não há contagem pausada para retomar.');return {...state,status:'running',endsAt:now()+state.remainingMs};}),
    stopHourglass:()=>update(()=>idleHourglass())});
}
