// Things that draw themselves: Lucide icons, the "Live it." pen trace, counters.
import React, {useMemo} from 'react';
import {evolvePath} from '@remotion/paths';
import {interpolate, useCurrentFrame} from 'remotion';
import * as lucide from 'lucide-static';
import brand from '../presentation/brand.generated.json';
import {COLORS, EASE, FONTS, WEIGHTS} from '../presentation/config';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// --------------------------------------------------------------- DrawIcon --
type IconEl = {tag: string; attrs: Record<string, string>};
const parseIcon = (svg: string): IconEl[] =>
  [...svg.matchAll(/<(path|circle|rect|line|polyline|ellipse)\s([^>]*?)\/>/g)].map((m) => ({
    tag: m[1],
    attrs: Object.fromEntries([...m[2].matchAll(/([a-z-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  }));

/** Lucide stroke icon (2 px) inside an 88 px circle, drawn stroke by stroke. */
export const DrawIcon: React.FC<{name: string; delay: number; size?: number; color?: string}> = ({name, delay, size = 88, color = COLORS.navy}) => {
  const frame = useCurrentFrame();
  const els = useMemo(() => parseIcon((lucide as unknown as Record<string, string>)[name]), [name]);
  const ring = interpolate(frame, [delay, delay + 22], [0, 1], {...clamp, easing: EASE.out});
  const per = 10;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" style={{display: 'block', overflow: 'visible'}}>
      <circle cx="44" cy="44" r="43" fill="none" stroke={color} strokeWidth={1.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} transform="rotate(-90 44 44)" />
      <g transform="translate(22 22) scale(1.8333)" fill="none" stroke={color} strokeWidth={2 / 1.8333} strokeLinecap="round" strokeLinejoin="round">
        {els.map((el, i) => {
          const p = interpolate(frame, [delay + 8 + i * per * 0.6, delay + 8 + i * per * 0.6 + 22], [0, 1], {...clamp, easing: EASE.inOut});
          if (el.tag === 'path') {
            const ev = evolvePath(p, el.attrs.d);
            return <path key={i} d={el.attrs.d} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />;
          }
          const Tag = el.tag as 'circle';
          return <Tag key={i} {...(el.attrs as object)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
        })}
      </g>
    </svg>
  );
};

// --------------------------------------------------------- HandwrittenLive --
type Glyph = {d: string; x: number; y: number; part: string};
const LIVE_GLYPHS = (brand.baseline.glyphs as Glyph[]).filter((g) => g.part === 'live' && g.d);

/**
 * "Live it." traced with a pen: outlines of the official logo baseline
 * (Better Together) drawn glyph by glyph, then filled.
 */
export const HandwrittenLive: React.FC<{delay: number; duration?: number; height: number; color?: string}> = ({delay, duration = 30, height, color = COLORS.red}) => {
  const frame = useCurrentFrame();
  const box = brand.baseline.live;
  const pad = box.h * 0.12;
  const vb = `${box.x - pad} ${box.y - pad} ${box.w + pad * 2} ${box.h + pad * 2}`;
  const n = LIVE_GLYPHS.length;
  const slot = duration / (n * 0.7 + 0.3);
  return (
    <svg viewBox={vb} height={height} style={{display: 'block', overflow: 'visible'}}>
      {LIVE_GLYPHS.map((g, i) => {
        const s = delay + i * slot * 0.7;
        const p = interpolate(frame, [s, s + slot], [0, 1], {...clamp, easing: EASE.inOut});
        const fill = interpolate(frame, [s + slot * 0.55, s + slot * 1.25], [0, 1], {...clamp, easing: EASE.out});
        const ev = evolvePath(p, g.d);
        return (
          <g key={i} transform={`translate(${g.x} ${g.y})`}>
            <path d={g.d} fill={color} fillOpacity={fill} stroke={color} strokeWidth={0.16} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
};

/** Ratio width/height of the traced "Live it." (with padding). */
export const LIVE_RATIO = (() => {
  const b = brand.baseline.live;
  const pad = b.h * 0.12;
  return (b.w + pad * 2) / (b.h + pad * 2);
})();

// ---------------------------------------------------------------- Counter --
export const formatNumber = (n: number, grouping: boolean, sep: string) =>
  grouping ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n);

/** Number that rolls to its value (tabular figures, ease-out). */
export const Counter: React.FC<{value: number; from?: number; delay: number; duration?: number; grouping: boolean; sep: string; suffix?: string; size: number; color?: string}> = ({
  value,
  from = 0,
  delay,
  duration = 42,
  grouping,
  sep,
  suffix = '',
  size,
  color = COLORS.navy,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + duration], [0, 1], {...clamp, easing: EASE.out});
  const v = Math.round(from + (value - from) * p);
  const shown = formatNumber(v, grouping, sep);
  return (
    <div
      style={{
        fontFamily: `'${FONTS.sans}'`,
        fontWeight: WEIGHTS.bold,
        fontSize: size,
        lineHeight: 1,
        color,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        opacity: interpolate(frame, [delay, delay + 10], [0, 1], clamp),
        translate: `0 ${interpolate(frame, [delay, delay + 28], [24, 0], {...clamp, easing: EASE.out})}px`,
        whiteSpace: 'nowrap',
      }}
    >
      {shown}
      {suffix}
    </div>
  );
};
