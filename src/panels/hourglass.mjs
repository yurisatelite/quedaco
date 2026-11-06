import {formatHourglass,hourglassRemaining} from '../hourglass.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Diálogo nativo: jogadores apenas veem a contagem. */
export function createHourglassPanel(game,service){
  let viewer=null,ready=false,shownId='',finishedId='';
  const clock=()=>game.time?.serverTime??Date.now();
  function show(){
    const state=service.getHourglass();
    if(state.status==='idle'){void viewer?.close();viewer=null;return;}
    if(viewer?.rendered){viewer.render({force:true});return;}
    class HourglassDialog extends foundry.applications.api.DialogV2{
      _onRender(context,options){super._onRender(context,options);clearInterval(this.ticker);const tick=()=>{
        const current=service.getHourglass(),left=hourglassRemaining(current,clock());
        const root=this.element;root.querySelector('[data-hourglass-time]').textContent=formatHourglass(left);
        root.querySelector('[data-hourglass-label]').textContent=current.label;
        root.querySelector('progress').max=current.durationMs||1;root.querySelector('progress').value=left;
        root.querySelector('[data-hourglass-status]').textContent=current.status==='paused'?'Pausada':left>0?'Tempo restante':'Tempo encerrado';
        if(current.status==='running'&&left===0&&finishedId!==current.id){finishedId=current.id;ui.notifications.info(`Ampulheta: ${current.label} — tempo encerrado.`);}
      };tick();this.ticker=setInterval(tick,250);}
      async close(options){clearInterval(this.ticker);return super.close(options);}
    }
    viewer=new HourglassDialog({classes:['qd-ui'],window:{title:'QUEDAÇO — Ampulheta',resizable:false},position:{width:320},content:`<div class="qd-hourglass"><span aria-hidden="true">⏳</span><strong data-hourglass-label>${escape(state.label)}</strong><output data-hourglass-time>${formatHourglass(state.displayRemainingMs)}</output><progress aria-label="Tempo restante" value="0" max="1"></progress><p data-hourglass-status></p></div>`,buttons:[{action:'close',label:'Fechar'}]});viewer.render({force:true});
  }
  return {refresh(){if(!ready)return;const state=service.getHourglass();if(state.status==='idle'){show();shownId='';return;}if(state.id!==shownId||viewer?.rendered){shownId=state.id;show();}},initialize(){ready=true;const state=service.getHourglass();if(state.status==='paused'||state.displayRemainingMs>0){shownId=state.id;show();}},showHourglass:show,
    async openHourglass(){
      if(!game.user?.isGM){show();return;}
      const state=service.getHourglass();
      const actions=[['start','Iniciar para todos'],...(state.status==='running'?[['pause','Pausar']]:[]),...(state.status==='paused'?[['resume','Retomar']]:[]),...(state.status!=='idle'?[['show','Ver ampulheta'],['stop','Encerrar para todos']]:[])];
      const result=await foundry.applications.api.DialogV2.wait({classes:['qd-ui'],window:{title:'QUEDAÇO — Controlar ampulheta'},content:`<p>Contagem de tempo real compartilhada com os jogadores.</p><label>Título<input name="label" maxlength="100" value="${escape(state.label)}"></label><label>Duração em segundos<input name="seconds" type="number" min="1" max="86400" step="1" value="${state.durationMs/1000||60}"></label>`,buttons:actions.map(([action,label])=>({action,label,callback:(_event,button)=>({action,label:button.form.elements.label.value,seconds:Number(button.form.elements.seconds.value)})})),rejectClose:false,close:()=>null});
      if(!result)return;
      try{if(result.action==='start')await service.startHourglass(result);if(result.action==='pause')await service.pauseHourglass();if(result.action==='resume')await service.resumeHourglass();if(result.action==='stop')await service.stopHourglass();if(result.action==='show')show();}catch(error){ui.notifications.error(error.message);}
    }};
}
