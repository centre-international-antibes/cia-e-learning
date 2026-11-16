import React from 'react';
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, EASE, FONTS, TYPE, WEIGHTS, alpha} from '../config';
import {useLayout, useText} from '../../shared/context';
import {Kicker, RedBar} from '../../shared/primitives';
import {Counter} from '../../shared/drawing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const NUMBERS_T = {grid: 8, first: 22, stagger: 12, countDuration: 44, accreditation: 112};

/** Fine blue grid line that traces itself, with an almost imperceptible organic drift. */
const GridLine: React.FC<{vertical?: boolean; pos: number; delay: number; seed: string; end?: number}> = ({vertical, pos, delay, seed, end}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 40], [0, 1], {...clamp, easing: EASE.inOut});
  const drift = noise2D(seed, frame / 120, 0) * 1.5;
  return (
    <div
      style={{
        position: 'absolute',
        background: alpha('blue', 0.16),
        ...(vertical
          ? {left: pos + drift, top: 0, height: end ?? '100%', width: 1, transformOrigin: 'top', scale: `1 ${p}`}
          : {top: pos + drift, left: 0, right: 0, height: 1, transformOrigin: 'left', scale: `${p} 1`}),
      }}
    />
  );
};

export const Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useText().numbers;
  const {portrait, width, height, marginX} = useLayout();
  const size = portrait ? 132 : TYPE.numbers.size;
  const colW = portrait ? width - marginX * 2 : (width - marginX * 2) / 3;

  const cols = t.items.map((it, i) => {
    const d = NUMBERS_T.first + i * NUMBERS_T.stagger;
    return (
      <div key={i} style={{width: colW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <Kicker text={it.pre || ' '} delay={d} color={alpha('navy', 0.7)} />
        <Counter value={it.value} from={i === 0 ? 1900 : 0} delay={d} duration={NUMBERS_T.countDuration} grouping={it.grouping} sep={t.thousands} suffix={it.suffix} size={size} />
        <div style={{height: 14, display: 'flex', alignItems: 'center'}}>{i === 1 ? <RedBar delay={d + NUMBERS_T.countDuration - 8} width={72} height={8} /> : null}</div>
        <div
          style={{
            fontFamily: `'${FONTS.sans}'`,
            fontWeight: WEIGHTS.regular,
            fontSize: portrait ? 36 : TYPE.secondary.size,
            color: alpha('navy', 0.7),
            opacity: interpolate(frame, [d + 18, d + 36], [0, 1], clamp),
            minHeight: '1.2em',
          }}
        >
          {it.label || ' '}
        </div>
      </div>
    );
  });

  const verticals = portrait ? [] : [marginX + colW, marginX + colW * 2];
  const horizontals = portrait ? [height * 0.2, height * 0.8] : [height * 0.22, height * 0.72];

  return (
    <AbsoluteFill style={{background: COLORS.white}}>
      {verticals.map((x, i) => (
        <GridLine key={`v${i}`} vertical end={horizontals[1]} pos={x} delay={NUMBERS_T.grid + i * 6} seed={`v${i}`} />
      ))}
      {horizontals.map((y, i) => (
        <GridLine key={`h${i}`} pos={y} delay={NUMBERS_T.grid + 4 + i * 6} seed={`h${i}`} />
      ))}
      <div
        style={{
          position: 'absolute',
          left: marginX,
          right: marginX,
          top: horizontals[0],
          height: horizontals[1] - horizontals[0],
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: portrait ? 'space-evenly' : 'center',
        }}
      >
        {cols}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: horizontals[1] + (portrait ? 70 : 64), display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            fontFamily: `'${FONTS.sans}'`,
            fontWeight: WEIGHTS.regular,
            fontSize: portrait ? 34 : TYPE.secondary.size,
            color: alpha('navy', 0.7),
            textAlign: 'center',
            padding: '0 60px',
            opacity: interpolate(frame, [NUMBERS_T.accreditation, NUMBERS_T.accreditation + 20], [0, 1], clamp),
            translate: `0 ${interpolate(frame, [NUMBERS_T.accreditation, NUMBERS_T.accreditation + 24], [12, 0], {...clamp, easing: EASE.out})}px`,
          }}
        >
          {t.accreditation}
        </div>
      </div>
    </AbsoluteFill>
  );
};
