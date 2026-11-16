// V3 editorial templates (brief V3 §3). Animatic level: clean, simple motion,
// entrances/exits on the metronome grid. All values from config.ts.
import React from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, CROP, Clip, EASE, FONTS, GRADE, SOURCES, TimedClip, V3, WEIGHTS, alpha} from '../config';
import {DrawIcon, HandwrittenLive, LIVE_RATIO, formatNumber} from '../../shared/drawing';
import {BrandLogo, CornerBug, RedBar} from '../../shared/primitives';
import {RivieraSvg} from '../map/RivieraSvg';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SANS = `'${FONTS.sans}', '${FONTS.cyrillic}', '${FONTS.jp}'`;
const M = {x: 140, top: 100, bottom: 130};
/** 12-column grid on 1920 px: margins 140, gutter 24 */
const COL = (1920 - 2 * M.x - 11 * 24) / 12;
const cols = (n: number) => n * COL + (n - 1) * 24;

// ------------------------------------------------------------------ text --
export type Line = {text: string; bold: boolean};
export const parseText = (t: string): Line[] => t.split('|').map((l) => ({text: l.replace(/^\*/, ''), bold: l.startsWith('*')}));

/** Line revealed through a mask (Y 100 % → 0), on the beat. */
const Reveal: React.FC<{delay: number; children: React.ReactNode; dur?: number}> = ({delay, children, dur = 12}) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [delay, delay + dur], [110, 0], {...clamp, easing: EASE.out});
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.08em', marginBottom: '-0.08em'}}>
      <div style={{translate: `0 ${y}%`}}>{children}</div>
    </div>
  );
};

const fitSize = (text: string, max: number, width: number, k = 0.64) => Math.max(V3.minReadPx, Math.min(max, width / (text.length * k)));

// ------------------------------------------------------------------ media --
/** Source footage: crop ≥ 1.18 anchored top (burnt-in logos out of frame) + common grade. */
export const ClipView: React.FC<{clip: Clip; blur?: number; push?: [number, number]; dur?: number}> = ({clip, blur = 0, push, dur = 60}) => {
  const f = useCurrentFrame();
  const z = push ? interpolate(f, [0, dur], push, clamp) : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{scale: String((clip.scale ?? CROP.scale) * z), transformOrigin: 'top center', filter: `${GRADE.filter}${blur ? ` blur(${blur}px)` : ''}`}}>
        <Video src={staticFile(SOURCES[clip.src])} muted objectFit="cover" trimBefore={Math.round(clip.in * 30)} playbackRate={clip.rate ?? 1} style={{width: '100%', height: '100%'}} />
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
          <Sequence key={i} from={from} durationInFrames={c.dur} layout="absolute-fill">
            <ClipView clip={c} blur={blur} push={[1, 1.03]} dur={c.dur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const GradeOverlay: React.FC = () => (
  <>
    <AbsoluteFill style={{background: GRADE.warmVeil, mixBlendMode: 'soft-light'}} />
    <AbsoluteFill style={{background: GRADE.vignette}} />
  </>
);

/** Photo graded like the footage (warm veil, +contrast/+saturation), slow zoom ≤ 1.12. */
export const PhotoView: React.FC<{src: string; dur: number; zoom?: [number, number]; position?: string}> = ({src, dur, zoom = [1.0, 1.08], position = 'center'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, scale: String(interpolate(f, [0, dur], zoom, {...clamp, easing: EASE.zoom})), filter: GRADE.filter}}
      />
      <AbsoluteFill style={{background: GRADE.warmVeil, mixBlendMode: 'soft-light'}} />
    </AbsoluteFill>
  );
};

const ScrimBL: React.FC<{strength?: number}> = ({strength = 1}) => (
  <AbsoluteFill
    style={{
      opacity: strength,
      background: `linear-gradient(20deg, ${alpha('navy', 0.85)} 0%, ${alpha('navy', 0.5)} 32%, ${alpha('navy', 0)} 62%)`,
    }}
  />
);

/** Place / line label, bottom-left: bold uppercase title + red bar + reading line(s). */
const LowerText: React.FC<{lines: Line[]; delay?: number; titleSize?: number; lineSize?: number; maxWidth?: number}> = ({
  lines,
  delay = 2,
  titleSize = V3.type.placeTitle,
  lineSize = V3.type.line,
  maxWidth = cols(8),
}) => {
  const hasTitle = lines[0]?.bold;
  return (
    <div style={{position: 'absolute', left: M.x, bottom: M.bottom, maxWidth, color: COLORS.white, fontFamily: SANS}}>
      {lines.map((l, i) => (
        <Reveal key={i} delay={delay + i * 5}>
          <div
            style={{
              fontWeight: l.bold ? WEIGHTS.bold : WEIGHTS.regular,
              fontSize: l.bold ? fitSize(l.text, titleSize, maxWidth) : lineSize,
              letterSpacing: l.bold ? '0.02em' : '0.005em',
              textTransform: l.bold ? 'uppercase' : 'none',
              lineHeight: 1.12,
              textShadow: `0 2px 18px ${alpha('navy', 0.35)}`,
            }}
          >
            {l.text}
          </div>
        </Reveal>
      ))}
      {hasTitle || lines.length ? <RedBar delay={delay + lines.length * 5 + 4} width={72} height={8} style={{marginTop: 22}} /> : null}
    </div>
  );
};

// ------------------------------------------------------------- templates --
/** Full-frame video (+ greeting centred, or lower text). */
export const VideoSeg: React.FC<{clip: Clip; dur: number; text?: string; kind?: 'greeting' | 'line'; bug?: boolean}> = ({clip, dur, text, kind, bug}) => (
  <AbsoluteFill>
    <ClipView clip={clip} push={[1, 1.03]} dur={dur} />
    <GradeOverlay />
    {text && kind === 'greeting' ? (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: alpha('navy', 0.18)}}>
        <Reveal delay={0} dur={6}>
          <div style={{fontFamily: SANS, fontWeight: /[぀-鿿]/.test(text) ? WEIGHTS.medium : WEIGHTS.bold, fontSize: V3.type.greeting, color: COLORS.white, textShadow: `0 4px 30px ${alpha('navy', 0.45)}`}}>{text}</div>
        </Reveal>
      </AbsoluteFill>
    ) : null}
    {text && kind === 'line' ? (
      <>
        <ScrimBL />
        <LowerText lines={parseText(text)} />
      </>
    ) : null}
    {bug ? <CornerBug /> : null}
  </AbsoluteFill>
);

export const BonjourSeg: React.FC<{clip: Clip; dur: number; text: string}> = ({clip, dur, text}) => (
  <AbsoluteFill>
    <ClipView clip={clip} dur={dur} />
    <GradeOverlay />
    <AbsoluteFill style={{background: alpha('navy', 0.25)}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <Reveal delay={0} dur={9}>
        <div style={{fontFamily: SANS, fontWeight: WEIGHTS.bold, fontSize: V3.type.bonjour, color: COLORS.white, textShadow: `0 4px 30px ${alpha('navy', 0.4)}`}}>{text}</div>
      </Reveal>
      <RedBar delay={8} width={120} height={10} style={{marginTop: 18}} />
    </AbsoluteFill>
    <CornerBug />
  </AbsoluteFill>
);

/** T1 · Title on video */
export const T1: React.FC<{clip: Clip; dur: number; text: string}> = ({clip, dur, text}) => {
  const lines = parseText(text);
  return (
    <AbsoluteFill>
      <ClipView clip={clip} dur={dur} />
      <GradeOverlay />
      <ScrimBL />
      <div style={{position: 'absolute', left: M.x, bottom: M.bottom, color: COLORS.white, fontFamily: SANS}}>
        {lines.map((l, i) => (
          <Reveal key={i} delay={2 + i * 5} dur={14}>
            <div style={{fontWeight: l.bold ? WEIGHTS.bold : WEIGHTS.regular, fontSize: fitSize(l.text, V3.type.title, cols(11)), letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase'}}>{l.text}</div>
          </Reveal>
        ))}
        <RedBar delay={20} width={96} height={10} style={{marginTop: 28}} />
      </div>
      <CornerBug />
    </AbsoluteFill>
  );
};

/** T2 · Split screen: video on 7 columns, programme panel on 5 columns */
export const T2: React.FC<{clips: TimedClip[]; dur: number; text: string; icons: string[]}> = ({clips, dur, text, icons}) => {
  const f = useCurrentFrame();
  const [num, name, ...facts] = parseText(text);
  const split = M.x + cols(7) + 12; // video | panel boundary (≈ 7/12)
  const inP = interpolate(f, [0, 12], [0, 1], {...clamp, easing: EASE.out});
  const outP = interpolate(f, [dur - 10, dur], [0, 1], {...clamp, easing: EASE.inOut});
  const panelLeft = 1920 - (1920 - split) * inP + (1920 - split) * outP;
  const pw = 1920 - split;
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <AbsoluteFill style={{clipPath: `inset(0 ${1920 - panelLeft}px 0 0)`}}>
        <div style={{position: 'absolute', left: -(1920 - panelLeft) / 2, top: 0, width: 1920, height: 1080}}>
          <ClipChain clips={clips} />
          <GradeOverlay />
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: panelLeft, top: 0, width: pw, height: 1080, background: COLORS.navy, boxShadow: `inset 8px 0 0 0 ${COLORS.red}`}}>
        <div style={{position: 'absolute', left: 72, right: 64, top: 220, color: COLORS.white, fontFamily: SANS}}>
          <Reveal delay={8}>
            <div style={{fontWeight: WEIGHTS.medium, fontSize: V3.type.kicker, letterSpacing: '0.25em'}}>{num.text}</div>
          </Reveal>
          <RedBar delay={12} width={64} height={6} style={{marginTop: 14, marginBottom: 26}} />
          <Reveal delay={12}>
            <div style={{fontWeight: WEIGHTS.bold, fontSize: fitSize(name.text, V3.type.splitName, pw - 136, 0.68), letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.05}}>{name.text}</div>
          </Reveal>
          <div style={{marginTop: 56, display: 'flex', flexDirection: 'column', gap: 30}}>
            {facts.map((fact, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26}}>
                <DrawIcon name={icons[i] ?? 'MapPin'} delay={20 + i * 8} size={64} color={COLORS.white} />
                <Reveal delay={22 + i * 8}>
                  <div style={{fontWeight: WEIGHTS.regular, fontSize: V3.type.fact, lineHeight: 1.15}}>{fact.text}</div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Photo card (8 px corners, 6 px white border, soft navy shadow) */
const PhotoCard: React.FC<{src: string; x: number; y: number; w: number; h: number; delay: number; dur: number; rotate?: number; position?: string}> = ({src, x, y, w, h, delay, dur, rotate = 0, position}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + 14], [0, 1], {...clamp, easing: EASE.out});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 8,
        border: `6px solid ${COLORS.white}`,
        boxShadow: `0 30px 60px -25px ${alpha('navy', 0.55)}`,
        overflow: 'hidden',
        opacity: p,
        translate: `0 ${(1 - p) * 60}px`,
        rotate: `${rotate}deg`,
        background: COLORS.white,
      }}
    >
      <PhotoView src={src} dur={dur} zoom={[1.0, 1.08]} position={position} />
    </div>
  );
};

/** T3 · Photo collage over blurred, darkened footage of the same place */
export const T3: React.FC<{photos: string[]; bg: TimedClip[]; dur: number; text?: string}> = ({photos, bg, dur, text}) => {
  const lines = text ? parseText(text) : [];
  const withText = lines.length > 0;
  const L = withText
    ? [
        {x: 760, y: 120, w: 900, h: 600, r: 0},
        {x: 1360, y: 610, w: 440, h: 330, r: 2},
        {x: 600, y: 650, w: 380, h: 300, r: -2},
      ]
    : [
        {x: 220, y: 170, w: 520, h: 700, r: -2},
        {x: 700, y: 120, w: 760, h: 520, r: 1},
        {x: 1240, y: 470, w: 460, h: 520, r: 2},
      ];
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <ClipChain clips={bg} blur={14} />
      <AbsoluteFill style={{background: alpha('navy', 0.55)}} />
      {photos.map((p, i) => (
        <PhotoCard key={i} src={p} x={L[i].x} y={L[i].y} w={L[i].w} h={L[i].h} rotate={L[i].r} delay={i * 6} dur={dur} />
      ))}
      {withText ? (
        <div style={{position: 'absolute', left: M.x, top: 150, width: 520, color: COLORS.white, fontFamily: SANS}}>
          <Reveal delay={4}>
            <div style={{fontWeight: WEIGHTS.bold, fontSize: fitSize(lines[0].text, V3.type.placeTitle, 520), letterSpacing: '0.02em', textTransform: 'uppercase'}}>{lines[0].text}</div>
          </Reveal>
          <RedBar delay={12} width={64} height={8} style={{marginTop: 16, marginBottom: 22}} />
          {lines.slice(1).map((l, i) => (
            <Reveal key={i} delay={10 + i * 5}>
              <div style={{fontWeight: WEIGHTS.regular, fontSize: V3.type.line, lineHeight: 1.18}}>{l.text}</div>
            </Reveal>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** T4 · Programme card over blurred programme footage; the card opens as a wipe, footage un-blurs at exit */
export const T4: React.FC<{bg: TimedClip[]; dur: number; text: string}> = ({bg, dur, text}) => {
  const f = useCurrentFrame();
  const [num, name, ...facts] = parseText(text);
  const open = interpolate(f, [0, 14], [0, 1], {...clamp, easing: EASE.out});
  const close = interpolate(f, [dur - 15, dur - 3], [0, 1], {...clamp, easing: EASE.inOut});
  const blur = 12 * (1 - close);
  const w = cols(7);
  const x = (1920 - w) / 2;
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <ClipChain clips={bg} blur={blur} />
      <AbsoluteFill style={{background: alpha('navy', 0.55 * (1 - close))}} />
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 250,
          width: w,
          height: 580,
          background: COLORS.white,
          borderRadius: 8,
          boxShadow: `0 40px 80px -30px ${alpha('navy', 0.6)}`,
          clipPath: `inset(0 ${100 - open * 100 + close * 100}% 0 0 round 8px)`,
        }}
      >
        <div style={{position: 'absolute', left: 72, right: 72, top: 84, fontFamily: SANS, color: COLORS.navy}}>
          <Reveal delay={8}>
            <div style={{fontWeight: WEIGHTS.medium, fontSize: V3.type.kicker, letterSpacing: '0.25em'}}>{num.text}</div>
          </Reveal>
          <Reveal delay={12}>
            <div style={{marginTop: 18, fontWeight: WEIGHTS.bold, fontSize: fitSize(name.text, V3.type.programmeName, w - 144, 0.68), letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.04}}>{name.text}</div>
          </Reveal>
          <RedBar delay={18} width={72} height={8} style={{marginTop: 26, marginBottom: 40}} />
          {facts.map((l, i) => (
            <Reveal key={i} delay={20 + i * 6}>
              <div style={{fontWeight: WEIGHTS.regular, fontSize: V3.type.fact, lineHeight: 1.5, color: alpha('navy', 0.85)}}>{l.text}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** T5 · Giant number used as a mask over footage, on navy; the mask opens to full frame at exit */
export const T5: React.FC<{clip: Clip; dur: number; text: string; value: number; from: number; suffix: string; grouping: boolean; labelAbove: boolean; sep: string}> = ({
  clip,
  dur,
  text,
  value,
  from,
  suffix,
  grouping,
  labelAbove,
  sep,
}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const [, label] = parseText(text);
  const p = interpolate(f, [0, 30], [0, 1], {...clamp, easing: EASE.out});
  const shown = formatNumber(Math.round(from + (value - from) * p), grouping, sep) + suffix;
  const chars = (formatNumber(value, grouping, sep) + suffix).length;
  const size = Math.min(V3.type.number, 1640 / (chars * 0.62));
  const open = interpolate(f, [dur - 12, dur], [1, 9], {...clamp, easing: EASE.inOut});
  const id = `t5-${Math.round(clip.in * 100)}`;
  const baseline = 560 + size * 0.36;
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={id} clipPathUnits="userSpaceOnUse">
            <text
              x={960}
              y={baseline}
              textAnchor="middle"
              transform={`translate(960 ${baseline - size * 0.36}) scale(${open}) translate(-960 ${-(baseline - size * 0.36)})`}
              style={{fontFamily: `'${FONTS.sans}'`, fontWeight: 700, fontSize: size, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em'}}
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
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: labelAbove ? baseline - size * 0.98 - 70 : baseline + 56,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: WEIGHTS.regular,
          fontSize: V3.type.numberLabel,
          color: COLORS.white,
          opacity: interpolate(f, [6, 16], [0, 1], clamp) * interpolate(f, [dur - 12, dur - 6], [1, 0], clamp),
        }}
      >
        {label.text}
      </div>
    </AbsoluteFill>
  );
};

/** T6 · Picture in picture: a photo card grows to full frame and becomes the footage */
export const T6: React.FC<{photo: string; photoDur: number; clip: Clip; dur: number; text: string}> = ({photo, photoDur, clip, dur, text}) => {
  const f = useCurrentFrame();
  const g = interpolate(f, [photoDur - 18, photoDur + 2], [0, 1], {...clamp, easing: EASE.inOut});
  const card = {x: 700 - 700 * g, y: 170 - 170 * g, w: 900 + 1020 * g, h: 600 + 480 * g};
  const videoIn = interpolate(f, [photoDur - 4, photoDur + 4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <AbsoluteFill style={{filter: 'blur(18px)', opacity: 0.5}}>
        <PhotoView src={photo} dur={dur} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: alpha('navy', 0.6)}} />
      <div
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.w,
          height: card.h,
          borderRadius: 8 * (1 - g),
          border: `${6 * (1 - g)}px solid ${COLORS.white}`,
          overflow: 'hidden',
          boxShadow: `0 30px 60px -25px ${alpha('navy', 0.55)}`,
        }}
      >
        <PhotoView src={photo} dur={dur} />
        {f >= photoDur - 6 ? (
          <AbsoluteFill style={{opacity: videoIn}}>
            <Sequence from={photoDur - 6} layout="absolute-fill">
              <ClipView clip={clip} dur={dur - photoDur} push={[1, 1.03]} />
            </Sequence>
          </AbsoluteFill>
        ) : null}
      </div>
      <ScrimBL strength={0.9} />
      <LowerText lines={parseText(text)} delay={4} />
    </AbsoluteFill>
  );
};

/** T7 · Coast map (V1 component, accelerated) + round drone inset */
export const T7: React.FC<{inset: Clip; dur: number; cities: string[]}> = ({inset, dur, cities}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [4, 18], [0, 1], {...clamp, easing: EASE.out});
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <RivieraSvg cities={cities} speed={2.6} labelSize={V3.minReadPx} />
      <div
        style={{
          position: 'absolute',
          right: 170,
          top: 150,
          width: 330,
          height: 330,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `6px solid ${COLORS.white}`,
          boxShadow: `0 30px 60px -25px ${alpha('navy', 0.7)}`,
          scale: String(0.6 + 0.4 * p),
          opacity: p,
        }}
      >
        <ClipView clip={inset} dur={dur} push={[1.0, 1.06]} />
      </div>
    </AbsoluteFill>
  );
};

const PanelIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{translate: `0 ${interpolate(f, [0, 10], [100, 0], {...clamp, easing: EASE.out})}%`}}>{children}</AbsoluteFill>;
};

/** T8 · Triptych: 3 videos side by side (6 px white rules), one per beat; text band on top */
export const T8: React.FC<{panels: TimedClip[][]; dur: number; text: string}> = ({panels, text}) => {
  const lines = parseText(text);
  const band = 300;
  return (
    <AbsoluteFill style={{background: COLORS.white}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: band, bottom: 0, display: 'flex', gap: 6}}>
        {panels.map((chain, i) => (
          <div key={i} style={{flex: 1, position: 'relative', overflow: 'hidden', background: COLORS.navy}}>
            <Sequence from={i * V3.beat} layout="absolute-fill">
              <PanelIn>
                <ClipChain clips={chain} />
              </PanelIn>
            </Sequence>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: band, background: COLORS.navy}}>
        <div style={{position: 'absolute', left: M.x, top: 70, color: COLORS.white, fontFamily: SANS}}>
          {lines.map((l, i) => (
            <Reveal key={i} delay={2 + i * 6}>
              <div style={{fontWeight: i === 0 ? WEIGHTS.bold : WEIGHTS.regular, fontSize: 64, lineHeight: 1.15}}>{l.text}</div>
            </Reveal>
          ))}
        </div>
        <div style={{position: 'absolute', right: M.x, top: 82}}>
          <RedBar delay={14} width={72} height={8} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Full-frame photo sequence with a two-line reading text (morning / afternoon) */
export const PhotosSeg: React.FC<{photos: {src: string; dur: number}[]; text: string}> = ({photos, text}) => {
  const lines = parseText(text);
  let t = 0;
  return (
    <AbsoluteFill>
      {photos.map((p, i) => {
        const from = t;
        t += p.dur;
        return (
          <Sequence key={i} from={from} durationInFrames={p.dur} layout="absolute-fill">
            <PhotoView src={p.src} dur={p.dur} zoom={[1.0, 1.06]} />
            <GradeOverlay />
          </Sequence>
        );
      })}
      <ScrimBL />
      <div style={{position: 'absolute', left: M.x, bottom: M.bottom, color: COLORS.white, fontFamily: SANS}}>
        {lines.map((l, i) => (
          <Reveal key={i} delay={i === 0 ? 2 : photos[0].dur}>
            <div style={{fontWeight: i === 0 ? WEIGHTS.regular : WEIGHTS.bold, fontSize: 64, lineHeight: 1.15}}>{l.text}</div>
          </Reveal>
        ))}
        <RedBar delay={photos[0].dur + 6} width={72} height={8} style={{marginTop: 22}} />
      </div>
    </AbsoluteFill>
  );
};

/** Full-frame footage chain with a two-line reading text */
export const LineSeg: React.FC<{clips: TimedClip[]; text: string}> = ({clips, text}) => {
  const lines = parseText(text);
  return (
    <AbsoluteFill>
      <ClipChain clips={clips} />
      <GradeOverlay />
      <ScrimBL />
      <div style={{position: 'absolute', left: M.x, bottom: M.bottom, color: COLORS.white, fontFamily: SANS}}>
        {lines.map((l, i) => (
          <Reveal key={i} delay={4 + i * 6}>
            <div style={{fontWeight: i === 0 ? WEIGHTS.regular : WEIGHTS.bold, fontSize: 64, lineHeight: 1.15}}>{l.text}</div>
          </Reveal>
        ))}
        <RedBar delay={18} width={72} height={8} style={{marginTop: 22}} />
      </div>
      <CornerBug />
    </AbsoluteFill>
  );
};

/** Sunset + "Don't learn French." / "Live it." traced, in white */
export const SunsetSeg: React.FC<{clip: Clip; dur: number; dont: string}> = ({clip, dur, dont}) => {
  const f = useCurrentFrame();
  const h = 150;
  return (
    <AbsoluteFill>
      <ClipView clip={clip} dur={dur} />
      <GradeOverlay />
      <AbsoluteFill style={{background: `linear-gradient(0deg, ${alpha('navy', 0.55)} 0%, ${alpha('navy', 0)} 55%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 190}}>
        <div style={{fontFamily: SANS, fontWeight: WEIGHTS.regular, fontSize: 84, color: COLORS.white, opacity: interpolate(f, [2, 12], [0, 1], clamp), textShadow: `0 4px 30px ${alpha('navy', 0.4)}`}}>{dont}</div>
        <div style={{width: h * LIVE_RATIO, height: h, marginTop: 14}}>
          <HandwrittenLive delay={22} duration={30} height={h} color={COLORS.white} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** End card over the frozen sunset: navy veil 85 % rising, white logo, programmes, URL, CTA */
export const EndCard: React.FC<{image: string; programmes: string; url: string; cta: string}> = ({image, programmes, url, cta}) => {
  const f = useCurrentFrame();
  const veil = interpolate(f, [0, 15], [0, 1], {...clamp, easing: EASE.out});
  const icons = ['GraduationCap', 'Sun', 'ChefHat', 'Landmark'];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(CROP.scale), transformOrigin: 'top center', filter: GRADE.filter}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: alpha('navy', 0.85), clipPath: `inset(${(1 - veil) * 100}% 0 0 0)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: SANS, color: COLORS.white}}>
        <div style={{opacity: interpolate(f, [8, 20], [0, 1], clamp)}}>
          <BrandLogo variant="primaryWhite" height={230} />
        </div>
        <div style={{display: 'flex', gap: 54, marginTop: 56}}>
          {icons.map((n, i) => (
            <DrawIcon key={n} name={n} delay={14 + i * 4} size={80} color={COLORS.white} />
          ))}
        </div>
        <div style={{marginTop: 26, fontSize: 44, fontWeight: WEIGHTS.regular, opacity: interpolate(f, [18, 28], [0, 1], clamp)}}>{programmes}</div>
        <div style={{marginTop: 18, fontSize: 44, fontWeight: WEIGHTS.medium, letterSpacing: '0.03em', opacity: interpolate(f, [22, 32], [0, 1], clamp)}}>{url}</div>
        <div
          style={{
            marginTop: 40,
            background: COLORS.white,
            color: COLORS.navy,
            borderRadius: 5,
            padding: '22px 60px',
            fontSize: 44,
            fontWeight: WEIGHTS.bold,
            letterSpacing: '0.08em',
            opacity: interpolate(f, [26, 36], [0, 1], clamp),
            boxShadow: `0 12px 30px -12px ${alpha('navy', 0.5)}`,
          }}
        >
          {cta}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
