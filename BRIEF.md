# BRIEF V3 — Film de marque « Centre International d'Antibes » (90 s)

> Branche **`video-presentation-cia`** du dépôt `centre-international-antibes/cia-e-learning`. Branche isolée : **jamais de fusion dans `main`**.
> **V1 refusée** (diaporama : que du graphisme, trop lent). **Montage offline V2 refusé** (que de la vidéo, plans d'environ 1 s tous identiques, rien à lire, rythme monotone, photos inutilisées).
> **V3 = l'entre-deux** : un **script lisible**, des **séquences vidéo** qui respirent, et du **motion design éditorial** construit avec les **photos et les vidéos**. Garde l'infrastructure existante (config, polices, logo, tracés de « Live it. », dérush, EDL, recadrages et filigranes) ; refais la structure et le montage.
> **Musique : hors sujet pour l'instant.** Monte sur un métronome à 120 BPM (piste de clics, uniquement pour caler le rythme). On posera une piste sous licence plus tard.
> Charte : `assets-src/brand/charte-graphique-CIA.pdf` (rappel au §7). Jamais `CIA-charte-graphique.md`.

---

## 0. LES 5 RÈGLES QUI CORRIGENT V1 ET V2

1. **On doit pouvoir tout lire.** Une phrase reste à l'écran **au minimum 1 s + 0,3 s par mot** (titre + légende comptés ensemble : 8 mots = 3,4 s), immobile au moins 1,5 s. Les **cartes programme** (T2, T4) restent **4,5 s minimum**. **6 mots maximum par ligne**, 2 lignes maximum. Taille **minimum 44 px** pour toute ligne qu'on doit lire, 26 px seulement pour les surtitres. Les labels de 18–24 px de la V1 étaient illisibles : interdits.
2. **Le rythme varie.** On alterne **respirations** (plans de 2,5 à 4 s, avec texte) et **rafales** (4 à 6 plans de 0,4 à 0,8 s, sans texte). **Une seule rafale par chapitre, au maximum.** Jamais plus de 3 plans consécutifs de même durée.
3. **Hybride vidéo / graphisme.** Environ **60 % de vidéo plein cadre, 40 % de mises en page graphiques** (§3) qui contiennent elles-mêmes des photos ou de la vidéo. **Jamais un écran de texte seul sur fond uni**, sauf la carte de fin.
4. **Les photos sont utilisées.** Au moins **12 photos** du dossier, principalement pour les lieux (Le Château, Le Port, Castel Arabel, Astor, Cannes), la cuisine et la dégustation.
5. **Une histoire claire en 4 temps** : *qui on est → où → ce qu'on propose (4 programmes) → pourquoi c'est unique*. Le spectateur doit pouvoir résumer le film après l'avoir vu.

---

## 1. RÔLE & MÉTHODE

Tu es **directeur artistique motion designer senior** et **monteur senior** (films de marque tourisme / éducation, niveau studio). Références : films de marque Airbnb, Visit France / Atout France, EF Education First ; mises en page éditoriales type magazine (Monocle, Kinfolk) pour les écrans graphiques.

1. **Styleframes d'abord.** Rends **8 images fixes 1920×1080**, une par gabarit du §3, avec les vrais textes et les vraies photos. Planche unique `styleframes.png` + les 8 PNG.
2. **Animatic V3 dans la foulée** : le film complet en 960×540, gabarits animés simplement, textes définitifs, métronome. Plus la planche contact (1 image/s).
3. **Livre les deux ensemble dans la conversation et attends ma validation** avant la finition (motion fin, étalonnage, déclinaisons).
4. Avant de livrer, **contrôle-toi** : regarde la planche contact image par image et vérifie les règles du §0 (temps de lecture calculés pour chaque texte, alternance du rythme). Liste tes vérifications dans ton message.

---

## 2. LE SCRIPT (90 s = 2 700 f à 30 fps, en anglais ; version FR au §8)

Le texte à l'écran **est la narration** : pas de voix off, donc chaque ligne doit faire avancer l'histoire.

| # | Temps | Section | Gabarit | Images | **Texte à l'écran** (durée de lecture) |
|---|---|---|---|---|---|
| 1 | 0–6 s | **Accroche** | rafale + T1 | 6 plans éclair (JR mer/voiliers, JR bouée, WC on trinque, COURS prof expressive, SR rires au marché, JR ado qui rit) 0,5–0,7 s chacun, salutations `Hello · Hola · Ciao · Hallo · Привет · こんにちは` (un mot par plan, 120 px) → drone SR 00:01 mer vers Antibes | `Bonjour.` (2 s, 160 px) |
| 2 | 6–14 s | **Promesse** | T1 puis T7 | Drone Antibes (SR 00:02–00:05, puis WC 00:36) | `LEARN FRENCH` / **`ON THE FRENCH RIVIERA`** (4 s) → carte : `ANTIBES · JUAN-LES-PINS · CANNES` (3 s) |
| 3 | 14–24 s | **Qui on est** | T5 ×3 | Vidéo **dans les chiffres** : arrivées sous les drapeaux (COURS 00:11), classe qui rit (COURS 00:21), terrasse internationale (COURS 00:47) | **`1985`** `Since` (2,5 s) → **`10,000`** `students a year` (3 s) → **`50+`** `nationalities` (3 s) → ligne `Accredited Qualité FLE & EAQUALS` (2 s) |
| 4 | 24–40 s | **01 · French courses** | T4 → vidéo → T3 → T6 | T4 sur fond vidéo de classe floutée ; 3 plans classe (COURS 00:15, 00:18, 00:29) de 1,5 s ; T3 collage de 3 photos Le Port ; T6 Le Château (photo jardin + vidéo du mas COURS 00:05) | Carte programme : **`FRENCH COURSES`** · `All levels · All year` · `Max. 12 per class` · `Intensive · DELF · Business French` (4,5 s) → sur les plans de classe : `Small classes. Real conversations.` (3 s) → collage : **`LE PORT`** `Old Town, steps from the beach` (3,5 s) → **`LE CHÂTEAU`** `A Provençal mas, 22 classrooms` (3,5 s) |
| 5 | 40–56 s | **02 · Juniors Premium** | T2 → rafale → T6 → T3 | T2 : vidéo plage (JR 00:31) + panneau bleu ; rafale activités (JR bouée 00:05, catamaran 00:07, accrobranche 00:11, plage 00:32, piscine 00:29) 0,6 s chacune ; T6 Castel Arabel (photo façade → vidéo piscine JR 00:28) ; T3 Astor (2 photos chambres + salon) | Panneau : **`JUNIORS 8–17`** · `Juan-les-Pins Premium` · `All-inclusive · Supervised` (4,5 s) → (rafale sans texte) → `Classes in the morning.` / `The Riviera all afternoon.` (3,5 s, sur la fin de rafale + plan tenu) → **`CASTEL ARABEL`** `500 m from the beach` (3 s) → **`ASTOR`** `In the heart of Juan-les-Pins` (2,5 s) |
| 6 | 56–72 s | **03 · Wine & Cooking** | T4 → T8 → T3 → vidéo | T4 sur la cheffe (WC 00:05) ; T8 triptyque inserts (WC 00:07, 00:11, 00:12) ; T3 photos (fraisier, cheffe, dégustation recadrée) ; drone Crémat (WC 00:51) + chai (WC 01:02) + on trinque (WC 01:12) | Carte programme : **`WINE & COOKING`** · `French through gastronomy` · `Workshops · Tastings · Excursions` (4,5 s) → triptyque : `Cook it. Taste it.` / `Say it in French.` (3 s) → drone : **`CHÂTEAU DE CRÉMAT`** `AOC Bellet, Nice` (3 s) |
| 7 | 72–82 s | **04 · 50+** | T2 → vidéo | T2 : ruelle du vieil Antibes (SR 00:06) + panneau ; 3 plans de 1,5 s (marché SR 00:22, socca SR 00:25, photo face à la mer SR 00:29) | Panneau : **`50+ PROGRAMME`** · `Culture · Markets · Excursions` (4,5 s) → `Your pace. Your Riviera.` (2,5 s) |
| 8 | 82–90 s | **Finale** | rafale → T1 → carte de fin | 6 sourires 0,4 s (1 par film minimum) → coucher de soleil (COURS 00:56) → carte de fin | `Don't learn French.` / *`Live it.`* tracé (3 s, blanc sur le soleil) → **carte de fin** (3 s) : logo blanc, 4 pictos programmes + `French courses · Juniors · Wine & Cooking · 50+`, `www.cia-france.com`, bouton `DISCOVER OUR PROGRAMMES` |

**Vérifie le total : 2 700 f pile.** Ajuste les plans, pas les temps de lecture. Si une section déborde, raccourcis une rafale ou un plan sans texte.
Les timecodes sources sont ceux de ton dérush V2 : reprends tes meilleurs in/out. Évite toujours WC 00:55, SR 00:15, 00:43, 00:46, 00:51 et les étiquettes de bouteilles lisibles.

---

## 3. LES 8 GABARITS (le motion design éditorial)

Grille 12 colonnes sur 1920 px, marges 140 px, gouttière 24 px. Un seul texte actif à la fois. Les animations d'entrée et de sortie se calent sur les temps du métronome (15 f).

| Gabarit | Description | Technique |
|---|---|---|
| **T1 · Titre sur vidéo** | Vidéo plein cadre, voile dégradé `#11263D` en bas à gauche, titre 96–112 px Regular + **Bold**, barre rouge. | Masques ligne par ligne (`overflow:hidden`), `@remotion/layout-utils` (`fitText`) pour que le titre tienne sans casser. |
| **T2 · Écran partagé** | 7 colonnes de vidéo à gauche, 5 colonnes de panneau `#11263D` à droite : numéro `02`, nom du programme 72 px Bold, 2 à 3 lignes de faits 36 px avec pictos Lucide qui se dessinent. Le panneau entre en glissé ; la vidéo continue derrière. | `clipPath` animé, `@remotion/paths` pour les pictos. |
| **T3 · Collage photo** | 3 photos en cartes (coins 8 px, bordure blanche 6 px, ombre douce) posées l'une après l'autre sur un fond **vidéo floutée et assombrie** du même lieu (pas de fond uni), titre du lieu 72 px + légende 36 px. | Entrées décalées de 6 f, léger zoom dans chaque photo, **parallaxe 2,5D** sur la photo principale (§4). |
| **T4 · Carte programme** | La vidéo du programme tourne en fond (flou 12 px + voile 55 %) ; au premier plan, une carte blanche (6 colonnes, coins 8 px) : numéro, **nom du programme** 80 px Bold `#11263D`, 3 lignes de faits 36 px, barre rouge. La carte s'ouvre en volet, puis la vidéo se défloute à la sortie de la carte. | `@remotion/transitions` (présentation custom), flou animé. |
| **T5 · Chiffre en défonce** | Chiffre géant (400–520 px, Bold) qui sert de **masque** : on voit la vidéo à travers les chiffres, sur fond `#11263D` ; libellé 48 px à côté. Le chiffre défile (compteur), puis le masque s'ouvre jusqu'au plein cadre pour passer au plan suivant. | Texte en `clipPath` / `mask-image` sur `<OffthreadVideo>`, compteur `interpolate` + chiffres tabulaires. |
| **T6 · Image dans l'image** | Une photo du lieu dans une carte au centre, sur le voile bleu → la carte s'agrandit jusqu'au plein cadre et **devient la vidéo** du même lieu (fondu sur 8 f à l'intérieur de la carte). Label de lieu en bas à gauche. | Interpolation de taille et de position de la carte, fondu photo → vidéo. |
| **T7 · Carte de la Côte** | 3 s seulement : trait de côte (reprends la carte V1), 3 villes qui s'allument l'une après l'autre, sur fond `#11263D`, avec la vidéo drone en incrustation ronde qui suit la caméra. | Réutilisation du composant carte V1, accéléré. |
| **T8 · Triptyque** | 3 vidéos côte à côte (filets blancs de 6 px) qui apparaissent une par temps ; texte au-dessus sur une bande `#11263D`. | 3 `<OffthreadVideo>` synchronisés. |

**Transitions :** coupes franches sur les temps (60 %), entrées et sorties de gabarit (30 %), **whip pan** 8 f avec flou directionnel (`@remotion/motion-blur`) entre chapitres (10 %). Pas de fondu enchaîné long, pas de flash.
**Signature de marque :** numéro de chapitre + barre rouge à chaque début de chapitre ; petite signature logo blanche en haut à droite sur les plans vidéo plein cadre (pas sur les gabarits).

---

## 4. STACK TECHNIQUE (niveau studio)

| Brique | Usage | Si indisponible |
|---|---|---|
| Remotion 4 (`Series`, `TransitionSeries`, `interpolate`, `spring` amorti, `Easing.bezier`) | Montage et animation pilotés par la frame | — |
| `@remotion/layout-utils` | `fitText` / `measureText` : titres qui tiennent toujours dans leur colonne, en EN comme en FR | Tailles fixes vérifiées sur stills |
| `@remotion/transitions` (présentations custom) | Volet T4, whip pan, ouverture de masque T5 | — |
| `@remotion/motion-blur` | Flou de mouvement des whip pans et des entrées rapides | Flou CSS directionnel |
| `@remotion/paths` | Pictos Lucide et filets qui se dessinent, « Live it. » tracé | — |
| `@remotion/three` | Parallaxe 2,5D des photos (photo projetée sur un plan déformé par sa carte de profondeur, caméra qui glisse légèrement) | Parallaxe en 2 couches (détourage) ou zoom lent |
| **Python : Depth Anything V2 Small** (`transformers` ou ONNX) | Cartes de profondeur des photos pour la parallaxe 2,5D | Pas de profondeur → zoom lent |
| **Python : `rembg` (u2net / BiRefNet)** | Détourage des sujets pour **mettre du texte derrière une personne ou un bâtiment** (1 ou 2 fois dans le film, sur T1 ou T3) | Texte devant, simplement |
| ffmpeg / OpenCV | Filigranes (déjà en place), flou de fond, planches contact, contrôle | — |

Les modèles se téléchargent depuis Hugging Face. **Teste l'accès d'abord** ; s'il est bloqué, dis-le et passe aux solutions de repli sans contourner. **Toutes les images générées par ces outils** (profondeur, détourages) sont **précalculées** dans `public/derived/` et versionnées : rien n'est calculé au rendu.

---

## 5. MÉDIAS

- **Vidéos :** les 4 films, avec ton dérush V2 (EDL, recadrages, filigranes retirés).
- **Photos à mettre dans `public/photos/`, en plus de celles déjà copiées** (copie et renomme depuis `assets-src/photos/`, redimensionne à 2560 px de large) :
  - piscine de Castel Arabel : `Piscine Castel Petits (18, 28, 37 sur 37)` → `castel-arabel-pool-*.jpg`. Enfants : uniquement en plan large, sans visage reconnaissable en gros plan.
  - `cooking-workshop-chef-a.jpg`, `wine-tasting-toast.jpg` (étiquette de vin recadrée hors champ), `le-port-class-teacher-student.jpg`.
  - les photos `Prestige Sem 31`, `Groupes divers`, `1 (2)`, `2`, `16`, `24 (1)`, `38` et `test (… sur 27)` : regarde-les, garde celles qui servent le script (lieux, cours, activités) et indique dans ton message ce que tu as pris et ce que tu as écarté, et pourquoi.
- **Polices :** Nunito Sans tant qu'Avenir Next / Better Together ne sont pas dans `assets-src/fonts/`.

---

## 6. IMAGE

- Filigranes : jamais visibles (règles V2 inchangées).
- Étalonnage commun sur vidéos **et photos** : léger voile chaud, contraste +4 %, saturation +5 %, vignettage `#11263D` doux. Les photos ne doivent pas paraître plus « plates » que la vidéo.
- Aucun texte sur un visage, aucune marque tierce lisible.

---

## 7. CHARTE (rappel)

- Couleurs : `#11263D` (dominante), `#283371` (structure), `#E64353` (accent : barres, 1 mot max par écran), blanc. Opacités autorisées, rien d'autre.
- Typo : Avenir Next si fournie, sinon Nunito Sans. Titres en MAJUSCULES +0.02em ; surtitres Medium +0.25em ; lignes de lecture en casse normale.
- Logo : version principale sans baseline sur la carte de fin, blanc sur fond sombre.
- Faits autorisés : since 1985 · 10,000 students a year · 50+ nationalities · Qualité FLE & EAQUALS · max. 12 per class (adults) · Juniors 8–17, Juan-les-Pins Premium, all-inclusive, supervised, classes in the morning / activities in the afternoon · Le Port (Old Town, steps from the beach) · Le Château (Provençal mas, 22 classrooms) · Castel Arabel (500 m from the beach) · Astor (In the heart of Juan-les-Pins — **à valider par Jules**) · Château de Crémat (AOC Bellet, Nice) · 50+ (culture, markets, excursions). Pas de prix, pas de superlatif.
- Site : www.cia-france.com.

---

## 8. VERSION FR (`LANG='fr'`)

`Bonjour.` · `APPRENDRE LE FRANÇAIS / SUR LA CÔTE D'AZUR` · `Depuis 1985` · `étudiants par an` · `nationalités` · `Labels Qualité FLE & EAQUALS` · `COURS DE FRANÇAIS` · `Tous niveaux · Toute l'année` · `12 élèves max. par classe` · `Petits groupes. Vraies conversations.` · `Le vieil Antibes, à deux pas de la plage` · `Un mas provençal, 22 salles` · `JUNIORS 8–17 ANS` · `Tout compris · Encadré` · `Les cours le matin.` / `La Riviera l'après-midi.` · `À 500 m de la plage` · `Au cœur de Juan-les-Pins` · `WINE & COOKING` · `Le français par la gastronomie` · `Ateliers · Dégustations · Excursions` · `Cuisinez. Goûtez.` / `Dites-le en français.` · `PROGRAMME 50+` · `Culture · Marchés · Excursions` · `Votre rythme. Votre Riviera.` · `DÉCOUVREZ NOS PROGRAMMES`. La baseline reste en anglais.

---

## 9. LIVRABLES DE CETTE ÉTAPE (dans la conversation)

1. `styleframes.png` (planche des 8 gabarits) + les 8 PNG en 1920×1080.
2. `animatic-v3-540p.mp4` (90 s, métronome) + `animatic-v3-contact-sheet.png`.
3. Un message court : tableau script → durée de lecture calculée pour chaque texte, liste des photos utilisées et écartées, état des outils Python (profondeur, détourage : OK ou repli).

Déclinaisons (9:16, 30 s, 15 s), étalonnage final et musique : **après** validation de l'animatic.

---

## 10. FLUIDITÉ — RÈGLES TECHNIQUES OBLIGATOIRES (ajout après l'animatic V3)

Diagnostic mesuré sur l'animatic V3 (différence image par image) : les saccades viennent de 3 causes.

1. **Cadences mélangées.** COURS = **25 fps**, JR = **23,976 fps**, WC et SR = 30 fps, dans une composition à 30 fps → une image répétée toutes les 5 ou 6 images sur COURS et JR, très visible sur les mouvements de drone.
   → **Conforme toutes les sources à 30 fps AVANT montage**, par interpolation de mouvement : `ffmpeg -i in.mp4 -vf "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -c:v libx264 -crf 14 -preset slow -an public/video/30fps/<nom>.mp4`. Contrôle les artefacts (objets qui fondent, contours qui ondulent) sur chaque plan retenu ; si un plan est abîmé, utilise un plan sans mouvement de caméra à la place.
2. **Ralentis par `playbackRate` < 1** (0,8–0,9 sur les drones, les chiffres, Castel Arabel, Crémat, le coucher de soleil) → images dupliquées à chaque seconde.
   → **Interdit.** Vitesse 1,0 par défaut (1,0–1,2 autorisé). Si un ralenti est indispensable : génère un intermédiaire à 60 fps avec `minterpolate=fps=60:…`, lis-le à 0,5, et vérifie qu'aucune image n'est répétée.
3. **Transitions trop courtes** : ouvertures de masque et entrées de gabarit en 4 à 6 images (vers 13,2 s, 15,7 s, 17,8 s, 43,3 s, 75,3 s) → l'image saute.
   → Transitions et masques **entre 12 et 18 images**, easing in-out `Easing.bezier(0.65, 0, 0.35, 1)`, **jamais linéaire**. Flou de mouvement (`<CameraMotionBlur samples={8} shutterAngle={180}>`) sur tout élément qui bouge vite. **Aucun élément ne se déplace de plus de 80 px par image.** Les transitions **chevauchent** les deux plans (`TransitionSeries`), jamais d'échange brut sous un masque.

**Contrôle obligatoire avant chaque livraison**, résultat à joindre dans ton message :
```bash
ffmpeg -loglevel error -i out.mp4 -vf "scale=320:180,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=diff.txt" -f null -
```
- Une image répétée (`YAVG` < 0,15) n'est acceptée que sur un plan volontairement fixe (carte de fin).
- Un pic (`YAVG` > 14) n'est accepté que sur une coupe franche voulue ; plusieurs pics à la suite = transition trop rapide → à corriger.
