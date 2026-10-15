import {CampaignApp} from './app.mjs';
import {MODULE_ID,assertCompatible} from './adapter.mjs';
import {registerBranding,loadBranding} from './branding.mjs';
import {ASK_RELEASE_ON_ACTIVATE_KEY,CampaignLibrary,NPC_LOCALITIES_KEY,REGION_SCENES_KEY,SCENES_KEY,SCENE_ATLAS_KEY,registerLibrarySettings,shouldAskReleaseOnActivate} from './library.mjs';
import {CHANGELOG,entriesSince,isNewer} from './changelog.mjs';
import {bindForienQuestHooks} from './forien-quests.mjs';
import {registerArcaneOverload} from './arcane-overload.mjs';
import {registerSheetV2} from './sheet-v2.mjs';
import {guildLevel} from './guilds.mjs';
import {removeAtlasScene,resolveSceneLocality} from './scene-atlas.mjs';
import {PLACES,REGIONS} from './book-world.mjs';
import {explorerCatalog,publicRegions,registeredNpcs,setNpcExplorerLocation} from './integration.mjs';
import {createFamilyRegistry} from './family.mjs';
import {createWorldCatalogService,registerWorldCatalog} from './world-catalog.mjs';
let worldCatalog;
let app;
let family;
const LAST_SEEN_VERSION='lastSeenVersion';
const escape=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function openCampaign(startArea='npcs',focus={}){
  try{
    assertCompatible(game);
    // T29 (13/10/2026): o painel é uma ferramenta da Mestra. O jogador só chega ao vendedor pelo token.
    if(!game.user.isGM)return ui.notifications.info('O painel do QUEDAÇO é uma ferramenta da Mestra.');
    const area=startArea;
    if(app?.rendered){app.area=area;if(focus.npcActor)app.library.state.npcActor=focus.npcActor;app.render(false);return app.bringToFront();}
    app=new CampaignApp();
    app.family=family;
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
Hooks.once('init',()=>{registerWorldCatalog(game,Hooks);worldCatalog=createWorldCatalogService(game,Hooks);family=createFamilyRegistry({game,hooks:Hooks,onChange:()=>{if(app?.rendered&&app.area==='modules')app.render(false);}});registerBranding();registerLibrarySettings(game,()=>{if(app?.rendered)app.render(false);});registerArcaneOverload(game);registerSheetV2(MODULE_ID);game.settings.register(MODULE_ID,LAST_SEEN_VERSION,{scope:'client',config:false,type:String,default:''});});
Hooks.once('ready',()=>{
  const module=game.modules.get(MODULE_ID);
  const descriptor=Object.freeze({family:'quedaco',contractVersion:1,id:MODULE_ID,title:module.title,version:module.version,capabilities:Object.freeze({npcDatabase:true,regionDatabase:true,campaignPanel:true,familyRegistry:true,explorerCatalog:true,npcLocation:true,worldCatalog:true,localityDatabase:true,tagDatabase:true,climateDatabase:true,ambientDatabase:true}),getStatus:()=>({ready:true}),open:openCampaign,openCampaign,listNpcs:()=>registeredNpcs(game),...worldCatalog,setNpcExplorerLocation:(uuid,location)=>setNpcExplorerLocation(game,uuid,location),familyRegistry:Object.freeze({list:()=>family.scan().list(),open:id=>family.open(id),withCapability:capability=>family.withCapability(capability)})});
  module.api=descriptor;family.scan();Hooks.callAll('quedaco:register',descriptor);void loadBranding();
  const current=String(module.version??''),seen=String(game.settings.get(MODULE_ID,LAST_SEEN_VERSION)??'');
  if(seen!==current&&isNewer(current,seen)){const fresh=entriesSince(CHANGELOG,seen);if(fresh.length)showChangelog(fresh,current);}
  bindForienQuestHooks(game,()=>{if(app?.rendered&&app.area==='quests')app.render(false);});
});
// Botão de campanha. Criação de personagens pertence ao módulo separado.
Hooks.on('getSceneControlButtons',(controls)=>{
  if(!game.user?.isGM)return;
  const tool={name:'quedaco',title:'QUEDAÇO',icon:'fa-solid fa-dragon',button:true,order:99,onClick:()=>openCampaign(game.user?.isGM?'npcs':'map')};
  if(Array.isArray(controls)){const group=controls.find(c=>c.name==='tokens')??controls[0];group?.tools?.push(tool);}
  else{const group=controls.tokens??Object.values(controls)[0];if(group?.tools)group.tools[tool.name]=tool;}
});
Hooks.on('getHeaderControlsActorSheetV2',(sheet,controls)=>{
  const actor=sheet.actor??sheet.document;if(!game.user?.isGM||!actor?.flags?.[MODULE_ID]?.npc||controls.some(control=>control.action==='quedacoNpc'))return;
  controls.push({action:'quedacoNpc',icon:'fa-solid fa-dragon',label:'QUEDAÇO · NPC',onClick:()=>openCampaign('npcs',{npcActor:actor.id})});
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

Hooks.on('quedaco:catalog-updated',()=>{if(app?.rendered)app.render(false);});
