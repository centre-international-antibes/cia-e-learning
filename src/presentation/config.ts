// ============================================================================
//  CIA — Présentation (60 s) · SOURCE UNIQUE DE VÉRITÉ
//  Every duration, colour, text, fact, media file and timing lives here.
//  Scenes never hard-code values: change them here.
// ============================================================================
import {Easing} from 'remotion';
import generated from './assets.generated.json';

// ---------------------------------------------------------------- language --
export type Lang = 'en' | 'fr';
export const DEFAULT_LANG: Lang = 'en';

// ------------------------------------------------------------------- video --
export const VIDEO = {
  fps: 30,
  durationInFrames: 1800,
  landscape: {width: 1920, height: 1080},
  portrait: {width: 1080, height: 1920},
  cutdownDurationInFrames: 600,
} as const;

// ------------------------------------------------------------------ scenes --
// 195 + 225 + 255 + 435 + 315 + 255 + 240 − 6 × 20 = 1800
export const TRANSITION_FRAMES = 20;
export const SCENES = {
  hello: 195,
  riviera: 225,
  numbers: 255,
  schools: 435,
  programmes: 315,
  liveIt: 255,
  signature: 240,
} as const;
export type SceneKey = keyof typeof SCENES;
export const SCENE_ORDER: SceneKey[] = ['hello', 'riviera', 'numbers', 'schools', 'programmes', 'liveIt', 'signature'];
/** Transition INTO each scene (index = scene index). Signature wipe = blue + red rule. */
export const TRANSITIONS: ('fade' | 'wipe')[] = ['fade', 'wipe', 'fade', 'wipe', 'fade', 'wipe'];

/** Global start frame of each scene in the 60 s master. */
export const sceneStart = (key: SceneKey): number => {
  let t = 0;
  for (const k of SCENE_ORDER) {
    if (k === key) return t;
    t += SCENES[k] - TRANSITION_FRAMES;
  }
  throw new Error(key);
};

// 20 s cutdown: Bonjour (3 s) → Riviera (≈5 s) → Live it (≈7 s) → Signature (7 s)
// 90 + 141 + 219 + 210 − 3 × 20 = 600. Durations chosen so that scene-6 cuts land on
// beats 13/15/17/19 and "Live it." on beat 25 (frame 450) of the 20 s score.
export const CUTDOWN = {
  scenes: [
    {key: 'hello' as const, duration: 90, offset: 105}, // starts on "Bonjour"
    {key: 'riviera' as const, duration: 141, offset: 40},
    {key: 'liveIt' as const, duration: 219, offset: 0},
    {key: 'signature' as const, duration: 210, offset: 0},
  ],
  transitions: ['fade', 'wipe', 'wipe'] as ('fade' | 'wipe')[],
};

// ------------------------------------------------------------------ colours --
// Charte CIA juin 2026 — 3 colours + white. Nothing else, anywhere.
export const COLORS = {
  navy: '#11263D', // bleu profond — dominante
  blue: '#283371', // bleu dense — structure
  red: '#E64353', // rouge — accent uniquement
  white: '#FFFFFF',
} as const;
/** rgba() helper restricted to the charte colours. */
export const alpha = (c: keyof typeof COLORS, a: number) => {
  const h = COLORS[c].slice(1);
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
export const SCRIM_LEFT = `linear-gradient(90deg, ${alpha('navy', 0.88)} 0%, ${alpha('navy', 0.55)} 38%, ${alpha('navy', 0)} 68%)`;
export const SCRIM_BOTTOM = `linear-gradient(0deg, ${alpha('navy', 0.88)} 0%, ${alpha('navy', 0.55)} 30%, ${alpha('navy', 0)} 60%)`;
// Common grade for all photo/video sources (§5)
export const GRADE = {
  warmVeil: 'rgba(255,190,120,.06)', // soft-light warm veil (brief §5)
  filter: 'contrast(1.04) saturate(1.05)',
  vignette: `radial-gradient(ellipse at center, ${alpha('navy', 0)} 55%, ${alpha('navy', 0.38)} 100%)`,
};

// --------------------------------------------------------------------- type --
const AVENIR = generated.avenirAvailable;
export const FONTS = {
  /** Avenir Next when present in assets-src/fonts/, else Nunito Sans (OFL). */
  sans: AVENIR ? 'CIA Avenir Next' : 'CIA Nunito Sans',
  fallbackNotice: !AVENIR,
  cyrillic: 'CIA Noto Sans',
  jp: 'CIA Noto Sans JP',
  sc: 'CIA Noto Sans SC',
  /** "Live it." is traced from the official logo glyphs (Better Together). */
  handwritingFromLogo: true,
  betterTogetherFile: generated.betterTogetherAvailable,
};
export const WEIGHTS = {regular: 400, medium: 500, bold: 700} as const;

/** Sizes in px for 1920-wide landscape; portrait values in LAYOUT. */
export const TYPE = {
  title: {size: 104, tracking: '0.02em', lineHeight: 1.05},
  giant: {size: 188},
  numbers: {size: 150},
  kicker: {size: 25, tracking: '0.25em'},
  secondary: {size: 34},
  baseline: {regular: 72, script: 96},
  cta: {size: 44, tracking: '0.08em'},
  credits: {size: 18},
  label: {size: 24, tracking: '0.25em'},
} as const;

// ------------------------------------------------------------------- layout --
export const LAYOUT = {
  landscape: {
    marginX: 140,
    marginTop: 100,
    marginBottom: 130,
    titleScale: 1,
    giantScale: 1,
  },
  portrait: {
    marginX: 80,
    marginTop: 180,
    marginBottom: 220,
    titleScale: 84 / 104,
    giantScale: 140 / 188,
  },
} as const;
export type Orientation = keyof typeof LAYOUT;

// ------------------------------------------------------------------ easings --
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  zoom: Easing.bezier(0.33, 0, 0.2, 1),
};
/** Line-by-line title reveal (§7) */
export const TITLE_ANIM = {lineDuration: 24, lineStagger: 5, barDelay: 6, barDuration: 18};

// -------------------------------------------------------------------- audio --
export const AUDIO = {
  bpm: 100,
  /** frames per beat at 30 fps = 18 */
  beat: (30 * 60) / 100,
  music: 'audio/cia-presentation-music.wav',
  musicCutdown: 'audio/cia-presentation-music-20s.wav',
  /** score is normalised to ≈ −15 LUFS; −1 dB here + SFX → ≈ −16 LUFS mix */
  musicVolume: 0.89,
  sfx: {
    whoosh: 'audio/sfx-whoosh.wav',
    tick: 'audio/sfx-tick.wav',
    pop: 'audio/sfx-pop.wav',
    pen: 'audio/sfx-pen.wav',
  },
  sfxGain: {whoosh: 0.16, tick: 0.14, pop: 0.12, pen: 0.12},
};
/** Frame of beat n (global, from frame 0). */
export const beatFrame = (n: number) => Math.round(n * AUDIO.beat);

// -------------------------------------------------------------------- facts --
// Validated facts only (brief §1). Never compute an age, never show a price.
export const FACTS = {
  founded: 1985,
  studentsPerYear: 10000,
  nationalities: 50, // shown as "50+" — 60+ not confirmed
  // Residences (CIA, 16/11/2026): Castel Arabel and Astor are in central Juan-les-Pins, 5 min from school.
};

// --------------------------------------------------------------------- text --
export const TEXT = {
  en: {
    hello: {
      greetings: ['Hello', 'Hallo', 'Hola', 'Ciao', 'Olá', 'Привет', 'Merhaba', 'こんにちは', '你好'],
      bonjour: 'Bonjour',
      kicker: 'CENTRE INTERNATIONAL D’ANTIBES · SINCE 1985',
    },
    riviera: {
      line1: 'LEARN FRENCH',
      line2: 'ON THE FRENCH RIVIERA',
      cities: ['ANTIBES', 'JUAN-LES-PINS', 'CANNES'],
    },
    numbers: {
      items: [
        {pre: 'SINCE', value: FACTS.founded, suffix: '', label: '', grouping: false},
        {pre: '', value: FACTS.studentsPerYear, suffix: '', label: 'students a year', grouping: true},
        {pre: '', value: FACTS.nationalities, suffix: '+', label: 'nationalities', grouping: false},
      ],
      accreditation: 'Accredited by Qualité FLE & EAQUALS',
      thousands: ',',
    },
    schools: {
      kicker: 'OUR SCHOOLS & RESIDENCES',
      cards: [
        {name: 'LE PORT', caption: 'Antibes Old Town, steps from the beach'},
        {name: 'LE CHÂTEAU', caption: 'A Provençal mas, 22 classrooms'},
        {name: 'CANNES', caption: 'A listed historic campus'},
        {name: 'CASTEL ARABEL', caption: 'Our residence in Juan-les-Pins'},
        {name: 'ASTOR', caption: 'In the heart of Juan-les-Pins'},
      ],
    },
    programmes: {
      line1: 'A PROGRAMME',
      line2: 'FOR EVERY LEARNER',
      columns: [
        {title: 'ADULTS', items: ['Intensive', 'DELF', 'Business French', '50+', 'Wine & Cooking']},
        {title: 'JUNIORS 6–17', items: ['Summer camps', 'Watersports', 'Sailing']},
        {title: 'GROUPS', items: ['Schools', 'Tailor-made stays']},
      ],
    },
    liveIt: {words: ['LEARN.', 'TASTE.', 'SAIL.', 'EXPLORE.', 'LIVE.']},
    signature: {
      dont: 'Don’t learn French.',
      live: 'Live it.',
      url: 'www.cia-france.com',
      cta: 'DISCOVER OUR PROGRAMMES',
    },
  },
  fr: {
    hello: {
      greetings: ['Hello', 'Hallo', 'Hola', 'Ciao', 'Olá', 'Привет', 'Merhaba', 'こんにちは', '你好'],
      bonjour: 'Bonjour',
      kicker: 'CENTRE INTERNATIONAL D’ANTIBES · DEPUIS 1985',
    },
    riviera: {
      line1: 'APPRENDRE LE FRANÇAIS',
      line2: 'SUR LA CÔTE D’AZUR',
      cities: ['ANTIBES', 'JUAN-LES-PINS', 'CANNES'],
    },
    numbers: {
      items: [
        {pre: 'DEPUIS', value: FACTS.founded, suffix: '', label: '', grouping: false},
        {pre: '', value: FACTS.studentsPerYear, suffix: '', label: 'étudiants par an', grouping: true},
        {pre: '', value: FACTS.nationalities, suffix: '+', label: 'nationalités', grouping: false},
      ],
      accreditation: 'Labels Qualité FLE & EAQUALS',
      thousands: ' ',
    },
    schools: {
      kicker: 'NOS ÉCOLES & RÉSIDENCES',
      cards: [
        {name: 'LE PORT', caption: 'Vieil Antibes, à deux pas de la plage'},
        {name: 'LE CHÂTEAU', caption: 'Un mas provençal, 22 salles'},
        {name: 'CANNES', caption: 'Un campus classé monument historique'},
        {name: 'CASTEL ARABEL', caption: 'Notre résidence à Juan-les-Pins'},
        {name: 'ASTOR', caption: 'Au cœur de Juan-les-Pins'},
      ],
    },
    programmes: {
      line1: 'UN PROGRAMME',
      line2: 'POUR CHAQUE PROFIL',
      columns: [
        {title: 'ADULTES', items: ['Intensif', 'DELF', 'Français des affaires', '50+', 'Vin & Cuisine']},
        {title: 'JUNIORS 6–17 ANS', items: ['Séjours d’été', 'Sports nautiques', 'Voile']},
        {title: 'GROUPES', items: ['Scolaires', 'Séjours sur mesure']},
      ],
    },
    liveIt: {words: ['APPRENDRE.', 'SAVOURER.', 'NAVIGUER.', 'EXPLORER.', 'VIVRE.']},
    signature: {
      // The baseline is the brand signature: it stays in English.
      dont: 'Don’t learn French.',
      live: 'Live it.',
      url: 'www.cia-france.com',
      cta: 'DÉCOUVREZ NOS PROGRAMMES',
    },
  },
} as const;
export type Text = (typeof TEXT)['en'] | (typeof TEXT)['fr'];

// ------------------------------------------------------------------- assets --
export const ASSETS = {
  brand: {
    primary: 'brand/logo-primary.svg',
    primaryWhite: 'brand/logo-primary-white.svg',
    bandeauWhite: 'brand/logo-bandeau-white.svg',
  },
  /** Scene 1 background. null → WebGL Mediterranean light shader. */
  helloVideo: 'video/riviera-aerial-bay.mp4' as string | null,
  helloVideoFrames: 217,
  schools: [
    {photo: 'photos/le-port-balcony-view-port-vauban.jpg', focus: [0.5, 0.45] as [number, number]},
    {photo: 'photos/le-chateau-garden-a.jpg', focus: [0.5, 0.5] as [number, number]},
    {photo: 'photos/cannes-vieux-port-wikimedia.jpg', focus: [0.55, 0.55] as [number, number]},
    {photo: 'photos/castel-arabel-facade-tower.jpg', focus: [0.45, 0.4] as [number, number]},
    {photo: 'photos/astor-room-balcony.jpg', focus: [0.5, 0.55] as [number, number]},
  ] as {photo: string | null; focus: [number, number]}[],
  /** Scene 6 shots, one word each, cut on beats. Video zoom ≤ 1.08, photo ≤ 1.12. */
  liveIt: [
    {kind: 'photo', src: 'photos/le-port-class-adults-groupwork.jpg', focus: [0.5, 0.35], zoom: 1.06},
    // focus at the top: keeps the third-party cream carton (bottom edge) out of frame
    {kind: 'photo', src: 'photos/cooking-workshop-chef-b.jpg', focus: [0.5, 0], zoom: 1.06},
    {kind: 'video', src: 'video/sail-catamarans-offshore.mp4', focus: [0.5, 0.5], zoom: 1.0},
    {kind: 'video', src: 'video/juniors-beach-from-back.mp4', focus: [0.5, 0.5], zoom: 1.04},
    // already cropped ×1.08 in prepare-assets.py (watermark removal) → no extra zoom
    {kind: 'video', src: 'video/live-antibes-ramparts-aerial.mp4', focus: [0.5, 0.5], zoom: 1.0},
  ] as {kind: 'photo' | 'video'; src: string; focus: [number, number]; zoom: number}[],
  /** Local shot starts in scene 6 (frames). Global cut = sceneStart('liveIt') + value, on beats. */
  liveItCuts: [0, 43, 79, 115, 151],
  zoomMax: {photo: 1.12, video: 1.08},
};

// ---------------------------------------------------------------------- map --
export const MAP = {
  /** lon, lat — order east → west: Antibes, Juan-les-Pins, Cannes */
  cities: [
    {lon: 7.1256, lat: 43.5808, labelDx: 26, labelDy: -26, anchor: 'start'},
    {lon: 7.1083, lat: 43.5704, labelDx: 70, labelDy: 96, anchor: 'start'},
    {lon: 7.0128, lat: 43.5513, labelDx: -22, labelDy: -34, anchor: 'end'},
  ] as {lon: number; lat: number; labelDx: number; labelDy: number; anchor: 'start' | 'end'}[],
  /** camera: Europe → Côte d'Azur */
  from: {lon: 4.2, lat: 46.4, span: 22}, // span = degrees of longitude across the frame
  to: {lon: 7.07, lat: 43.545, span: 0.86},
  credit: 'Map: Natural Earth',
};

// ------------------------------------------------------------------ credits --
export const CREDITS = {
  en: 'Photo Cannes: Spike, Wikimedia Commons, CC BY-SA 4.0 · Map data: Natural Earth',
  fr: 'Photo Cannes : Spike, Wikimedia Commons, CC BY-SA 4.0 · Carte : Natural Earth',
};

// ------------------------------------------------------------- invariants --
// Fail loudly if a duration edit breaks the exact lengths required by the brief.
{
  const master = SCENE_ORDER.reduce((a, k) => a + SCENES[k], 0) - (SCENE_ORDER.length - 1) * TRANSITION_FRAMES;
  if (master !== VIDEO.durationInFrames) throw new Error(`SCENES total ${master} ≠ ${VIDEO.durationInFrames} frames`);
  const cut = CUTDOWN.scenes.reduce((a, s) => a + s.duration, 0) - CUTDOWN.transitions.length * TRANSITION_FRAMES;
  if (cut !== VIDEO.cutdownDurationInFrames) throw new Error(`CUTDOWN total ${cut} ≠ ${VIDEO.cutdownDurationInFrames} frames`);
}

// ============================================================================
//  V2 — BRAND FILM (brief V2). EDL: one entry per shot, cuts on the music grid.
//  120 BPM TEMP music → 1 beat = 15 f, 1 bar = 60 f, 30 bars = 1800 f.
// ============================================================================
export const V2_AUDIO = {
  bpm: 120,
  beat: 15,
  bar: 60,
  music: 'audio/TEMP-music-120bpm.wav',
  isTemp: true, // generated placeholder — replace with the licensed track (assets-src/audio/)
};

export const SOURCES = {
  cours: 'video/src/cours.mp4', // cours de français (25 fps, 60 s)
  jr: 'video/src/jr.mp4', // junior program (23.976 fps, 34.5 s)
  wc: 'video/src/wc.mp4', // wine & cooking (30 fps, 80 s)
  sr: 'video/src/sr.mp4', // senior program (30 fps, 81 s)
} as const;
export type SourceKey = keyof typeof SOURCES;
/** All sources conformed to 30 fps by motion interpolation (scripts/conform-30fps.sh) — used by V3. */
export const SOURCES30: Record<SourceKey, string> = {
  cours: 'video/30fps/cours.mp4',
  jr: 'video/30fps/jr.mp4',
  wc: 'video/30fps/wc.mp4',
  sr: 'video/30fps/sr.mp4',
};

/** Default crop: scale 1.18 anchored top → removes the burnt-in CIA logo (bottom-left)
 *  and the vimeo badge (bottom-right). JR 0–7 s carries a taller "40 ans" badge → 1.27. */
export const CROP = {scale: 1.18, scaleJrBadge: 1.27};

export type Clip = {src: SourceKey; in: number; rate?: number; scale?: number};
export type Shot = {
  id: string;
  act: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  dur: number; // frames (multiples of 15 = on the beat)
  kind: 'video' | 'photo' | 'still' | 'triptych';
  clip?: Clip;
  panels?: Clip[]; // triptych: appear one per beat
  image?: string; // photo / still
  /** provisional text for the offline cut (final typography in the motion pass) */
  text?: string;
  crop9x16?: number; // 0..1 horizontal centre of interest for the 9:16 version
};

const v = (src: SourceKey, inS: number, extra: Partial<Clip> = {}): Clip => ({src, in: inS, ...extra});
const JRB = {scale: CROP.scaleJrBadge};

export const EDL: Shot[] = [
  // A · Cold open (0–120)
  {id: 'A1', act: 'A', dur: 30, kind: 'video', clip: v('jr', 0.3, JRB), text: 'Hello'},
  {id: 'A2', act: 'A', dur: 15, kind: 'video', clip: v('jr', 2.4, JRB), text: 'Hola'},
  {id: 'A3', act: 'A', dur: 15, kind: 'video', clip: v('wc', 33.6), text: 'Ciao'},
  {id: 'A4', act: 'A', dur: 15, kind: 'video', clip: v('cours', 20.0), text: 'Hallo'},
  {id: 'A5', act: 'A', dur: 15, kind: 'video', clip: v('sr', 9.2), text: 'Привет'},
  {id: 'A6', act: 'A', dur: 30, kind: 'video', clip: v('jr', 3.75, JRB), text: 'こんにちは'},
  // B · Title (120–300) — drop at 4 s
  {id: 'B1', act: 'B', dur: 120, kind: 'video', clip: v('sr', 2.0), text: 'Bonjour. → LEARN FRENCH / ON THE FRENCH RIVIERA'},
  {id: 'B2', act: 'B', dur: 60, kind: 'video', clip: v('sr', 32.1), text: "CENTRE INTERNATIONAL D'ANTIBES · SINCE 1985 / ANTIBES · JUAN-LES-PINS · CANNES"},
  // C · 01 French courses (300–600)
  {id: 'C1', act: 'C', dur: 45, kind: 'video', clip: v('cours', 5.6), text: '01 FRENCH COURSES — All levels · All year  |  LE CHÂTEAU'},
  {id: 'C2', act: 'C', dur: 30, kind: 'video', clip: v('cours', 24.85), text: 'LE PORT · OLD TOWN'},
  {id: 'C3', act: 'C', dur: 45, kind: 'video', clip: v('cours', 11.5), text: '10,000 students a year · 50+ nationalities'},
  {id: 'C4', act: 'C', dur: 30, kind: 'video', clip: v('cours', 15.45)},
  {id: 'C5', act: 'C', dur: 30, kind: 'video', clip: v('cours', 18.25)},
  {id: 'C6', act: 'C', dur: 30, kind: 'video', clip: v('cours', 21.0), text: 'Max. 12 per class'},
  {id: 'C8', act: 'C', dur: 45, kind: 'video', clip: v('cours', 29.0)},
  {id: 'C9', act: 'C', dur: 30, kind: 'photo', image: 'photos/le-port-balcony-view-port-vauban.jpg', text: 'Intensive · DELF · Business French'},
  {id: 'C10', act: 'C', dur: 15, kind: 'video', clip: v('cours', 47.0)},
  // D · 02 Juniors — Juan-les-Pins Premium (600–960)
  {id: 'D1', act: 'D', dur: 30, kind: 'video', clip: v('jr', 21.74, {rate: 0.95}), text: '02 JUNIORS — Juan-les-Pins Premium · Ages 8–17'},
  {id: 'D2', act: 'D', dur: 30, kind: 'video', clip: v('jr', 22.75)},
  {id: 'D3', act: 'D', dur: 30, kind: 'video', clip: v('jr', 16.82), text: 'Small classes · max. 10'},
  {id: 'D4', act: 'D', dur: 15, kind: 'video', clip: v('jr', 19.52)},
  {id: 'D5', act: 'D', dur: 30, kind: 'video', clip: v('jr', 12.55), text: 'All-inclusive · Supervised'},
  {id: 'D6a', act: 'D', dur: 30, kind: 'video', clip: v('jr', 28.25)},
  {id: 'D6b', act: 'D', dur: 30, kind: 'video', clip: v('jr', 29.68), text: 'CASTEL ARABEL · 500 m from the beach'},
  {id: 'D7', act: 'D', dur: 30, kind: 'video', clip: v('jr', 5.05, JRB)},
  {id: 'D8', act: 'D', dur: 30, kind: 'video', clip: v('jr', 6.65)},
  {id: 'D9', act: 'D', dur: 45, kind: 'video', clip: v('jr', 10.1)},
  {id: 'D10', act: 'D', dur: 60, kind: 'video', clip: v('jr', 30.78), text: 'Classes · Beach · Adventure'},
  // E · 03 Wine & Cooking (960–1260) — musical break
  {id: 'E1', act: 'E', dur: 30, kind: 'video', clip: v('wc', 5.25), text: '03 WINE & COOKING — Cook. Taste. Speak French.'},
  {id: 'E2-4', act: 'E', dur: 45, kind: 'triptych', panels: [v('wc', 10.62, {rate: 0.9}), v('wc', 24.05), v('wc', 7.24)]},
  {id: 'E5', act: 'E', dur: 15, kind: 'video', clip: v('wc', 14.62)},
  {id: 'E6', act: 'E', dur: 30, kind: 'video', clip: v('wc', 28.05)},
  {id: 'E7', act: 'E', dur: 30, kind: 'video', clip: v('wc', 30.75)},
  {id: 'E8', act: 'E', dur: 45, kind: 'video', clip: v('wc', 51.0), text: 'CHÂTEAU DE CRÉMAT · AOC Bellet, Nice'},
  {id: 'E9', act: 'E', dur: 30, kind: 'video', clip: v('wc', 57.75)},
  {id: 'E10', act: 'E', dur: 30, kind: 'video', clip: v('wc', 61.85)},
  {id: 'E11', act: 'E', dur: 15, kind: 'video', clip: v('wc', 68.55)},
  {id: 'E12', act: 'E', dur: 30, kind: 'video', clip: v('wc', 71.25)},
  // F · 04 50+ & Culture (1260–1500)
  {id: 'F1', act: 'F', dur: 45, kind: 'video', clip: v('sr', 7.3), text: '04 50+ PROGRAMME — Markets · Art · The Riviera'},
  {id: 'F2', act: 'F', dur: 15, kind: 'video', clip: v('sr', 16.5)},
  {id: 'F3', act: 'F', dur: 15, kind: 'video', clip: v('sr', 18.25)},
  {id: 'F4', act: 'F', dur: 30, kind: 'video', clip: v('sr', 22.3)},
  {id: 'F5', act: 'F', dur: 30, kind: 'video', clip: v('sr', 24.6)},
  {id: 'F6', act: 'F', dur: 30, kind: 'video', clip: v('sr', 29.22)},
  {id: 'F7', act: 'F', dur: 30, kind: 'video', clip: v('sr', 53.45)},
  {id: 'F8', act: 'F', dur: 45, kind: 'video', clip: v('sr', 13.1)},
  // G · Finale (1500–1800) — final drop at 50 s, final hit at 56 s
  {id: 'G1', act: 'G', dur: 15, kind: 'video', clip: v('sr', 45.4)},
  {id: 'G2', act: 'G', dur: 15, kind: 'video', clip: v('wc', 26.8)},
  {id: 'G3', act: 'G', dur: 15, kind: 'video', clip: v('jr', 7.85)},
  {id: 'G4', act: 'G', dur: 15, kind: 'video', clip: v('cours', 16.85)},
  {id: 'G5', act: 'G', dur: 15, kind: 'video', clip: v('wc', 20.8)},
  {id: 'G6', act: 'G', dur: 15, kind: 'video', clip: v('sr', 69.3)},
  {id: 'G7', act: 'G', dur: 60, kind: 'video', clip: v('cours', 54.0)},
  {id: 'G8', act: 'G', dur: 60, kind: 'video', clip: v('cours', 56.55), text: 'Don’t learn French. → Live it.'},
  {id: 'G9', act: 'G', dur: 90, kind: 'still', image: 'video/stills/sunset-freeze.jpg', text: 'END CARD — logo · French courses · Juniors · Wine & Cooking · 50+ · Business French · www.cia-france.com · DISCOVER OUR PROGRAMMES'},
];

export const edlStarts = () => {
  let t = 0;
  return EDL.map((s) => {
    const start = t;
    t += s.dur;
    return start;
  });
};
{
  const total = EDL.reduce((a, s) => a + s.dur, 0);
  if (total !== VIDEO.durationInFrames) throw new Error(`EDL total ${total} ≠ ${VIDEO.durationInFrames}`);
}

// ============================================================================
//  V3 — BRAND FILM 90 s (brief V3): readable script, video + editorial layouts.
//  Metronome 120 BPM: 1 beat = 15 f. Total 2700 f.
// ============================================================================
export const V3 = {
  durationInFrames: 2700,
  beat: 15,
  metronome: 'audio/metronome-120bpm-90s.wav',
  /** reading rule (§0): 1 s + 0.3 s per word, title + caption together */
  readFrames: (words: number) => Math.ceil((1 + 0.3 * words) * 30),
  minReadPx: 44,
  type: {
    greeting: 120,
    bonjour: 160,
    title: 120, // opening title ≥ 120 px (V3.1)
    programmeName: 110,
    splitName: 76,
    placeTitle: 76,
    line: 48, // captions 44–52 px
    fact: 48,
    kicker: 26, // surtitles only
    number: 460,
    numberLabel: 56,
  },
};

const tv = (src: SourceKey, inS: number, extra: Partial<Clip> = {}): Clip => ({src, in: inS, ...extra});
const JRB3 = {scale: CROP.scaleJrBadge};

export type TimedClip = Clip & {dur: number};
export type MediaV3 = {kind: 'photo'; src: string; dur: number} | ({kind: 'video'} & TimedClip);
export type CityPoint = {x: number; y: number; lx: number; ly: number; anchor: 'start' | 'end'};
export type SegV3 =
  | {id: string; sec: number; dur: number; tpl: 'video'; clip: Clip; text?: string; textKind?: 'greeting' | 'line'; bug?: boolean}
  | {id: string; sec: number; dur: number; tpl: 'bonjour'; clip: Clip}
  | {id: string; sec: number; dur: number; tpl: 'T1'; clip: Clip; text: string}
  | {id: string; sec: number; dur: number; tpl: 'cities'; clip: Clip; text: string; points: CityPoint[]}
  | {id: string; sec: number; dur: number; tpl: 'T2'; clips: TimedClip[]; text: string; icons: string[]}
  | {id: string; sec: number; dur: number; tpl: 'T3'; photos: string[]; bg: TimedClip[]; text?: string}
  | {id: string; sec: number; dur: number; tpl: 'T4'; bg: TimedClip[]; text: string}
  | {id: string; sec: number; dur: number; tpl: 'T5'; clip: Clip; text: string; value: number; from: number; suffix: string; grouping: boolean; onNavy: boolean}
  | {id: string; sec: number; dur: number; tpl: 'T6'; photo: string; photoDur: number; clip: Clip; text: string}
  | {id: string; sec: number; dur: number; tpl: 'T8'; panels: TimedClip[][]; text: string; kicker?: string}
  | {id: string; sec: number; dur: number; tpl: 'line'; media: MediaV3[]; text: string; bug?: boolean}
  | {id: string; sec: number; dur: number; tpl: 'sunset'; clip: Clip}
  | {id: string; sec: number; dur: number; tpl: 'endcard'; image: string};

/** Whip pan between chapters (V3.1 §11): 12 f, overlapping both shots. */
export const WHIP_FRAMES = 12;

/** Texts (EN / FR). Keys are referenced by the script below. */
export const TEXT_V3 = {
  en: {
    hello: 'Hello', hola: 'Hola', ciao: 'Ciao', hallo: 'Hallo', privet: 'Привет', konnichiwa: 'こんにちは',
    bonjour: 'Bonjour.',
    promise: 'LEARN FRENCH|*ON THE FRENCH RIVIERA',
    cities: 'ANTIBES · JUAN-LES-PINS · CANNES',
    since: '1985|Since',
    students: '10,000|students a year',
    nationalities: '50+|nationalities',
    accredited: 'Accredited Qualité FLE & EAQUALS',
    fcCard: '01|*FRENCH COURSES|All levels · All year|Max. 12 per class|Intensive · DELF · Business French',
    fcLine: 'Small classes.|Real conversations.',
    lePort: '*LE PORT|Old Town, steps from the beach',
    leChateau: '*LE CHÂTEAU|A Provençal mas, 22 classrooms',
    juniors: '02|*JUNIORS 8–17|Juan-les-Pins Premium|All-inclusive|Supervised',
    morning: 'Classes in the morning.|The Riviera all afternoon.',
    castel: '*CASTEL ARABEL|500 m from the beach',
    astor: '*ASTOR|In the heart of Juan-les-Pins',
    wcCard: '03|*WINE & COOKING|French through gastronomy|Workshops · Tastings · Excursions',
    wcLine: 'Cook it. Taste it.|Say it in French.',
    cremat: '*CHÂTEAU DE CRÉMAT|AOC Bellet, Nice',
    seniors: '04|*50+ PROGRAMME|Culture · Markets · Excursions',
    seniorsLine: 'Your pace.|Your Riviera.',
    dont: 'Don’t learn French.',
    programmes: 'French courses · Juniors · Wine & Cooking · 50+',
    url: 'www.cia-france.com',
    cta: 'DISCOVER OUR PROGRAMMES',
  },
  fr: {
    hello: 'Hello', hola: 'Hola', ciao: 'Ciao', hallo: 'Hallo', privet: 'Привет', konnichiwa: 'こんにちは',
    bonjour: 'Bonjour.',
    promise: 'APPRENDRE LE FRANÇAIS|*SUR LA CÔTE D’AZUR',
    cities: 'ANTIBES · JUAN-LES-PINS · CANNES',
    since: '1985|Depuis',
    students: '10 000|étudiants par an',
    nationalities: '50+|nationalités',
    accredited: 'Labels Qualité FLE & EAQUALS',
    fcCard: '01|*COURS DE FRANÇAIS|Tous niveaux · Toute l’année|12 élèves max. par classe|Intensif · DELF · Français des affaires',
    fcLine: 'Petits groupes.|Vraies conversations.',
    lePort: '*LE PORT|Le vieil Antibes, à deux pas de la plage',
    leChateau: '*LE CHÂTEAU|Un mas provençal, 22 salles',
    juniors: '02|*JUNIORS 8–17 ANS|Juan-les-Pins Premium|Tout compris|Encadré',
    morning: 'Les cours le matin.|La Riviera l’après-midi.',
    castel: '*CASTEL ARABEL|À 500 m de la plage',
    astor: '*ASTOR|Au cœur de Juan-les-Pins',
    wcCard: '03|*WINE & COOKING|Le français par la gastronomie|Ateliers · Dégustations · Excursions',
    wcLine: 'Cuisinez. Goûtez.|Dites-le en français.',
    cremat: '*CHÂTEAU DE CRÉMAT|AOC Bellet, Nice',
    seniors: '04|*PROGRAMME 50+|Culture · Marchés · Excursions',
    seniorsLine: 'Votre rythme.|Votre Riviera.',
    dont: 'Don’t learn French.',
    programmes: 'Cours de français · Juniors · Wine & Cooking · 50+',
    url: 'www.cia-france.com',
    cta: 'DÉCOUVREZ NOS PROGRAMMES',
  },
} as const;
export type TextKeyV3 = keyof (typeof TEXT_V3)['en'];

/**
 * The script. `text` values are keys of TEXT_V3. Within a text, '|' separates lines,
 * a leading '*' marks a Bold line. Sections: 1 hook · 2 promise · 3 who · 4 French courses ·
 * 5 Juniors · 6 Wine & Cooking · 7 50+ · 8 finale.
 */
export const SCRIPT_V3: SegV3[] = [
  // 1 · Hook (0–165): greetings cut with each shot, then Bonjour on the SR drone (speed 1.0)
  {id: '1a', sec: 1, dur: 22, tpl: 'video', clip: tv('jr', 0.3, JRB3), text: 'hello', textKind: 'greeting'},
  {id: '1b', sec: 1, dur: 15, tpl: 'video', clip: tv('jr', 2.4, JRB3), text: 'hola', textKind: 'greeting'},
  {id: '1c', sec: 1, dur: 15, tpl: 'video', clip: tv('wc', 33.6), text: 'ciao', textKind: 'greeting'},
  {id: '1d', sec: 1, dur: 23, tpl: 'video', clip: tv('cours', 20.0), text: 'hallo', textKind: 'greeting'},
  {id: '1e', sec: 1, dur: 15, tpl: 'video', clip: tv('sr', 9.2), text: 'privet', textKind: 'greeting'},
  {id: '1f', sec: 1, dur: 30, tpl: 'video', clip: tv('jr', 3.75, JRB3), text: 'konnichiwa', textKind: 'greeting'},
  {id: '1g', sec: 1, dur: 45, tpl: 'bonjour', clip: tv('sr', 1.72)},
  // 2 · Promise (165–345): title on the drone, then the bay with 3 city labels (replaces the T7 map)
  {id: '2a', sec: 2, dur: 105, tpl: 'T1', clip: tv('sr', 3.22), text: 'promise'},
  {id: '2b', sec: 2, dur: 75, tpl: 'cities', clip: tv('cours', 0.3), text: 'cities', points: [
    {x: 300, y: 600, lx: 300, ly: 470, anchor: 'start'}, // Antibes: foreground town
    {x: 1080, y: 470, lx: 1180, ly: 600, anchor: 'start'}, // Juan-les-Pins: the bay front
    {x: 820, y: 318, lx: 700, ly: 230, anchor: 'end'}, // Cannes: across the bay, under the Estérel
  ]},
  // 3 · Who we are (345–615)
  {id: '3a', sec: 3, dur: 60, tpl: 'T5', clip: tv('cours', 11.42), text: 'since', value: 1985, from: 1900, suffix: '', grouping: false, onNavy: true},
  {id: '3b', sec: 3, dur: 75, tpl: 'T5', clip: tv('cours', 26.62), text: 'students', value: 10000, from: 0, suffix: '', grouping: true, onNavy: false},
  {id: '3c', sec: 3, dur: 60, tpl: 'T5', clip: tv('cours', 45.95), text: 'nationalities', value: 50, from: 0, suffix: '+', grouping: false, onNavy: false},
  {id: '3d', sec: 3, dur: 75, tpl: 'video', clip: tv('cours', 48.2), text: 'accredited', textKind: 'line', bug: true},
  // 4 · 01 French courses (615–1155): T4 → classes → T3 Le Port → T6 Le Château
  {id: '4a', sec: 4, dur: 180, tpl: 'T4', text: 'fcCard', bg: [{...tv('cours', 18.25), dur: 32}, {...tv('cours', 15.4), dur: 42}, {...tv('cours', 31.15), dur: 31}, {...tv('cours', 33.45), dur: 32}, {...tv('cours', 19.95), dur: 28}, {...tv('cours', 29.0), dur: 15}]},
  {id: '4b', sec: 4, dur: 120, tpl: 'line', text: 'fcLine', bug: true, media: [{kind: 'video', ...tv('cours', 13.75), dur: 45}, {kind: 'video', ...tv('cours', 28.95), dur: 45}, {kind: 'video', ...tv('cours', 22.12), dur: 30}]},
  {id: '4c', sec: 4, dur: 135, tpl: 'T3', text: 'lePort', photos: ['photos/le-port-balcony-view-port-vauban.jpg', 'photos/le-port-class-adults-a.jpg', 'photos/le-port-class-teacher-student.jpg'], bg: [{...tv('sr', 30.35), dur: 52}, {...tv('sr', 32.1), dur: 83}]},
  {id: '4d', sec: 4, dur: 105, tpl: 'T6', text: 'leChateau', photo: 'photos/le-chateau-garden-a.jpg', photoDur: 96, clip: tv('cours', 7.46)},
  // 5 · 02 Juniors (1155–1677): T2 → burst → morning/afternoon → T6 Castel Arabel → T3 Astor
  {id: '5a', sec: 5, dur: 150, tpl: 'T2', text: 'juniors', icons: ['MapPin', 'Sun', 'ShieldCheck'], clips: [{...tv('jr', 30.8), dur: 66}, {...tv('jr', 16.82), dur: 39}, {...tv('jr', 12.55), dur: 31}, {...tv('jr', 13.62), dur: 14}]},
  {id: '5b', sec: 5, dur: 15, tpl: 'video', clip: tv('jr', 5.05, JRB3)},
  {id: '5c', sec: 5, dur: 12, tpl: 'video', clip: tv('jr', 10.1)},
  {id: '5d', sec: 5, dur: 18, tpl: 'video', clip: tv('jr', 28.25)},
  {id: '5e', sec: 5, dur: 12, tpl: 'video', clip: tv('jr', 21.75)},
  {id: '5f', sec: 5, dur: 15, tpl: 'video', clip: tv('jr', 17.0)},
  {id: '5g', sec: 5, dur: 105, tpl: 'line', text: 'morning', media: [{kind: 'photo', src: 'photos/juniors-class-teacher-whiteboard.jpg', dur: 47}, {kind: 'video', ...tv('jr', 6.6), dur: 58}]},
  // Castel Arabel: facade photo → wide pool footage (no child's face full screen)
  {id: '5h', sec: 5, dur: 105, tpl: 'T6', text: 'castel', photo: 'photos/castel-arabel-facade-tower.jpg', photoDur: 85, clip: tv('jr', 29.66)},
  {id: '5i', sec: 5, dur: 90, tpl: 'T3', text: 'astor', photos: ['photos/astor-room-balcony.jpg', 'photos/astor-room-c.jpg', 'photos/astor-lounge.jpg'], bg: [{...tv('jr', 24.0), dur: 30}, {...tv('jr', 25.0), dur: 40}, {...tv('jr', 26.7), dur: 20}]},
  // 6 · 03 Wine & Cooking (1677–2097): T8 → T4 → T3 → Crémat
  {id: '6a', sec: 6, dur: 105, tpl: 'T8', text: 'wcLine', kicker: '03', panels: [
    [{...tv('wc', 7.24), dur: 15}, {...tv('wc', 10.62), dur: 30}, {...tv('wc', 24.05), dur: 30}, {...tv('wc', 30.75), dur: 30}],
    [{...tv('wc', 11.92), dur: 15}, {...tv('wc', 13.72), dur: 27}, {...tv('wc', 22.92), dur: 33}, {...tv('wc', 28.05), dur: 15}],
    [{...tv('wc', 14.62), dur: 30}, {...tv('wc', 7.9), dur: 12}, {...tv('wc', 12.65), dur: 18}, {...tv('wc', 29.45), dur: 15}],
  ]},
  {id: '6b', sec: 6, dur: 135, tpl: 'T4', text: 'wcCard', bg: [{...tv('wc', 5.25), dur: 39}, {...tv('wc', 20.7), dur: 39}, {...tv('wc', 26.75), dur: 39}, {...tv('wc', 2.9), dur: 18}]},
  {id: '6c', sec: 6, dur: 45, tpl: 'T3', photos: ['photos/cooking-pastry-fraisier-vertical.jpg', 'photos/cooking-workshop-chef-a.jpg', 'photos/wine-tasting-toast.jpg'], bg: [{...tv('wc', 33.5), dur: 45}]},
  {id: '6d', sec: 6, dur: 90, tpl: 'video', clip: tv('wc', 74.6), text: 'cremat', textKind: 'line', bug: true},
  {id: '6e', sec: 6, dur: 15, tpl: 'video', clip: tv('wc', 61.85), bug: true},
  {id: '6f', sec: 6, dur: 30, tpl: 'video', clip: tv('wc', 71.25), bug: true},
  // 7 · 04 50+ (2097–2427): T6 old-Antibes photo → the lane footage; market, socca, sea; drone
  {id: '7a', sec: 7, dur: 165, tpl: 'T6', text: 'seniors', photo: 'photos/old-antibes-lane-still.jpg', photoDur: 96, clip: tv('sr', 6.38)},
  {id: '7b', sec: 7, dur: 120, tpl: 'line', text: 'seniorsLine', bug: true, media: [{kind: 'video', ...tv('sr', 22.25), dur: 34}, {kind: 'video', ...tv('sr', 24.58), dur: 33}, {kind: 'video', ...tv('sr', 29.21), dur: 32}, {kind: 'video', ...tv('sr', 9.05), dur: 21}]},
  {id: '7c', sec: 7, dur: 45, tpl: 'video', clip: tv('sr', 13.05), bug: true},
  // 8 · Finale (2427–2700): 4 smiles (one per film), sunset at speed 1.0, end card
  {id: '8a', sec: 8, dur: 12, tpl: 'video', clip: tv('sr', 45.4)},
  {id: '8b', sec: 8, dur: 14, tpl: 'video', clip: tv('wc', 16.1)},
  {id: '8c', sec: 8, dur: 12, tpl: 'video', clip: tv('jr', 19.55)},
  {id: '8d', sec: 8, dur: 10, tpl: 'video', clip: tv('cours', 16.85)},
  {id: '8e', sec: 8, dur: 90, tpl: 'sunset', clip: tv('cours', 56.47)},
  {id: '8f', sec: 8, dur: 135, tpl: 'endcard', image: 'video/stills/sunset-freeze.jpg'},
];

export const v3Starts = () => {
  let t = 0;
  return SCRIPT_V3.map((s) => {
    const st = t;
    t += s.dur;
    return st;
  });
};
{
  const total = SCRIPT_V3.reduce((a, s) => a + s.dur, 0);
  if (total !== V3.durationInFrames) throw new Error(`SCRIPT_V3 total ${total} ≠ ${V3.durationInFrames}`);
}
