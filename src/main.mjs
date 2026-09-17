import {CreatorApp} from './app.mjs';
import {MODULE_ID,assertCompatible} from './adapter.mjs';
import {registerBranding,loadBranding} from './branding.mjs';
import {ASK_RELEASE_ON_ACTIVATE_KEY,CampaignLibrary,NPC_LOCALITIES_KEY,REGION_SCENES_KEY,SCENES_KEY,SCENE_ATLAS_KEY,registerLibrarySettings,shouldAskReleaseOnActivate} from './library.mjs';
import {CHANGELOG,entriesSince,isNewer} from './changelog.mjs';
import {bindForienQuestHooks} from './forien-quests.mjs';
import {registerArcaneOverload} from './arcane-overload.mjs';
import {guildLevel} from './guilds.mjs';
import {removeAtlasScene,resolveSceneLocality} from './scene-atlas.mjs';
import {PLACES,REGIONS} from './book-world.mjs';
let app;
const LAST_SEEN_VERSION='lastSeenVersion';
const escape=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function openCreator(startArea='characters',focus={}){
  try{
    assertCompatible(game);
    const area=game.user.isGM?startArea:'characters';
    if(app?.rendered){app.area=area;if(focus.npcActor)app.library.state.npcActor=focus.npcActor;app.render(false);return app.bringToFront();}
    app=new CreatorApp();
    app.area=area;if(focus.npcActor)app.library.state.npcActor=focus.npcActor;
    return app.start();
  }catch(error){ui.notifications.error(error.message);}
}
function showChangelog(entries,current){
  const content=`<div class="sy-changelog-content">${entries.map(entry=>`<section><small>VERSÃO ${escape(entry.version)} · ${escape(entry.date.split('-').reverse().join('/'))}</small><h2>${escape(entry.title)}</h2><ul>${entry.notes.map(note=>`<li>${escape(note)}</li>`).join('')}</ul></section>`).join('')}<a class="sy-changelog-link" href="https://github.com/yurisatelite/quedaco/releases" target="_blank" rel="noopener">Ver no GitHub</a></div>`;
  const DialogV2=foundry.applications.api.DialogV2;
  const dialog=new DialogV2({classes:['sy-changelog'],window:{title:'QUEDAÇO — Novidades'},position:{width:520},content,buttons:[{action:'close',label:'Fechar',default:true}]});
  dialog.addEventListener('close',()=>{void game.settings.set(MODULE_ID,LAST_SEEN_VERSION,current);},{once:true});
  dialog.render({force:true});
}
Hooks.once('init',()=>{registerBranding();registerLibrarySettings(game,()=>{if(app?.rendered)app.render(false);});registerArcaneOverload(game);game.settings.register(MODULE_ID,LAST_SEEN_VERSION,{scope:'client',config:false,type:String,default:''});});
Hooks.once('ready',()=>{
  const module=game.modules.get(MODULE_ID);module.api={open:openCreator,openCampaign:()=>openCreator('npcs')};void loadBranding();
  const current=String(module.version??''),seen=String(game.settings.get(MODULE_ID,LAST_SEEN_VERSION)??'');
  if(seen!==current&&isNewer(current,seen)){const fresh=entriesSince(CHANGELOG,seen);if(fresh.length)showChangelog(fresh,current);}
  bindForienQuestHooks(game,()=>{if(app?.rendered&&app.area==='quests')app.render(false);});
});
Hooks.on('renderActorDirectory',(application,html)=>{
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector('[data-yuri-creator]'))return;
  const button=document.createElement('button');button.type='button';button.dataset.yuriCreator='';button.className='sy-launch';button.textContent='QUEDAÇO · Criar personagem';button.addEventListener('click',()=>openCreator('characters'));
  const target=root.querySelector('.directory-header')??root;target.prepend(button);
});
// Botão no menu lateral de controles de cena — para todos. Mestre abre o painel de campanha; jogador cai na criação de personagens.
Hooks.on('getSceneControlButtons',(controls)=>{
  const tool={name:'quedaco',title:'QUEDAÇO',icon:'fa-solid fa-dragon',button:true,order:99,onClick:()=>openCreator(game.user?.isGM?'npcs':'characters')};
  if(Array.isArray(controls)){const group=controls.find(c=>c.name==='tokens')??controls[0];group?.tools?.push(tool);}
  else{const group=controls.tokens??Object.values(controls)[0];if(group?.tools)group.tools[tool.name]=tool;}
});
Hooks.on('getHeaderControlsActorSheetV2',(sheet,controls)=>{
  const actor=sheet.actor??sheet.document;if(!game.user?.isGM||!actor?.flags?.[MODULE_ID]?.npc||controls.some(control=>control.action==='quedacoNpc'))return;
  controls.push({action:'quedacoNpc',icon:'fa-solid fa-dragon',label:'QUEDAÇO · NPC',onClick:()=>openCreator('npcs',{npcActor:actor.id})});
});
async function refreshOpenPanel(){
  if(!app?.rendered)return;
  app.library.loaded=false;
  if(app.area==='monsters'&&game.user?.isGM)await app.library.loadActors(true);
  app.render(false);
}
Hooks.on('createActor',()=>{void refreshOpenPanel();});
Hooks.on('updateActor',()=>{void refreshOpenPanel();});
Hooks.on('updateUser',(_user,changed)=>{
  const roleChanged=foundry.utils.hasProperty(changed,'flags.quedaco.npcRoles2')||Object.keys(changed).some(key=>key.startsWith('flags.quedaco.npcRoles2'));
  if(app?.rendered&&app.area==='npcs'&&roleChanged)app.render(false);
});
// Estrutura da guilda: system.level = maior nível entre os membros-jogador (mín. 2).
async function syncGuildLevels(){
  if(!game.user?.isGM)return;
  const guilds=(game.actors??[]).filter(actor=>actor.type==='guild');if(!guilds.length)return;
  const resolve=uuid=>{try{return fromUuidSync(uuid);}catch{return null;}};
  for(const guild of guilds){const wanted=guildLevel(guild,resolve);if(Number(guild.system?.level)!==wanted)await guild.update({'system.level':wanted});}
}
Hooks.on('updateActor',(actor,changed)=>{
  if(actor.type==='guild'&&foundry.utils.hasProperty(changed,'system.members'))void syncGuildLevels();
  else if(actor.type==='character'&&foundry.utils.hasProperty(changed,'system.level'))void syncGuildLevels();
});
// T6 (Mapa Imersivo): o painel da cena ativa lê a Scene ativa do canvas; ela só muda
// depois que o canvas troca de verdade. Nada abre sozinho — só re-renderiza quem já
// está com a janela aberta na aba Mapa.
Hooks.on('canvasReady',()=>{
  if(app?.rendered&&['map','activeScene'].includes(app.area)&&game.user?.isGM)app.render(false);
});
// A entrada é administrativa, não a Scene em si. Ao apagar a Scene no Foundry,
// removemos somente essa entrada e mantemos as ligações para poder repará-las depois.
Hooks.on('deleteScene',(scene)=>{
  if(!game.user?.isGM||!scene?.id)return;
  try{
    const atlas=game.settings.get(MODULE_ID,SCENE_ATLAS_KEY);
    if(!atlas?.scenes?.[scene.id])return;
    void game.settings.set(MODULE_ID,SCENE_ATLAS_KEY,removeAtlasScene(atlas,scene.id)).catch(error=>console.error(MODULE_ID,'não foi possível atualizar o Mapa Imersivo após apagar a Scene.',error));
  }catch(error){console.error(MODULE_ID,'não foi possível ler o Mapa Imersivo após apagar a Scene.',error);}
});
// T7 (Mapa Imersivo): ao ativar uma cena cuja localidade ainda não foi liberada,
// pergunta antes de liberar. Nunca libera sozinho, e uma configuração desliga a
// pergunta. Funciona sem o painel do QUEDAÇO estar aberto — a leitura/gravação usa os
// settings direto, e o `setNpcLocality` de uma instância descartável faz a gravação.
Hooks.on('updateScene',(scene,changed)=>{
  if(!game.user?.isGM||changed?.active!==true)return;
  const askEnabled=Boolean(game.settings.get(MODULE_ID,ASK_RELEASE_ON_ACTIVATE_KEY));
  const atlas=game.settings.get(MODULE_ID,SCENE_ATLAS_KEY);
  const placeScenes=game.settings.get(MODULE_ID,SCENES_KEY)||{};
  const regionScenes=game.settings.get(MODULE_ID,REGION_SCENES_KEY)||{};
  const locality=resolveSceneLocality(atlas,scene.id,{placeScenes,regionScenes});
  const npcLocalities=new Set(game.settings.get(MODULE_ID,NPC_LOCALITIES_KEY)||[]);
  if(!shouldAskReleaseOnActivate({askEnabled,locality,npcLocalities}))return;
  const place=locality.placeId?PLACES.find(p=>p.id===locality.placeId):null;
  const region=REGIONS.find(r=>r.id===locality.regionId);
  const nome=place?.name??region?.name??'esta localidade';
  foundry.applications.api.DialogV2.confirm({
    window:{title:'Liberar localidade'},
    content:`<p>O grupo chegou em <strong>${escape(nome)}</strong>. Liberar aos jogadores?</p>`,
    yes:{label:'Liberar',callback:async()=>{
      const kind=locality.placeId?'place':'region';
      await (app?.library??new CampaignLibrary(game,null)).setNpcLocality(kind,locality.placeId||locality.regionId,true);
    }},
    no:{label:'Agora não'}
  });
});
