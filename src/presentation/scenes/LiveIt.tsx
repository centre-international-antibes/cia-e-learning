import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {ASSETS, COLORS, EASE, FONTS, TYPE, WEIGHTS} from '../config';
import {useLayout, useText} from '../../shared/context';
import {CornerBug, Grade, PhotoFill, Scrim} from '../../shared/primitives';
import {VideoShot} from '../../shared/VideoShot';
import {SCENES} from '../config';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** Word mask duration (§3: 8 f). Cuts are on beats (see ASSETS.liveItCuts). */
export const LIVEIT_T = {wordIn: 8, firstWordDelay: 8};

const Word: React.FC<{text: string; red: boolean; delay: number}> = ({text, red, delay}) => {
  const frame = useCurrentFrame();
  const {giantScale, marginX, marginBottom} = useLayout();
  const y = interpolate(frame, [delay, delay + LIVEIT_T.wordIn], [105, 0], {...clamp, easing: EASE.out});
  return (
    <div style={{position: 'absolute', left: marginX, bottom: marginBottom - 20, overflow: 'hidden', paddingTop: 10}}>
      <div
        style={{
          translate: `0 ${y}%`,
          fontFamily: `'${FONTS.sans}'`,
          fontWeight: WEIGHTS.bold,
          fontSize: TYPE.giant.size * giantScale * 0.92,
          lineHeight: 1.05,
          letterSpacing: '0.01em',
          color: red ? COLORS.red : COLORS.white,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const LiveIt: React.FC = () => {
  const words = useText().liveIt.words;
  const cuts = ASSETS.liveItCuts;
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      {ASSETS.liveIt.map((shot, i) => {
        const from = cuts[i];
        const dur = (i < cuts.length - 1 ? cuts[i + 1] : SCENES.liveIt) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} premountFor={30}>
            {shot.kind === 'photo' ? (
              <PhotoFill src={shot.src} duration={dur} to={Math.min(shot.zoom, ASSETS.zoomMax.photo)} focus={shot.focus} />
            ) : (
              <VideoShot src={shot.src} duration={dur} zoomTo={shot.zoom} />
            )}
            <Grade />
            <Scrim side="bottom" opacity={0.9} />
            <Word text={words[i]} red={i === words.length - 1} delay={i === 0 ? LIVEIT_T.firstWordDelay : 0} />
          </Sequence>
        );
      })}
      <CornerBug />
    </AbsoluteFill>
  );
};
