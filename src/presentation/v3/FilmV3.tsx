// V3.1 film: SCRIPT_V3 (config.ts) on the metronome grid.
// Hard cuts inside chapters; between chapters a 12-frame whip pan that OVERLAPS both shots
// (TransitionSeries). To keep every segment's start frame unchanged, the outgoing segment is
// extended by the overlap.
import React from 'react';
import {Audio} from '@remotion/media';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, staticFile} from 'remotion';
import {COLORS, SCRIPT_V3, SegV3, TEXT_V3, TextKeyV3, V3, WHIP_FRAMES} from '../config';
import {useLang} from '../../shared/context';
import {BonjourSeg, CitiesSeg, EndCard, LineSeg, SunsetSeg, T1, T2, T3, T4, T5, T6, T8, VideoSeg} from './templates';

// ------------------------------------------------------------ whip pan --
type WhipProps = Record<string, never>;
const WHIP_SHIFT = 520; // px: peak speed stays ≤ 80 px/frame over 12 frames with the in-out curve
const WhipComponent: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({children, presentationDirection, presentationProgress}) => {
  const p = presentationProgress;
  const exiting = presentationDirection === 'exiting';
  const x = exiting ? -WHIP_SHIFT * p : WHIP_SHIFT * (1 - p);
  const blur = 26 * Math.sin(Math.PI * p); // directional blur, strongest mid-transition
  const opacity = exiting ? 1 : Math.min(1, p * 2.2);
  const id = `whip-${exiting ? 'o' : 'i'}`;
  return (
    <AbsoluteFill style={{opacity}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-10%" y="0" width="120%" height="100%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{translate: `${x}px 0`, filter: blur > 0.3 ? `url(#${id})` : undefined}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
const whip = (): TransitionPresentation<Record<string, unknown>> =>
  ({component: WhipComponent, props: {}}) as unknown as TransitionPresentation<Record<string, unknown>>;
const whipTiming = linearTiming({durationInFrames: WHIP_FRAMES, easing: Easing.bezier(0.65, 0, 0.35, 1)});

// ----------------------------------------------------------- segments --
const Seg: React.FC<{s: SegV3; dur: number}> = ({s, dur}) => {
  const lang = useLang();
  const T = TEXT_V3[lang];
  const tx = (k?: string) => (k ? (T[k as TextKeyV3] as string) : undefined);
  switch (s.tpl) {
    case 'video':
      return <VideoSeg clip={s.clip} dur={dur} text={tx(s.text)} kind={s.textKind} bug={s.bug} />;
    case 'bonjour':
      return <BonjourSeg clip={s.clip} dur={dur} text={T.bonjour} />;
    case 'T1':
      return <T1 clip={s.clip} dur={dur} text={tx(s.text)!} />;
    case 'cities':
      return <CitiesSeg clip={s.clip} dur={dur} cities={tx(s.text)!.split(' · ')} points={s.points} />;
    case 'T2':
      return <T2 clips={s.clips} dur={s.dur} text={tx(s.text)!} icons={s.icons} />;
    case 'T3':
      return <T3 photos={s.photos} bg={s.bg} dur={dur} text={tx(s.text)} />;
    case 'T4':
      return <T4 bg={s.bg} dur={s.dur} text={tx(s.text)!} />;
    case 'T5':
      return <T5 clip={s.clip} dur={s.dur} text={tx(s.text)!} value={s.value} from={s.from} suffix={s.suffix} grouping={s.grouping} onNavy={s.onNavy} labelAbove={s.text === 'since'} sep={lang === 'fr' ? ' ' : ','} />;
    case 'T6': {
      const t = tx(s.text)!;
      const [first, ...rest] = t.split('|');
      const numbered = /^\d\d$/.test(first);
      return <T6 photo={s.photo} photoDur={s.photoDur} clip={s.clip} dur={dur} text={numbered ? rest.join('|') : t} kicker={numbered ? first : undefined} />;
    }
    case 'T8':
      return <T8 panels={s.panels} dur={dur} text={tx(s.text)!} kicker={s.kicker} />;
    case 'line':
      return <LineSeg media={s.media} dur={dur} text={tx(s.text)!} bug={s.bug} />;
    case 'sunset':
      return <SunsetSeg clip={s.clip} dur={dur} dont={T.dont} />;
    case 'endcard':
      return <EndCard image={s.image} programmes={T.programmes} url={T.url} cta={T.cta} />;
  }
};

export const FilmV3: React.FC<{metronome?: boolean}> = ({metronome = true}) => (
  <AbsoluteFill style={{background: COLORS.navy}}>
    <TransitionSeries>
      {SCRIPT_V3.map((s, i) => {
        const next = SCRIPT_V3[i + 1];
        const chapterCut = next && next.sec !== s.sec && next.sec >= 4 && s.sec >= 3;
        const dur = s.dur + (chapterCut ? WHIP_FRAMES : 0);
        return (
          <React.Fragment key={s.id}>
            <TransitionSeries.Sequence durationInFrames={dur} name={`${s.id} ${s.tpl}`} premountFor={30}>
              <Seg s={s} dur={dur} />
            </TransitionSeries.Sequence>
            {chapterCut ? <TransitionSeries.Transition presentation={whip()} timing={whipTiming} /> : null}
          </React.Fragment>
        );
      })}
    </TransitionSeries>
    {metronome ? <Audio src={staticFile(V3.metronome)} /> : null}
  </AbsoluteFill>
);
