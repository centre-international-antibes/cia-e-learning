import React from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ASSETS, EASE, GRADE} from '../presentation/config';

/** Full-frame muted CIA footage with optional slow push-in (≤ 1.08 for 1080p). */
export const VideoShot: React.FC<{src: string; duration: number; zoomTo?: number; trimBefore?: number; playbackRate?: number}> = ({
  src,
  duration,
  zoomTo = 1,
  trimBefore,
  playbackRate,
}) => {
  const frame = useCurrentFrame();
  const z = Math.min(zoomTo, ASSETS.zoomMax.video);
  const s = interpolate(frame, [0, duration], [1, z], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.zoom});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{scale: String(s), filter: GRADE.filter}}>
        <Video src={staticFile(src)} muted objectFit="cover" trimBefore={trimBefore} playbackRate={playbackRate} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
