import { PLACES, REGIONS } from './book-world.mjs';
import { adoptNpcFlag, isGeneratedNpc, npcFlag } from './npcs.mjs';

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
    };
  }).sort((a, b) => a.regionName.localeCompare(b.regionName, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
}

export function publicRegions() {
  return REGIONS.map(({ id, name, color }) => ({ id, name, color }));
}
