// Series signature transition: a dense-blue panel edged with a red rule
// sweeps left → right; the next scene is revealed behind its trailing edge.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {COLORS} from '../presentation/config';

type Props = Record<string, never>;

const BrandWipeComponent: React.FC<TransitionPresentationComponentProps<Props>> = ({children, presentationDirection, presentationProgress}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  // Panel left edge travels from -100 % to +100 % of the frame width.
  const left = -100 + presentationProgress * 200;
  const reveal = Math.max(0, left);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 ${100 - reveal}% 0 0)`}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${left}%`,
            width: '100%',
            background: COLORS.blue,
            boxShadow: `inset -12px 0 0 0 ${COLORS.red}`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const brandWipe = (): TransitionPresentation<Props> => ({component: BrandWipeComponent, props: {}});
