// V3 animatic / film: the script (config.ts SCRIPT_V3) laid out on the metronome grid.
import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {COLORS, SCRIPT_V3, TEXT_V3, TextKeyV3, V3, v3Starts} from '../config';
import {useLang} from '../../shared/context';
import {BonjourSeg, EndCard, LineSeg, PhotosSeg, SunsetSeg, T1, T2, T3, T4, T5, T6, T7, T8, VideoSeg} from './templates';

export const FilmV3: React.FC<{metronome?: boolean}> = ({metronome = true}) => {
  const lang = useLang();
  const T = TEXT_V3[lang];
  const tx = (k?: string) => (k ? T[k as TextKeyV3] : undefined) as string | undefined;
  const starts = v3Starts();
  return (
    <AbsoluteFill style={{background: COLORS.navy}}>
      {SCRIPT_V3.map((s, i) => (
        <Sequence key={s.id} from={starts[i]} durationInFrames={s.dur} name={`${s.id} ${s.tpl}`} premountFor={30}>
          {s.tpl === 'video' ? <VideoSeg clip={s.clip} dur={s.dur} text={tx(s.text)} kind={s.textKind} bug={s.bug} /> : null}
          {s.tpl === 'bonjour' ? <BonjourSeg clip={s.clip} dur={s.dur} text={T.bonjour} /> : null}
          {s.tpl === 'T1' ? <T1 clip={s.clip} dur={s.dur} text={tx(s.text)!} /> : null}
          {s.tpl === 'T2' ? <T2 clips={s.clips} dur={s.dur} text={tx(s.text)!} icons={s.icons} /> : null}
          {s.tpl === 'T3' ? <T3 photos={s.photos} bg={s.bg} dur={s.dur} text={tx(s.text)} /> : null}
          {s.tpl === 'T4' ? <T4 bg={s.bg} dur={s.dur} text={tx(s.text)!} /> : null}
          {s.tpl === 'T5' ? (
            <T5 clip={s.clip} dur={s.dur} text={tx(s.text)!} value={s.value} from={s.from} suffix={s.suffix} grouping={s.grouping} labelAbove={s.text === 'since'} sep={lang === 'fr' ? ' ' : ','} />
          ) : null}
          {s.tpl === 'T6' ? <T6 photo={s.photo} photoDur={s.photoDur} clip={s.clip} dur={s.dur} text={tx(s.text)!} /> : null}
          {s.tpl === 'T7' ? <T7 inset={s.inset} dur={s.dur} cities={tx(s.text)!.split(' · ')} /> : null}
          {s.tpl === 'T8' ? <T8 panels={s.panels} dur={s.dur} text={tx(s.text)!} /> : null}
          {s.tpl === 'photos' ? <PhotosSeg photos={s.photos} text={tx(s.text)!} /> : null}
          {s.tpl === 'line' ? <LineSeg clips={s.clips} text={tx(s.text)!} /> : null}
          {s.tpl === 'sunset' ? <SunsetSeg clip={s.clip} dur={s.dur} dont={T.dont} /> : null}
          {s.tpl === 'endcard' ? <EndCard image={s.image} programmes={T.programmes} url={T.url} cta={T.cta} /> : null}
        </Sequence>
      ))}
      {metronome ? <Audio src={staticFile(V3.metronome)} /> : null}
    </AbsoluteFill>
  );
};
