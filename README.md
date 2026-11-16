# Film « Centre International d'Antibes — Présentation » (60 s)

Film institutionnel du CIA, fabriqué avec **Remotion 4** (React). Message : *Don't learn French. Live it.*
Branche isolée `video-presentation-cia` — ne contient que ce film. **Ne jamais fusionner dans `main`.**

Charte : *Charte graphique CIA juin 2026* (`assets-src/brand/charte-graphique-CIA.pdf`) — 3 couleurs + blanc
(`#11263D`, `#283371`, `#E64353`, `#FFFFFF`), Avenir Next + Better Together.

## Compositions

| ID | Format | Durée |
|---|---|---|
| `CiaPresentation-16x9` | 1920×1080, 30 fps | 1 800 f (60 s) |
| `CiaPresentation-9x16` | 1080×1920, 30 fps | 1 800 f (60 s) |
| `CiaPresentation-20s` | 1920×1080, 30 fps | 600 f (20 s) |
| `Scenes/Scene-<scène>` (+ `-9x16`) | une scène seule | pour travailler une scène |

Langue : prop `lang` (`"en"` par défaut, `"fr"`). La baseline reste en anglais (signature de marque).

## Commandes

```bash
npm install
bash scripts/download-media.sh          # médias libres (Wikimedia) → media-free/
python3 scripts/prepare-assets.py       # photos/vidéos/polices → public/ (+ assets.generated.json)
node scripts/prepare-brand.mjs          # logos SVG, glyphes de la baseline, trait de côte (nécessite Playwright)
python3 scripts/make-music.py           # musique originale + bruitages → public/audio/
npm run dev                             # Remotion Studio
```

Rendus (Three.js → `--gl=swangle`, déjà réglé dans `remotion.config.ts`) :

```bash
npx remotion render CiaPresentation-16x9 out/cia-presentation-60s-1920x1080-en.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle
npx remotion render CiaPresentation-16x9 out/cia-presentation-60s-1920x1080-fr.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle --props='{"lang":"fr"}'
npx remotion render CiaPresentation-9x16 out/cia-presentation-60s-1080x1920-en.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle
npx remotion render CiaPresentation-20s out/cia-presentation-20s-1920x1080-en.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle
npx remotion still CiaPresentation-16x9 out/poster.png --frame=150
npx remotion still CiaPresentation-16x9 out/poster-end.png --frame=1799
bash scripts/contact-sheet.sh out/cia-presentation-60s-1920x1080-en.mp4
```

Dans ce conteneur cloud, Remotion utilise le Chromium pré-installé (`/opt/pw-browsers/…`). Ailleurs, il télécharge
son propre navigateur, ou on lui indique un binaire avec `REMOTION_BROWSER=/chemin/vers/chrome`.

## Changer un texte, une durée, un média

Tout est dans **`src/presentation/config.ts`** (source unique) :

- **Textes** : `TEXT.en` / `TEXT.fr`.
- **Durées des scènes** : `SCENES` (la somme − 6 × 20 doit rester égale à 1 800 ; la composition échoue sinon).
- **Cutdown 20 s** : `CUTDOWN` (durées calculées pour tomber sur les temps de la musique).
- **Médias** : `ASSETS` (photo de chaque carte de la scène 4, plans de la scène 6, `liveItCuts` = coupes sur les temps).
- **Couleurs / typo / marges** : `COLORS`, `TYPE`, `LAYOUT`. Aucune autre couleur n'existe dans `src/`.
- **Faits affichés** : `FACTS` (1985, 10 000 étudiants/an, 50+ nationalités).
- **Carte** : `MAP` (villes, cadrage Europe → Côte d'Azur).
- **Musique** : `AUDIO` (100 BPM, 1 temps = 18 frames). Si on change la structure, régénérer avec `make-music.py`.

## Polices

Les fichiers Avenir Next et Better Together **n'étaient pas fournis** : le film utilise **Nunito Sans** (OFL), signalé ici.
Pour basculer sans rien recoder : déposer dans `assets-src/fonts/` les fichiers Avenir Next Regular / Medium / Bold
(noms contenant `avenir`, `regular|medium|bold`), relancer `python3 scripts/prepare-assets.py`, puis rendre.
« Live it. » est tracé à la plume à partir des **glyphes vectoriels de la baseline du logo officiel** (Better Together),
il ne dépend donc pas du fichier de police.

## Médias & droits

Voir `CREDITS-LICENCES.md`. Points d'attention :
- Rushs CIA recadrés ×1,08 pour retirer le logo incrusté ; films *Wine & Cooking* et *Senior* non utilisés (badge vimeo).
- Juniors : autorisations parentales confirmées par le CIA (16/11/2026) ; le montage actuel n'utilise que des plans de dos ou lointains.
- Photo de dégustation (`wine-tasting-toast.jpg`) non utilisée ; photo cuisine cadrée pour exclure une marque.
- Résidence Astor : carte en scène 4 avec le nom seul (aucune légende validée pour l'instant — `TEXT.*.schools.cards`).

## Arborescence

```
public/{photos,video,brand,fonts,audio}/   médias prêts au rendu (générés par les scripts)
scripts/   download-media.sh · prepare-assets.py · prepare-brand.mjs · make-music.py · contact-sheet.sh
src/
  presentation/config.ts          source unique
  presentation/scenes/            Hello · Riviera · Numbers · Schools · Programmes · LiveIt · Signature
  presentation/three/             MedLightShader (repli scène 1) · SchoolCards3D
  presentation/map/               RivieraSvg + europe-10m.json (Natural Earth)
  presentation/PresentationFilm.tsx  assemblage, transitions, musique, bruitages
  shared/                         composants de la série (Headline, RedBar, BrandWipe, CtaButton, …)
  fonts.ts · Root.tsx
```
