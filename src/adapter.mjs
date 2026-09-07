import { ABILITIES, wallet } from './rules.mjs';
export const MODULE_ID='skyfall-yuri-criador';
/** Adapter for the inspected Skyfall 1.0.1 schema. Never reimplements its effects. */
export function assertCompatible(game) {
  if (game.system.id !== 'skyfall') throw Error('Este criador requer o sistema Skyfall.');
  if (Number(String(game.version).split('.')[0]) !== 13) throw Error('Esta versão do criador foi preparada para Foundry 13.');
}
export function actorSource(draft, userId) {
  if (!draft.name?.trim()) throw Error('Dê um nome ao personagem.');
  if (!draft.attributes || Object.values(draft.attributes).some(v=>!Number.isInteger(v)||v< -4||v>4)) throw Error('Atributos inválidos.');
  if (Object.keys(ABILITIES).some(k=>!(k in draft.attributes))) throw Error('Faltam atributos.');
  return {
    name:draft.name.trim(), type:'character', img:draft.portrait||'icons/svg/mystery-man.svg',
    ownership:{default:0,[userId]:3},
    prototypeToken:{name:draft.name.trim(),actorLink:true,texture:{src:draft.token||draft.portrait||'icons/svg/mystery-man.svg'}},
    system:{abilities:Object.fromEntries(Object.entries(draft.attributes).map(([k,value])=>[k,{value}])),
      currency:wallet(draft.cash),spellcasting:draft.spellcasting,
      biography:escapeHTML(draft.biography??'').replace(/\n/g,'<br>'),
      resources:{hp:{value:0},ep:{value:0},shadow:{value:5},catharsis:{value:0}}},
    flags:{[MODULE_ID]:{state:'draft',draftVersion:1,creator:userId,plan:draft.selections,notes:{debt:draft.debt??0,equipmentBudget:draft.equipmentBudget??0}}}
  };
}
export function escapeHTML(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function safeImage(path) {
  const value=String(path??'');
  if (!value || /^(?:javascript|data|file):/i.test(value) || value.startsWith('//')) return 'icons/svg/mystery-man.svg';
  return value;
}
export async function createDraft(draft) {
  assertCompatible(game);
  if (!game.user.can('ACTOR_CREATE')) throw Error('Seu usuário não tem permissão para criar personagens. Peça ao mestre para habilitar a criação de Atores.');
  const actor=await Actor.create(actorSource(draft,game.user.id));
  if (!actor) throw Error('O sistema não criou a ficha.');
  return actor;
}
export async function addDocument(actor, document) {
  if (!actor.isOwner) throw Error('Você não tem acesso de edição a essa ficha.');
  if (actor.items.some(i=>i._stats?.compendiumSource===document.uuid)) throw Error('Este conteúdo já está na ficha.');
  const data=document.toObject();delete data._id;
  data._stats={...data._stats,compendiumSource:document.uuid};
  if(document.type==='class') {data.system.level=1;data.system.initial=true;data.system.hitDie.value=1;}
  // Native lifecycle opens Skyfall's choices and applies its own origins/effects.
  const created=await actor.createEmbeddedDocuments('Item',[data]);
  if (!created?.length) throw Error('O sistema não adicionou o conteúdo; revise as escolhas na ficha.');
  return created[0];
}
function embeddedSource(document,originId=null) {
  const data=document.toObject();delete data._id;
  data._stats={...data._stats,compendiumSource:document.uuid};
  if (originId) data.system.origin=[originId];
  if(document.type==='class') {data.system.level=1;data.system.initial=true;data.system.hitDie.value=1;}
  return data;
}
export async function addResolvedPlan(actor,planItems,catalog) {
  if (!actor.isOwner) throw Error('Você não tem acesso de edição a essa ficha.');
  const seen=new Set(actor.items.map(item=>item._stats?.compendiumSource).filter(Boolean));
  const sources=[];
  for (const item of planItems) {
    if (seen.has(item.entry.uuid)) continue;
    const document=item.document??await catalog.document(item.entry.uuid);
    sources.push(embeddedSource(document,item.originId));seen.add(item.entry.uuid);
  }
  if (!sources.length) return [];
  const BenefitsDialog=globalThis.skyfall?.applications?.BenefitsDialog;
  const originalPrompt=BenefitsDialog?.prompt;
  try {
    if (BenefitsDialog&&typeof originalPrompt==='function') BenefitsDialog.prompt=()=>null;
    return await actor.createEmbeddedDocuments('Item',sources);
  } finally {
    if (BenefitsDialog&&typeof originalPrompt==='function') BenefitsDialog.prompt=originalPrompt;
  }
}
export async function refillResources(actor) {
  const hp=actor.system.resources.hp.max,ep=actor.system.resources.ep.max;
  if (!Number.isFinite(hp)||hp<1||!Number.isFinite(ep)||ep<0) throw Error('O sistema ainda não calculou os recursos. Termine as escolhas de classe e benefícios.');
  await actor.update({'system.resources.hp.value':hp,'system.resources.ep.value':ep});
}
