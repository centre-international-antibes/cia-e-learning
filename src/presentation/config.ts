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

// 20 s cutdown: Bonjour (3 s) → Riviera (5 s) → Live it (7 s) → Signature (5 s)
// 90 + 150 + 210 + 210 − 3 × 20 = 600
export const CUTDOWN = {
  scenes: [
    {key: 'hello' as const, duration: 90, offset: 105}, // starts on "Bonjour"
    {key: 'riviera' as const, duration: 150, offset: 40},
    {key: 'liveIt' as const, duration: 210, offset: 45},
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
};

// --------------------------------------------------------------------- text --
export const TEXT = {
  en: {
    hello: {
      greetings: ['Hello', 'Hallo', 'Hola', 'Ciao', 'Olá', 'Привет', 'Merhaba', 'こんにちは', '你好'],
      bonjour: 'Bonjour',
      kicker: "CENTRE INTERNATIONAL D'ANTIBES · SINCE 1985",
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
      kicker: "CENTRE INTERNATIONAL D'ANTIBES · DEPUIS 1985",
    },
    riviera: {
      line1: 'APPRENDRE LE FRANÇAIS',
      line2: "SUR LA CÔTE D'AZUR",
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
  ] as {photo: string | null; focus: [number, number]}[],
  /** Scene 6 shots, one word each, cut on beats. Video zoom ≤ 1.08, photo ≤ 1.12. */
  liveIt: [
    {kind: 'photo', src: 'photos/le-port-class-adults-groupwork.jpg', frames: 0, wordSide: 'left'},
    {kind: 'photo', src: 'photos/cooking-workshop-chef-b.jpg', frames: 0, wordSide: 'left'},
    {kind: 'video', src: 'video/sail-catamaran-splash.mp4', frames: 45, wordSide: 'left'},
    {kind: 'video', src: 'video/juniors-beach-from-back.mp4', frames: 68, wordSide: 'left'},
    {kind: 'video', src: 'video/live-antibes-ramparts-aerial.mp4', frames: 104, wordSide: 'left'},
  ] as {kind: 'photo' | 'video'; src: string; frames: number; wordSide: 'left' | 'right'}[],
  /** Local shot starts in scene 6 (frames). Global cut = sceneStart('liveIt') + value, on beats. */
  liveItCuts: [0, 43, 79, 115, 151],
  zoomMax: {photo: 1.12, video: 1.08},
};

// ---------------------------------------------------------------------- map --
export const MAP = {
  /** lon, lat — order east → west: Antibes, Juan-les-Pins, Cannes */
  cities: [
    {lon: 7.1256, lat: 43.5808, labelDx: 26, labelDy: -26, anchor: 'start'},
    {lon: 7.1083, lat: 43.5704, labelDx: 24, labelDy: 46, anchor: 'start'},
    {lon: 7.0128, lat: 43.5513, labelDx: -26, labelDy: -26, anchor: 'end'},
  ] as {lon: number; lat: number; labelDx: number; labelDy: number; anchor: 'start' | 'end'}[],
  /** camera: Europe → Côte d'Azur */
  from: {lon: 6.2, lat: 46.4, span: 26}, // span = degrees of longitude across the frame
  to: {lon: 7.06, lat: 43.6, span: 0.62},
  credit: 'Map: Natural Earth',
};

// ------------------------------------------------------------------ credits --
export const CREDITS = {
  en: 'Photo Cannes: Spike, Wikimedia Commons, CC BY-SA 4.0 · Map data: Natural Earth',
  fr: 'Photo Cannes : Spike, Wikimedia Commons, CC BY-SA 4.0 · Carte : Natural Earth',
};
