// ============================================================================
//  V4 — CORRECTIONS-V4.md + MUSIC-EDIT.md
//  Every duration is written in MUSIC BEATS and resolved to frames on the real
//  beat grid of the edited track (beats.json, librosa). Cuts, chain cuts, whip
//  centres and text starts therefore land on a beat by construction.
// ============================================================================
import beatsJson from './beats.json';
import {CROP, Clip, CityPoint, SegV3, SourceKey, TEXT_V3, TimedClip} from '../config';

export const BEAT_FRAMES: number[] = beatsJson.frames;
export const FILM_FRAMES = 2700;
export const MUSIC_V4 = 'audio/v4-mix.wav';
export const BEAT = {drop: 12, chapter01: 40, finale: 156, redrop: 168};

/** frame of beat k (beyond the last beat: the film end) */
export const fb = (k: number) => (k < BEAT_FRAMES.length ? BEAT_FRAMES[k] : FILM_FRAMES);

const c = (src: SourceKey, inS: number, extra: Partial<Clip> = {}): Clip => ({src, in: inS, ...extra});
const JRB = {scale: CROP.scaleJrBadge};
type BClip = Clip & {beats: number};
const bc = (src: SourceKey, inS: number, beats: number, extra: Partial<Clip> = {}): BClip => ({src, in: inS, beats, ...extra});

type BSeg =
  | {id: string; sec: number; beats: number; tpl: 'video'; clip: Clip; text?: string; textKind?: 'greeting' | 'line'; bug?: boolean}
  | {id: string; sec: number; beats: number; tpl: 'bonjour'; clip: Clip}
  | {id: string; sec: number; beats: number; tpl: 'T1'; text: string; chain: BClip[]}
  | {id: string; sec: number; beats: number; tpl: 'cities'; clip: Clip; text: string; points: CityPoint[]}
  | {id: string; sec: number; beats: number; tpl: 'T2'; text: string; icons: string[]; chain: BClip[]}
  | {id: string; sec: number; beats: number; tpl: 'T3'; text?: string; photos: string[]; chain: BClip[]}
  | {id: string; sec: number; beats: number; tpl: 'T4'; text: string; chain: BClip[]}
  | {id: string; sec: number; beats: number; tpl: 'T5'; clip: Clip; text: string; value: number; from: number; suffix: string; grouping: boolean; onNavy: boolean; chain?: BClip[]}
  | {id: string; sec: number; beats: number; tpl: 'T6'; text: string; photo: string; growFrames: number; videoAtBeat: number; clip: Clip}
  | {id: string; sec: number; beats: number; tpl: 'T8'; text: string; kicker: string; panels: BClip[][]}
  | {id: string; sec: number; beats: number; tpl: 'place'; text: string; chain: (BClip | {photo: string; beats: number})[]}
  | {id: string; sec: number; beats: number; tpl: 'line'; text: string; bug?: boolean; chain: (BClip | {photo: string; beats: number})[]}
  | {id: string; sec: number; beats: number; tpl: 'word'; text: string; clip: Clip; bar?: boolean}
  | {id: string; sec: number; beats: number; tpl: 'sunset'; clip: Clip}
  | {id: string; sec: number; beats: number | 'rest'; tpl: 'endcard'; image: string};

/** V4 texts: V3 texts + new structure (chapter numbers 01–05, residences, excursions, finale words). */
export const TEXT_V4 = {
  en: {
    ...TEXT_V3.en,
    juniors: '01|*JUNIORS 8–17|Juan-les-Pins Premium|All-inclusive|Supervised',
    fcCard: '02|*FRENCH COURSES|All levels · All year|Max. 12 per class|Intensive · DELF · Business French',
    seniors: '02|*50+ PROGRAMME|Culture · Markets · Excursions',
    castel: '03 · OUR RESIDENCES|*CASTEL ARABEL|500 m from the beach',
    excursions: '04|*EXCURSIONS|Nice · Monaco · Cannes · Grasse',
    wcCard: '05|*WINE & COOKING|French through gastronomy|Workshops · Tastings · Excursions',
    encounters: 'Encounters.',
    emotions: 'Emotions.',
    memories: 'Memories.',
  },
  fr: {
    ...TEXT_V3.fr,
    juniors: '01|*JUNIORS 8–17 ANS|Juan-les-Pins Premium|Tout compris|Encadré',
    fcCard: '02|*COURS DE FRANÇAIS|Tous niveaux · Toute l’année|12 élèves max. par classe|Intensif · DELF · Français des affaires',
    seniors: '02|*PROGRAMME 50+|Culture · Marchés · Excursions',
    castel: '03 · NOS RÉSIDENCES|*CASTEL ARABEL|À 500 m de la plage',
    excursions: '04|*EXCURSIONS|Nice · Monaco · Cannes · Grasse',
    wcCard: '05|*WINE & COOKING|Le français par la gastronomie|Ateliers · Dégustations · Excursions',
    encounters: 'Rencontres.',
    emotions: 'Émotions.',
    memories: 'Souvenirs.',
  },
};
export type TextKeyV4 = keyof (typeof TEXT_V4)['en'];

// --------------------------------------------------------------- script --
const B: BSeg[] = [
  // 1 · Hook — beats 0–12: greetings (cut with each shot), Bonjour just before the drop
  {id: '1a', sec: 1, beats: 2, tpl: 'video', clip: c('jr', 0.3, JRB), text: 'hello', textKind: 'greeting'},
  {id: '1b', sec: 1, beats: 1, tpl: 'video', clip: c('jr', 2.4, JRB), text: 'hola', textKind: 'greeting'},
  {id: '1c', sec: 1, beats: 1, tpl: 'video', clip: c('wc', 33.6), text: 'ciao', textKind: 'greeting'},
  {id: '1d', sec: 1, beats: 2, tpl: 'video', clip: c('cours', 19.93), text: 'hallo', textKind: 'greeting'},
  {id: '1e', sec: 1, beats: 1, tpl: 'video', clip: c('sr', 9.2), text: 'privet', textKind: 'greeting'},
  {id: '1f', sec: 1, beats: 2, tpl: 'video', clip: c('jr', 3.75, JRB), text: 'konnichiwa', textKind: 'greeting'},
  {id: '1g', sec: 1, beats: 3, tpl: 'bonjour', clip: c('sr', 1.72)},
  // 2 · Promise — title ON THE DROP (beat 12), then the bay with 3 city labels
  {id: '2a', sec: 2, beats: 6, tpl: 'T1', text: 'promise', chain: [bc('sr', 3.25, 6)]},
  {id: '2b', sec: 2, beats: 4, tpl: 'cities', clip: c('cours', 0.3), text: 'cities', points: [
    {x: 300, y: 600, lx: 300, ly: 470, anchor: 'start'},
    {x: 1080, y: 470, lx: 1180, ly: 600, anchor: 'start'},
    {x: 820, y: 318, lx: 700, ly: 230, anchor: 'end'},
  ]},
  // 3 · Numbers — beats 22–40
  {id: '3a', sec: 3, beats: 4, tpl: 'T5', clip: c('cours', 11.40), text: 'since', value: 1985, from: 1900, suffix: '', grouping: false, onNavy: true},
  {id: '3b', sec: 3, beats: 5, tpl: 'T5', clip: c('cours', 26.62), chain: [bc('cours', 26.62, 3), bc('sr', 63.85, 2)], text: 'students', value: 10000, from: 0, suffix: '', grouping: true, onNavy: false},
  {id: '3c', sec: 3, beats: 4, tpl: 'T5', clip: c('cours', 22.12), text: 'nationalities', value: 50, from: 0, suffix: '+', grouping: false, onNavy: false},
  {id: '3d', sec: 3, beats: 5, tpl: 'place', text: 'accredited', chain: [bc('cours', 21.0, 2), bc('cours', 13.75, 3)]},
  // 4 · 01 Juniors — beats 40–69: T2 → Le Château (juniors' school) → class → burst at sea → morning / afternoon
  {id: '4a', sec: 4, beats: 9, tpl: 'T2', text: 'juniors', icons: ['MapPin', 'Sun', 'ShieldCheck'], chain: [bc('jr', 6.6, 3), bc('jr', 16.82, 2), bc('jr', 12.55, 2), bc('jr', 13.62, 1), bc('jr', 19.52, 1)]},
  {id: '4b', sec: 4, beats: 6, tpl: 'place', text: 'leChateau', chain: [bc('cours', 7.46, 2), bc('sr', 59.18, 4)]},
  {id: '4c', sec: 4, beats: 2, tpl: 'video', clip: c('jr', 20.3), bug: true},
  {id: '4d', sec: 4, beats: 1, tpl: 'video', clip: c('jr', 5.05, JRB)},
  {id: '4e', sec: 4, beats: 1, tpl: 'video', clip: c('jr', 10.1)},
  {id: '4f', sec: 4, beats: 1, tpl: 'video', clip: c('jr', 28.25)},
  {id: '4g', sec: 4, beats: 1, tpl: 'video', clip: c('jr', 21.75)},
  {id: '4h', sec: 4, beats: 1, tpl: 'video', clip: c('jr', 18.2)},
  {id: '4i', sec: 4, beats: 7, tpl: 'line', text: 'morning', chain: [{photo: 'photos/juniors-class-teacher-whiteboard.jpg', beats: 5}, bc('jr', 26.7, 2)]},
  // 5 · 02 Adults — beats 69–104: T4 French courses → classes → Le Port → 50+ (T1 lane) → your pace
  {id: '5a', sec: 5, beats: 10, tpl: 'T4', text: 'fcCard', chain: [bc('cours', 18.25, 2), bc('cours', 31.15, 2), bc('cours', 16.85, 1), bc('cours', 32.25, 2), bc('cours', 19.35, 1), bc('cours', 33.45, 2)]},
  {id: '5b', sec: 5, beats: 5, tpl: 'line', text: 'fcLine', bug: true, chain: [bc('cours', 15.4, 2), bc('cours', 28.95, 3)]},
  {id: '5c', sec: 5, beats: 9, tpl: 'T3', text: 'lePort', photos: ['photos/le-port-balcony-view-port-vauban.jpg', 'photos/le-port-class-adults-a.jpg', 'photos/le-port-class-teacher-student.jpg'], chain: [bc('sr', 30.35, 3), bc('sr', 32.1, 4), bc('cours', 24.6, 2)]},
  {id: '5d', sec: 5, beats: 6, tpl: 'T1', text: 'seniors', chain: [bc('sr', 6.42, 1), bc('sr', 7.3, 3), bc('sr', 23.45, 1), bc('sr', 17.65, 1)]},
  {id: '5e', sec: 5, beats: 5, tpl: 'line', text: 'seniorsLine', bug: true, chain: [bc('sr', 22.25, 2), bc('sr', 29.21, 2), bc('sr', 24.05, 1)]},
  // 6 · 03 Residences — beats 104–117: Castel Arabel (T6, grows from the first frame) → Astor
  {id: '6a', sec: 6, beats: 8, tpl: 'T6', text: 'castel', photo: 'photos/castel-arabel-facade-tower.jpg', growFrames: 30, videoAtBeat: 6, clip: c('jr', 29.66)},
  {id: '6b', sec: 6, beats: 6, tpl: 'T3', text: 'astor', photos: ['photos/astor-room-balcony.jpg', 'photos/astor-room-c.jpg', 'photos/astor-lounge.jpg'], chain: [bc('jr', 25.0, 3), bc('jr', 22.75, 2), bc('jr', 24.0, 1)]},
  // 7 · 04 Excursions — beats 117–132
  {id: '7a', sec: 7, beats: 6, tpl: 'T1', text: 'excursions', chain: [bc('wc', 36.0, 2), bc('sr', 0.1, 3), bc('sr', 57.45, 1)]},
  {id: '7b', sec: 7, beats: 1, tpl: 'video', clip: c('sr', 16.5)},
  {id: '7c', sec: 7, beats: 1, tpl: 'video', clip: c('sr', 19.47)},
  {id: '7d', sec: 7, beats: 2, tpl: 'video', clip: c('sr', 25.75)},
  {id: '7e', sec: 7, beats: 1, tpl: 'video', clip: c('sr', 21.7)},
  {id: '7f', sec: 7, beats: 2, tpl: 'video', clip: c('sr', 28.05)},
  {id: '7g', sec: 7, beats: 1, tpl: 'video', clip: c('sr', 53.45), bug: true},
  // 8 · 05 Wine & Cooking — beats 132–156: triptych → card → Crémat (drone + cellar) → toast
  {id: '8a', sec: 8, beats: 7, tpl: 'T8', text: 'wcLine', kicker: '05', panels: [
    [bc('wc', 10.62, 2), bc('wc', 24.05, 2), bc('wc', 30.75, 2), bc('wc', 12.65, 1)],
    [bc('wc', 11.92, 1), bc('wc', 13.72, 1), bc('wc', 22.92, 2), bc('wc', 28.05, 2)],
    [bc('wc', 14.6, 1), bc('wc', 29.45, 2), bc('wc', 7.24, 1), bc('wc', 9.22, 1)],
  ]},
  {id: '8b', sec: 8, beats: 9, tpl: 'T4', text: 'wcCard', chain: [bc('wc', 5.45, 2), bc('wc', 20.7, 1), bc('wc', 2.9, 1), bc('wc', 26.75, 2), bc('wc', 22.0, 1), bc('wc', 32.15, 2)]},
  {id: '8c', sec: 8, beats: 6, tpl: 'place', text: 'cremat', chain: [bc('wc', 74.6, 4), bc('wc', 61.85, 2)]},
  {id: '8d', sec: 8, beats: 2, tpl: 'video', clip: c('wc', 71.25), bug: true},
  // 9 · Finale on the BREAK (beat 156): one word per bar on a held shot
  {id: '9a', sec: 9, beats: 4, tpl: 'word', text: 'encounters', clip: c('cours', 46.0)},
  {id: '9b', sec: 9, beats: 4, tpl: 'word', text: 'emotions', clip: c('jr', 30.8)},
  {id: '9c', sec: 9, beats: 4, tpl: 'word', text: 'memories', clip: c('cours', 54.0), bar: true},
  // re-drop (beat 168): sunset + baseline, "Live it." traced on the beat
  {id: '9d', sec: 9, beats: 4, tpl: 'sunset', clip: c('cours', 56.47)},
  {id: '9e', sec: 9, beats: 'rest', tpl: 'endcard', image: 'video/stills/sunset-freeze.jpg'},
];

/** Chapter boundaries carrying a whip pan centred on the cut (6 f before, 6 f after). */
export const WHIP_BEATS = [BEAT.chapter01, 69, 104, 118, 132];

// ------------------------------------------------------------ resolver --
export type SegV4 = SegV3 | {id: string; sec: number; dur: number; tpl: 'word'; text: string; clip: Clip; bar?: boolean};
export type ResolvedSeg = {seg: SegV4; start: number; beat: number; cuts: number[]};

const chainToFrames = (b0: number, chain: (BClip | {photo: string; beats: number})[]) => {
  let k = b0;
  return chain.map((x) => {
    const dur = fb(k + x.beats) - fb(k);
    k += x.beats;
    return 'photo' in x ? {kind: 'photo' as const, src: x.photo, dur} : {kind: 'video' as const, ...stripBeats(x), dur};
  });
};
const stripBeats = (x: BClip): Clip => {
  const {beats: _b, ...rest} = x;
  return rest;
};
const clipsToFrames = (b0: number, chain: BClip[]): TimedClip[] =>
  chainToFrames(b0, chain).map((m) => {
    const {kind: _k, ...rest} = m as {kind: 'video'} & TimedClip;
    return rest;
  });

export const resolveV4 = (): ResolvedSeg[] => {
  let k = 0;
  return B.map((s) => {
    const beats = s.beats === 'rest' ? Infinity : s.beats;
    const start = fb(k);
    const end = beats === Infinity ? FILM_FRAMES : fb(k + beats);
    const dur = end - start;
    const cuts: number[] = [start];
    const addChainCuts = (chain: {beats: number}[]) => {
      let kk = k;
      chain.slice(0, -1).forEach((x) => {
        kk += x.beats;
        cuts.push(fb(kk));
      });
    };
    let seg: SegV4;
    const base = {id: s.id, sec: s.sec, dur};
    switch (s.tpl) {
      case 'T1':
        seg = {...base, tpl: 'T1', text: s.text, clip: stripBeats(s.chain[0]), clips: clipsToFrames(k, s.chain)};
        addChainCuts(s.chain);
        break;
      case 'T2':
        seg = {...base, tpl: 'T2', text: s.text, icons: s.icons, clips: clipsToFrames(k, s.chain)};
        addChainCuts(s.chain);
        break;
      case 'T3':
        seg = {...base, tpl: 'T3', text: s.text, photos: s.photos, bg: clipsToFrames(k, s.chain)};
        addChainCuts(s.chain);
        break;
      case 'T4':
        seg = {...base, tpl: 'T4', text: s.text, bg: clipsToFrames(k, s.chain)};
        addChainCuts(s.chain);
        break;
      case 'T6':
        seg = {...base, tpl: 'T6', text: s.text, photo: s.photo, photoDur: s.growFrames, videoFrom: fb(k + s.videoAtBeat) - start, clip: s.clip};
        cuts.push(fb(k + s.videoAtBeat)); // photo → footage dissolve starts on a beat
        break;
      case 'T8':
        seg = {
          ...base,
          tpl: 'T8',
          text: s.text,
          kicker: s.kicker,
          panelStarts: s.panels.map((_, i) => fb(k + i) - start),
          panels: s.panels.map((p, i) => {
            const startBeat = k + i;
            const chain = clipsToFrames(startBeat, p);
            let kk = startBeat;
            p.slice(0, -1).forEach((x) => {
              kk += x.beats;
              cuts.push(fb(kk));
            });
            if (i > 0) cuts.push(fb(startBeat)); // panel entry
            return chain;
          }),
        };
        break;
      case 'place':
      case 'line':
        seg = {...base, tpl: s.tpl, text: s.text, media: chainToFrames(k, s.chain), ...(s.tpl === 'line' ? {bug: s.bug} : {})} as SegV4;
        addChainCuts(s.chain);
        break;
      case 'endcard':
        seg = {...base, tpl: 'endcard', image: s.image};
        break;
      case 'T5':
        seg = {...base, ...(s as object), dur, clips: s.chain ? clipsToFrames(k, s.chain) : undefined} as SegV4;
        delete (seg as {beats?: unknown; chain?: unknown}).chain;
        delete (seg as {beats?: unknown}).beats;
        if (s.chain) addChainCuts(s.chain);
        break;
      default:
        seg = {...base, ...(s as object), dur} as SegV4;
        delete (seg as {beats?: unknown}).beats;
    }
    const r = {seg, start, beat: k, cuts: [...new Set(cuts)].sort((a, b) => a - b)};
    k += beats === Infinity ? 0 : beats;
    return r;
  });
};

/** Every cut / transition start with its distance to the nearest beat (frames). */
export const cutReport = () => {
  const rows: {id: string; frame: number; beatFrame: number; delta: number}[] = [];
  for (const r of resolveV4())
    for (const f of r.cuts) {
      const nearest = BEAT_FRAMES.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
      rows.push({id: r.seg.id, frame: f, beatFrame: nearest, delta: f - nearest});
    }
  return rows;
};
