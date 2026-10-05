import * as React from 'react';

/**
 * Objets du quotidien — l'illustration des nœuds du parcours.
 *
 * Direction arbitrée à l'étape 3 : ce qu'on rencontre en vivant la langue, un
 * objet par module. Contour de 2 px, aplats, aucune dégradé — le même langage
 * que la tranche des objets tapables.
 *
 * Tous dessinés sur une grille de 48, `currentColor` pour le contour, de sorte
 * qu'un objet posé sur un nœud verrouillé devienne gris sans retouche.
 *
 * Ce jeu couvre la première unité A1. Les suivants viendront avec les modules,
 * un par un — c'est le lot d'illustration à commander.
 */

export type ModuleObjectName =
  | 'chest'
  | 'lock'
  | 'check'
  | 'trophy'
  | 'croissant'
  | 'ticket'
  | 'postcard'
  | 'key'
  | 'menu'
  | 'cup'
  | 'map'
  | 'market';

interface Props extends React.SVGProps<SVGSVGElement> {
  name: ModuleObjectName;
  /** Teinte des aplats. Le contour suit `currentColor`. */
  fill?: string;
  size?: number;
}

const STROKE = 2.2;

/** Aplats par objet, exprimés en variables CIA pour rester dans la palette. */
const SHAPES: Record<ModuleObjectName, (fill: string) => React.ReactNode> = {
  /* ── Pictos de système : même tracé que les objets, jamais une icône tierce ── */
  chest: (fill) => (
    <>
      <path d="M8 22h32v15a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill={fill} />
      <path d="M8 22l3-7a2 2 0 0 1 2-1h22a2 2 0 0 1 2 1l3 7" fill={fill} />
      <path d="M8 27h32" />
      <path d="M21 27h6v6h-6z" fill="none" />
    </>
  ),
  lock: (fill) => (
    <>
      <rect x="12" y="22" width="24" height="17" rx="4" fill={fill} />
      <path d="M17 22v-4a7 7 0 0 1 14 0v4" fill="none" />
      <circle cx="24" cy="30" r="2.4" fill="none" />
    </>
  ),
  check: (fill) => (
    <>
      <circle cx="24" cy="24" r="16" fill={fill} />
      <path d="M16 24.5l5.5 5.5L32 19" strokeWidth={3.4} />
    </>
  ),
  trophy: (fill) => (
    <>
      <path d="M15 10h18v9a9 9 0 0 1-18 0z" fill={fill} />
      <path d="M15 13h-5a5 5 0 0 0 5 5M33 13h5a5 5 0 0 1-5 5" fill="none" />
      <path d="M24 28v6M17 38h14l-1-4H18z" />
    </>
  ),
  croissant: (fill) => (
    <>
      <path
        d="M8 30c0-9 7-16 16-16s16 7 16 16c0 3-2 5-5 5-4 0-5-3-7-3s-2 3-4 3-2-3-4-3-3 3-7 3c-3 0-5-2-5-5Z"
        fill={fill}
      />
      <path d="M13 22c2 2 3 5 3 8M24 17c0 4 0 8-1 11M35 22c-2 2-3 5-3 8" />
    </>
  ),
  ticket: (fill) => (
    <>
      <path
        d="M7 17h34a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6v-4a2 2 0 0 1 2-2Z"
        fill={fill}
      />
      <path d="M18 20v9M24 23h12M24 28h8" />
    </>
  ),
  postcard: (fill) => (
    <>
      <rect x="6" y="13" width="36" height="24" rx="3" fill={fill} />
      <path d="M24 13v24M29 20h8M29 25h8M29 30h5" />
      <path d="M11 31l4-6 3 4 2-3 3 5z" />
    </>
  ),
  key: (fill) => (
    <>
      <circle cx="16" cy="24" r="8" fill={fill} />
      <circle cx="16" cy="24" r="3" fill="none" />
      <path d="M24 24h17M35 24v6M40 24v4" />
    </>
  ),
  menu: (fill) => (
    <>
      <path d="M10 9h28v30l-14-5-14 5z" fill={fill} />
      <path d="M17 18h14M17 24h14M17 30h9" />
    </>
  ),
  cup: (fill) => (
    <>
      <path d="M10 18h22v11a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8z" fill={fill} />
      <path d="M32 21h4a4 4 0 0 1 0 8h-4" fill="none" />
      <path d="M8 41h26" />
      <path d="M17 11c0 2-2 2-2 4M24 10c0 2-2 2-2 4" />
    </>
  ),
  map: (fill) => (
    <>
      <path d="M7 14l10-4 14 5 10-4v23l-10 4-14-5-10 4z" fill={fill} />
      <path d="M17 10v23M31 15v23" />
    </>
  ),
  market: (fill) => (
    <>
      <path d="M9 20h30l-2 17H11z" fill={fill} />
      <path d="M6 13h36l-3 7H9z" fill={fill} />
      <path d="M18 27v6M24 27v6M30 27v6" />
    </>
  ),
};

export function ModuleObject({ name, fill = 'currentColor', size = 36, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {SHAPES[name](fill)}
    </svg>
  );
}
