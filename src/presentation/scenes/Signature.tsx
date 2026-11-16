import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, EASE, FONTS, TYPE, WEIGHTS, alpha} from '../config';
import {useLayout, useText} from '../../shared/context';
import {BrandLogo, CtaButton, Credits} from '../../shared/primitives';
import {HandwrittenLive, LIVE_RATIO} from '../../shared/drawing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Timings inside the scene (frames). The scene starts under the brand wipe. */
export const SIGNATURE_T = {logo: 14, dont: 40, live: 60, liveDuration: 30, url: 98, cta: 108, credits: 122};

export const Signature: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useText().signature;
  const {portrait} = useLayout();
  const T = SIGNATURE_T;

  const logoP = interpolate(frame, [T.logo, T.logo + 30], [0, 1], {...clamp, easing: EASE.out});
  const dontP = interpolate(frame, [T.dont, T.dont + 22], [0, 1], {...clamp, easing: EASE.out});
  const urlP = interpolate(frame, [T.url, T.url + 20], [0, 1], {...clamp, easing: EASE.out});

  const regular = portrait ? 60 : TYPE.baseline.regular;
  const scriptH = (portrait ? 1.5 : 1.38) * regular;

  return (
    <AbsoluteFill style={{background: COLORS.white, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: portrait ? -40 : -30}}>
        <div style={{opacity: logoP, translate: `0 ${(1 - logoP) * 22}px`}}>
          <BrandLogo variant="primary" height={portrait ? 300 : 236} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: portrait ? 'column' : 'row',
            alignItems: portrait ? 'center' : 'baseline',
            gap: portrait ? 8 : 28,
            marginTop: portrait ? 90 : 64,
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.sans}'`,
              fontWeight: WEIGHTS.regular,
              fontSize: regular,
              color: COLORS.navy,
              whiteSpace: 'nowrap',
              opacity: dontP,
              translate: `0 ${(1 - dontP) * 14}px`,
            }}
          >
            {t.dont}
          </div>
          <div style={{width: scriptH * LIVE_RATIO, height: scriptH, translate: `0 ${portrait ? 0 : scriptH * 0.2}px`}}>
            <HandwrittenLive delay={T.live} duration={T.liveDuration} height={scriptH} />
          </div>
        </div>

        <div
          style={{
            marginTop: portrait ? 80 : 54,
            fontFamily: `'${FONTS.sans}'`,
            fontWeight: WEIGHTS.medium,
            fontSize: portrait ? 34 : TYPE.secondary.size,
            letterSpacing: '0.04em',
            color: alpha('navy', 0.7),
            opacity: urlP,
            translate: `0 ${(1 - urlP) * 10}px`,
          }}
        >
          {t.url}
        </div>
        <div style={{marginTop: portrait ? 44 : 34}}>
          <CtaButton text={t.cta} delay={T.cta} />
        </div>
      </div>
      <Credits delay={T.credits} />
    </AbsoluteFill>
  );
};
