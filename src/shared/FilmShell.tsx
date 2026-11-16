import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender} from 'remotion';
import {fontsLoaded} from '../fonts';
import {COLORS, Lang} from '../presentation/config';
import {LangProvider} from './context';

/** Waits for local fonts, provides language, sets the base background.
 *  Children mount only once fonts are ready, so fitText/measureText measure the real font. */
export const FilmShell: React.FC<{lang: Lang; children: React.ReactNode}> = ({lang, children}) => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontsLoaded
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return (
    <LangProvider lang={lang}>
      <AbsoluteFill style={{background: COLORS.white}}>{ready ? children : null}</AbsoluteFill>
    </LangProvider>
  );
};
