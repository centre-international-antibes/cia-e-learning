// Local font loading only (no CDN at render time).
// Avenir Next is used automatically when its files are in assets-src/fonts/
// (copied to public/fonts/ by scripts/prepare-assets.py); otherwise Nunito Sans (OFL).
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import generated from './presentation/assets.generated.json';
import {FONTS} from './presentation/config';

const brand = generated.brandFonts as Record<string, string>;

const faces: {family: string; url: string; weight: string; unicodeRange?: string}[] = [
  {family: FONTS.cyrillic, url: 'fonts/NotoSans-cyrillic-500.woff2', weight: '500'},
  {family: FONTS.cyrillic, url: 'fonts/NotoSans-latin-500.woff2', weight: '500'},
  {family: FONTS.jp, url: 'fonts/NotoSansJP-500.woff2', weight: '500'},
  {family: FONTS.sc, url: 'fonts/NotoSansSC-500.woff2', weight: '500'},
];

if (generated.avenirAvailable) {
  faces.push(
    {family: FONTS.sans, url: brand['avenir-400'], weight: '400'},
    {family: FONTS.sans, url: brand['avenir-500'], weight: '500'},
    {family: FONTS.sans, url: brand['avenir-700'], weight: '700'},
  );
} else {
  for (const w of ['400', '500', '700']) {
    faces.push({family: FONTS.sans, url: `fonts/NunitoSans-${w}.woff2`, weight: w});
  }
  faces.push(
    {family: FONTS.sans, url: 'fonts/NunitoSans-ext-400.woff2', weight: '400', unicodeRange: 'U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF'},
    {family: FONTS.sans, url: 'fonts/NunitoSans-ext-700.woff2', weight: '700', unicodeRange: 'U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF'},
  );
}

export const fontsLoaded = Promise.all(
  faces.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(f.url),
      weight: f.weight,
      display: 'block',
      ...(f.unicodeRange ? {unicodeRange: f.unicodeRange} : {}),
    }),
  ),
);

/** CSS font-family for a greeting, picking the right script. */
export const familyFor = (text: string) => {
  if (/[Ѐ-ӿ]/.test(text)) return `'${FONTS.cyrillic}', '${FONTS.sans}'`;
  if (/[぀-ヿ]/.test(text)) return `'${FONTS.jp}'`;
  if (/[一-鿿]/.test(text)) return `'${FONTS.sc}', '${FONTS.jp}'`;
  return `'${FONTS.sans}'`;
};
