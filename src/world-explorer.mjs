// T15 — ponte pequena e segura com o módulo World Explorer (CarlosFdez/world-explorer).
// O QUEDAÇO não lê nem escreve nada dele além de: (1) saber se está ativo; (2) contar,
// só pra mostrar, os hexágonos revelados de uma cena. A contagem lê um dado interno e não
// documentado (`flags['world-explorer'].gridData`, formato estável desde a v2.1.0 —
// `{chave:{offset:{i,j},reveal:true|false|'partial'}}`, ver docs/REFERENCIA-SKYFALL.md).
// Por isso tudo aqui é blindado: formato inesperado = `null`, nunca erro.

export const WORLD_EXPLORER_ID='world-explorer';

export function worldExplorerActive(game){
  try{return Boolean(game?.modules?.get?.(WORLD_EXPLORER_ID)?.active);}catch{return false;}
}

/** `{revealed,partial}` a partir do gridData cru, ou `null` se o formato não for o esperado. */
export function countRevealedHexes(gridData){
  try{
    if(!gridData||typeof gridData!=='object'||Array.isArray(gridData))return null;
    let revealed=0,partial=0,valid=0;
    for(const cell of Object.values(gridData)){
      if(!cell||typeof cell!=='object')continue;
      if(cell.reveal===true){revealed++;valid++;}
      else if(cell.reveal==='partial'){partial++;valid++;}
      else if(cell.reveal===false)valid++;
    }
    if(!valid&&Object.keys(gridData).length)return null;
    return {revealed,partial};
  }catch{return null;}
}

/** Lê direto de `scene.flags` — `getFlag` lança erro quando o módulo dono está desativado. */
export function sceneRevealedHexes(scene){
  try{return countRevealedHexes(scene?.flags?.[WORLD_EXPLORER_ID]?.gridData);}catch{return null;}
}

/** A cena de exploração a abrir: a cena principal da região, se tiver dado do World
 * Explorer; senão a primeira cena do mundo que tiver. `null` quando nenhuma tem. */
export function explorationScene(scenes=[],preferredId=''){
  try{
    const list=Array.from(scenes??[]);
    const has=scene=>Boolean(scene?.flags?.[WORLD_EXPLORER_ID]?.gridData);
    const preferred=preferredId?list.find(scene=>scene?.id===preferredId):null;
    if(preferred&&has(preferred))return preferred;
    return list.find(has)??null;
  }catch{return null;}
}
