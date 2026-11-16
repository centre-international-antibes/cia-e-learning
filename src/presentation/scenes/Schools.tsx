import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {ASSETS, COLORS, EASE, FONTS, TYPE, WEIGHTS, alpha} from '../config';
import {useLayout, useText} from '../../shared/context';
import {Headline, Kicker} from '../../shared/primitives';
import {SchoolCards3D} from '../three/SchoolCards3D';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Camera stops in front of each card; captions arrive when it stops.
 * 5 cards in 435 f: Astor's time is taken from the Cannes stop (brief §3).
 * The last hold includes the 20 f fade into scene 5.
 */
export const SCHOOLS_T = {
  kicker: 10,
  firstArrive: 28, // camera reaches card 0
  holds: [64, 64, 46, 64, 73],
  move: 24,
};
export const schoolStops = (n: number) => {
  let t = SCHOOLS_T.firstArrive;
  return Array.from({length: n}, (_, i) => {
    const s = {arrive: t, leave: t + SCHOOLS_T.holds[i], hold: SCHOOLS_T.holds[i]};
    t = s.leave + SCHOOLS_T.move;
    return s;
  });
};

const Caption: React.FC<{name: string; caption: string; hold: number}> = ({name, caption, hold}) => {
  const frame = useCurrentFrame();
  const {portrait} = useLayout();
  const out = interpolate(frame, [hold - 4, hold + 8], [1, 0], {...clamp, easing: EASE.inOut});
  return (
    <div style={{opacity: out}}>
      <Headline lines={[{text: name, bold: true}]} delay={2} size={portrait ? 76 : 92} />
      <div
        style={{
          marginTop: 18,
          fontFamily: `'${FONTS.sans}'`,
          fontWeight: WEIGHTS.regular,
          fontSize: portrait ? 34 : TYPE.secondary.size,
          color: alpha('navy', 0.7),
          opacity: interpolate(frame, [12, 28], [0, 1], clamp),
          translate: `0 ${interpolate(frame, [12, 32], [12, 0], {...clamp, easing: EASE.out})}px`,
          whiteSpace: 'nowrap',
        }}
      >
          {caption}
      </div>
    </div>
  );
};

export const Schools: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useText().schools;
  const {marginX, marginTop, marginBottom, portrait} = useLayout();
  const n = ASSETS.schools.length;
  const stops = schoolStops(n);

  // camera position along the row of cards (in card units)
  let cam = interpolate(frame, [0, stops[0].arrive], [-0.55, 0], {...clamp, easing: EASE.out});
  for (let i = 1; i < n; i++) {
    if (frame >= stops[i - 1].leave) {
      cam = interpolate(frame, [stops[i - 1].leave, stops[i].arrive], [i - 1, i], {...clamp, easing: EASE.inOut});
    }
  }
  // gentle drift after the last stop so the frame never freezes
  if (frame > stops[n - 1].leave) cam = n - 1 + interpolate(frame, [stops[n - 1].leave, stops[n - 1].leave + 90], [0, 0.06], clamp);

  // slow zoom inside each photo (≤ 1.12), only while its card is on screen
  const zooms = stops.map((s) => interpolate(frame, [s.arrive - SCHOOLS_T.move * 2, s.leave + SCHOOLS_T.move * 2], [1.0, ASSETS.zoomMax.photo - 0.02], clamp));

  return (
    <AbsoluteFill style={{background: COLORS.white}}>
      <SchoolCards3D cam={cam} zooms={zooms} offset={portrait ? [0, -1.6] : [-1.05, -0.55]} />
      <div style={{position: 'absolute', left: marginX, top: marginTop}}>
        <Kicker text={t.kicker} delay={SCHOOLS_T.kicker} />
      </div>
      {stops.map((s, i) => (
        <Sequence key={i} from={s.arrive - 2} durationInFrames={s.hold + 14} layout="none">
          <div style={{position: 'absolute', left: marginX, bottom: marginBottom}}>
            <Caption name={t.cards[i].name} caption={t.cards[i].caption} hold={s.hold} />
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
