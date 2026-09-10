import {MODULE_ID} from './adapter.mjs';

// T35 — o sistema Skyfall só AVISA sobre a sobrecarga arcana ao equipar um item
// com sigilos acima do limite de Fragmentos Arcanos; nunca rola o dano. O QUEDAÇO
// completa: rola Nd6 de dano Energético e aplica na ficha do portador.
export const ARCANE_OVERLOAD_KEY='arcaneOverloadAuto';

/** Quantos d6 de dano Energético o equipamento dispara, ou 0 quando não sobrecarrega. */
export function overloadDice({fragments=0,value=0,max=0}={}){
  const f=Math.max(0,Math.floor(Number(fragments)||0));
  if(f<=0)return 0;
  return (f+(Number(value)||0))>(Number(max)||0)?f:0;
}

/** Aplica `total` de dano consumindo primeiro os PV temporários, depois os PV atuais. */
export function applyOverloadHp(hp={},total=0){
  const damage=Math.max(0,Math.floor(Number(total)||0));
  const temp=Math.max(0,Number(hp.temp)||0),fromTemp=Math.min(temp,damage);
  return {temp:temp-fromTemp,value:(Number(hp.value)||0)-(damage-fromTemp)};
}

async function onItemUpdate(game,item,changed,userId){
  try{
    if(game.user?.id!==userId)return;
    if(!game.settings.get(MODULE_ID,ARCANE_OVERLOAD_KEY))return;
    if(changed?.system?.equipped!==true)return;
    const sys=item?.system??{};
    if(!('equipped' in sys)||sys.attuned!==true)return;
    const actor=item.parent;if(!actor?.system?.fragments)return;
    const {value=0,max=0}=actor.system.fragments;
    const dice=overloadDice({fragments:Number(sys.fragments)||0,value,max});
    if(!dice)return;
    const roll=await new Roll(`${dice}d6`).evaluate();
    const speaker=globalThis.ChatMessage?.getSpeaker?.({actor});
    await roll.toMessage({speaker,flavor:`Sobrecarga arcana de ${item.name} — dano Energético`});
    const next=applyOverloadHp(actor.system.resources?.hp??{},roll.total);
    await actor.update({'system.resources.hp.temp':next.temp,'system.resources.hp.value':next.value});
    globalThis.ui?.notifications?.warn?.(`${actor.name} sofreu ${roll.total} de dano Energético por sobrecarga arcana.`);
  }catch(error){console.error('QUEDAÇO · sobrecarga arcana',error);}
}

export function registerArcaneOverload(game){
  game.settings.register(MODULE_ID,ARCANE_OVERLOAD_KEY,{scope:'world',config:true,type:Boolean,default:true,
    name:'Rolar sobrecarga arcana ao equipar',
    hint:'Quando um equipamento com sigilos ultrapassa o limite de Fragmentos Arcanos do portador, o QUEDAÇO rola Nd6 de dano Energético e aplica na ficha. O sistema base só exibia um aviso.'});
  Hooks.on('updateItem',(item,changed,options,userId)=>{void onItemUpdate(game,item,changed,userId);});
}
