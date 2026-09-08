import {CreatorApp} from './app.mjs';
import {MODULE_ID,assertCompatible} from './adapter.mjs';
let app;
function openCreator(){try{assertCompatible(game);if(app?.rendered)return app.bringToFront();app=new CreatorApp();return app.start();}catch(error){ui.notifications.error(error.message);}}
Hooks.once('ready',()=>{game.modules.get(MODULE_ID).api={open:openCreator};});
Hooks.on('renderActorDirectory',(application,html)=>{
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector('[data-yuri-creator]'))return;
  const button=document.createElement('button');button.type='button';button.dataset.yuriCreator='';button.className='sy-launch';button.textContent='QUEDAÇO · Criar personagem';button.addEventListener('click',openCreator);
  const target=root.querySelector('.directory-header')??root;target.prepend(button);
});
