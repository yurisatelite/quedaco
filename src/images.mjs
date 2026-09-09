export const IMAGE_KINDS={region:'regioes',place:'locais',npc:'npcs',monster:'monstros',item:'itens',quest:'quests',map:'mapas'};
export function imageSlug(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
export function imageCandidates(root,kind,idOrName){
 const base=String(root??'').replace(/[\/]+$/,''),folder=IMAGE_KINDS[kind]??imageSlug(kind),slug=imageSlug(idOrName);
 if(!base||!slug)return [];
 return ['webp','png','jpg','svg'].map(ext=>`${base}/${folder}/${slug}.${ext}`);
}
export function resolveImage(kind,idOrName,{root='',manifest={},documentImg='',fallback='icons/svg/mystery-man.svg'}={}){
 const key=imageSlug(idOrName),section=manifest?.[IMAGE_KINDS[kind]]??manifest?.[kind]??{},exception=section?.[idOrName]??section?.[key];
 const sources=[exception,...imageCandidates(root,kind,idOrName),documentImg,fallback].filter(Boolean);
 return {src:sources[0]??'',fallbacks:[...new Set(sources.slice(1))],sources:[...new Set(sources)]};
}
export class ImageResolver{
 constructor(game,moduleId='quedaco',setting='assetRoot'){this.game=game;this.moduleId=moduleId;this.setting=setting;this.manifest={};}
 get root(){try{const value=this.game.settings?.get(this.moduleId,this.setting);return (typeof value==='string'?value:'').replace(/[\/]+$/,'');}catch{return '';}}
 async load(){this.manifest={};if(!this.root)return this.manifest;try{const response=await fetch(`${this.root}/quedaco-imagens.json`,{cache:'no-store'});if(response.ok)this.manifest=await response.json();}catch{}return this.manifest;}
 resolve(kind,idOrName,documentImg='',fallback='icons/svg/mystery-man.svg'){return resolveImage(kind,idOrName,{root:this.root,manifest:this.manifest,documentImg,fallback});}
}
