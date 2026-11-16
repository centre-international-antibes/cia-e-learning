import React from 'react';
import {Composition, Folder} from 'remotion';
import {DEFAULT_LANG, Lang, SCENES, SceneKey, VIDEO} from './presentation/config';
import {FilmShell} from './shared/FilmShell';
import {SCENE_COMPONENTS} from './presentation/scenes';
import {PresentationFilm, PresentationCutdown} from './presentation/PresentationFilm';

type Props = {lang: Lang};
const defaultProps: Props = {lang: DEFAULT_LANG};

const SceneOnly: React.FC<Props & {scene: SceneKey}> = ({lang, scene}) => {
  const C = SCENE_COMPONENTS[scene];
  return (
    <FilmShell lang={lang}>
      <C />
    </FilmShell>
  );
};

export const RemotionRoot: React.FC = () => {
  const {landscape, portrait, fps} = VIDEO;
  return (
    <>
      <Composition
        id="CiaPresentation-16x9"
        component={({lang}: Props) => (
          <FilmShell lang={lang}>
            <PresentationFilm />
          </FilmShell>
        )}
        durationInFrames={VIDEO.durationInFrames}
        fps={fps}
        width={landscape.width}
        height={landscape.height}
        defaultProps={defaultProps}
      />
      <Composition
        id="CiaPresentation-9x16"
        component={({lang}: Props) => (
          <FilmShell lang={lang}>
            <PresentationFilm />
          </FilmShell>
        )}
        durationInFrames={VIDEO.durationInFrames}
        fps={fps}
        width={portrait.width}
        height={portrait.height}
        defaultProps={defaultProps}
      />
      <Composition
        id="CiaPresentation-20s"
        component={({lang}: Props) => (
          <FilmShell lang={lang}>
            <PresentationCutdown />
          </FilmShell>
        )}
        durationInFrames={VIDEO.cutdownDurationInFrames}
        fps={fps}
        width={landscape.width}
        height={landscape.height}
        defaultProps={defaultProps}
      />
      <Folder name="Scenes">
        {(Object.keys(SCENES) as SceneKey[]).map((k) => (
          <React.Fragment key={k}>
            <Composition
              id={`Scene-${k}`}
              component={(p: Props) => <SceneOnly {...p} scene={k} />}
              durationInFrames={SCENES[k]}
              fps={fps}
              width={landscape.width}
              height={landscape.height}
              defaultProps={defaultProps}
            />
            <Composition
              id={`Scene-${k}-9x16`}
              component={(p: Props) => <SceneOnly {...p} scene={k} />}
              durationInFrames={SCENES[k]}
              fps={fps}
              width={portrait.width}
              height={portrait.height}
              defaultProps={defaultProps}
            />
          </React.Fragment>
        ))}
      </Folder>
    </>
  );
};
