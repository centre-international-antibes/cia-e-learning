/**
 * Feedback multisensoriel — son + haptique en un seul appel.
 *
 * C'est la seule API que les composants utilisent :
 *
 *   import { feedback } from '@/lib/feedback';
 *   feedback.correct(combo);
 *
 * Chaque méthode accepte un `scope` : `player` (dans le cours) ou `app`
 * (partout ailleurs), qui décide du comportement par défaut tant que
 * l'utilisateur n'a pas réglé le son lui-même. Les retours d'appui (`tap`,
 * `select`) ne vibrent que dans le player ; les retours de progression
 * (bonne réponse, erreur, fin, level-up, coffre) vibrent dans les deux.
 */
import { vibrate } from './haptics';
import { playSound, type PlayOptions, type SfxScope } from './sound';

export type { SfxScope, SoundName, PlayOptions } from './sound';
export type { HapticPattern } from './haptics';
export {
  isSoundEnabled,
  setSoundEnabled,
  playSound,
  primeAudio,
  stepFrequency,
  MAX_COMBO_STEP,
  SFX_STORAGE_KEY,
} from './sound';
export { vibrate, canVibrate } from './haptics';

interface ScopeOption {
  scope?: SfxScope;
}

const opts = (o: ScopeOption = {}): PlayOptions => ({ scope: o.scope ?? 'app' });

export const feedback = {
  /**
   * Appui sur une surface tactile (Pressable, boutons).
   * Vibre uniquement dans le player : hors cours, chaque bouton ferait
   * vibrer le téléphone en continu.
   */
  tap(options: ScopeOption = {}) {
    playSound('tap', opts(options));
    if (options.scope === 'player') vibrate('tap');
  },
  /** Sélection d'une option, d'un onglet, d'un filtre. Vibre dans le player seul. */
  select(options: ScopeOption = {}) {
    playSound('select', opts(options));
    if (options.scope === 'player') vibrate('tap');
  },
  /** Bonne réponse — la hauteur monte avec le combo (0 → 7). */
  correct(step = 0, options: ScopeOption = {}) {
    playSound('correct', { ...opts(options), step });
    vibrate(step > 0 ? 'combo' : 'correct');
  },
  /** Mauvaise réponse — doux, jamais punitif. */
  wrong(options: ScopeOption = {}) {
    playSound('wrong', opts(options));
    vibrate('wrong');
  },
  /** Fin de leçon / d'unité. */
  complete(options: ScopeOption = {}) {
    playSound('complete', opts(options));
    vibrate('celebrate');
  },
  /** Passage de niveau. */
  levelUp(options: ScopeOption = {}) {
    playSound('levelUp', opts(options));
    vibrate('celebrate');
  },
  /** Ouverture d'un coffre XP. */
  chest(options: ScopeOption = {}) {
    playSound('chest', opts(options));
    vibrate('combo');
  },
  /** Transition longue (remplissage du chemin, défilement du parcours). */
  whoosh(options: ScopeOption = {}) {
    playSound('whoosh', opts(options));
  },
} as const;

export type Feedback = typeof feedback;
