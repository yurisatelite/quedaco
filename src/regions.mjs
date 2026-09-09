import {REGIONS} from './book-world.mjs';
import {normalize} from './rules.mjs';
export const NEUTRAL_REGION_COLOR='#77818d';
export function regionColor(regionId,folders=[],regions=REGIONS){
  const region=regions.find(entry=>entry.id===regionId);
  const folder=Array.from(folders??[]).find(entry=>entry?.type==='Actor'&&region&&normalize(entry.name)===normalize(region.name));
  return String(folder?.color||region?.color||NEUTRAL_REGION_COLOR);
}
