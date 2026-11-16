# BRIEF V2 — Film de marque « Centre International d'Antibes » (60 s)

> Branche **`video-presentation-cia`** du dépôt `centre-international-antibes/cia-e-learning`. Branche isolée : **ne jamais fusionner dans `main`**, commits sur cette branche uniquement.
> **La v1 est refusée.** Ce brief la remplace entièrement. Garde l'infrastructure du projet Remotion (config, polices, logo, composants utiles) mais **refais le film** : structure, montage, musique, motion design.
> Source de vérité visuelle : charte institutionnelle CIA (`assets-src/brand/charte-graphique-CIA.pdf`, résumée au §8). Jamais `CIA-charte-graphique.md` (app e-learning).

---

## 0. CE QUI NE VA PAS DANS LA V1 (à ne pas reproduire)

1. **C'est un diaporama, pas un film.** 47 s sur 60 sont des écrans graphiques (carte, compteurs sur fond blanc, cartes 3D, colonnes de programmes sur blanc). La vraie vidéo n'arrive qu'à 47 s.
2. **Trop lent.** Plans de 4 à 8 s, transitions longues, musique piano à 100 BPM sans énergie.
3. **Les 4 films pros sont presque inutilisés.** Ce sont la matière première du film.
4. **Les programmes phares sont listés en texte au lieu d'être montrés** : cours de français, Juniors Juan-les-Pins Premium, Wine & Cooking, 50+.
5. Ça ressemble aux petits clips cuisine. Ici, c'est **le film de marque** du CIA.

**Règle d'or v2 : la vidéo occupe 100 % du temps à l'écran.** Le motion design se pose **sur** les images, il ne les remplace plus. Aucun écran blanc ou bleu plein cadre avant la carte de fin.

---

## 1. RÔLE & MÉTHODE DE TRAVAIL (comme en post-production)

Tu es à la fois **vidéaste-monteur senior** (pubs de marque, films tourisme / lifestyle) et **motion designer senior**. Références de ton : films de marque Airbnb Experiences, Visit France / Atout France, campagnes EF Education First, Aesop pour la retenue typographique.

Travaille dans cet ordre, avec **deux validations de ma part** :

1. **Dérush.** Pour chaque film : planche contact 2 images/s, puis note les meilleurs plans (début/fin à 0,1 s près, cadrage, énergie, présence de visages, défauts). Les timecodes du §4 sont un point de départ à affiner, pas une contrainte.
2. **Musique** (§5) : récupère la piste, détecte le tempo et les temps forts (`librosa.beat.beat_track` ou `aubio`), construis la grille de montage sur la vraie musique.
3. **Montage offline (« animatic »)** : coupes franches calées sur la musique, textes provisoires bruts, **aucun motion design**. Rends en 960×540 et envoie-moi la vidéo + la planche contact 1 image/s. **⏸ Attends ma validation du montage.**
4. **Motion design** sur le montage validé (§6).
5. **Finition** : étalonnage commun, mixage, déclinaisons (§9). Contrôle §10, puis livraison dans la conversation.

---

## 2. LE FILM

- **Idée : « Une journée sur la Riviera, une vie en français. »** On vit une journée au CIA, du matin à la mer jusqu'au coucher de soleil, et chaque moment de la journée est un programme phare. La baseline arrive en conclusion, sur le coucher de soleil.
- **Message :** au CIA on n'apprend pas seulement le français, on le vit → **« Don't learn French. Live it. »**
- **Durée :** **60 s** (1 800 frames à 30 fps). **Langue :** anglais, version FR via `LANG`.
- **Rythme :** plan moyen **1 à 1,5 s**, 40 à 55 plans au total. Plans les plus courts : 8 frames (inserts). Plans les plus longs : 3 s (titre d'ouverture, coucher de soleil).
- **Sans le son**, on comprend en 5 s : école de français + Côte d'Azur + des gens heureux.

---

## 3. STRUCTURE (sur une grille de 120 BPM : 1 temps = 15 f, 1 mesure = 60 f, 30 mesures)

Si la musique réelle n'est pas à 120 BPM, **recale toutes les durées sur ses mesures**. La structure (proportions, temps forts) reste la même.

| Acte | Temps | Mesures | Rôle | Musique |
|---|---|---|---|---|
| A · Cold open | 0–4 s | 1–2 | 6 plans éclair, une salutation par plan | intro / montée |
| B · Titre | 4–10 s | 3–5 | Bonjour + titre sur le drone d'Antibes | **drop** à 4 s |
| C · 01 French Courses | 10–20 s | 6–10 | Écoles, profs, classes, international | groove |
| D · 02 Juniors Premium | 20–32 s | 11–16 | Juan-les-Pins Premium, Castel Arabel, mer | groove + énergie max |
| E · 03 Wine & Cooking | 32–43 s | 17–21 | Atelier cuisine → Château de Crémat | **break** (filtre, plus aéré) |
| F · 04 50+ & Culture | 43–50 s | 22–25 | Marché, vieil Antibes, culture | remontée |
| G · Finale | 50–60 s | 26–30 | Sourires en rafale → coucher de soleil → baseline → fin | **drop final** à 50 s, coup final à 56 s |

---

## 4. LISTE DE MONTAGE (EDL) — point de départ

Sources (`assets-src/video/`) : **COURS** = cours de français (60 s) · **JR** = junior program (34,5 s, 23,976 fps) · **WC** = wine & cooking (80 s) · **SR** = senior program (81 s). Timecodes en `mm:ss`, durées en frames 30 fps.
Mets l'EDL finale dans `config.ts` (`EDL: {src, in, out, dur, crop, text?}[]`), jamais en dur dans les scènes.

### A · Cold open (0–4 s, ~120 f)
| # | Source | In | Dur | Plan | Texte |
|---|---|---|---|---|---|
| A1 | JR | 00:00.3 | 22 f | Mer, voiliers, main au premier plan (POV) | `Hello` |
| A2 | JR | 00:02.5 | 18 f | Bouée tractée, éclaboussures | `Hola` |
| A3 | WC | 00:33.5 | 18 f | On trinque en cuisine | `Ciao` |
| A4 | COURS | 00:15.2 | 18 f | Prof très expressive | `Hallo` |
| A5 | SR | 00:09.3 | 18 f | Rires au marché | `Привет` |
| A6 | JR | 00:04.2 | 26 f | Ado qui rit et pointe la caméra | `こんにちは` |
Salutations en Avenir/Nunito Bold 140 px, blanc, centrées, **coupées net avec le plan** (pas de fondu).

### B · Titre (4–10 s, ~180 f)
| # | Source | In | Dur | Plan | Texte |
|---|---|---|---|---|---|
| B1 | SR | 00:01.0 | 110 f | Drone : de la mer vers le vieil Antibes | `Bonjour.` (sur le drop) → s'efface → titre `LEARN FRENCH` / **`ON THE FRENCH RIVIERA`** + barre rouge |
| B2 | WC | 00:36.0 | 70 f | Drone sur les toits d'Antibes et le port | surtitre `CENTRE INTERNATIONAL D'ANTIBES · SINCE 1985` + ligne `ANTIBES · JUAN-LES-PINS · CANNES` |

### C · 01 French Courses (10–20 s, ~300 f)
Étiquette de chapitre : `01` / `FRENCH COURSES` (+ sous-ligne `All levels · All year`).
| # | Source | In | Dur | Plan | Texte / info |
|---|---|---|---|---|---|
| C1 | COURS | 00:05.0 | 40 f | Le Château : le mas couvert de lierre | étiquette de lieu `LE CHÂTEAU` |
| C2 | COURS | 00:24.5 | 30 f | Drone sur les toits du vieil Antibes | étiquette de lieu `LE PORT · OLD TOWN` |
| C3 | COURS | 00:11.0 | 40 f | Arrivée des étudiants sous les drapeaux | compteurs `10,000 students a year` · `50+ nationalities` |
| C4 | COURS | 00:15.8 | 25 f | Prof expressive (autre moment que A4) | — |
| C5 | COURS | 00:18.0 | 25 f | Prof en sweat jaune, au tableau | — |
| C6 | COURS | 00:21.0 | 30 f | Groupe qui rit | chip `Max. 12 per class` |
| C7 | COURS | 00:32.5 | 12 f | Insert : main qui écrit | — |
| C8 | COURS | 00:29.0 | 30 f | Échange prof / étudiants | — |
| C9 | photo `le-port-balcony-view-port-vauban.jpg` | — | 40 f | Balcon de l'école Le Port, vue sur le port Vauban (zoom lent) | chip `Intensive · DELF · Business French` |
| C10 | COURS | 00:47.0 | 28 f | Terrasse, étudiants détendus | — |

### D · 02 Juniors — Juan-les-Pins Premium (20–32 s, ~360 f)
Étiquette de chapitre : `02` / `JUNIORS` + sous-ligne `Juan-les-Pins Premium · Ages 8–17`.
| # | Source | In | Dur | Plan | Texte / info |
|---|---|---|---|---|---|
| D1 | JR | 00:22.0 | 30 f | Arrivée, valises, allée | — |
| D2 | JR | 00:23.5 | 30 f | Écran partagé : découverte des chambres | — |
| D3 | JR | 00:17.0 | 30 f | Classe avec vue | chip `Small classes · max. 10` |
| D4 | JR | 00:19.0 | 20 f | Sourire en classe | — |
| D5 | JR | 00:13.0 | 30 f | Déjeuner en terrasse | chip `All-inclusive · Supervised` |
| D6 | JR | 00:28.5 | 45 f | Piscine de Castel Arabel | étiquette de lieu `CASTEL ARABEL` + `500 m from the beach` |
| D7 | JR | 00:05.0 | 25 f | Bouée tractée (autre angle que A2) | — |
| D8 | JR | 00:07.0 | 30 f | Catamaran, les filles rient | — |
| D9 | JR | 00:11.0 | 25 f | Accrobranche | — |
| D10 | JR | 00:31.0 | 45 f | Plage, l'équipe en t-shirts CIA | chip `Classes · Beach · Adventure` |
Les plans juniors viennent **uniquement des films officiels CIA** (déjà diffusés par le CIA). Pas de photos de juniors en gros plan de visage.

### E · 03 Wine & Cooking (32–43 s, ~330 f) — break musical
Étiquette de chapitre : `03` / `WINE & COOKING` + sous-ligne `Cook. Taste. Speak French.`
| # | Source | In | Dur | Plan | Texte / info |
|---|---|---|---|---|---|
| E1 | WC | 00:05.0 | 35 f | La cheffe sourit, panier de légumes | — |
| E2 | WC | 00:07.0 | 10 f | Insert : couteau, tomate | triptyque (E2+E3+E4 côte à côte, sur 3 temps) |
| E3 | WC | 00:11.0 | 10 f | Insert : poêle | |
| E4 | WC | 00:12.0 | 10 f | Insert : farce de courgette | |
| E5 | WC | 00:15.0 | 20 f | Four | — |
| E6 | WC | 00:28.0 | 25 f | Poche à douille | — |
| E7 | WC | 00:31.0 | 30 f | Tarte, finition des agrumes | — |
| E8 | WC | 00:51.0 | 50 f | Drone : Château de Crémat, façade rouge | étiquette de lieu `CHÂTEAU DE CRÉMAT` + `AOC Bellet, Nice` |
| E9 | WC | 00:58.0 | 25 f | Vignes au pied des remparts | — |
| E10 | WC | 01:02.0 | 30 f | Chai à barriques | — |
| E11 | WC | 01:09.0 | 25 f | On sert le vin | — |
| E12 | WC | 01:12.0 | 40 f | On trinque en terrasse | — |
**Interdit dans WC :** 00:55 (vitrail avec un monogramme de marque), gros plans de bouteilles avec étiquette lisible (01:05, 01:13).

### F · 04 50+ & Culture (43–50 s, ~210 f)
Étiquette de chapitre : `04` / `50+ PROGRAMME` + sous-ligne `Markets · Art · The Riviera`.
| # | Source | In | Dur | Plan | Texte / info |
|---|---|---|---|---|---|
| F1 | SR | 00:06.0 | 35 f | Ruelle du vieil Antibes | — |
| F2 | SR | 00:16.0 | 15 f | Insert : légumes du marché | — |
| F3 | SR | 00:18.0 | 15 f | Insert : fleurs de courgette | — |
| F4 | SR | 00:22.5 | 25 f | Groupe au marché, rires | — |
| F5 | SR | 00:25.0 | 25 f | Four à socca | — |
| F6 | SR | 00:29.0 | 30 f | Photo face à la mer | — |
| F7 | SR | 00:53.0 | 25 f | Touches à parfum (**vérifie qu'aucune marque n'est lisible**) | — |
| F8 | SR | 00:13.0 | 40 f | Drone sur les toits, vers la mer | — |
**Interdit dans SR :** 00:15 (enseigne de marché lisible), 00:43, 00:46 et 00:51 (marque Fragonard lisible).

### G · Finale (50–60 s, ~300 f)
| # | Source | In | Dur | Plan | Texte |
|---|---|---|---|---|---|
| G1–G6 | mixte | — | 8–10 f chacun | **Rafale de 6 sourires** pas encore utilisés (un par film au moins), coupés sur chaque temps | — |
| G7 | COURS | 00:54.0 | 55 f | Drone : vieil Antibes et remparts au soleil doré | — |
| G8 | COURS | 00:56.0 | 70 f | Coucher de soleil sur la mer (vitesse réelle ou 0,9) | `Don't learn French.` puis *`Live it.`* tracé à la main (tracés du logo PDF), en **blanc** sur le soleil |
| G9 | G8 figé ou suite | — | 120 f | Voile `#11263D` à 85 % qui monte sur le coucher de soleil | **Carte de fin** : logo CIA blanc, ligne `French courses · Juniors · Wine & Cooking · 50+ · Business French`, `www.cia-france.com`, bouton **`DISCOVER OUR PROGRAMMES`** (fond blanc, texte `#11263D`), crédits en petit. Tenue ≥ 2,5 s. |

Total indicatif : ~1 800 f. Ajuste les durées sur la musique ; **la fin doit tomber pile sur 1 800 f.**

---

## 5. MUSIQUE — c'est elle qui fait le film

- **Piste sous licence obligatoire pour un rendu pro.** Jules dépose un MP3/WAV dans `assets-src/audio/` (Artlist, Epidemic Sound ou Musicbed). Brief musical : **instrumental, 118–124 BPM, pop/house estivale lumineuse avec guitare ou percussions organiques, montée en intro, drop net, break au milieu, drop final, fin franche** (pas de fondu interminable). Pas de voix.
- **Si `assets-src/audio/` est vide :** génère une piste **TEMP** à 120 BPM avec cette structure (intro filtrée 0–4 s, drop à 4 s, break à 32 s, drop à 50 s, coup final à 56 s), uniquement pour valider le montage. Nomme le rendu `…-TEMP-MUSIC.mp4` et signale-le. Ne présente jamais une piste générée comme définitive.
- **Sound design** (léger, sous la musique) : whoosh sur les transitions de chapitre, impact sur le titre et sur le drop final, sons d'ambiance réels courts si utiles (vague, verres qui trinquent) — générés ou synthétisés, jamais repris des films sources (leur son contient leur propre musique).
- **Mixage :** −14 LUFS intégrés (web / réseaux), crête vraie ≤ −1 dBTP.

---

## 6. MOTION DESIGN — sur l'image, au service du rythme

**Outils à utiliser :**
- **Étiquettes de chapitre** (4) : petit numéro `01` en Medium +0.25em, titre en Bold majuscules 88–100 px, sous-ligne Regular 32 px, barre rouge. Apparition en masque vertical sur le premier temps du chapitre, visibles 2 mesures, sortie en masque. Calées en bas à gauche, voile dégradé `#11263D` dessous.
- **Étiquettes de lieu** (Le Château, Le Port, Castel Arabel, Château de Crémat) : petit point + filet fin qui pointe vers le bâtiment, nom en Medium majuscules 26 px +0.25em. Le point suit le bâtiment : keyframes manuels tous les 15 f, vérifiés sur les stills.
- **Chips d'info** : pastille `#11263D` à 80 %, texte blanc 28 px, coins 4 px, entrée en glissé 10 f. Une seule à l'écran à la fois.
- **Compteurs** (C3) : chiffres qui roulent sur l'image (tabulaires), pas sur fond blanc.
- **Salutations du cold open** : mot centré, coupé avec le plan, très léger flou de mouvement d'entrée.
- **Triptyque** (E2–E4) : 3 inserts côte à côte qui apparaissent un par temps, filets blancs de 6 px entre eux.
- **Transitions :** 80 % de **coupes franches sur les temps**. Entre chapitres : **whip pan** (glissé 8 f + flou directionnel, `@remotion/motion-blur`) ou volet signature bleu `#283371` + filet rouge en **8 f maximum**. Un **flash blanc de 2 f** sur le drop du titre et sur le drop final. Jamais de fondu enchaîné long.
- **Énergie dans le plan :** léger zoom avant continu (1.00 → 1.04) sur les plans fixes, recadrage dynamique (punch-in de 1.15 sur un temps fort) 2 ou 3 fois dans le film, vitesse 1.0 à 1.2 sur les plans lents. Pas de ralenti sous 0,9 (sauf le coucher de soleil).

**Retirés de la v1 :** carte animée, écran de compteurs sur blanc, carrousel de cartes 3D, colonnes de programmes sur blanc, shader. Ils ne reviennent pas.

---

## 7. IMAGE : RECADRAGE OBLIGATOIRE & ÉTALONNAGE

- **Les films sources portent des logos incrustés** : logo CIA en bas à gauche (les 4 films) et **badge « vimeo » en bas à droite** (WC et SR). Ils ne doivent **jamais** apparaître.
  - Par défaut : **scale 1.18, ancré en haut** (`transformOrigin: 'top center'`). Ça retire les 15 % du bas, logos compris.
  - Si un cadrage coupe une tête : ancre au centre et ajuste `translateY`, mais vérifie que les deux coins bas restent hors champ.
  - Contrôle **chaque plan** sur sa 1re et sa dernière frame.
  - *Jules va demander les masters propres sans logo au vidéaste. S'ils arrivent dans `assets-src/video/clean/`, utilise-les à la place et repasse à scale 1.00–1.04.*
- **Photos CIA** : zoom lent ≤ 1.12, jamais de bord vide.
- **Étalonnage commun** sur toutes les sources : léger voile chaud (`rgba(255,190,120,.05)` en soft-light), contraste +4 %, saturation +5 %, vignettage `#11263D` doux. Les 4 films doivent sembler venir du même tournage.
- Aucun texte sur un visage. Aucune marque tierce lisible.

---

## 8. CHARTE (rappel)

- **Couleurs :** `#11263D` (dominante), `#283371` (structure), `#E64353` (accent : barres, 1 mot max par écran), blanc. Rien d'autre (pas d'or, pas de couleurs de l'app e-learning).
- **Typo :** Avenir Next si présente dans `assets-src/fonts/`, sinon **Nunito Sans** (déjà en place). « Live it. » = tracés extraits du logo PDF (déjà en place).
- **Logo :** version principale sans baseline sur la carte de fin, en blanc sur fond sombre ; zone de protection respectée. Petite signature blanche en haut à droite **uniquement** pendant l'acte B.
- **Marges :** 140 px gauche/droite, 130 px bas, 100 px haut.
- **Faits autorisés :** since 1985 · 10,000 students a year · 50+ nationalities · Qualité FLE & EAQUALS · max. 12 per class (adults), max. 10 (Premium juniors) · Juniors 8–17 Premium Juan-les-Pins, all-inclusive, supervised · Castel Arabel, 500 m from the beach · Château de Crémat, AOC Bellet. Rien d'autre (pas de prix, pas de superlatif, pas de 97 % DELF).
- Site : **www.cia-france.com**.

---

## 9. DÉCLINAISONS

- **9:16 (1080×1920, 60 s)** : même EDL, **recadrage par plan** (`crop9x16: {x}` dans l'EDL : centre d'intérêt de chaque plan). Le triptyque devient vertical. Textes 84 px, marges 80 / 220 bas.
- **Cutdown 30 s** : A (2 s) → B (3 s) → 2 plans par chapitre avec leur étiquette (C, D, E, F) → G7-G8-G9. Sur la même musique, coupée sur une mesure.
- **Cutdown 15 s (réseaux)** : A (2 s) → B1 (2 s) → 1 plan par chapitre (C6, D8, E12, F4) → G8-G9.
- **Version FR** : `LANG='fr'` — `APPRENDRE LE FRANÇAIS / SUR LA CÔTE D'AZUR`, `COURS DE FRANÇAIS`, `JUNIORS`, `WINE & COOKING`, `PROGRAMME 50+`, chips traduites ; la baseline reste en anglais.

---

## 10. CHECKLIST AVANT LIVRAISON

- [ ] Aucun écran graphique plein cadre avant la carte de fin ; la vidéo est présente 100 % du temps.
- [ ] 40 à 55 plans, durée moyenne 1–1,5 s ; toutes les coupes tombent sur un temps (tolérance ±1 f).
- [ ] Les 4 programmes phares sont **montrés** et nommés ; chaque chapitre dure au moins 7 s.
- [ ] **Aucun logo incrusté visible** (CIA bas gauche, vimeo bas droite) sur aucune frame : vérifie la planche contact à 2 images/s.
- [ ] Aucune marque tierce lisible (Fragonard, monogramme du vitrail, étiquettes de bouteilles).
- [ ] Étalonnage homogène entre les 4 sources.
- [ ] Texte lisible (contraste sur l'image, voile dessous), jamais sur un visage, une seule chip à la fois.
- [ ] Musique : drops aux bons endroits, fin franche, −14 LUFS, piste TEMP signalée si générée.
- [ ] 1 800 f pile (master), 900 f (30 s), 450 f (15 s).
- [ ] Rien poussé ailleurs que sur `video-presentation-cia`.

## 11. LIVRABLES (dans la conversation)

1. Étape 3 : `offline-cut-540p.mp4` + `offline-contact-sheet.png` → **validation**
2. Étape 5 : `cia-brand-film-60s-16x9-en.mp4` (+ `-fr`), `cia-brand-film-60s-9x16-en.mp4`, `cia-brand-film-30s-16x9-en.mp4`, `cia-brand-film-15s-9x16-en.mp4`, poster PNG, planche contact, et l'EDL finale (`edl.json`).
