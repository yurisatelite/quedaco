export const IMAGE_KINDS={region:'regioes',place:'locais',npc:'npcs',monster:'monstros',item:'itens',quest:'quests',map:'mapas',token:'tokens',guild:'guildas',seal:'selos'};
export function imageSlug(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
export function imageCandidates(root,kind,idOrName){
 const base=String(root??'').replace(/[\/]+$/,''),folder=IMAGE_KINDS[kind]??imageSlug(kind),slug=imageSlug(idOrName);
 if(!base||!slug)return [];
 return ['webp','png'].map(ext=>`${base}/${folder}/${slug}.${ext}`);
}
export function imageIndexMatchesRoot(index,root){return Array.isArray(index?.files)&&String(index?.root??'').replace(/[\\/]+$/,'')===String(root??'').replace(/[\\/]+$/,'');}
export function indexedImageCandidates(candidates,index,root){
 if(!imageIndexMatchesRoot(index,root))return candidates;
 const files=new Set(index.files.map(path=>String(path).replace(/\\/g,'/')));
 return candidates.filter(path=>files.has(String(path).replace(/\\/g,'/')));
}
/** Lê cada pasta só uma vez: o índice impede que o navegador teste extensões inexistentes. */
export async function buildImageIndex(root,browse){
 const base=String(root??'').replace(/[\\/]+$/,'');if(!base||typeof browse!=='function')return {root:base,files:[]};
 const folders=[...new Set([...Object.values(IMAGE_KINDS),'tokens'])];
 const results=await Promise.all(folders.map(async folder=>{try{return await browse(`${base}/${folder}`);}catch{return null;}}));
 const files=results.flatMap(result=>Array.isArray(result?.files)?result.files:[]).map(path=>String(path).replace(/\\/g,'/')).filter(Boolean).sort();
 return {root:base,files:[...new Set(files)]};
}
export function resolveImage(kind,idOrName,{root='',manifest={},index=null,documentImg='',fallback='icons/svg/mystery-man.svg'}={}){
 const key=imageSlug(idOrName),section=manifest?.[IMAGE_KINDS[kind]]??manifest?.[kind]??{},exception=section?.[idOrName]??section?.[key];
 const tokenCandidates=['npc','monster'].includes(kind)?imageCandidates(root,'token',idOrName):[];
 const folder=indexedImageCandidates([...imageCandidates(root,kind,idOrName),...tokenCandidates],index,root);
 // Com imagem própria do documento e sem entrada no manifesto: mostra a imagem
 // real primeiro. Ela existe, então o navegador nunca chega a pedir os candidatos
 // da pasta (evita centenas de 404 ao abrir o painel). Para forçar um arquivo da
 // pasta, use o quedaco-imagens.json.
 // Um NPC sem retrato próprio fica com o placeholder padrão do Foundry no
 // documento (documentImg===fallback). Isso não conta como "imagem real": sem
 // essa checagem, o placeholder vence antes de a pasta ter a chance de entrar.
 const preferDocument=!exception&&documentImg&&documentImg!==fallback;
 const sources=(preferDocument
   ?[documentImg,...folder,fallback]
   :[exception,...folder,documentImg,fallback]).filter(Boolean);
 return {src:sources[0]??'',fallbacks:[...new Set(sources.slice(1))],sources:[...new Set(sources)]};
}
export class ImageResolver{
 constructor(game,moduleId='quedaco',setting='assetRoot',indexSetting='imageIndex'){this.game=game;this.moduleId=moduleId;this.setting=setting;this.indexSetting=indexSetting;this.manifest={};}
 get root(){try{const value=this.game.settings?.get(this.moduleId,this.setting);return (typeof value==='string'?value:'').replace(/[\/]+$/,'');}catch{return '';}}
 get index(){try{return this.game.settings?.get(this.moduleId,this.indexSetting)??null;}catch{return null;}}
 async load(){this.manifest={};if(!this.root)return this.manifest;try{const response=await fetch(`${this.root}/quedaco-imagens.json`,{cache:'no-store'});if(response.ok)this.manifest=await response.json();}catch{}return this.manifest;}
 async reindex(browse){const index=await buildImageIndex(this.root,browse);await this.game.settings?.set?.(this.moduleId,this.indexSetting,index);return index;}
 resolve(kind,idOrName,documentImg='',fallback='icons/svg/mystery-man.svg'){return resolveImage(kind,idOrName,{root:this.root,manifest:this.manifest,index:this.index,documentImg,fallback});}
}
