import { PLACES, REGIONS } from './book-world.mjs';
import { NPC_ROLES, adoptNpcFlag, isGeneratedNpc, npcFlag } from './npcs.mjs';

/** Contrato público e somente-leitura para módulos satélites do QUEDAÇO. */
export function registeredNpcs(game) {
  return Array.from(game?.actors ?? []).filter(actor => actor?.visible !== false && isGeneratedNpc(actor)).map(actor => {
    const flag = npcFlag(actor) ?? adoptNpcFlag(actor);
    const place = PLACES.find(entry => entry.id === flag.placeId);
    const regionId = flag.regionId || place?.regionId || '';
    const region = REGIONS.find(entry => entry.id === regionId);
    return {
      id: actor.id,
      uuid: actor.uuid ?? `Actor.${actor.id}`,
      name: actor.name,
      img: actor.img,
      type: actor.type,
      role: flag.role ?? 'extra',
      regionId,
      regionName: region?.name ?? '',
      placeId: flag.placeId ?? '',
      placeName: place?.name ?? '',
      explorerLocation: flag.explorerLocation?.hexId ? { hexId: String(flag.explorerLocation.hexId), sceneId: String(flag.explorerLocation.sceneId ?? '') } : null,
    };
  }).sort((a, b) => a.regionName.localeCompare(b.regionName, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
}

export function publicRegions() {
  return REGIONS.map(({ id, name, color }) => ({ id, name, color }));
}

/** Catálogo somente-leitura para o Explorador: só ids e nomes, nunca a prosa do livro. */
export function explorerCatalog() {
  return {
    regions: REGIONS.map(({ id, name, color }) => ({ id, name, color })),
    places: PLACES.map(({ id, name, regionId }) => ({ id, name, regionId })),
    tags: Object.entries(NPC_ROLES).map(([id, label]) => ({ id: `role:${id}`, label })),
  };
}

/** Atribui (ou limpa, com `null`) a área do Explorador de um NPC. O QUEDAÇO é o dono da flag; a permissão é checada aqui. */
export async function setNpcExplorerLocation(game, actorUuid, location) {
  if (!game?.user?.isGM) throw Error('Somente a Mestra pode atribuir NPCs a uma área.');
  const match = /^Actor\.([\w-]+)$/.exec(String(actorUuid));
  const actor = match && game.actors?.get(match[1]);
  if (!actor || !isGeneratedNpc(actor)) throw Error('Escolha um NPC cadastrado no QUEDAÇO.');
  if (location === null) { await actor.update({ 'flags.quedaco.npc.explorerLocation': null }); return true; }
  const hexId = String(location?.hexId ?? ''), sceneId = String(location?.sceneId ?? '');
  if (!hexId || hexId.length > 200 || !sceneId) throw Error('Área inválida.');
  const update = { 'flags.quedaco.npc.explorerLocation': { hexId, sceneId } };
  if (PLACES.some(p => p.id === location.placeId)) update['flags.quedaco.npc.placeId'] = location.placeId;
  if (REGIONS.some(r => r.id === location.regionId)) update['flags.quedaco.npc.regionId'] = location.regionId;
  await actor.update(update);
  return true;
}
