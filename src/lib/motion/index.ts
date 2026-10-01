/**
 * Façade motion — `import { spring, fade, stagger } from '@/lib/motion'`.
 *
 * Tout nouveau mouvement passe par ici. `@/lib/animations` reste disponible
 * pour les écrans déjà en place, mais est déprécié.
 */
export { spring, fade, stagger } from './tokens';
export type { SpringToken, FadeToken, StaggerToken } from './tokens';
