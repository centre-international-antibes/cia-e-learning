import React, {createContext, useContext} from 'react';
import {useVideoConfig} from 'remotion';
import {CREDITS, DEFAULT_LANG, LAYOUT, Lang, TEXT, Text} from '../presentation/config';

const LangContext = createContext<Lang>(DEFAULT_LANG);

export const LangProvider: React.FC<{lang: Lang; children: React.ReactNode}> = ({lang, children}) => (
  <LangContext.Provider value={lang}>{children}</LangContext.Provider>
);

export const useLang = () => useContext(LangContext);
export const useText = (): Text => TEXT[useLang()];
export const useCredits = () => CREDITS[useLang()];

/** Layout for the current composition (16:9 or 9:16). */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const l = portrait ? LAYOUT.portrait : LAYOUT.landscape;
  return {...l, portrait, width, height};
};
