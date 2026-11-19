# CORRECTIONS V4 — Film de marque CIA (90 s)

Retours sur `cia-brand-film-90s-1920x1080-fr` (rendu final V3.2) : Jules + Vincent Gence (Directeur commercial).
Ce document complète `BRIEF.md` (V3 + §10). Il prime en cas de contradiction.

## A. NOUVELLE STRUCTURE (demande de Vincent Gence)

Ordre logique du parcours client : juniors → adultes → où l'on vit → ce qu'on découvre → l'expérience signature → l'émotion.

| # | Temps | Section | Contenu | Texte (FR / EN) |
|---|---|---|---|---|
| 1 | 0–6 s | Accroche | inchangée (salutations → Bonjour) | inchangé |
| 2 | 6–11 s | Promesse | drone + 3 étiquettes de villes | inchangé |
| 3 | 11–19 s | Chiffres | 1985 en défonce, 10 000 et 50+ sur vidéo, labels qualité sur plan de classe | inchangé |
| 4 | 19–34 s | **01 · Juniors** | T2 (panneau Juniors 8–17 / Juan-les-Pins Premium / Tout compris / Encadré) → **Le Château** (vidéo du mas plein cadre + étiquette : c'est l'école des juniors Premium) → classes juniors → rafale activités mer → « Les cours le matin. / La Riviera l'après-midi. » | inchangé |
| 5 | 34–51 s | **02 · Adultes** | T4 carte « Cours de français » → classes adultes → **Le Port** (collage, école des adultes) → transition interne vers **Programme 50+** (T1 ruelle, « Culture · Marchés · Excursions » puis « Votre rythme. Votre Riviera. ») | inchangé |
| 6 | 51–61 s | **03 · Résidences** | surtitre « Nos résidences / Our residences » → **Castel Arabel** (T6, phase petite photo ≤ 12 f, puis piscine en plan large) → **Astor** (collage) | « À 500 m de la plage » · « Au cœur de Juan-les-Pins » |
| 7 | 61–69 s | **04 · Excursions** | T1 sur drone (vieil Antibes ou baie) puis montage des sorties : marché de Nice / socca, ruelles, mer (catamaran), parfum (touches sans marque lisible), Saint-Paul / Monaco si plans disponibles | FR « EXCURSIONS » + « Nice · Monaco · Cannes · Grasse » / EN « EXCURSIONS » + « Nice · Monaco · Cannes · Grasse » |
| 8 | 69–79 s | **05 · Wine & Cooking** | triptyque (ouverture) → carte T4 → Château de Crémat (drone + chai) → on trinque | inchangé |
| 9 | 79–90 s | **Finale : l'expérience humaine** | 3 temps forts, chacun sur un plan tenu ~1,8 s (groupe qui rit, accolade / regard complice, coucher de soleil entre amis) avec un MOT géant (160–200 px, Bold, centré, masque vertical) : **Rencontres.** → **Émotions.** → **Souvenirs.** (EN : **Encounters.** → **Emotions.** → **Memories.**), le dernier mot avec la barre rouge → coucher de soleil + baseline (« Don't learn French. » 72 px min, « Live it. » 120 px min) → carte de fin 3 s | voir colonne contenu |

- Numérotation des chapitres : 01 à 05 (les résidences comptent comme un chapitre).
- Durées : ajuste à l'intérieur des sections, mais respecte les temps de lecture du §0 du BRIEF et le total **2 700 f pile**.
- Les plans juniors en mer restent en 01 ; les excursions (04) utilisent en priorité les plans senior (Nice, marché, socca, ruelles, parfum) et WC (drones, baie) non encore utilisés. Pas deux fois le même plan dans le film.

## B. RYTHME — CAUSE DU « HORS RYTHME »

Mesuré sur le rendu V3.2 : **57 coupes sur 76 tombent hors de la grille** (3 à 7 images d'écart par rapport aux temps de 15 f à 120 BPM). Cause : les « 4–6 images pour laisser l'animation se poser » ont été obtenues en **déplaçant les coupes**.

Règles :
1. **Toutes les coupes, tous les débuts de transition et tous les débuts de texte tombent sur un temps de la musique** (grille calculée dans MUSIC-EDIT.md, piste à 117,45 BPM, arrondi à l’image la plus proche, tolérance ±1 f). Les whip pans sont **centrés** sur un temps (6 f avant, 6 f après).
2. Pour qu'une animation se pose avant une coupe, **démarre-la plus tôt** (ou raccourcis-la), ne bouge jamais la coupe.
3. Rythme par section : respirations sur 2 ou 4 temps, rafales sur 1 temps (15 f) ; la finale ralentit (4 temps par mot).
4. **Si une piste est présente dans `assets-src/audio/`**, détecte son tempo et ses temps (librosa), et cale la grille sur cette piste au lieu des 120 BPM.
5. Contrôle à joindre : liste des coupes avec leur écart à la grille → **0 coupe hors grille**.

## C. FLUIDITÉ — DERNIERS POINTS

- **Écran presque noir vers 59 s**, entre le triptyque et la cheffe : supprime ce trou ; le triptyque doit passer directement à l'image suivante.
- Les 3 whip pans (≈ 37,5 s, 70,9 s, 81 s dans V3.2) : flou directionnel plus fort (`samples={10}`), mouvement 100 px/f max, centrés sur le temps.
- Séries dans le triptyque (56–58 s) : chaque panneau entre en 12 f minimum, pas 2–3 f.
- Contrôle §10 du BRIEF inchangé : aucune image répétée hors carte de fin, aucune série de pics hors coupes franches et whip pans.

## D. RETOUCHE V3.2 NON APPLIQUÉE

- Baseline sur le coucher de soleil : « Don't learn French. » **72 px minimum**, « Live it. » tracé **120 px minimum**. Toujours trop petite dans le rendu.

## E. LIVRAISON

1. `animatic-v4-540p.mp4` + planche contact 1 image/s + contrôle image par image + liste des coupes vs grille → **validation de Jules**.
2. Après validation : rendu final 1080p EN et FR (réglages inchangés), posters, contrôles.
