// Assembly: scenes + transitions + score + sound effects, all timed from config.ts.
import React from 'react';
import {Audio} from '@remotion/media';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Sequence, staticFile} from 'remotion';
import {AUDIO, CUTDOWN, EASE, SCENES, SCENE_ORDER, SceneKey, TRANSITIONS, TRANSITION_FRAMES, sceneStart} from './config';
import {SCENE_COMPONENTS} from './scenes';
import {brandWipe} from '../shared/BrandWipe';
import {MAP_T} from './map/RivieraSvg';
import {NUMBERS_T} from './scenes/Numbers';
import {SIGNATURE_T} from './scenes/Signature';

const timing = linearTiming({durationInFrames: TRANSITION_FRAMES, easing: EASE.inOut});
const presentation = (kind: 'fade' | 'wipe') =>
  (kind === 'wipe' ? brandWipe() : fade()) as unknown as TransitionPresentation<Record<string, unknown>>;

type Sfx = {at: number; src: keyof typeof AUDIO.sfx};

const SfxTrack: React.FC<{cues: Sfx[]}> = ({cues}) => (
  <>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.at} durationInFrames={45} layout="none">
        <Audio src={staticFile(AUDIO.sfx[c.src])} volume={AUDIO.sfxGain[c.src]} />
      </Sequence>
    ))}
  </>
);

/** Sound-effect cues for a scene starting at global frame `start` (local offset applied). */
const cuesFor = (key: SceneKey, start: number, offset = 0): Sfx[] => {
  const at = (local: number) => start + local - offset;
  const keep = (local: number) => local - offset >= 0;
  switch (key) {
    case 'riviera':
      return [0, 1, 2].map((i) => MAP_T.city0 + i * MAP_T.cityStagger).filter(keep).map((l) => ({at: at(l), src: 'tick' as const}));
    case 'numbers':
      return [0, 1, 2].map((i) => NUMBERS_T.first + i * NUMBERS_T.stagger + NUMBERS_T.countDuration - 6).filter(keep).map((l) => ({at: at(l), src: 'pop' as const}));
    case 'signature':
      return [{at: at(SIGNATURE_T.live), src: 'pen' as const}];
    default:
      return [];
  }
};

export const PresentationFilm: React.FC = () => {
  const cues: Sfx[] = [];
  SCENE_ORDER.forEach((k, i) => {
    cues.push(...cuesFor(k, sceneStart(k)));
    // breath on the signature wipes (no sound on fades)
    if (i > 0 && TRANSITIONS[i - 1] === 'wipe') cues.push({at: sceneStart(k) - 4, src: 'whoosh'});
  });
  return (
    <>
      <TransitionSeries>
        {SCENE_ORDER.map((k, i) => {
          const C = SCENE_COMPONENTS[k];
          return (
            <React.Fragment key={k}>
              {i > 0 ? <TransitionSeries.Transition presentation={presentation(TRANSITIONS[i - 1])} timing={timing} /> : null}
              <TransitionSeries.Sequence durationInFrames={SCENES[k]} premountFor={30}>
                <C />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <Audio src={staticFile(AUDIO.music)} volume={AUDIO.musicVolume} />
      <SfxTrack cues={cues} />
    </>
  );
};

/** 20 s cutdown: Bonjour → Riviera → Live it → Signature (600 frames). */
export const PresentationCutdown: React.FC = () => {
  const cues: Sfx[] = [];
  let t = 0;
  CUTDOWN.scenes.forEach((s, i) => {
    cues.push(...cuesFor(s.key, t, s.offset));
    if (i > 0 && CUTDOWN.transitions[i - 1] === 'wipe') cues.push({at: t - 4, src: 'whoosh'});
    t += s.duration - TRANSITION_FRAMES;
  });
  return (
    <>
      <TransitionSeries>
        {CUTDOWN.scenes.map((s, i) => {
          const C = SCENE_COMPONENTS[s.key];
          return (
            <React.Fragment key={s.key}>
              {i > 0 ? <TransitionSeries.Transition presentation={presentation(CUTDOWN.transitions[i - 1])} timing={timing} /> : null}
              <TransitionSeries.Sequence durationInFrames={s.duration} premountFor={30}>
                <Sequence trimBefore={s.offset} layout="absolute-fill">
                  <C />
                </Sequence>
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <Audio src={staticFile(AUDIO.musicCutdown)} volume={AUDIO.musicVolume} />
      <SfxTrack cues={cues.filter((c) => c.at >= 0)} />
    </>
  );
};
