import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS} from '../config';
import {useLayout, useText} from '../../shared/context';
import {CornerBug, Headline, Scrim} from '../../shared/primitives';
import {RivieraSvg} from '../map/RivieraSvg';

export const RIVIERA_T = {title: 10};

export const Riviera: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useText().riviera;
  const {marginX, marginBottom} = useLayout();
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      <RivieraSvg cities={t.cities} />
      <Scrim side="bottom" opacity={0.85} />
      <div style={{position: 'absolute', left: marginX, bottom: marginBottom}}>
        <Headline lines={[{text: t.line1}, {text: t.line2, bold: true}]} delay={RIVIERA_T.title} color={COLORS.white} />
      </div>
      <CornerBug opacity={interpolate(frame, [0, 10], [1, 1])} />
    </AbsoluteFill>
  );
};
