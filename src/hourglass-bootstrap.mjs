import {HOURGLASS_KEY,idleHourglass,createHourglassService} from './hourglass.mjs';
import {createHourglassPanel} from './panels/hourglass.mjs';
let panel;
Hooks.once('init',()=>game.settings.register('quedaco',HOURGLASS_KEY,{scope:'world',config:false,type:Object,default:idleHourglass(),onChange:()=>panel?.refresh()}));
Hooks.once('ready',()=>{
  const service=createHourglassService(game);panel=createHourglassPanel(game,service);
  const module=game.modules.get('quedaco');module.api=Object.freeze({...module.api,...service,openHourglass:()=>panel.openHourglass(),capabilities:Object.freeze({...module.api?.capabilities,hourglass:true})});
  Hooks.callAll('quedaco:register',module.api);panel.initialize();
});
Hooks.on('getSceneControlButtons',controls=>{
  if(!game.user?.isGM)return;
  const tool={name:'quedaco-hourglass',title:'QUEDAÇO — Ampulheta',icon:'fa-solid fa-hourglass-half',button:true,order:100,onClick:()=>panel?.openHourglass()};
  const group=Array.isArray(controls)?controls.find(row=>row.name==='tokens')??controls[0]:controls.tokens??Object.values(controls)[0];
  if(Array.isArray(group?.tools)){if(!group.tools.some(row=>row.name===tool.name))group.tools.push(tool);}else if(group?.tools)group.tools[tool.name]=tool;
});
