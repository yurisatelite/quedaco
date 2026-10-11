// T27 — Ficha V2. Herda a ficha de personagem do sistema Skyfall (1.0.1) sem mudar nada
// visual; as correções de nível entram aqui, só nesta subclasse. O sistema não exporta a
// classe, então ela é achada pelo registro de fichas do Foundry.
export const SHEET_V2_LABEL='QUEDAÇO — Ficha V2';
export const SYSTEM_SHEET_ID='skyfall.SkyfallCharacterSheet';

export function findSystemCharacterSheet(config=globalThis.CONFIG){
  const entry=config?.Actor?.sheetClasses?.character?.[SYSTEM_SHEET_ID];
  return typeof entry?.cls==='function'?entry.cls:null;
}

export function createSheetV2(Base){
  return class QuedacoCharacterSheetV2 extends Base{};
}

export function registerSheetV2(moduleId,{config=globalThis.CONFIG,sheets=globalThis.foundry?.applications?.apps?.DocumentSheetConfig,ActorClass=globalThis.foundry?.documents?.Actor}={}){
  const Base=findSystemCharacterSheet(config);
  if(!Base||!sheets||!ActorClass){console.warn(moduleId,'Ficha V2 não registrada: ficha de personagem do Skyfall não encontrada.');return null;}
  const Sheet=createSheetV2(Base);
  sheets.registerSheet(ActorClass,moduleId,Sheet,{types:['character'],makeDefault:true,label:SHEET_V2_LABEL});
  return Sheet;
}
