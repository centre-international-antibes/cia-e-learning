// Brand primitives shared by every film of the CIA series.
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ASSETS, COLORS, EASE, FONTS, GRADE, SCRIM_BOTTOM, SCRIM_LEFT, TITLE_ANIM, TYPE, WEIGHTS, alpha} from '../presentation/config';
import {useCredits, useLayout} from './context';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// --------------------------------------------------------------- RedBar --
/** Signature red bar: scaleX 0 → 1 from the left. */
export const RedBar: React.FC<{delay: number; width?: number; height?: number; duration?: number; style?: React.CSSProperties}> = ({
  delay,
  width = 72,
  height = 10,
  duration = TITLE_ANIM.barDuration,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width,
        height,
        background: COLORS.red,
        transformOrigin: 'left center',
        scale: `${interpolate(frame, [delay, delay + duration], [0, 1], {...clamp, easing: EASE.out})} 1`,
        ...style,
      }}
    />
  );
};

// ------------------------------------------------------------ RevealLine --
/** One line revealed through a mask: Y 100 % → 0 (§7). */
export const RevealLine: React.FC<{delay: number; duration?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay,
  duration = TITLE_ANIM.lineDuration,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [delay, delay + duration], [105, 0], {...clamp, easing: EASE.out});
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.06em', marginBottom: '-0.06em'}}>
      <div style={{translate: `0 ${y}%`, ...style}}>{children}</div>
    </div>
  );
};

// -------------------------------------------------------------- Headline --
export type HeadlineLine = {text: string; bold?: boolean; red?: boolean};
/** Title: uppercase lines, Regular + Bold on the key part, red bar after the last line. */
export const Headline: React.FC<{
  lines: HeadlineLine[];
  delay?: number;
  color?: string;
  align?: 'left' | 'center';
  size?: number;
  bar?: boolean;
}> = ({lines, delay = 0, color = COLORS.navy, align = 'left', size, bar = true}) => {
  const {titleScale} = useLayout();
  const fontSize = size ?? TYPE.title.size * titleScale;
  const lastLine = delay + (lines.length - 1) * TITLE_ANIM.lineStagger;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start'}}>
      {lines.map((l, i) => (
        <RevealLine key={i} delay={delay + i * TITLE_ANIM.lineStagger}>
          <div
            style={{
              fontFamily: `'${FONTS.sans}'`,
              fontWeight: l.bold ? WEIGHTS.bold : WEIGHTS.regular,
              fontSize,
              lineHeight: TYPE.title.lineHeight,
              letterSpacing: TYPE.title.tracking,
              textTransform: 'uppercase',
              color: l.red ? COLORS.red : color,
              textAlign: align,
              whiteSpace: 'nowrap',
            }}
          >
            {l.text}
          </div>
        </RevealLine>
      ))}
      {bar ? <RedBar delay={lastLine + TITLE_ANIM.barDelay} style={{marginTop: fontSize * 0.32}} /> : null}
    </div>
  );
};

// ---------------------------------------------------------------- Kicker --
export const Kicker: React.FC<{text: string; delay: number; color?: string; style?: React.CSSProperties; size?: number}> = ({
  text,
  delay,
  color = COLORS.navy,
  style,
  size = TYPE.kicker.size,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: `'${FONTS.sans}'`,
        fontWeight: WEIGHTS.medium,
        fontSize: size,
        letterSpacing: TYPE.kicker.tracking,
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
        opacity: interpolate(frame, [delay, delay + 18], [0, 1], {...clamp, easing: EASE.out}),
        translate: `0 ${interpolate(frame, [delay, delay + 24], [14, 0], {...clamp, easing: EASE.out})}px`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// ----------------------------------------------------------------- Scrim --
export const Scrim: React.FC<{side?: 'left' | 'bottom'; opacity?: number}> = ({side = 'left', opacity = 1}) => (
  <AbsoluteFill style={{background: side === 'left' ? SCRIM_LEFT : SCRIM_BOTTOM, opacity}} />
);

/** Common grade: warm soft-light veil + soft navy vignette (§5). */
export const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{background: GRADE.warmVeil, mixBlendMode: 'soft-light'}} />
    <AbsoluteFill style={{background: GRADE.vignette}} />
  </>
);

// ------------------------------------------------------------- BrandLogo --
export const BrandLogo: React.FC<{variant: 'primary' | 'primaryWhite' | 'bandeauWhite'; height: number; style?: React.CSSProperties}> = ({
  variant,
  height,
  style,
}) => <Img src={staticFile(ASSETS.brand[variant])} style={{height, width: 'auto', display: 'block', ...style}} />;

/** Discreet white bandeau logo, top right, 60 % (dark video shots). */
export const CornerBug: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const {marginX, marginTop, portrait} = useLayout();
  return (
    <div style={{position: 'absolute', top: marginTop * 0.6, right: marginX * 0.6, opacity: 0.6 * opacity}}>
      <BrandLogo variant="bandeauWhite" height={portrait ? 50 : 46} />
    </div>
  );
};

// ------------------------------------------------------------- CtaButton --
export const CtaButton: React.FC<{text: string; delay: number}> = ({text, delay}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 22], [0, 1], {...clamp, easing: EASE.out});
  const {portrait} = useLayout();
  return (
    <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', opacity: p, translate: `0 ${(1 - p) * 16}px`}}>
      <div
        style={{
          background: COLORS.navy,
          color: COLORS.white,
          borderRadius: 5,
          padding: portrait ? '22px 44px' : '24px 64px',
          fontFamily: `'${FONTS.sans}'`,
          fontWeight: WEIGHTS.bold,
          fontSize: portrait ? 34 : TYPE.cta.size,
          letterSpacing: TYPE.cta.tracking,
          whiteSpace: 'nowrap',
          boxShadow: `0 12px 30px -12px ${alpha('navy', 0.35)}`,
        }}
      >
        {text}
      </div>
      <RedBar delay={delay + 14} width={undefined} height={6} style={{width: '100%', marginTop: 10}} />
    </div>
  );
};

// --------------------------------------------------------------- Credits --
export const Credits: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const credits = useCredits();
  const {marginBottom, portrait} = useLayout();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: marginBottom * 0.45,
        textAlign: 'center',
        fontFamily: `'${FONTS.sans}'`,
        fontWeight: WEIGHTS.regular,
        fontSize: portrait ? 20 : TYPE.credits.size,
        color: alpha('navy', 0.6),
        opacity: interpolate(frame, [delay, delay + 20], [0, 1], clamp),
        padding: '0 60px',
      }}
    >
      {credits}
    </div>
  );
};

// ------------------------------------------------------------- PhotoFill --
/** Full-frame photo with slow zoom (≤ max) that never shows an edge. */
export const PhotoFill: React.FC<{src: string; from?: number; to?: number; duration: number; focus?: [number, number]; style?: React.CSSProperties}> = ({
  src,
  from = 1.0,
  to = 1.08,
  duration,
  focus = [0.5, 0.5],
  style,
}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, duration], [from, to], {...clamp, easing: EASE.zoom});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
          transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          scale: String(s),
          filter: GRADE.filter,
          ...style,
        }}
      />
    </AbsoluteFill>
  );
};
