import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, EASE, FONTS, TYPE, WEIGHTS, alpha} from '../config';
import {useLayout, useText} from '../../shared/context';
import {Headline} from '../../shared/primitives';
import {DrawIcon} from '../../shared/drawing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const PROGRAMMES_T = {title: 8, columns: 44, colStagger: 10, wordStep: 3, bandStart: 80, bandStep: 58, bandMove: 18};
const ICONS = ['GraduationCap', 'Sun', 'Users'] as const;

export const Programmes: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useText().programmes;
  const {marginX, marginTop, portrait, width} = useLayout();
  const T = PROGRAMMES_T;
  const inner = width - marginX * 2;
  const gap = 64;
  const colW = portrait ? inner : (inner - gap * 2) / 3;

  // active-column band, travelling left → right
  const bandPos = interpolate(
    frame,
    [T.bandStart, T.bandStart + T.bandMove, T.bandStart + T.bandStep, T.bandStart + T.bandStep + T.bandMove, T.bandStart + T.bandStep * 2, T.bandStart + T.bandStep * 2 + T.bandMove],
    [0, 0, 0, 1, 1, 2],
    {...clamp, easing: EASE.inOut},
  );
  const bandIn = interpolate(frame, [T.bandStart - 16, T.bandStart + 4], [0, 1], {...clamp, easing: EASE.out});

  let wordCounter = 0;
  const columns = t.columns.map((c, i) => {
    const d = T.columns + i * T.colStagger;
    const p = interpolate(frame, [d, d + 24], [0, 1], {...clamp, easing: EASE.out});
    const itemsStart = d + 16;
    const items = c.items.map((it) => {
      const words = it.split(' ');
      const spans = words.map((w, k) => {
        const wd = itemsStart + (wordCounter + k) * T.wordStep;
        const wp = interpolate(frame, [wd, wd + 12], [0, 1], {...clamp, easing: EASE.out});
        return (
          <span key={k} style={{display: 'inline-block', opacity: wp, translate: `0 ${(1 - wp) * 10}px`, marginRight: '0.28em'}}>
            {w}
          </span>
        );
      });
      wordCounter += words.length;
      return spans;
    });
    return (
      <div key={i} style={{width: colW, opacity: p, translate: `0 ${(1 - p) * 24}px`, display: 'flex', flexDirection: portrait ? 'row' : 'column', gap: portrait ? 36 : 30, alignItems: 'flex-start'}}>
        <DrawIcon name={ICONS[i]} delay={d} size={portrait ? 96 : 88} />
        <div>
          <div style={{fontFamily: `'${FONTS.sans}'`, fontWeight: WEIGHTS.bold, fontSize: portrait ? 40 : 42, letterSpacing: '0.08em', color: COLORS.navy, whiteSpace: 'nowrap'}}>{c.title}</div>
          <div style={{marginTop: portrait ? 14 : 20, fontFamily: `'${FONTS.sans}'`, fontWeight: WEIGHTS.regular, fontSize: portrait ? 32 : TYPE.secondary.size - 2, lineHeight: 1.5, color: alpha('navy', 0.7)}}>
            {items.map((spans, k) => (
              <div key={k} style={{whiteSpace: 'nowrap'}}>
                {spans}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

  const colsTop = portrait ? 640 : 470;
  return (
    <AbsoluteFill style={{background: COLORS.white}}>
      {/* fine dense-blue band behind the active column */}
      {portrait ? null : (
        <div
          style={{
            position: 'absolute',
            top: colsTop - 34,
            left: marginX - 32 + bandPos * (colW + gap),
            width: colW + 32,
            height: 6,
            background: COLORS.blue,
            transformOrigin: 'left center',
            scale: `${bandIn} 1`,
          }}
        />
      )}
      <div style={{position: 'absolute', left: marginX, top: marginTop}}>
        <Headline lines={[{text: t.line1}, {text: t.line2, bold: true}]} delay={T.title} size={portrait ? 76 : 96} />
      </div>
      <div style={{position: 'absolute', left: marginX, top: colsTop, display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: portrait ? 72 : gap}}>{columns}</div>
    </AbsoluteFill>
  );
};
