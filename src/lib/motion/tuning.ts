import * as React from 'react';

import { PRESETS, toSpring, type MotionPreset, type PresetName, type SpringShape } from './presets';

/**
 * Réglage des presets — le banc d'essai écrit ici, l'app lit ici.
 *
 * Les valeurs de `presets.ts` sont un point de départ mesuré. Le vrai réglage se
 * fait à l'œil, sur un téléphone : la section « Réglage » du Motion Lab écrit
 * dans ce magasin, qui persiste en `localStorage` et prévient ses abonnés.
 *
 * En production, personne ne touche à ce magasin : il reste vide et l'app
 * utilise les valeurs par défaut. Une fois les réglages validés, ils sont
 * recopiés dans `presets.ts` et dans MOTION.md — le `localStorage` n'est qu'un
 * atelier, jamais une source de vérité.
 */

const STORAGE_KEY = 'cia-motion-tuning';

type Overrides = Partial<Record<PresetName, { visualDuration: number; bounce: number }>>;

let overrides: Overrides = read();
const listeners = new Set<() => void>();

function read(): Overrides {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Navigation privée, stockage bloqué : le réglage reste en mémoire.
  }
  listeners.forEach((l) => l());
}

/** Preset effectif : valeur réglée si elle existe, valeur par défaut sinon. */
export function getPreset(name: PresetName): MotionPreset {
  const o = overrides[name];
  return o ? { ...PRESETS[name], ...o } : PRESETS[name];
}

/** Transition framer-motion du preset effectif. */
export const getSpring = (name: PresetName): SpringShape => toSpring(getPreset(name));

export function setPreset(name: PresetName, value: { visualDuration: number; bounce: number }) {
  overrides = { ...overrides, [name]: value };
  persist();
}

export function resetPreset(name: PresetName) {
  const next = { ...overrides };
  delete next[name];
  overrides = next;
  persist();
}

export function resetAll() {
  overrides = {};
  persist();
}

export const getOverrides = (): Overrides => overrides;

/** Les réglages, prêts à être recopiés dans `presets.ts`. */
export function exportTuning(): string {
  const lines = (Object.keys(PRESETS) as PresetName[]).map((n) => {
    const p = getPreset(n);
    const touched = overrides[n] ? ' // réglé' : '';
    return `  ${n}: { visualDuration: ${p.visualDuration}, bounce: ${p.bounce} },${touched}`;
  });
  return `{\n${lines.join('\n')}\n}`;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Re-rend le composant à chaque réglage. */
export function useTuning() {
  React.useSyncExternalStore(
    subscribe,
    () => overrides,
    () => overrides,
  );
  return { getPreset, getSpring, setPreset, resetPreset, resetAll, exportTuning };
}
