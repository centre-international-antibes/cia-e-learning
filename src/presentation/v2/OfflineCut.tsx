// V2 offline cut ("animatic"): hard cuts on the music grid, raw provisional text,
// NO motion design. Driven entirely by EDL in config.ts.
import React from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, staticFile} from 'remotion';
import {COLORS, CROP, Clip, EDL, FONTS, SOURCES, V2_AUDIO, alpha, edlStarts} from '../config';

const FPS = 30;

/** Source footage, cropped (scale ≥ 1.18 anchored top) so burnt-in logos stay out of frame. */
export const ClipView: React.FC<{clip: Clip; style?: React.CSSProperties}> = ({clip, style}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>
    <AbsoluteFill style={{scale: String(clip.scale ?? CROP.scale), transformOrigin: 'top center'}}>
      <Video
        src={staticFile(SOURCES[clip.src])}
        muted
        objectFit="cover"
        trimBefore={Math.round(clip.in * FPS)}
        playbackRate={clip.rate ?? 1}
        style={{width: '100%', height: '100%'}}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Triptych: React.FC<{panels: Clip[]; beat: number}> = ({panels, beat}) => (
  <AbsoluteFill style={{background: COLORS.white, display: 'flex', flexDirection: 'row', gap: 6}}>
    {panels.map((p, i) => (
      <div key={i} style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
        <Sequence from={i * beat} layout="absolute-fill">
          <ClipView clip={p} />
        </Sequence>
      </div>
    ))}
  </AbsoluteFill>
);

const TempText: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: 'absolute',
      left: 60,
      bottom: 60,
      maxWidth: 1500,
      padding: '14px 22px',
      background: alpha('navy', 0.75),
      color: COLORS.white,
      fontFamily: `'${FONTS.sans}', '${FONTS.cyrillic}', '${FONTS.jp}'`,
      fontWeight: 700,
      fontSize: 46,
      lineHeight: 1.2,
    }}
  >
    {text}
  </div>
);

export const OfflineCut: React.FC = () => {
  const starts = edlStarts();
  return (
    <AbsoluteFill style={{background: 'black'}}>
      {EDL.map((s, i) => (
        <Sequence key={s.id} from={starts[i]} durationInFrames={s.dur} name={s.id}>
          {s.kind === 'video' && s.clip ? <ClipView clip={s.clip} /> : null}
          {s.kind === 'triptych' && s.panels ? <Triptych panels={s.panels} beat={V2_AUDIO.beat} /> : null}
          {(s.kind === 'photo' || s.kind === 'still') && s.image ? (
            <AbsoluteFill style={{overflow: 'hidden'}}>
              <Img
                src={staticFile(s.image)}
                style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(s.kind === 'still' ? CROP.scale : 1), transformOrigin: 'top center'}}
              />
            </AbsoluteFill>
          ) : null}
          {s.text ? <TempText text={s.text} /> : null}
          <div style={{position: 'absolute', right: 24, top: 18, color: 'white', fontFamily: 'monospace', fontSize: 30, textShadow: '0 0 6px black'}}>{s.id}</div>
        </Sequence>
      ))}
      <Audio src={staticFile(V2_AUDIO.music)} />
    </AbsoluteFill>
  );
};
