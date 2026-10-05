import type { ModuleObjectName } from './ModuleObject';

/**
 * Objet d'un module. Stable : le même module montre toujours le même objet,
 * sans table de correspondance à tenir à la main tant que le lot complet n'est
 * pas dessiné.
 */
const ORDER: ModuleObjectName[] = [
  'croissant',
  'ticket',
  'postcard',
  'key',
  'menu',
  'cup',
  'map',
  'market',
];

export function objectForModule(moduleId: string): ModuleObjectName {
  let h = 0;
  for (let i = 0; i < moduleId.length; i++) h = (h * 31 + moduleId.charCodeAt(i)) >>> 0;
  return ORDER[h % ORDER.length];
}
