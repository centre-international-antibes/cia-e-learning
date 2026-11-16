# BRIEF CLAUDE CODE — Film motion design « Centre International d'Antibes — Présentation »

> À coller tel quel dans Claude Code, **à la racine du kit** (le dossier qui contient `assets-src/`).
> Ce film est le **film institutionnel** de la série vidéo CIA (après « Cooking Masterclass » et « Wine Tasting au Château de Crémat »). **Si le projet Remotion de ces vidéos existe, réutilise son code** (composants, polices, volet de transition, CTA, config) : on garde la même signature. Nouvelle composition, nouveau `config`.
>
> Source de vérité visuelle : **charte institutionnelle CIA juin 2026** (`assets-src/brand/charte-graphique-CIA.pdf`, résumée au §6). **Ne jamais utiliser `CIA-charte-graphique.md`** (charte de l'app e-learning : or, Spark, Plus Jakarta Sans… tout est interdit ici).

---

## 0. RÔLE & MÉTHODE

Tu es **directeur artistique motion designer senior** (niveau studio, références : films de marque Apple, Airbnb, Aesop) **et développeur Remotion senior**. Tu livres un film de marque premium, pas une démo technique. La technique sert l'histoire : chaque effet doit avoir une raison d'être.

1. **Lis tout ce brief, la charte PDF et la brochure (`assets-src/docs/brochure2026en.pdf`) avant d'écrire une ligne.** Inspecte `assets-src/` (dimensions, orientation, durée des rushs, polices présentes).
2. Charge les skills Remotion disponibles et respecte-les : `remotion-best-practices` (routeur), `remotion-create`, `remotion-markup`, `remotion-maps`, `remotion-studio`, `remotion-render`. Utilise `remotion-docs` dès que tu as un doute sur une API.
3. Fais l'inventaire des médias. **Le film doit fonctionner même avec zéro rush** : il est d'abord typographique et graphique ; les images réelles viennent l'enrichir (voir §5).
4. Propose-moi d'abord un **plan court** : storyboard final, média choisi pour chaque plan (fichier + point d'entrée), technique utilisée par scène, musique, polices trouvées ou manquantes, faits que tu comptes afficher. **Attends ma validation.**
5. Construis **scène par scène**. Après chaque scène, rends **3 stills** (`npx remotion still`) et regarde-les toi-même. Corrige tout ce qui ne passe pas la checklist §11 avant de passer à la suivante.
6. Rends le master, extrais une **planche contact** (1 image/seconde) et un **contrôle audio** (loudness), vérifie-les, puis seulement dis-moi que c'est fini.

### Environnement : Claude Code sur le web (cloud)
- Tu travailles dans un dépôt GitHub **privé** cloné dans un conteneur Linux **sans GPU** : rends tout ce qui contient du Three.js avec `--gl=swangle`. Teste d'abord un rendu court (scène 1 seule) pour mesurer le temps de rendu ; si c'est trop lent, baisse la complexité du shader plutôt que de supprimer la scène.
- Vérifie au démarrage que `ffmpeg` et `python3` (numpy, scipy) sont présents ; installe ce qui manque (`pip install --break-system-packages`).
- Le réseau est filtré : npm et GitHub passent, les autres sites peuvent être bloqués. Si un téléchargement échoue (Mixkit, Wikimedia, tuiles Mapbox), **arrête-toi et dis-le-moi**, ne contourne pas.
- **Ne committe jamais les rendus dans git** (`out/` dans `.gitignore`). Livre les MP4, PNG et la planche contact en **release GitHub** : `gh release create v1-presentation out/* --title "Film présentation CIA v1" --notes "…"`. Les polices commerciales restent dans le dépôt privé, jamais dans une release.

---

## 1. LE FILM

**Objet :** présenter le Centre International d'Antibes (CIA) en 60 secondes : qui on est, où on est, ce qu'on propose, ce qu'on fait vivre.
**Message unique :** *apprendre le français ici, c'est vivre la Côte d'Azur* — la baseline de la marque : **« Don't learn French. Live it. »**
**Cibles :** futurs étudiants adultes et parents de juniors (internationaux), agents et partenaires, salons professionnels.
**Diffusion :** site web (hero / page À propos), YouTube, LinkedIn, salons, écrans de l'accueil. **Doit fonctionner sans le son.**
**Ton :** solaire, élégant, confiant, international. Calme et précis, jamais agité. Premium, jamais luxe ostentatoire.
**Action attendue :** visiter **www.cia-france.com** (jamais centreantibes.com).

### Faits validés, utilisables à l'écran (sources : brochure 2026 + direction)
- Fondé en **1985** (« Since 1985 »). Ne calcule pas d'ancienneté (« 41 ans ») : elle change chaque année.
- **≈ 10 000 étudiants par an** (« 10,000 students a year »).
- **50+ nationalités** (brochure). *Un chiffre « 60+ » circule en interne : n'affiche que 50+ tant que je ne l'ai pas confirmé.*
- Labels qualité **FLE** (Qualité FLE) et **EAQUALS** — en texte uniquement, **pas leurs logos** (pas fournis, pas d'autorisation).
- Établissement d'enseignement supérieur privé.
- **3 destinations** : **Antibes, Juan-les-Pins, Cannes**.
- Écoles : **Le Port** (vieil Antibes, à deux pas des plages, du marché provençal et du port ; 10 salles + cuisine pour les ateliers culinaires) · **Le Château** (ancien mas provençal, 22 salles, restaurant panoramique, jardin méditerranéen) · **campus de Cannes** classé monument historique.
- Adultes : **12 étudiants maximum par classe**, tous niveaux, cours toute l'année.
- Programmes adultes : Intensive, DELF, Business French / Manager, 50+, Wine & Cooking.
- Juniors : **6 à 17 ans**, séjours tout compris, activités et excursions (Monaco, Nice, Cannes), voile et sports nautiques.
- Groupes scolaires et séjours sur mesure.

### À ne pas afficher
- « The most popular language camp in France » ou tout autre superlatif non prouvé.
- Qualiopi, Bildungsurlaub, adresses exactes, **tout prix** (le film doit vivre plusieurs saisons).
- Le taux de réussite DELF de 97 % : **à confirmer** avant usage ; par défaut, ne l'affiche pas.
- Tout témoignage ou citation attribué à une personne visible à l'écran.
- La mascotte Spark, l'or, les éléments de gamification (réservés à l'app e-learning).

---

## 2. FORMAT & CONTRAINTES

| Paramètre | Valeur |
|---|---|
| Master | **1920×1080** (16:9), 30 fps, **60 s = 1 800 frames** exactement |
| Déclinaisons | **1080×1920** (9:16, Reels/Stories/Shorts) + **cutdown 20 s** 16:9 (voir §10) — même code, config différente |
| Langue à l'écran | **anglais** ; tous les textes dans `config.ts` avec une version **FR** prête (`LANG = 'en' \| 'fr'`) |
| Texte | titres de **2 à 5 mots** ; jamais plus de 2 niveaux de texte à l'écran en même temps |
| Compréhension | « école de français sur la Côte d'Azur » comprise **avant 8 s**, sans le son |
| Voix off | aucune |
| Export | MP4 H.264, CRF 16, AAC 320k + poster PNG + planche contact |

---

## 3. STORYBOARD (60 s)

Convention : `MOT` en **gras** = Avenir Next Bold ; mot en *rouge* = accent `#E64353` (un seul par écran).

| # | Temps | Rôle | Visuel & technique | Texte à l'écran | Mouvement |
|---|---|---|---|---|---|
| 1 | **0–6,5 s** (195 f) | **Accroche : le monde entier** | Fond : lumière méditerranéenne générée en **shader WebGL** (`@remotion/three`, plan plein cadre, reflets d'eau / caustiques lents, teintes **uniquement** dérivées de `#11263D` et `#283371` + blanc). Si un rush mer/port de qualité existe, il remplace le shader sous un voile bleu. | Au centre, salutations qui défilent en accélérant : `Hello` · `Hallo` · `Hola` · `Ciao` · `Olá` · `Привет` · `Merhaba` · `こんにちは` · `你好` → atterrissage sur **`Bonjour`** (tenu 1,5 s). Puis surtitre : `CENTRE INTERNATIONAL D'ANTIBES · SINCE 1985`. | Chaque mot entre en masque vertical + léger flou de mouvement (`@remotion/motion-blur`, `<CameraMotionBlur>`), cadence 10 f → 4 f. « Bonjour » : arrêt net, barre rouge qui s'étire dessous. |
| 2 | **6,5–14 s** (225 f) | **Lieu : la Côte d'Azur** | **Carte animée** : plan Europe → descente sur la Côte d'Azur, le trait de côte se dessine, 3 points s'allument. Méthode : skill **`remotion-maps`** (Mapbox, style épuré re-coloré en palette CIA) **si un token Mapbox est dans `.env`** ; sinon carte SVG maison : trait de côte Natural Earth (domaine public) projeté avec `d3-geo`, dessiné avec `@remotion/paths` (`evolvePath`). | Titre : `LEARN FRENCH` / **`ON THE FRENCH RIVIERA`** + 3 étiquettes aux points : `ANTIBES` · `JUAN-LES-PINS` · `CANNES`. | Caméra qui plonge (scale + translate, easing zoom lent). Points : cercles (`@remotion/shapes`) + onde concentrique unique, décalage 8 f. Étiquettes en surtitre. |
| 3 | **14–22,5 s** (255 f) | **Crédibilité : les chiffres** | Fond blanc. 3 compteurs alignés + ligne de labels. Fines lignes de grille bleues qui se tracent, grain subtil (`@remotion/noise`, amplitude très faible). | `SINCE` **`1985`** · **`10,000`** `students a year` · **`50+`** `nationalities` — puis ligne secondaire : `Accredited by Qualité FLE & EAQUALS`. | Compteurs qui roulent (chiffres tabulaires, `font-variant-numeric: tabular-nums`) avec easing de sortie, décalage 12 f. Barre rouge sous le chiffre central seulement. |
| 4 | **22,5–35 s** (375 f) | **Les écoles** | **3 cartes photo dans un espace 3D** (`@remotion/three` : plans texturés, caméra en travelling latéral lent, profondeur de champ légère). Une carte = une école. Médias : photos/vidéos des écoles dans `assets-src/` ; sinon photos libres de droits des lieux (vieil Antibes, Juan-les-Pins, Cannes — Wikimedia Commons, crédit obligatoire). | Surtitre : `OUR SCHOOLS` puis, carte par carte : `LE PORT` — `Antibes Old Town, steps from the beach` · `LE CHÂTEAU` — `A Provençal mas, 22 classrooms` · `CANNES` — `A listed historic campus`. | La caméra s'arrête ~2,5 s devant chaque carte, la légende arrive à ce moment-là. Parallaxe 2,5D dans chaque photo (2 couches si détourage propre possible, sinon zoom lent). |
| 5 | **35–46,5 s** (345 f) | **Les programmes** | Fond blanc, grille éditoriale à 3 colonnes. Pictos Lucide au trait (SVG inline) **qui se dessinent** (`@remotion/paths`, longueur de trait animée). | Titre : `A PROGRAMME` / **`FOR EVERY LEARNER`**. Colonnes : **`ADULTS`** — `Intensive · DELF · Business French · 50+ · Wine & Cooking` · **`JUNIORS 6–17`** — `Summer camps · Watersports · Sailing` · **`GROUPS`** — `Schools · Tailor-made stays`. | Colonnes en cascade (10 f), puces qui apparaissent mot par mot (3 f). Une fine bande `#283371` passe derrière la colonne active, de gauche à droite. |
| 6 | **46,5–56 s** (285 f) | **La vie : « Live it »** | **Montage rythmé** de 6 à 8 plans réels calés sur les temps de la musique : classe en petit groupe, terrasse/vieille ville, marché, plage, atelier cuisine, voile, excursion (Monaco / Nice). Étalonnage commun (§5). Sans rush : séquence de cartes photo plein cadre. | Un mot par plan, sur le temps fort : `LEARN.` · `TASTE.` · `SAIL.` · `EXPLORE.` · *`LIVE.`* (le dernier en rouge). | Coupes franches sur les temps. Mot en masque rapide (8 f), tenu jusqu'à la coupe. Aucun mot sur un visage. |
| 7 | **56–60 s + tenue** (240 f) | **Signature** | Fond blanc. Logo CIA couleur (version avec baseline si fournie). | Baseline : `Don't learn French.` (Avenir Next) / *`Live it.`* en **Better Together rouge**, **tracé à la plume** : glyphes convertis en chemins (`opentype.js`) puis `evolvePath`. Puis `www.cia-france.com` et bouton **`DISCOVER OUR PROGRAMMES`**. Crédits en bas, en petit. | Logo : fondu + légère montée. « Live it. » s'écrit en 30 f. Bouton : apparition douce, la barre rouge souligne. **Image fixe ≥ 2,5 s** à la fin. |

**Transitions** (20 f, easing in-out, jamais linéaire) : signature de la série = **volet bleu `#283371` bordé d'un filet rouge `#E64353`** pour 2→3, 4→5 et 6→7 ; **fondus** pour 1→2, 3→4, 5→6.
Calcul : 195 + 225 + 255 + 375 + 345 + 285 + 240 − 6 × 20 = **1 800 frames**.

**Petite signature de marque** : sur les plans vidéo sombres (scènes 1, 2, 6), logo **bandeau blanc** discret en haut à droite, 60 % d'opacité.

---

## 4. STACK TECHNIQUE — TOUT CE QUE CLAUDE CODE SAIT FAIRE, AU SERVICE DU FILM

| Technologie | Usage dans le film | Si indisponible |
|---|---|---|
| **Remotion 4** (`TransitionSeries`, `interpolate`, `spring`, `Easing`) | Moteur du film, toute l'animation pilotée par la frame | — |
| **`@remotion/three`** (Three.js / R3F) | Shader de lumière méditerranéenne (sc. 1), cartes 3D et travelling caméra (sc. 4) | Sc. 1 : dégradé radial animé en palette ; sc. 4 : cartes 2D en perspective CSS |
| **Skill `remotion-maps`** (Mapbox) | Descente sur la Côte d'Azur (sc. 2) | Carte SVG `d3-geo` + Natural Earth + `@remotion/paths` |
| **`@remotion/paths`** | Trait de côte, pictos qui se dessinent, baseline manuscrite tracée | — |
| **`opentype.js`** | Conversion des glyphes Better Together en chemins SVG | Fondu + masque gauche→droite sur « Live it. » |
| **`@remotion/shapes`** | Points et ondes sur la carte | Cercles SVG à la main |
| **`@remotion/motion-blur`** | Flou de mouvement sur la typo rapide (sc. 1, 6) | Flou CSS léger pendant le mouvement |
| **`@remotion/noise`** | Dérive organique très légère, grain | Pas de grain |
| **`@remotion/transitions`** | Fondus + volet signature (présentation custom) | — |
| **`@remotion/media`** / `<OffthreadVideo>` | Rushs, muets, avec `trimBefore` | — |
| **`@remotion/fonts`** | Avenir Next, Better Together, Noto Sans (CJK/cyrillique), chargées en local | Nunito Sans (voir §6) |
| **Python (numpy / scipy)** | Musique originale et bruitages générés (§7) | — |
| **ffmpeg** | Planche contact, contrôle loudness (`ebur128`), poster, vérifs | — |

Règles Three.js : animer **uniquement** depuis `useCurrentFrame()` (jamais `useFrame` de R3F), `<ThreeCanvas>` aux dimensions de la composition, rendu avec `--gl=swangle` (environnement cloud sans GPU). Vérifie qu'il n'y a **aucun scintillement** entre deux frames consécutives.

**Ne pas utiliser** : Lottie de Spark, librairies d'icônes autres que Lucide, effets « tech » (glitch, néon, particules gaming, lens flare), polices chargées depuis un CDN au rendu.

---

## 5. MÉDIAS & DROITS

### Contenu attendu du kit
```
assets-src/
├─ brand/    LOGO CIA.png · LOGO CIA ssBL.png · Picto.png · charte-graphique-CIA.pdf
├─ docs/     brochure2026en.pdf (source des faits)
├─ photos/   photos CIA (écoles, classes, activités) — nom = sujet : le-port-*.jpg, le-chateau-*.jpg, cannes-*.jpg, class-*.jpg…
├─ video/    rushs CIA si disponibles (même convention de nommage)
├─ fonts/    Avenir Next (Regular, Medium, Bold) + Better Together
└─ audio/    optionnel : musique sous licence
```
Inspecte les 3 logos et déduis lequel est la version principale, sans baseline, et le picto. **En cas de doute, demande-moi.**

### Ordre de priorité des images
1. **Médias CIA** fournis dans `assets-src/` (toujours en premier).
2. **Libres de droits vérifiables** : Mixkit (licence libre), Wikimedia Commons (lieux : vieil Antibes, port Vauban, Juan-les-Pins, Croisette — crédit CC obligatoire). Écris un script `scripts/download-media.sh` + un `CREDITS-LICENCES.md` (fichier, URL, auteur, licence). Vérifie que chaque fichier est bien une vidéo/image, pas une page d'erreur. Si le réseau bloque un site, **arrête-toi et dis-le-moi** au lieu de contourner.
3. **Rien** : le plan bascule en version graphique (carte photo remplacée par un aplat bleu + typo). Le film reste complet.

### Règles
- Les personnes des banques d'images sont des figurants : **ne jamais les présenter comme des étudiants du CIA**, ni écrire de témoignage sur leurs plans.
- Aucune personnalité publique, aucune marque tierce lisible à l'écran, aucun mineur identifiable dans les médias libres de droits.
- Rushs 720p : **zoom ≤ 1.05**. Étalonnage commun pour lier les sources : voile chaud identique (`rgba(255,190,120,.06)` en `soft-light`) + vignettage bleu `#11263D` doux, `filter: contrast(1.04) saturate(1.05)` au plus.
- Crédits sur la carte de fin, en bas, Avenir Next Regular 18 px, `#11263D` à 60 % (ex. `Photos: Wikimedia Commons, CC BY-SA 4.0 · Footage: Mixkit`).

---

## 6. CHARTE GRAPHIQUE CIA — juin 2026 (au pixel)

**Esprit :** institutionnel, international, premium, épuré. Le bleu domine, le rouge est un **accent subtil**. Beaucoup de blanc et d'air.

### Couleurs (3 couleurs + blanc, pas une de plus)
| Nom | HEX | Rôle |
|---|---|---|
| **Bleu profond** | `#11263D` | dominante : titres sur fond clair, voiles, bouton CTA, pictos, base du shader |
| **Bleu dense** | `#283371` | structure : volets, bandes, deuxième teinte du shader |
| **Rouge** | `#E64353` | **accent uniquement** : barre signature, filets, « Live it. », 1 mot clé max par écran |
| Blanc | `#FFFFFF` | fonds clairs, texte sur fond sombre |

Voile gauche autorisé : `linear-gradient(90deg, rgba(17,38,61,.88) 0%, rgba(17,38,61,.55) 38%, rgba(17,38,61,0) 68%)` (même logique vers le haut pour un texte en bas). Texte secondaire sur blanc : `#11263D` à 70 %.
Le shader et la carte peuvent utiliser des **opacités** de ces couleurs, jamais de nouvelles teintes.
**Interdits :** doré, dégradés décoratifs multicolores, néon, noir pur en aplat, grand aplat rouge, couleurs de l'app e-learning (`#0A3D62`, `#CCAE62`, `#1E90FF`).

### Typographie
| Niveau | Police | Taille (1920 px) | Style |
|---|---|---|---|
| Titre | Avenir Next **Regular** + **Bold** sur la partie clé | 96–112 px | MAJUSCULES, +0.02em, interligne 1.05 |
| Mot géant (sc. 1, 6) | Avenir Next Bold | 160–200 px | casse du mot, centré |
| Chiffres (sc. 3) | Avenir Next Bold, tabulaires | 140–160 px | — |
| Surtitre / étiquettes | Avenir Next Medium | 24–26 px | MAJUSCULES, **+0.25em** |
| Ligne secondaire | Avenir Next Regular | 32–36 px | casse normale |
| Baseline | Avenir Next Regular + **Better Together** | 72 / 96 px | « Live it. » en rouge |
| CTA | Avenir Next **Bold** | 44–48 px | MAJUSCULES, +0.08em |
| Crédits | Avenir Next Regular | 18 px | `#11263D` à 60 % |

Non-latin (sc. 1) : **Noto Sans** (cyrillique) et **Noto Sans JP / SC** (OFL), poids Medium, téléchargées dans `public/fonts/`.
**Si Avenir Next ou Better Together manquent :** arrête-toi et préviens-moi. Pour avancer : **Nunito Sans** (OFL) et un simple fondu sur « Live it. », signalé dans le rendu et le README.

### Éléments signature
- **Barre rouge** `#E64353` (≈ 72×32 px ou filet 64×6 px) sous chaque titre, animée (scaleX 0 → 1, origine à gauche).
- **Volet de transition** bleu `#283371` + filet rouge (repris de la série).
- **Bouton CTA** : rectangle `#11263D`, coins **4–6 px**, texte blanc Bold majuscules, padding 24×64 px, ombre douce max `0 12px 30px -12px rgba(17,38,61,.35)`.
- **Cartes photo** : coins **8 px**, bordure blanche 6 px, ombre `0 30px 60px -25px rgba(17,38,61,.35)`.
- **Pictos** : Lucide au trait 2 px `#11263D`, dans un cercle de 88 px (`graduation-cap`, `sun`, `users` pour la sc. 5).

### Logo
Pas de déformation, de recoloration, de dégradé, de rotation. Couleur sur fond clair, blanc sur fond sombre. Zone de protection = au moins la hauteur de « D'ANTIBES ». Sous ≈ 140 px de haut, version bandeau.

### Mise en page
Marges de sécurité **140 px** gauche/droite, **130 px** bas, **100 px** haut. Texte aligné à gauche et ancré en bas à gauche sur les plans vidéo ; centré seulement sur les scènes 1, 6 et 7. Une seule chose à regarder par plan.

---

## 7. MOTION DESIGN & SON

### Mouvement
- Tout est piloté par `useCurrentFrame()` + `interpolate()` (clamp) ou `spring()` amorti. **Aucune animation CSS.**
- Easings : sortie `Easing.bezier(0.16, 1, 0.3, 1)` · in-out `Easing.bezier(0.65, 0, 0.35, 1)` · zoom lent `Easing.bezier(0.33, 0, 0.2, 1)`. **Jamais linéaire.** Ressorts : `damping ≥ 20`, aucun rebond visible.
- Titres **ligne par ligne** (masque `overflow: hidden`, Y 100 % → 0 en 24 f, 5 f d'écart), barre rouge 6 f après la dernière ligne.
- Chaque titre reste **≥ 2 s lisible et immobile** (sauf les mots-rythme de la sc. 6, ≥ 20 f).
- Zoom photo sans bord blanc : décalage max (%) ≤ `(scale − 1) / 2 × 100` à chaque frame. Vérifie la 1re et la dernière frame de chaque plan.
- Coupes calées sur les temps de la musique : calcule les instants depuis le BPM dans `config.ts`.
- Rythme global : lent (1–2) → posé (3–5) → **accéléré** (6) → **respiration** (7).

### Son
- **Musique originale générée par script** (`scripts/make-music.py`, numpy/scipy) sauf si `assets-src/audio/` contient une piste sous licence : **100 BPM**, ré majeur, piano doux + cordes en pizzicato + nappe légère, percussions légères à partir de la sc. 3, montée nette sur la sc. 6 (kick doux, shaker), **arrêt sur « Live it. »** puis accord tenu et fondu sur 2,5 s. WAV 44,1 kHz stéréo, crête −1 dBFS. **Aucune musique sous droits.**
- **Bruitages générés**, discrets (gain 0,12–0,18) : souffle doux sur les volets, petit « tick » sur chaque point de la carte, léger « pop » feutré sur les compteurs, son de plume très discret sous « Live it. ». Rien sur les fondus.
- Rushs : **muets**.
- Mixage : ≈ **−16 LUFS** intégrés pour le web (vérifie avec `ffmpeg -af ebur128`), crête vraie ≤ −1 dBTP.

---

## 8. ARCHITECTURE DU CODE

```
cia-video-series/                  (projet existant de la série, ou nouveau)
├─ public/{photos,video,brand,fonts,audio,geo}/
├─ scripts/   download-media.sh · prepare-assets.py · make-music.py · contact-sheet.sh
├─ src/
│  ├─ presentation/
│  │  ├─ config.ts        # ⚠ SOURCE UNIQUE : VIDEO, SCENES (durées), TRANSITION_FRAMES, COLORS, TYPE,
│  │  │                   #   TEXT {en, fr}, FACTS, ASSETS (fichier + trimBefore), AUDIO (BPM, beats),
│  │  │                   #   EASINGS, LAYOUT (16:9 / 9:16), CREDITS, MAP (bbox, villes, lat/lng)
│  │  ├─ scenes/          Hello · Riviera · Numbers · Schools · Programmes · LiveIt · Signature
│  │  ├─ three/           MedLightShader · SchoolCards3D
│  │  ├─ map/             RivieraMapbox · RivieraSvg
│  │  └─ PresentationFilm.tsx   # <TransitionSeries> + musique + bruitages calés sur config
│  ├─ shared/             (composants de la série) Headline · RedBar · Kicker · Scrim · BrandWipe ·
│  │                      BrandLogo · CtaButton · Credits · VideoShot · PhotoCard · Counter · DrawIcon ·
│  │                      HandwrittenPath
│  ├─ fonts.ts
│  └─ Root.tsx            # compositions CiaPresentation-16x9, CiaPresentation-9x16, CiaPresentation-20s
└─ README.md
```
Règles : aucune valeur en dur dans les scènes ; `COLORS` = 3 couleurs charte + blanc (grep : aucun autre `#` hors `config.ts`) ; tous les textes via `TEXT[LANG]` ; packages via `npx remotion add …` ; `npx tsc --noEmit` sans erreur ; aucun appel réseau au rendu (tuiles de carte comprises : si Mapbox, pré-télécharge ou vérifie que le rendu reste déterministe).

---

## 9. CONSTRUCTION — ORDRE IMPOSÉ

1. Config + polices + composants partagés → still de test typo (vérifie qu'Avenir Next est **réellement** chargée).
2. Scène 7 (signature) en premier : c'est elle qui fixe le niveau de finition.
3. Scènes 1 → 6.
4. Assemblage, transitions, musique, bruitages.
5. Déclinaisons 9:16 et 20 s.
6. Rendus finaux + contrôles.

---

## 10. DÉCLINAISONS

- **9:16 (`CiaPresentation-9x16`, 1080×1920, 60 s)** : titres 84 px, mot géant 140 px ; marges 80 px côtés / 220 px bas / 180 px haut ; carte recadrée verticalement (Antibes→Cannes en diagonale) ; colonnes de la sc. 5 empilées ; cartes 3D de la sc. 4 en défilement vertical.
- **Cutdown 20 s (`CiaPresentation-20s`, 16:9, 600 f)** : sc. 1 courte (Bonjour seul, 3 s) → sc. 2 (5 s) → sc. 6 (7 s) → sc. 7 (5 s). Recalcule les transitions pour tomber pile sur 600 frames.
- **Version FR** : même compositions avec `LANG='fr'` (`Apprendre le français` / **`sur la Côte d'Azur`**, etc. — propose les textes FR dans ton plan). La baseline reste en anglais (c'est la signature de marque).

---

## 11. CHECKLIST QUALITÉ

- [ ] « École de français sur la Côte d'Azur » compris **avant 8 s**, sans le son.
- [ ] Seuls les faits du §1 apparaissent ; aucun élément de la liste « à ne pas afficher » ; site = **www.cia-france.com**.
- [ ] **Uniquement** `#11263D`, `#283371`, `#E64353` et le blanc (et leurs opacités) ; aucun doré, aucune couleur de l'app e-learning.
- [ ] Avenir Next réellement chargée ; Better Together **uniquement** sur « Live it. » ; glyphes CJK/cyrilliques sans carrés vides.
- [ ] Logo conforme (ratio, zone de protection, version adaptée au fond).
- [ ] Carte : Antibes, Juan-les-Pins et Cannes **géographiquement justes** (ordre est→ouest : Antibes, Juan-les-Pins, Cannes).
- [ ] Three.js : aucun scintillement, aucune frame noire, rendu déterministe (2 rendus d'une même frame identiques).
- [ ] Aucun bord blanc pendant les zooms ; aucun texte sur un visage ; aucun plan flou (zoom ≤ 1.05 sur rushs 720p).
- [ ] Transitions fluides, aucun easing linéaire, aucun rebond visible.
- [ ] Crédits de toutes les sources présents et lisibles ; `CREDITS-LICENCES.md` complet.
- [ ] Durées exactes : 1 800 f (master et 9:16), 600 f (cutdown) ; image fixe finale ≥ 2,5 s.
- [ ] Son : −16 LUFS ± 1, crête ≤ −1 dBTP, pas de clic aux coupes ; coupes de la sc. 6 sur les temps.

---

## 12. LIVRABLES

1. `out/cia-presentation-60s-1920x1080-en.mp4` (+ `-fr`)
2. `out/cia-presentation-60s-1080x1920-en.mp4`
3. `out/cia-presentation-20s-1920x1080-en.mp4`
4. `out/poster.png` (« Bonjour » de la sc. 1) + `out/poster-end.png` (signature)
5. `out/contact-sheet.png` (1 image/seconde, master)
6. Projet propre + `README.md` (commandes, polices, sources, comment changer un texte ou une durée) + `CREDITS-LICENCES.md`

```bash
bash scripts/download-media.sh          # seulement si des médias libres sont nécessaires
python3 scripts/make-music.py
npm run dev
npx remotion render CiaPresentation-16x9 out/cia-presentation-60s-1920x1080-en.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle
npx remotion render CiaPresentation-9x16 out/cia-presentation-60s-1080x1920-en.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle
npx remotion render CiaPresentation-20s out/cia-presentation-20s-1920x1080-en.mp4 --codec=h264 --crf=16 --audio-bitrate=320k --gl=swangle
npx remotion still CiaPresentation-16x9 out/poster.png --frame=150
bash scripts/contact-sheet.sh out/cia-presentation-60s-1920x1080-en.mp4
```
