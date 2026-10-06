import * as React from 'react';

/**
 * Drapeau de refonte.
 *
 * La refonte vit derrière `?redesign=1` : sans le drapeau, l'application est
 * exactement celle d'aujourd'hui — mêmes polices, mêmes écrans. Avec, les
 * écrans refondus prennent la place des anciens, un par un, jusqu'à ce que
 * chacun soit validé et que le drapeau disparaisse de cet écran-là.
 *
 * Le drapeau se pose de trois façons :
 *   - `?redesign=1` dans l'URL (et `?redesign=0` pour l'enlever) ;
 *   - la bascule du Motion Lab ;
 *   - le `localStorage`, qui garde le choix d'une visite à l'autre.
 *
 * Il s'applique en posant `data-redesign` sur `<html>` : le CSS bascule les
 * familles de polices, et les composants lisent `useRedesign()`.
 */

const STORAGE_KEY = 'cia-redesign';
const ATTRIBUTE = 'data-redesign';

const listeners = new Set<() => void>();

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('redesign');
  if (param === '1') return true;
  if (param === '0') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let enabled = false;

/** Pose l'attribut sur `<html>`. Appelé avant le premier rendu. */
export function initRedesign(): boolean {
  if (typeof document === 'undefined') return false;
  enabled = readInitial();
  apply();
  return enabled;
}

function apply() {
  const root = document.documentElement;
  if (enabled) root.setAttribute(ATTRIBUTE, '');
  else root.removeAttribute(ATTRIBUTE);
  listeners.forEach((l) => l());
}

export function setRedesign(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // Stockage bloqué : le drapeau ne survivra pas à un rechargement.
  }
  apply();
}

export const isRedesign = () => enabled;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** `true` si la refonte est active. Re-rend le composant au basculement. */
export function useRedesign(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );
}
