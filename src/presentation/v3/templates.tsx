// V3.1 editorial templates (brief V3 §3 + correction V3.1 + §10 fluidity).
// - every readable line ≥ 44 px, sized with fitText, never broken inside a word
// - masks / entrances / exits 15–18 f, Easing.bezier(0.65, 0, 0.35, 1)
// - nothing static: slow 2–3 % drift on cards, panels and collages; text/image parallax
// - footage from public/video/30fps (all sources conformed to 30 fps), speed 1.0
import React from 'react';
import {Video} from '@remotion/media';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {fitText} from '@remotion/layout-utils';
import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, CROP, Clip, EASE, FONTS, GRADE, SOURCES30, TimedClip, V3, WEIGHTS, alpha} from '../config';
import {DrawIcon, HandwrittenLive, LIVE_RATIO, formatNumber} from '../../shared/drawing';
import {BrandLogo, CornerBug} from '../../shared/primitives';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const IO = EASE.inOut; // bezier(0.65, 0, 0.35, 1)
const STEADY = Easing.bezier(0.33, 0.33, 0.66, 0.66); // constant-speed drift/zoom: never a frozen frame
const SANS = `'${FONTS.sans}'`;
export const M = {x: 140, top: 100, bottom: 130};
const COL = (1920 - 2 * M.x - 11 * 24) / 12;
export const cols = (n: number) => n * COL + (n - 1) * 24;
const MASK = 15; // standard mask / entrance length (frames)

// ------------------------------------------------------------------ text --
export type Line = {text: string; bold: boolean};
export const parseText = (t: string): Line[] => t.split('|').map((l) => ({text: l.replace(/^\*/, ''), bold: l.startsWith('*')}));

// letter-spacing passed explicitly + 3 % safety margin (fitText alone under-measured by a few px)
const fit = (text: string, width: number, weight: number, upper: boolean) =>
  fitText({text, withinWidth: width * 0.97, fontFamily: FONTS.sans, fontWeight: weight, letterSpacing: upper ? '0.02em' : '0.005em', textTransform: upper ? 'uppercase' : 'none'}).fontSize;

/**
 * Lay out one logical line inside `width`: largest size ≤ max that fits on one line;
 * if that would drop under `min`, split at the space closest to the middle (never inside a word,
 * so "Juan-les-Pins" stays whole) and fit both halves at the same size.
 */
export const layoutLine = (text: string, width: number, max: number, weight: number, upper: boolean, min = V3.minReadPx) => {
  const one = Math.min(max, fit(text, width, weight, upper));
  if (one >= min || !text.includes(' ')) return {size: Math.max(one, Math.min(min, max)), lines: [text]};
  const mid = text.length / 2;
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
  const cut = spaces.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  // a line break replaces a ' · ' separator: never leave a dangling middle dot
  const parts = [text.slice(0, cut).replace(/\s*·\s*$/, ''), text.slice(cut + 1).replace(/^\s*·\s*/, '')];
  const size = Math.min(max, ...parts.map((p) => fit(p, width, weight, upper)));
  return {size: Math.max(size, min), lines: parts};
};

/** Mask reveal (Y 110 % → 0), 15 f in-out. */
export const Reveal: React.FC<{delay: number; children: React.ReactNode; dur?: number; out?: number}> = ({delay, children, dur = MASK, out}) => {
  const f = useCurrentFrame();
  const yIn = interpolate(f, [delay, delay + dur], [110, 0], {...clamp, easing: IO});
  const yOut = out === undefined ? 0 : interpolate(f, [out, out + dur], [0, -110], {...clamp, easing: IO});
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em'}}>
      <div style={{translate: `0 ${yIn + yOut}%`}}>{children}</div>
    </div>
  );
};

/** Block of fitted lines (title = bold uppercase, others regular). */
export const TextBlock: React.FC<{
  lines: Line[];
  width: number;
  titleMax: number;
  lineMax: number;
  delay?: number;
  stagger?: number;
  color?: string;
  lineColor?: string;
  out?: number;
  upperTitle?: boolean;
  gap?: number;
  minSize?: number;
}> = ({lines, width, titleMax, lineMax, delay = 0, stagger = 5, color = COLORS.white, lineColor, out, upperTitle = true, gap = 0, minSize}) => {
  let k = 0;
  return (
    <div style={{width, fontFamily: SANS, color}}>
      {lines.map((l, i) => {
        const w = l.bold ? WEIGHTS.bold : WEIGHTS.regular;
        const lay = layoutLine(l.text, width, l.bold ? titleMax : lineMax, w, l.bold && upperTitle, minSize);
        return (
          <div key={i} style={{marginTop: i && gap ? gap : 0}}>
            {lay.lines.map((t, j) => (
              <Reveal key={j} delay={delay + k++ * stagger} out={out}>
                <div
                  style={{
                    fontWeight: w,
                    fontSize: lay.size,
                    lineHeight: 1.12,
                    letterSpacing: l.bold ? '0.02em' : '0.005em',
                    textTransform: l.bold && upperTitle ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap',
                    color: l.bold ? color : lineColor ?? color,
                  }}
                >
                  {t}
                </div>
              </Reveal>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/** Red signature bar, scaleX 0 → 1 in 15 f. */
const Bar: React.FC<{delay: number; w?: number; h?: number; style?: React.CSSProperties}> = ({delay, w = 72, h = 8, style}) => {
  const f = useCurrentFrame();
  return <div style={{width: w, height: h, background: COLORS.red, transformOrigin: 'left center', scale: `${interpolate(f, [delay, delay + MASK], [0, 1], {...clamp, easing: IO})} 1`, ...style}} />;
};

/** Slow drift (2–3 % over the segment) — nothing is ever static. */
const useDrift = (dur: number, px: [number, number] = [0, -28]) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], clamp);
  return `${px[0] * p}px ${px[1] * p}px`;
};

// ------------------------------------------------------------------ media --
export const ClipView: React.FC<{clip: Clip; push?: [number, number]; dur?: number; blur?: number}> = ({clip, push = [1, 1.03], dur = 60, blur = 0}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], push, clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{scale: String((clip.scale ?? CROP.scale) * z), transformOrigin: 'top center', filter: `${GRADE.filter}${blur ? ` blur(${Math.min(blur, 4)}px)` : ''}`}}>
        <Video src={staticFile(SOURCES30[clip.src])} muted objectFit="cover" trimBefore={Math.round(clip.in * 30)} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ClipChain: React.FC<{clips: TimedClip[]; blur?: number}> = ({clips, blur}) => {
  let t = 0;
  return (
    <AbsoluteFill>
      {clips.map((c, i) => {
        const from = t;
        t += c.dur;
        return (
          <Sequence key={i} from={from} durationInFrames={c.dur} layout="absolute-fill" premountFor={20}>
            <ClipView clip={c} dur={c.dur} blur={blur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{background: GRADE.warmVeil, mixBlendMode: 'soft-light'}} />
    <AbsoluteFill style={{background: GRADE.vignette}} />
  </>
);

export const PhotoView: React.FC<{src: string; dur: number; zoom?: [number, number]; position?: string}> = ({src, dur, zoom = [1.0, 1.06], position = 'center'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, scale: String(interpolate(f, [0, dur], zoom, {...clamp, easing: STEADY})), filter: GRADE.filter}}
      />
      <AbsoluteFill style={{background: GRADE.warmVeil, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: GRADE.vignette}} />
    </AbsoluteFill>
  );
};

const ScrimBL: React.FC<{strength?: number}> = ({strength = 1}) => (
  <AbsoluteFill style={{opacity: strength, background: `linear-gradient(20deg, ${alpha('navy', 0.85)} 0%, ${alpha('navy', 0.5)} 34%, ${alpha('navy', 0)} 64%)`}} />
);

/** Bottom-left text with parallax against the image. */
const LowerText: React.FC<{text: string; dur: number; delay?: number; width?: number; kicker?: string}> = ({text, dur, delay = 0, width = cols(7), kicker}) => {
  const drift = useDrift(dur, [10, 0]);
  return (
    <div style={{position: 'absolute', left: M.x, bottom: M.bottom, translate: drift}}>
      {kicker ? (
        <Reveal delay={delay}>
          <div style={{fontFamily: SANS, fontWeight: WEIGHTS.medium, fontSize: V3.type.kicker, letterSpacing: '0.25em', color: COLORS.white, marginBottom: 14}}>{kicker}</div>
        </Reveal>
      ) : null}
      <TextBlock lines={parseText(text)} width={width} titleMax={V3.type.placeTitle} lineMax={V3.type.line} delay={delay + (kicker ? 4 : 0)} />
      <Bar delay={delay + 14} style={{marginTop: 22}} />
    </div>
  );
};

// ------------------------------------------------------------- templates --
export const VideoSeg: React.FC<{clip: Clip; dur: number; text?: string; kind?: 'greeting' | 'line'; bug?: boolean}> = ({clip, dur, text, kind, bug}) => (
  <AbsoluteFill>
    <ClipView clip={clip} dur={dur} />
    <Grade />
    {text && kind === 'greeting' ? (
      // greeting cut with the shot (hard cut, no mask)
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: alpha('navy', 0.18)}}>
        <div style={{fontFamily: `${SANS}, '${FONTS.cyrillic}', '${FONTS.jp}'`, fontWeight: /[぀-鿿]/.test(text) ? WEIGHTS.medium : WEIGHTS.bold, fontSize: V3.type.greeting, color: COLORS.white, textShadow: `0 4px 30px ${alpha('navy', 0.45)}`}}>
          {text}
        </div>
      </AbsoluteFill>
    ) : null}
    {text && kind === 'line' ? (
      <>
        <ScrimBL />
        <LowerText text={text} dur={dur} />
      </>
    ) : null}
    {bug ? <CornerBug /> : null}
  </AbsoluteFill>
);

export const BonjourSeg: React.FC<{clip: Clip; dur: number; text: string}> = ({clip, dur, text}) => (
  <AbsoluteFill>
    <ClipView clip={clip} dur={dur} />
    <Grade />
    <AbsoluteFill style={{background: alpha('navy', 0.25)}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <Reveal delay={0}>
        <div style={{fontFamily: SANS, fontWeight: WEIGHTS.bold, fontSize: V3.type.bonjour, color: COLORS.white, textShadow: `0 4px 30px ${alpha('navy', 0.4)}`}}>{text}</div>
      </Reveal>
      <Bar delay={10} w={120} h={10} style={{marginTop: 18}} />
    </AbsoluteFill>
    <CornerBug />
  </AbsoluteFill>
);

/** T1 · Title on video — 120 px minimum */
export const T1: React.FC<{clip: Clip; dur: number; text: string; clips?: TimedClip[]}> = ({clip, dur, text, clips}) => {
  const drift = useDrift(dur, [12, 0]);
  const parts = text.split('|');
  const kicker = /^\d\d$/.test(parts[0]) ? parts[0] : undefined;
  const lines = parseText((kicker ? parts.slice(1) : parts).join('|'));
  return (
    <AbsoluteFill>
      {clips ? <ClipChain clips={clips} /> : <ClipView clip={clip} dur={dur} />}
      <Grade />
      <ScrimBL />
      <div style={{position: 'absolute', left: M.x, bottom: M.bottom, translate: drift}}>
        {kicker ? (
          // chapter opening: programme name (title size) + reading line; numbers are not shown
          <>
            {/^\d\d$/.test(kicker) ? null : <Reveal delay={0}>
              <div style={{fontFamily: SANS, fontWeight: WEIGHTS.medium, fontSize: V3.type.kicker, letterSpacing: '0.25em', color: COLORS.white, marginBottom: 16}}>{kicker}</div>
            </Reveal>}
            <TextBlock lines={lines} width={cols(12)} titleMax={V3.type.title} lineMax={V3.type.line} delay={0} gap={10} />
          </>
        ) : (
          <TextBlock lines={lines.map((l) => ({...l, bold: true}))} width={cols(12)} titleMax={V3.type.title} lineMax={V3.type.title} delay={0} />
        )}
        <Bar delay={22} w={96} h={10} style={{marginTop: 28}} />
      </div>
      <CornerBug />
    </AbsoluteFill>
  );
};

/** Full-frame footage/photo chain with a place label (dot-less lower third) — e.g. Le Château, accreditation. */
export const PlaceSeg: React.FC<{media: Media[]; dur: number; text: string}> = ({media, dur, text}) => {
  let t = 0;
  return (
    <AbsoluteFill>
      {media.map((m, i) => {
        const from = t;
        t += m.dur;
        return (
          <Sequence key={i} from={from} durationInFrames={i === media.length - 1 ? dur - from : m.dur} layout="absolute-fill" premountFor={20}>
            {m.kind === 'photo' ? <PhotoView src={m.src} dur={m.dur} /> : <ClipView clip={m} dur={m.dur} />}
            <Grade />
          </Sequence>
        );
      })}
      <ScrimBL />
      <LowerText text={text} dur={dur} />
      <CornerBug />
    </AbsoluteFill>
  );
};

/** Drone with 3 city labels pointing into the landscape (dot + thin rule + name 44 px) */
export const CitiesSeg: React.FC<{clip: Clip; dur: number; cities: string[]; points: {x: number; y: number; lx: number; ly: number; anchor: 'start' | 'end'}[]}> = ({clip, dur, cities, points}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const drift = interpolate(f, [0, dur], [0, -10], clamp); // follows the slow drone push
  return (
    <AbsoluteFill>
      <ClipView clip={clip} dur={dur} push={[1, 1.02]} />
      <Grade />
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${alpha('navy', 0.35)} 0%, ${alpha('navy', 0)} 45%)`}} />
      <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {points.map((p, i) => {
          const d = 4 + i * 10;
          const dot = interpolate(f, [d, d + MASK], [0, 1], {...clamp, easing: IO});
          const line = interpolate(f, [d + 4, d + 4 + MASK], [0, 1], {...clamp, easing: IO});
          const txt = interpolate(f, [d + 8, d + 8 + MASK], [0, 1], {...clamp, easing: IO});
          const y = p.y + drift;
          const ly = p.ly + drift;
          return (
            <g key={i}>
              <circle cx={p.x} cy={y} r={9 * dot} fill={COLORS.white} stroke={COLORS.navy} strokeWidth={2} />
              <circle cx={p.x} cy={y} r={9 + 22 * dot} fill="none" stroke={COLORS.white} strokeOpacity={0.5 * (1 - dot) + 0.25} strokeWidth={1.5} />
              <line x1={p.x} y1={y} x2={p.x + (p.lx - p.x) * line} y2={y + (ly - y) * line} stroke={COLORS.white} strokeWidth={2} />
              <text
                x={p.lx + (p.anchor === 'start' ? 14 : -14)}
                y={ly + 15}
                textAnchor={p.anchor}
                opacity={txt}
                fill={COLORS.white}
                style={{fontFamily: FONTS.sans, fontWeight: 600, fontSize: V3.minReadPx, letterSpacing: '0.12em', paintOrder: 'stroke', stroke: alpha('navy', 0.35), strokeWidth: 6}}
              >
                {cities[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <CornerBug />
    </AbsoluteFill>
  );
};

/** T2 · Split screen: video 7 cols | programme panel 5 cols. Panel slides in 18 f, drifts, slides out 18 f. */
export const T2: React.FC<{clips: TimedClip[]; dur: number; text: string; icons: string[]}> = ({clips, dur, text, icons}) => {
  const f = useCurrentFrame();
  const [, name, ...facts] = parseText(text);
  const split = M.x + cols(7) + 12;
  const pw = 1920 - split;
  const inP = interpolate(f, [0, 18], [0, 1], {...clamp, easing: IO});
  const outP = interpolate(f, [dur - 18 - 6, dur - 6], [0, 1], {...clamp, easing: IO});
  const panelLeft = split + 240 * (1 - inP) + 240 * outP;
  const panelOpacity = inP * (1 - outP);
  const drift = interpolate(f, [0, dur], [0, -24], clamp);
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: -pw / 2, top: 0, width: 1920, height: 1080}}>
          <ClipChain clips={clips} />
          <Grade />
        </div>
      </AbsoluteFill>
      <CameraMotionBlur samples={8} shutterAngle={180}>
        <AbsoluteFill>
          <div style={{position: 'absolute', left: panelLeft, top: 0, width: pw + 240, height: 1080, background: COLORS.navy, opacity: panelOpacity, boxShadow: `inset 8px 0 0 0 ${COLORS.red}`}}>
            <div style={{position: 'absolute', left: 72, right: 56, top: 200, translate: `0 ${drift}px`, color: COLORS.white, fontFamily: SANS}}>
              <Bar delay={0} w={64} h={6} style={{marginBottom: 26}} />
              <TextBlock lines={[name]} width={pw - 128} titleMax={V3.type.splitName} lineMax={V3.type.splitName} delay={4} />
              <div style={{marginTop: 54, display: 'flex', flexDirection: 'column', gap: 30}}>
                {facts.map((fact, i) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26}}>
                    <DrawIcon name={icons[i] ?? 'MapPin'} delay={22 + i * 8} size={64} color={COLORS.white} />
                    <TextBlock lines={[fact]} width={pw - 128 - 90} titleMax={V3.type.fact} lineMax={48} delay={24 + i * 8} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};

const PhotoCard: React.FC<{src: string; x: number; y: number; w: number; h: number; delay: number; dur: number; rotate?: number; drift: [number, number]}> = ({src, x, y, w, h, delay, dur, rotate = 0, drift}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + 18], [0, 1], {...clamp, easing: IO});
  void drift; // V4.2: cards are perfectly still once landed (no drift → no shimmer)
  return (
    <div
      style={{
        position: 'absolute',
        left: Math.round(x),
        top: Math.round(y + (1 - p) * 60),
        width: w,
        height: h,
        borderRadius: 8,
        border: `6px solid ${COLORS.white}`,
        boxShadow: `0 30px 60px -25px ${alpha('navy', 0.55)}`,
        overflow: 'hidden',
        opacity: p,
        rotate: `${rotate}deg`,
        background: COLORS.white,
      }}
    >
      <PhotoView src={src} dur={dur} zoom={[1, 1]} />
    </div>
  );
};

/** T3 · Photo collage on SHARP darkened footage (veil 45 %, blur ≤ 4 px). Text column 5 cols. */
export const T3: React.FC<{photos: string[]; bg: TimedClip[]; dur: number; text?: string}> = ({photos, bg, dur, text}) => {
  const withText = !!text;
  const L = withText
    ? [
        {x: 860, y: 120, w: 880, h: 590, r: 0, d: [-30, -16] as [number, number]},
        {x: 1400, y: 600, w: 420, h: 320, r: 2, d: [-14, -24] as [number, number]},
        {x: 740, y: 640, w: 380, h: 300, r: -2, d: [-22, -10] as [number, number]},
      ]
    : [
        {x: 220, y: 170, w: 520, h: 700, r: -2, d: [-20, -12] as [number, number]},
        {x: 700, y: 120, w: 760, h: 520, r: 1, d: [-30, -10] as [number, number]},
        {x: 1240, y: 470, w: 460, h: 520, r: 2, d: [-14, -20] as [number, number]},
      ];
  const drift = useDrift(dur, [14, 0]);
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <ClipChain clips={bg} blur={3} />
      <AbsoluteFill style={{background: alpha('navy', 0.45)}} />
      {photos.map((p, i) => (
        <PhotoCard key={i} src={p} x={L[i].x} y={L[i].y} w={L[i].w} h={L[i].h} rotate={L[i].r} delay={i * 6} dur={dur} drift={L[i].d} />
      ))}
      {withText ? (
        <div style={{position: 'absolute', left: M.x, top: 150, translate: drift}}>
          <TextBlock lines={parseText(text!)} width={cols(5)} titleMax={V3.type.placeTitle} lineMax={V3.type.line} delay={0} gap={14} />
          <Bar delay={12} style={{marginTop: 22}} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** T4 · Programme card: 6 columns, full useful height, against the left edge; SHARP footage behind, veil 40 %. */
export const T4: React.FC<{bg: TimedClip[]; dur: number; text: string}> = ({bg, dur, text}) => {
  const f = useCurrentFrame();
  const [, name, ...facts] = parseText(text);
  const open = interpolate(f, [0, 18], [0, 1], {...clamp, easing: IO});
  const close = interpolate(f, [dur - 18 - 6, dur - 6], [0, 1], {...clamp, easing: IO});
  const w = M.x + cols(6);
  const drift = interpolate(f, [0, dur], [0, 26], clamp);
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <ClipChain clips={bg} />
      <Grade />
      <AbsoluteFill style={{background: alpha('navy', 0.4 * (1 - close))}} />
      <CameraMotionBlur samples={8} shutterAngle={180}>
        <AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              left: -60, // extra bleed on the left: the slow drift never detaches the card from the edge
              top: M.top,
              width: w + 60,
              height: 1080 - M.top - M.bottom,
              background: COLORS.white,
              borderRadius: '0 8px 8px 0',
              boxShadow: `0 40px 80px -30px ${alpha('navy', 0.6)}`,
              opacity: open * (1 - close),
              translate: `${drift - 70 * (1 - open) - 70 * close}px 0`,
            }}
          >
            <div style={{position: 'absolute', left: M.x + 60, right: 64, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: SANS, color: COLORS.navy}}>
              <div>
                <ProgrammeName text={name.text} width={w - M.x - 64} delay={4} />
              </div>
              <Bar delay={22} style={{marginTop: 30, marginBottom: 44}} />
              <TextBlock lines={facts} width={w - M.x - 64} titleMax={V3.type.fact} lineMax={48} minSize={46} delay={24} stagger={6} color={COLORS.navy} lineColor={alpha('navy', 0.85)} gap={14} />
            </div>
          </div>
        </AbsoluteFill>
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};

/** Programme name at 110 px; wraps at a space (one word per line if needed) rather than shrinking. */
const ProgrammeName: React.FC<{text: string; width: number; delay: number}> = ({text, width, delay}) => {
  const words = text.split(' ');
  const lines: string[] = [];
  for (const wd of words) {
    const cur = lines.length ? `${lines[lines.length - 1]} ${wd}` : wd;
    if (lines.length && fit(cur, width, WEIGHTS.bold, true) >= V3.type.programmeName) lines[lines.length - 1] = cur;
    else lines.push(wd);
  }
  const size = Math.min(V3.type.programmeName, ...lines.map((l) => fit(l, width, WEIGHTS.bold, true)));
  return (
    <div style={{fontFamily: SANS, fontWeight: WEIGHTS.bold, fontSize: size, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.0}}>
      {lines.map((l, i) => (
        <Reveal key={i} delay={delay + i * 5}>
          <div style={{whiteSpace: 'nowrap'}}>{l}</div>
        </Reveal>
      ))}
    </div>
  );
};

/** T5 · Number. `onNavy`: knock-out mask over footage on navy (1985). Otherwise: white numbers over
 *  full-frame footage darkened 50 %. Exit: the mask opens to full frame in 18 f (scale ≤ 1.45). */
export const T5: React.FC<{clip: Clip; clips?: TimedClip[]; dur: number; text: string; value: number; from: number; suffix: string; grouping: boolean; onNavy: boolean; labelAbove: boolean; sep: string}> = ({
  clip,
  clips,
  dur,
  text,
  value,
  from,
  suffix,
  grouping,
  onNavy,
  labelAbove,
  sep,
}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const [, label] = parseText(text);
  const p = interpolate(f, [0, 36], [0, 1], {...clamp, easing: EASE.out});
  const shown = formatNumber(Math.round(from + (value - from) * p), grouping, sep) + suffix;
  const chars = (formatNumber(value, grouping, sep) + suffix).length;
  const size = Math.min(V3.type.number, 1640 / (chars * 0.62));
  const baseline = 560 + size * 0.36;
  const enter = interpolate(f, [0, 15], [0, 1], {...clamp, easing: IO});
  const labelEl = (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: labelAbove ? baseline - size * 0.98 - 84 : baseline + size * 0.22 + 40,
        textAlign: 'center',
        fontFamily: SANS,
        fontWeight: WEIGHTS.regular,
        fontSize: V3.type.numberLabel,
        color: COLORS.white,
        opacity: interpolate(f, [6, 21], [0, 1], {...clamp, easing: IO}) * interpolate(f, [dur - 18, dur - 6], [1, 0], {...clamp, easing: IO}),
      }}
    >
      {label.text}
    </div>
  );
  if (!onNavy) {
    const drift = interpolate(f, [0, dur], [0, -14], clamp);
    return (
      <AbsoluteFill>
        {clips ? <ClipChain clips={clips} /> : <ClipView clip={clip} dur={dur} push={[1, 1.04]} />}
        <Grade />
        <AbsoluteFill style={{background: alpha('navy', 0.5)}} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: baseline - size * 0.86,
            textAlign: 'center',
            fontFamily: SANS,
            fontWeight: WEIGHTS.bold,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: COLORS.white,
            opacity: enter,
            translate: `0 ${drift + (1 - enter) * 30}px`,
          }}
        >
          {shown}
        </div>
        {labelEl}
        <CornerBug />
      </AbsoluteFill>
    );
  }
  const open = interpolate(f, [dur - 18 - 6, dur - 6], [0, 1], {...clamp, easing: IO});
  const id = `t5-${Math.round(clip.in * 100)}`;
  const cy = baseline - size * 0.36;
  const sc = 1 + 0.3 * open;
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      {/* full-frame footage fades in under the opening mask: the two images overlap, no hard swap */}
      <AbsoluteFill style={{opacity: open}}>
        <ClipView clip={clip} dur={dur} push={[1.0, 1.04]} />
      </AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: 1 - open * 0.999}}>
        <defs>
          <clipPath id={id} clipPathUnits="userSpaceOnUse">
            <text
              x={960}
              y={baseline}
              textAnchor="middle"
              transform={`translate(960 ${cy}) scale(${sc}) translate(-960 ${-cy})`}
              style={{fontFamily: FONTS.sans, fontWeight: 700, fontSize: size, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em'}}
            >
              {shown}
            </text>
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <foreignObject x={0} y={0} width={width} height={height}>
            <div style={{position: 'relative', width, height}}>
              <ClipView clip={clip} dur={dur} push={[1.0, 1.04]} />
            </div>
          </foreignObject>
        </g>
      </svg>
      {labelEl}
    </AbsoluteFill>
  );
};

/** T6 · Picture in picture: a framed window grows (30 f) to full frame over a FIXED full-frame photo
 *  (the image is never rescaled during the growth → no large frame-to-frame change), then becomes the footage. */
export const T6: React.FC<{photo: string; photoDur: number; clip: Clip; dur: number; text: string; kicker?: string; videoFrom?: number}> = ({photo, photoDur, clip, dur, text, kicker, videoFrom}) => {
  const vf = videoFrom ?? photoDur - 10;
  const f = useCurrentFrame();
  const g = interpolate(f, [photoDur - 30, photoDur], [0, 1], {...clamp, easing: IO});
  const d = interpolate(f, [0, photoDur], [0, 1], clamp);
  const win = {x: 700 * (1 - g) - 20 * d * (1 - g), y: 170 * (1 - g), w: 900 + 1020 * g, h: 600 + 480 * g};
  const videoIn = interpolate(f, [vf, vf + 12], [0, 1], {...clamp, easing: IO});
  const inset = `inset(${win.y}px ${1920 - win.x - win.w}px ${1080 - win.y - win.h}px ${win.x}px round ${8 * (1 - g)}px)`;
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <AbsoluteFill style={{filter: 'blur(4px)', opacity: 0.55}}>
        <PhotoView src={photo} dur={photoDur} zoom={[1.06, 1.06]} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: alpha('navy', 0.5)}} />
      {/* shadow + white frame drawn around the window */}
      <div
        style={{
          position: 'absolute',
          left: win.x - 6 * (1 - g),
          top: win.y - 6 * (1 - g),
          width: win.w + 12 * (1 - g),
          height: win.h + 12 * (1 - g),
          borderRadius: 8 * (1 - g) + 4,
          background: COLORS.white,
          opacity: 1 - g,
          boxShadow: `0 30px 60px -25px ${alpha('navy', 0.55)}`,
        }}
      />
      <AbsoluteFill style={{clipPath: inset}}>
        {/* still while the window grows (no shimmer), then a slow steady push once it fills the frame (no frozen frames) */}
        <AbsoluteFill style={{scale: String(interpolate(f, [photoDur, vf + 12], [1, 1.035], {...clamp, easing: STEADY})), transformOrigin: 'center'}}>
          <PhotoView src={photo} dur={vf} zoom={[1, 1]} />
        </AbsoluteFill>
        <Sequence from={vf} layout="absolute-fill">
          <AbsoluteFill style={{opacity: videoIn}}>
            <ClipView clip={clip} dur={dur - vf} />
            <Grade />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
      <ScrimBL strength={0.9} />
      <LowerText text={text} dur={dur} delay={0} kicker={kicker} />
    </AbsoluteFill>
  );
};

/** T8 · Triptych: 3 footage panels (6 px white rules), one per beat, rising in 15 f; navy text band. */
export const T8: React.FC<{panels: TimedClip[][]; dur: number; text: string; kicker?: string; panelStarts?: number[]}> = ({panels, dur, text, kicker, panelStarts}) => {
  const band = 300;
  const drift = useDrift(dur, [12, 0]);
  return (
    <AbsoluteFill style={{background: COLORS.white}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: band, bottom: 0, display: 'flex', gap: 6}}>
        {panels.map((chain, i) => (
          <div key={i} style={{flex: 1, position: 'relative', overflow: 'hidden', background: COLORS.navy}}>
            <Sequence from={panelStarts ? panelStarts[i] : i * V3.beat} layout="absolute-fill">
              <PanelIn>
                <ClipChain clips={chain} />
              </PanelIn>
            </Sequence>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: band, background: COLORS.navy}}>
        <div style={{position: 'absolute', left: M.x, top: 56, translate: drift}}>
          {kicker ? (
            <Reveal delay={0}>
              <div style={{fontFamily: SANS, fontWeight: WEIGHTS.medium, fontSize: V3.type.kicker, letterSpacing: '0.25em', color: COLORS.white, marginBottom: 12}}>{kicker}</div>
            </Reveal>
          ) : null}
          <TextBlock lines={parseText(text).map((l, i) => ({...l, bold: i === 0}))} width={cols(9)} titleMax={64} lineMax={64} delay={0} upperTitle={false} />
        </div>
        <div style={{position: 'absolute', right: M.x, top: 70}}>
          <Bar delay={16} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PanelIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 15], [0, 1], {...clamp, easing: IO});
  return <AbsoluteFill style={{translate: `0 ${(1 - p) * 8}%`, opacity: p}}>{children}</AbsoluteFill>;
};

/** Full-frame media chain (photos and/or footage) with a two-line reading text */
export type Media = {kind: 'photo'; src: string; dur: number} | ({kind: 'video'} & TimedClip);
export const LineSeg: React.FC<{media: Media[]; dur: number; text: string; bug?: boolean}> = ({media, dur, text, bug}) => {
  let t = 0;
  const lines = parseText(text);
  const drift = useDrift(dur, [12, 0]);
  return (
    <AbsoluteFill>
      {media.map((m, i) => {
        const from = t;
        t += m.dur;
        return (
          <Sequence key={i} from={from} durationInFrames={m.dur} layout="absolute-fill" premountFor={20}>
            {m.kind === 'photo' ? <PhotoView src={m.src} dur={m.dur} /> : <ClipView clip={m} dur={m.dur} />}
            <Grade />
          </Sequence>
        );
      })}
      <ScrimBL />
      <div style={{position: 'absolute', left: M.x, bottom: M.bottom, translate: drift}}>
        <TextBlock lines={lines.map((l, i) => ({...l, bold: i === lines.length - 1}))} width={cols(8)} titleMax={64} lineMax={64} delay={0} stagger={8} upperTitle={false} />
        <Bar delay={22} style={{marginTop: 22}} />
      </div>
      {bug ? <CornerBug /> : null}
    </AbsoluteFill>
  );
};

/** Sunset (speed 1.0) + "Don't learn French." / "Live it." traced in white */
export const SunsetSeg: React.FC<{clip: Clip; dur: number; dont: string}> = ({clip, dur, dont}) => {
  const f = useCurrentFrame();
  const h = 250; // svg box incl. 12 % padding each side → traced glyphs ≈ 200 px tall (≥ 120 px)
  return (
    <AbsoluteFill>
      <ClipView clip={clip} dur={dur} push={[1, 1.03]} />
      <Grade />
      <AbsoluteFill style={{background: `linear-gradient(0deg, ${alpha('navy', 0.55)} 0%, ${alpha('navy', 0)} 55%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 150}}>
        <div style={{fontFamily: SANS, fontWeight: WEIGHTS.regular, fontSize: 104, color: COLORS.white, opacity: interpolate(f, [0, 12], [0, 1], {...clamp, easing: IO}), textShadow: `0 4px 30px ${alpha('navy', 0.4)}`}}>{dont}</div>
        <div style={{width: h * LIVE_RATIO, height: h, marginTop: 14}}>
          <HandwrittenLive delay={0} duration={30} height={h} color={COLORS.white} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** End card: navy veil 85 % rising (18 f) over the frozen sunset; white logo, programmes, URL, CTA. */
export const EndCard: React.FC<{image: string; programmes: string; url: string; cta: string}> = ({image, programmes, url, cta}) => {
  const f = useCurrentFrame();
  const veil = interpolate(f, [0, 18], [0, 1], {...clamp, easing: IO});
  const fade = (a: number) => interpolate(f, [a, a + 15], [0, 1], {...clamp, easing: IO});
  const icons = ['GraduationCap', 'Sun', 'ChefHat', 'Landmark'];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(CROP.scale), transformOrigin: 'top center', filter: GRADE.filter}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: alpha('navy', 0.85), clipPath: `inset(${(1 - veil) * 100}% 0 0 0)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: SANS, color: COLORS.white}}>
        <div style={{opacity: fade(8)}}>
          <BrandLogo variant="primaryWhite" height={230} />
        </div>
        <div style={{display: 'flex', gap: 54, marginTop: 56}}>
          {icons.map((n, i) => (
            <DrawIcon key={n} name={n} delay={14 + i * 4} size={80} color={COLORS.white} />
          ))}
        </div>
        <div style={{marginTop: 26, fontSize: 44, fontWeight: WEIGHTS.regular, opacity: fade(18)}}>{programmes}</div>
        <div style={{marginTop: 18, fontSize: 44, fontWeight: WEIGHTS.medium, letterSpacing: '0.03em', opacity: fade(22)}}>{url}</div>
        <div style={{marginTop: 40, background: COLORS.white, color: COLORS.navy, borderRadius: 5, padding: '22px 60px', fontSize: 44, fontWeight: WEIGHTS.bold, letterSpacing: '0.08em', opacity: fade(26)}}>{cta}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Finale word: a held shot with ONE giant word (Bold, centred, vertical mask in 12 f), red bar on the last one. */
export const WordSeg: React.FC<{clip: Clip; dur: number; word: string; bar?: boolean}> = ({clip, dur, word, bar}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 16, dur - 4], [0, 1], {...clamp, easing: IO});
  return (
    <AbsoluteFill>
      <ClipView clip={clip} dur={dur} push={[1, 1.04]} />
      <Grade />
      <AbsoluteFill style={{background: alpha('navy', 0.35)}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - out}}>
        <Reveal delay={0} dur={12}>
          <div style={{fontFamily: SANS, fontWeight: WEIGHTS.bold, fontSize: 184, lineHeight: 1.05, color: COLORS.white, textShadow: `0 6px 40px ${alpha('navy', 0.45)}`, whiteSpace: 'nowrap'}}>{word}</div>
        </Reveal>
        {bar ? <Bar delay={10} w={140} h={12} style={{marginTop: 26}} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
