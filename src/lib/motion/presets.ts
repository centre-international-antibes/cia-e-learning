
/**
 * Presets de ressort — exprimés par ce qu'on voit, pas par la physique.
 *
 * `visualDuration` est le temps que met l'objet à **arriver** à sa place ;
 * `bounce` dit s'il dépasse et de combien. C'est le seul vocabulaire qui permet
 * de discuter un mouvement avec quelqu'un qui le regarde — « 0,35 s, rebond
 * léger » se vérifie à l'œil, « stiffness 210, damping 26 » non.
 *
 * framer-motion 11.18 accepte déjà ces deux paramètres : aucune migration n'est
 * nécessaire pour les utiliser (vérifié en exécutant le générateur de ressort).
 *
 * Les quatre premiers presets reproduisent **exactement** le comportement des
 * presets de M1 : l'expression change, le mouvement de l'app ne bouge pas. Les
 * suivants sont introduits par la refonte et n'ont pas encore d'usage en prod.
 *
 * Les valeurs ci-dessous sont un point de départ mesuré, pas une vérité : elles
 * se règlent dans le Motion Lab (section « Réglage »), et les réglages validés
 * sur téléphone deviennent la référence reportée dans MOTION.md.
 */

export interface MotionPreset {
  /** Temps d'arrivée visé, en secondes. */
  visualDuration: number;
  /** Dépassement : 0 = aucun, 0,3 = net, au-delà = franchement joueur. */
  bounce: number;
  /** À quoi il sert, en une ligne. */
  usage: string;
  /** Plage du brief dans laquelle l'arrivée doit tomber. */
  band: 'micro' | 'transition' | 'moment';
  /** Déjà utilisé en production ? */
  inUse: boolean;
}

/** Plages d'arrivée imposées par le brief, en millisecondes. */
export const BANDS: Record<MotionPreset['band'], [number, number]> = {
  micro: [120, 180],
  transition: [250, 400],
  moment: [500, 800],
};

export const PRESETS = {
  /** Appui, bascule, sélection — réponse immédiate, aucun dépassement. */
  snappy: {
    visualDuration: 0.205,
    bounce: 0.17,
    usage: 'appui, bascule, sélection',
    band: 'micro',
    inUse: true,
  },
  /** Pop d'un badge, d'un check, d'un combo. Dépassement assumé. */
  bouncy: {
    visualDuration: 0.245,
    bounce: 0.3,
    usage: 'pop de badge, check, combo',
    band: 'micro',
    inUse: true,
  },
  /** Panneaux, feuilles, mise en page — glisse posée. */
  gentle: {
    visualDuration: 0.35,
    bounce: 0.09,
    usage: 'panneau, feuille, mise en page',
    band: 'transition',
    inUse: true,
  },
  /** Macro — mouvement ample et lisible. */
  slow: {
    visualDuration: 0.45,
    bounce: 0,
    usage: 'macro, passage de niveau',
    band: 'moment',
    inUse: true,
  },

  /* ── Introduits par la refonte ── */

  /** Enfoncement d'un Pressable : le plus court de tous, aucun rebond. */
  press: {
    visualDuration: 0.11,
    bounce: 0,
    usage: 'enfoncement 3D d’un Pressable',
    band: 'micro',
    inUse: false,
  },
  /** Ouverture d'une feuille depuis un nœud du parcours. */
  sheet: {
    visualDuration: 0.515,
    bounce: 0.25,
    usage: 'ouverture de feuille, recul de l’écran parent',
    band: 'transition',
    inUse: false,
  },
  /** Tampon qui frappe (« Parfait ! », nœud validé). Joueur, donc hors norme. */
  stamp: {
    visualDuration: 0.52,
    bounce: 0.44,
    usage: 'tampon qui frappe',
    band: 'transition',
    inUse: false,
  },
  /** Moment signature : chiffre géant, carte de niveau, Spark qui saute. */
  hero: {
    visualDuration: 0.88,
    bounce: 0.28,
    usage: 'moment signature',
    band: 'moment',
    inUse: false,
  },
} satisfies Record<string, MotionPreset>;

export type PresetName = keyof typeof PRESETS;

export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];

/**
 * Forme du ressort : volontairement plus étroite que `Transition`, pour rester
 * acceptable par `useSpring` autant que par la prop `transition`.
 */
export interface SpringShape {
  type: 'spring';
  visualDuration: number;
  bounce: number;
}

/** Ressort correspondant à un preset. */
export const toSpring = (p: Pick<MotionPreset, 'visualDuration' | 'bounce'>): SpringShape => ({
  type: 'spring',
  visualDuration: p.visualDuration,
  bounce: p.bounce,
});

export interface SpringReadout {
  /** Première atteinte de 99 % de la cible, en ms — ce qu'on perçoit comme l'arrivée. */
  arrive: number;
  /** Dépassement maximal, en % de la course. */
  overshoot: number;
  /** Moment où le ressort est considéré au repos, en ms. */
  settle: number;
}

/**
 * Ce que donne un couple (arrivée, rebond), en trois chiffres.
 *
 * Reprend la résolution de framer-motion 11.18 — mêmes formules, mêmes seuils de
 * repos — pour que le banc de réglage affiche ce que l'app jouera réellement, et
 * pas une approximation. Course de 0 à 100, vitesse initiale nulle.
 */
export function describeSpring(visualDuration: number, bounce: number): SpringReadout {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  const stiffness = root * root;
  const ratio = Math.min(1, Math.max(0.05, 1 - bounce)); // mass = 1
  const w0 = Math.sqrt(stiffness) / 1000; // rad/ms
  const delta = 100;

  const value =
    ratio < 1
      ? (t: number) => {
          const wd = w0 * Math.sqrt(1 - ratio * ratio);
          const env = Math.exp(-ratio * w0 * t);
          return (
            100 - env * (((ratio * w0 * delta) / wd) * Math.sin(wd * t) + delta * Math.cos(wd * t))
          );
        }
      : (t: number) => 100 - Math.exp(-w0 * t) * (delta + w0 * delta * t);

  let arrive = 0;
  let peak = 0;
  let settle = 0;
  let previous = 0;
  for (let t = 0; t <= 6000; t += 2) {
    const v = value(t);
    peak = Math.max(peak, v);
    if (!arrive && v >= 99) arrive = t;
    // Seuils de repos de framer-motion pour une course non granulaire.
    const speed = Math.abs((v - previous) / 2) * 1000;
    if (t > 0 && speed <= 2 && Math.abs(100 - v) <= 0.5) {
      settle = t;
      break;
    }
    previous = v;
  }

  return {
    arrive: arrive || Math.round(visualDuration * 1000),
    overshoot: +Math.max(0, peak - 100).toFixed(1),
    settle: settle || 6000,
  };
}
