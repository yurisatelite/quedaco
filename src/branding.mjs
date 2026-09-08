import {MODULE_ID} from './adapter.mjs';

// Optional, licensed fonts live outside the module so Foundry updates preserve them.
export function registerBranding(){
  game.settings.register(MODULE_ID,'fontDirectory',{
    name:'Pasta de fontes da mesa',hint:'Pasta no armazenamento do Foundry com Noka-Medium.woff2 e Noka-Semibold.woff2. Deixe vazia para usar a fonte padrão.',
    scope:'world',config:true,type:String,default:'',requiresReload:true
  });
}

export async function loadBranding(){
  const directory=String(game.settings.get(MODULE_ID,'fontDirectory')??'').trim().replace(/\/+$/,'');
  if(!directory||/^[a-z]+:|^\/\/|["()\\]/i.test(directory))return;
  await Promise.allSettled([['Medium','500'],['Semibold','600']].map(async([name,weight])=>{
    const face=new FontFace('NokaYuri',`url("${directory}/Noka-${name}.woff2")`,{weight});
    await face.load();document.fonts.add(face);
  }));
}
