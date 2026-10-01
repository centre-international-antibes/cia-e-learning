/**
 * Sons d'interface — synthèse Web Audio, aucun fichier audio.
 *
 * Tout est généré à la volée (oscillateurs + enveloppe ADSR) : pas de
 * `.mp3` à charger, pas de requête réseau, pas de 404 silencieux.
 *
 * Contraintes respectées :
 *   - un seul `AudioContext`, créé puis `resume()` au premier geste utilisateur
 *     (les navigateurs refusent l'audio avant une interaction) ;
 *   - chaque son dure moins de 400 ms ;
 *   - volume master 0.35, jamais agressif.
 */

export type SoundName =
  | 'tap'
  | 'select'
  | 'correct'
  | 'wrong'
  | 'complete'
  | 'levelUp'
  | 'chest'
  | 'whoosh';

/** `player` = dans le cours ; `app` = partout ailleurs. */
export type SfxScope = 'player' | 'app';

/** Clé historique, déjà utilisée par l'ancien `useSfx`. */
export const SFX_STORAGE_KEY = 'cia-sfx-enabled';

const MASTER_VOLUME = 0.35;

/** Demi-tons de la gamme majeure, pour le combo de bonnes réponses. */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12];
const COMBO_BASE_HZ = 523.25; // do5
/** Palier le plus haut du combo (index max de `MAJOR_SCALE`). */
export const MAX_COMBO_STEP = MAJOR_SCALE.length - 1;

/**
 * Hauteur d'une bonne réponse selon le combo courant.
 * Monotone croissante, bornée aux deux extrémités (`step` hors [0, 7] est ramené
 * dans l'intervalle) — c'est la montée en tension du player en M3.
 */
export function stepFrequency(step: number): number {
  const safe = Number.isFinite(step) ? Math.round(step) : 0;
  const clamped = Math.min(MAX_COMBO_STEP, Math.max(0, safe));
  return COMBO_BASE_HZ * Math.pow(2, MAJOR_SCALE[clamped] / 12);
}

/* ─────────────────────────── réglage ─────────────────────────── */

function readStoredPreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SFX_STORAGE_KEY);
    if (raw === null) return null;
    return raw === 'true';
  } catch {
    return null; // navigation privée, stockage bloqué
  }
}

/**
 * Le son est-il actif pour ce contexte ?
 *
 * Clé absente → actif dans le player, muet dans le reste de l'app.
 * Clé présente → le choix de l'utilisateur s'applique partout.
 */
export function isSoundEnabled(scope: SfxScope = 'app'): boolean {
  const stored = readStoredPreference();
  if (stored !== null) return stored;
  return scope === 'player';
}

/** Écrit le choix explicite de l'utilisateur (vaut alors pour tous les scopes). */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SFX_STORAGE_KEY, String(enabled));
  } catch {
    /* stockage indisponible — le réglage ne survivra pas à la session */
  }
}

/* ─────────────────────────── contexte audio ─────────────────────────── */

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let primed = false;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function getContext(): AudioContext | null {
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

/**
 * À appeler au premier geste utilisateur : crée et débloque le contexte.
 * Idempotent, et sans effet tant qu'aucun geste n'a eu lieu.
 */
export function primeAudio(): void {
  if (primed) return;
  primed = true;
  getContext();
}

/** Branche l'amorçage sur le premier geste de la page (une seule fois). */
function installPrimeListeners(): void {
  if (typeof window === 'undefined') return;
  const handler = () => {
    primeAudio();
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
    window.removeEventListener('touchstart', handler);
  };
  window.addEventListener('pointerdown', handler, { passive: true });
  window.addEventListener('keydown', handler);
  window.addEventListener('touchstart', handler, { passive: true });
}
installPrimeListeners();

/* ─────────────────────────── synthèse ─────────────────────────── */

interface ToneOptions {
  /** Fréquence de départ, en Hz. */
  freq: number;
  /** Fréquence d'arrivée si le son glisse (défaut : pas de glissando). */
  toFreq?: number;
  /** Durée totale en secondes (< 0.4 s). */
  duration: number;
  type?: OscillatorType;
  /** Gain crête, relatif au master. */
  peak?: number;
  /** Décalage de départ en secondes. */
  delay?: number;
  /** Attaque en secondes. */
  attack?: number;
}

function tone(context: AudioContext, options: ToneOptions): void {
  const { freq, toFreq, duration, type = 'sine', peak = 1, delay = 0, attack = 0.006 } = options;
  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (toFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), start + duration);
  }

  // ADSR compact : attaque courte, decay exponentiel jusqu'au silence.
  const level = MASTER_VOLUME * peak;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Souffle court à base de bruit filtré, pour les transitions. */
function noiseSweep(context: AudioContext, duration: number, peak = 0.5): void {
  const frames = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, Math.max(1, frames), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Bruit blanc atténué en fin de course.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(700, context.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2600, context.currentTime + duration);
  filter.Q.value = 0.8;

  const gain = context.createGain();
  gain.gain.setValueAtTime(MASTER_VOLUME * peak, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
}

function render(context: AudioContext, name: SoundName, step: number): void {
  switch (name) {
    case 'tap':
      tone(context, { freq: 320, duration: 0.05, type: 'triangle', peak: 0.45 });
      break;
    case 'select':
      tone(context, { freq: 520, toFreq: 660, duration: 0.09, type: 'triangle', peak: 0.55 });
      break;
    case 'correct': {
      const base = stepFrequency(step);
      tone(context, { freq: base, duration: 0.12, type: 'sine', peak: 0.7 });
      tone(context, { freq: base * 1.5, duration: 0.16, type: 'sine', peak: 0.45, delay: 0.06 });
      break;
    }
    case 'wrong':
      // Doux et grave : on signale l'erreur, on ne punit pas.
      tone(context, { freq: 180, toFreq: 130, duration: 0.22, type: 'sine', peak: 0.5 });
      break;
    case 'complete':
      [523.25, 659.25, 783.99].forEach((f, i) =>
        tone(context, { freq: f, duration: 0.18, type: 'sine', peak: 0.6, delay: i * 0.07 }),
      );
      break;
    case 'levelUp':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(context, { freq: f, duration: 0.2, type: 'triangle', peak: 0.65, delay: i * 0.06 }),
      );
      break;
    case 'chest':
      tone(context, { freq: 880, toFreq: 1320, duration: 0.14, type: 'sine', peak: 0.55 });
      tone(context, { freq: 1760, duration: 0.2, type: 'sine', peak: 0.35, delay: 0.1 });
      break;
    case 'whoosh':
      noiseSweep(context, 0.22, 0.45);
      break;
  }
}

export interface PlayOptions {
  /** Palier de combo pour `correct` (0 → 7). */
  step?: number;
  /** Contexte d'appel, qui décide du défaut quand l'utilisateur n'a rien réglé. */
  scope?: SfxScope;
}

/**
 * Joue un son, si le réglage l'autorise pour ce scope.
 * Sans Web Audio (SSR, tests, navigateur ancien) : no-op silencieux.
 */
export function playSound(name: SoundName, options: PlayOptions = {}): void {
  const { step = 0, scope = 'app' } = options;
  if (!isSoundEnabled(scope)) return;
  const context = getContext();
  if (!context) return;
  try {
    render(context, name, step);
  } catch {
    /* un son raté ne doit jamais casser l'interaction */
  }
}
