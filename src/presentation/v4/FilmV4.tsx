// V4 film: segments placed on the real beat grid of the edited music (script.ts).
// Hard cuts on beats; at each chapter boundary a whip pan CENTRED on the cut:
// the outgoing shot accelerates out over its last 6 frames, the incoming shot
// decelerates in over its first 6 frames (≤ 100 px/frame, strong directional blur).
import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS} from '../config';
import {useLang} from '../../shared/context';
import {BonjourSeg, CitiesSeg, EndCard, LineSeg, PlaceSeg, SunsetSeg, T1, T2, T3, T4, T5, T6, T8, VideoSeg, WordSeg} from '../v3/templates';
import {MUSIC_V4, ResolvedSeg, SegV4, TEXT_V4, TextKeyV4, WHIP_BEATS, fb, resolveV4} from './script';

const WHIP_HALF = 6;
const WHIP_SHIFT = 300; // px over 6 frames, quadratic: peak speed 2 × 300 / 6 = 100 px/frame

const Whip: React.FC<{dur: number; inWhip: boolean; outWhip: boolean; id: string; children: React.ReactNode}> = ({dur, inWhip, outWhip, id, children}) => {
  const f = useCurrentFrame();
  let x = 0;
  let blur = 0;
  if (outWhip && f >= dur - WHIP_HALF) {
    const t = interpolate(f, [dur - WHIP_HALF, dur], [0, 1]); // accelerates out to the left
    x = -WHIP_SHIFT * t * t;
    blur = 40 * t;
  }
  if (inWhip && f < WHIP_HALF) {
    const t = interpolate(f, [0, WHIP_HALF], [1, 0]); // decelerates in from the right
    x = WHIP_SHIFT * t * t;
    blur = 40 * t;
  }
  if (!blur) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: COLORS.navy}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`whip-${id}`} x="-20%" y="0" width="140%" height="100%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{translate: `${x}px 0`, scale: '1.1', filter: `url(#whip-${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Seg: React.FC<{s: SegV4}> = ({s}) => {
  const lang = useLang();
  const T = TEXT_V4[lang];
  const tx = (k?: string) => (k ? (T[k as TextKeyV4] as string) : undefined);
  const dur = s.dur;
  switch (s.tpl) {
    case 'video':
      return <VideoSeg clip={s.clip} dur={dur} text={tx(s.text)} kind={s.textKind} bug={s.bug} />;
    case 'bonjour':
      return <BonjourSeg clip={s.clip} dur={dur} text={T.bonjour} />;
    case 'T1':
      return <T1 clip={s.clip} dur={dur} text={tx(s.text)!} clips={s.clips} />;
    case 'place':
      return <PlaceSeg media={s.media} dur={dur} text={tx(s.text)!} />;
    case 'cities':
      return <CitiesSeg clip={s.clip} dur={dur} cities={tx(s.text)!.split(' · ')} points={s.points} />;
    case 'T2':
      return <T2 clips={s.clips} dur={dur} text={tx(s.text)!} icons={s.icons} />;
    case 'T3':
      return <T3 photos={s.photos} bg={s.bg} dur={dur} text={tx(s.text)} />;
    case 'T4':
      return <T4 bg={s.bg} dur={dur} text={tx(s.text)!} />;
    case 'T5':
      return <T5 clip={s.clip} clips={s.clips} dur={dur} text={tx(s.text)!} value={s.value} from={s.from} suffix={s.suffix} grouping={s.grouping} onNavy={s.onNavy} labelAbove={s.text === 'since'} sep={lang === 'fr' ? ' ' : ','} />;
    case 'T6': {
      const t = tx(s.text)!;
      const [first, ...rest] = t.split('|');
      const kicker = /^\d\d( · .*)?$/.test(first) ? first : undefined;
      return <T6 photo={s.photo} photoDur={s.photoDur} videoFrom={s.videoFrom} clip={s.clip} dur={dur} text={kicker ? rest.join('|') : t} kicker={kicker} />;
    }
    case 'T8':
      return <T8 panels={s.panels} panelStarts={s.panelStarts} dur={dur} text={tx(s.text)!} kicker={s.kicker} />;
    case 'line':
      return <LineSeg media={s.media} dur={dur} text={tx(s.text)!} bug={s.bug} />;
    case 'word':
      return <WordSeg clip={s.clip} dur={dur} word={tx(s.text)!} bar={s.bar} />;
    case 'sunset':
      return <SunsetSeg clip={s.clip} dur={dur} dont={T.dont} />;
    case 'endcard':
      return <EndCard image={s.image} programmes={T.programmes} url={T.url} cta={T.cta} />;
    default:
      return null;
  }
};

export const FilmV4: React.FC = () => {
  const segs: ResolvedSeg[] = resolveV4();
  const whipFrames = new Set(WHIP_BEATS.map(fb));
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      {segs.map((r, i) => {
        const end = r.start + r.seg.dur;
        return (
          <Sequence key={r.seg.id} from={r.start} durationInFrames={r.seg.dur} name={`${r.seg.id} ${r.seg.tpl}`} premountFor={30}>
            <Whip dur={r.seg.dur} inWhip={whipFrames.has(r.start)} outWhip={i < segs.length - 1 && whipFrames.has(end)} id={r.seg.id}>
              <Seg s={r.seg} />
            </Whip>
          </Sequence>
        );
      })}
      <Audio src={staticFile(MUSIC_V4)} />
    </AbsoluteFill>
  );
};
