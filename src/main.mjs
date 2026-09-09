import {CreatorApp} from './app.mjs';
import {MODULE_ID,assertCompatible} from './adapter.mjs';
import {registerBranding,loadBranding} from './branding.mjs';
import {registerSharedContent} from './library.mjs';
let app;
function openCreator(startArea='characters'){
  try{
    assertCompatible(game);
    const area=game.user.isGM?startArea:'characters';
    if(app?.rendered){if(area&&area!=='characters')app.area=area;app.render(false);return app.bringToFront();}
    app=new CreatorApp();
    if(area&&area!=='characters')app.area=area;
    return app.start();
  }catch(error){ui.notifications.error(error.message);}
}
Hooks.once('init',()=>{registerBranding();registerSharedContent(game,()=>{if(app?.rendered)app.render(false);});});
Hooks.once('ready',()=>{game.modules.get(MODULE_ID).api={open:openCreator,openCampaign:()=>openCreator('npcs')};void loadBranding();});
Hooks.on('renderActorDirectory',(application,html)=>{
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector('[data-yuri-creator]'))return;
  const button=document.createElement('button');button.type='button';button.dataset.yuriCreator='';button.className='sy-launch';button.textContent='QUEDAÇO · Criar personagem';button.addEventListener('click',()=>openCreator('characters'));
  const target=root.querySelector('.directory-header')??root;target.prepend(button);
});
// Botão no menu lateral de controles de cena — só para o mestre; abre o painel completo em NPCs.
Hooks.on('getSceneControlButtons',(controls)=>{
  if(!game.user?.isGM)return;
  const tool={name:'quedaco',title:'QUEDAÇO — Controle de campanha',icon:'fa-solid fa-dragon',button:true,order:99,onClick:()=>openCreator('npcs'),onChange:()=>openCreator('npcs')};
  if(Array.isArray(controls)){const group=controls.find(c=>c.name==='tokens')??controls[0];group?.tools?.push(tool);}
  else{const group=controls.tokens??Object.values(controls)[0];if(group?.tools)group.tools[tool.name]=tool;}
});
