import React from 'react';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ASSETS, COLORS, EASE, TYPE, WEIGHTS, alpha} from '../config';
import {familyFor} from '../../fonts';
import {useLayout, useText} from '../../shared/context';
import {CornerBug, Grade, Kicker, RedBar} from '../../shared/primitives';
import {VideoShot} from '../../shared/VideoShot';
import {MedLightShader} from '../three/MedLightShader';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Greeting rhythm: Hello is held, then the cadence accelerates 10 f → 4 f. "Bonjour" lands on beat 5 (frame 90). */
export const HELLO_T = {
  firstWord: 19,
  durations: [18, 10, 9, 8, 7, 6, 5, 4, 4],
  bonjour: 90,
  kicker: 116,
};

const Word: React.FC<{text: string; start: number; end: number | null; size: number}> = ({text, start, end, size}) => {
  const frame = useCurrentFrame();
  const len = end === null ? 9 : Math.max(3, Math.min(7, (end - start) * 0.7));
  const yIn = interpolate(frame, [start, start + len], [100, 0], {...clamp, easing: EASE.out});
  const yOut = end === null ? 0 : interpolate(frame, [end, end + len], [0, -100], {...clamp, easing: EASE.inOut});
  if (frame < start - 1 || (end !== null && frame > end + len + 1)) return null;
  const cjk = /[぀-ヿ一-鿿]/.test(text);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{overflow: 'hidden', padding: '0.12em 0.2em'}}>
        <div
          style={{
            translate: `0 ${yIn + yOut}%`,
            fontFamily: familyFor(text),
            fontWeight: cjk ? WEIGHTS.medium : WEIGHTS.bold,
            fontSize: cjk ? size * 0.86 : size,
            lineHeight: 1.1,
            color: COLORS.white,
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Hello: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useText().hello;
  const {giantScale, portrait} = useLayout();
  const size = TYPE.giant.size * giantScale;

  const starts: number[] = [];
  let s = HELLO_T.firstWord;
  for (const d of HELLO_T.durations) {
    starts.push(s);
    s += d;
  }
  const fadeIn = interpolate(frame, [0, 20], [1, 0], clamp);

  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      {ASSETS.helloVideo ? <VideoShot src={ASSETS.helloVideo} duration={ASSETS.helloVideoFrames} /> : <MedLightShader />}
      <Grade />
      {/* blue veil keeps the type readable, lighter at the top to let the sea breathe */}
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${alpha('navy', 0.42)} 0%, ${alpha('navy', 0.62)} 55%, ${alpha('navy', 0.74)} 100%)`}} />
      <AbsoluteFill style={{background: COLORS.navy, opacity: fadeIn}} />

      <CameraMotionBlur shutterAngle={160} samples={6}>
        <AbsoluteFill>
          {t.greetings.map((g, i) => (
            <Word key={g} text={g} start={starts[i]} end={i === t.greetings.length - 1 ? HELLO_T.bonjour : starts[i + 1]} size={size} />
          ))}
        </AbsoluteFill>
      </CameraMotionBlur>
      <Word text={t.bonjour} start={HELLO_T.bonjour} end={null} size={size} />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: size * 1.62}}>
          <RedBar delay={HELLO_T.bonjour + 4} width={portrait ? 96 : 120} height={10} duration={16} />
          <Kicker text={t.kicker} delay={HELLO_T.kicker} color={COLORS.white} size={portrait ? 22 : TYPE.kicker.size} style={{marginTop: 34, textAlign: 'center', whiteSpace: portrait ? 'normal' : 'nowrap', maxWidth: portrait ? 820 : undefined, lineHeight: 1.6}} />
        </div>
      </AbsoluteFill>
      <CornerBug opacity={interpolate(frame, [10, 30], [0, 1], clamp)} />
    </AbsoluteFill>
  );
};
