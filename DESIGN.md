# DESIGN.md — direction artistique de CIA e-learning

> Source de vérité du visuel. Toute décision validée est reportée ici **avant**
> d'être appliquée. Une consigne qui contredit ce fichier doit être signalée
> avant d'être suivie.
>
> État : **étape 3 close.** Les trois arbitrages sont tranchés (typographie,
> surfaces, illustration) et inscrits ci-dessous. Reste à appliquer, avec le
> parcours pilote de l'étape 4.

---

## 1. Invariants

Non négociables, rappelés ici parce que tout le reste en découle.

- **Spark** (flamme bleue) est la mascotte et le seul personnage. Logo CIA et slogan script inchangés.
- **La palette actuelle est conservée.** On en dérive des surfaces, des états et des tranches ; on ne la remplace pas.
- **Un rôle par couleur :**
  | couleur | rôle | jamais |
  |---|---|---|
  | bleu CIA | action principale — **une seule par écran** | décoration |
  | or | récompense (XP, coffre, parfait, niveau) | décoration |
  | rouge CIA / orange | série et erreur | ailleurs |
  | vert succès | bonne réponse | action |
  | couleurs CECR | identité de niveau (bannière d'unité, nœuds) | boutons |
- **Duolingo est une référence, pas une source.** Aucun asset, aucune police, aucune couleur exacte. On en extrait des principes mesurables (cf. `design/refs/ANALYSE.md`).
- **Gamification éthique.** Jamais de culpabilisation, de fausse urgence, de compte à rebours anxiogène. L'abonnement et la page tarifs ne sont jamais célébrés. Le classement reste opt-in et absent de l'accueil.
- **Le niveau CECR est pédagogique.** Il monte avec les modules et le test de placement, jamais avec l'XP. L'interface ne suggère jamais « gagne de l'XP pour passer B1 ».
- **i18n** : aucune chaîne en dur ; toute mise en page tient en allemand et en russe (+35 %).
- **RGPD** : aucune ressource depuis un CDN tiers. Les polices passent en auto-hébergé (cf. § 5).
- **Accessibilité** : `prefers-reduced-motion` respecté via `useReducedMotionConfig`, contraste AA, cibles de 44 pt minimum, vrais boutons et liens, tout dialogue a un titre.
- **Enfoncement** : le retour de pression signature est l'enfoncement 3D vertical de `Pressable` — translation + tranche qui s'écrase. **Jamais un scale.**

---

## 2. Liste noire

Ce qui signe une interface générée plutôt que dessinée. Rien de tout ceci n'entre dans le projet.

**Polices** — Inter, Roboto, Arial, police système seule, Space Grotesk, Fraunces,
Bricolage Grotesque, Instrument Serif, Satoshi, Clash Display, General Sans, Geist,
Manrope, DM Sans, Outfit, Onest. *Inter est aujourd'hui notre police de texte : elle sort.*

**Couleur et matière** — dégradés violet→bleu ou violet→rose, texte en dégradé,
glassmorphism (`backdrop-blur` réservé aux voiles d'overlay ; la variante `glass`
de `Button` disparaît), or ou bleu employés en décoration, surfaces quasi
identiques sans contraste tonal.

**Mise en page** — bento grid par défaut, hero centré suivi de trois cartes
features, look shadcn par défaut, `rounded-2xl` uniforme partout, `shadow-lg`
générique.

**Iconographie** — icônes Lucide non retouchées utilisées partout, emojis en
guise d'icônes (badges et modules compris).

**Mouvement** — `ease-in-out 300ms` par défaut, toute transition exprimée en
durée sur une transform.

---

## 3. Langage visuel cible

Tiré des mesures de `design/refs/ANALYSE.md`, exprimé avec l'identité CIA.

- **Couleurs franches et plates.** La profondeur vient de la **bordure épaisse et
  de la tranche basse pleine** — le langage de `Pressable` — jamais du flou.
- **Formes généreuses.** Contours de 2 px, rayons différenciés selon la taille de
  l'objet (un bouton et une carte n'ont pas le même rayon).
- **Typographie très grasse** pour les titres et les chiffres. Partout où il y a
  un score, le chiffre est gros.
- **Illustration.** Les écrans clés ne sont jamais « texte + icône Lucide ».
- **Densité.** Peu d'éléments par écran, **une seule action principale**, beaucoup d'air.

### Cibles géométriques, mesurées

| cible | valeur | relevé de référence | notre écart |
|---|---|---|---|
| surface quasi blanche | **≈ 70 %** | 70 % | parcours à 87 %, catalogue à 69 %, landing à 12 % |
| couleur saturée dominante | **une seule, ≈ 12 % de l'écran** | 12,3 % | 4,3 % réparti sur 5 teintes |
| bannière d'unité | **pleine largeur, 100–110 pt** | 109 pt | aucune bande pleine largeur |
| marge latérale | **24 pt** | 344 pt de contenu sur 392 | variable |
| nœud de leçon | **≈ 67 pt**, tranche de **5 à 6 pt** | 67 pt / 5,6 pt | cercle plat de 56 pt, trait fin |
| espacement entre nœuds | **76 à 95 pt** | 76–95 pt | ≈ 150 pt |
| pied de validation | **pleine largeur, ≈ 93 pt**, bouton pleine largeur | 93 pt | panneau et bouton côte à côte |

---

## 4. Tokens — couleur

La palette CIA existante reste la base (`src/index.css`, échelles 50→900 pour
`cia-blue`, `cia-gold`, `cia-red`, `ink`, plus `success`, `streak` et les
couleurs CECR). La refonte y ajoute **une tranche par couleur** et **trois
familles de surfaces**.

### Tranches (`-edge`)

Chaque couleur tapable gagne un token de tranche, utilisé pour l'ombre basse
pleine. Règle : la tranche est la teinte **deux crans plus foncée** que la face.

```css
--cia-blue-edge:   var(--cia-blue-700);   /* face 500 */
--cia-gold-edge:   var(--cia-gold-700);
--cia-red-edge:    var(--cia-red-700);
--success-edge:    var(--success-700);
--ink-edge:        var(--ink-300);        /* face : surface neutre */
```

`Pressable` les utilise déjà implicitement via `TONE_EDGE` ; la refonte sort ces
valeurs du composant pour en faire des tokens, de sorte que les nœuds du
parcours, les cartes tapables et les coffres parlent la même langue.

### Élévation — 4 niveaux

| niveau | usage | ombre |
|---|---|---|
| `flat` | fond de page, surfaces non tapables | aucune |
| `edge` | **tout ce qui se tape** : bouton, nœud, carte-action | tranche basse pleine, 4 à 8 pt selon la taille |
| `raised` | carte posée, panneau | ombre douce teintée d'encre, 2 couches |
| `float` | feuille, modale, toast | ombre douce large, 3 couches |

Jamais de noir pur dans une ombre : toujours `hsl(var(--ink-900) / α)`.

### Surfaces et états — **A, « Papier »** *(arbitré)*

| | |
|---|---|
| fond de page | blanc pur |
| carte | blanc, bordure `ink-200` de 2 px |
| survol | la bordure passe à `cia-blue-200` |
| actif / sélectionné | fond `cia-blue-50`, bordure `cia-blue-500` |
| désactivé | opacité 45 %, **tranche supprimée** — un objet sans tranche n'a pas l'air tapable |

C'est la déclinaison qui atteint les 70 % de blanc mesurés, en laissant la
**tranche** faire seule la différence entre ce qui se tape et ce qui ne se tape
pas. Les deux autres pistes (fond teinté `ink-50` avec tranche partout, ou
cartes `ink-50` sur fond blanc) sont écartées : la première rend tout tapable à
l'œil, la seconde s'éloigne de la cible de blanc.

## 5. Tokens — typographie

Deux fontes : une **d'affichage**, très grasse et arrondie, pour titres et
chiffres ; une **de texte** pour tout le reste. `JetBrains Mono` reste pour les
étiquettes en petites capitales. Les deux doivent être **auto-hébergées**
(`public/fonts/`, `@font-face` dans `index.css`, suppression du `<link>` Google
Fonts dans `index.html`), en `woff2`, sous-réglées latin + cyrillique.

**Vérification obligatoire avant arbitrage** : rendu en russe (cyrillique), en
allemand (mots longs), et des chiffres tabulaires lisibles à 48 px.

### Couple retenu — **Baloo 2 + Figtree, avec renfort cyrillique** *(arbitré)*

| rôle | fr · en · de · es · it | ru |
|---|---|---|
| affichage (titres, chiffres) | **Baloo 2** 800 | **Nunito** 800–900 |
| texte | **Figtree** 400 / 600 | **Golos Text** 400 / 600 |
| étiquettes mono | JetBrains Mono 500 | idem |

Toutes en OFL, toutes hors liste noire, toutes auto-hébergées.

**Pourquoi un renfort.** Vérification faite sur les fichiers eux-mêmes :
**Baloo 2 et Figtree n'ont aucun glyphe cyrillique — 0 sur 256 pour les deux.**
Sans renfort, toute l'interface russe bascule sur une serif système, ce qui est
hors charte et casse l'invariant i18n. Nunito (220/256) et Golos Text
(170/256) couvrent le russe en entier. Nunito a été préféré à Comfortaa pour
l'affichage : sa rondeur et son épaisseur en 800–900 sont bien plus proches de
Baloo 2, là où Comfortaa reste géométrique et léger même en gras.

**Conséquence assumée : l'interface russe n'a pas exactement la même voix.**
L'écart est réduit par le choix de Nunito, il n'est pas nul. Il est connu et
accepté.

À noter : **Plus Jakarta Sans n'a pas non plus de cyrillique.** Les titres russes
basculent donc déjà aujourd'hui sur Inter. La refonte ne crée pas ce mécanisme,
elle le rend explicite et lui donne une police choisie plutôt que subie.

**Mise en œuvre.** Quatre familles variables, servies par `unicode-range` : un
lecteur francophone ne télécharge jamais les fichiers cyrilliques, et
réciproquement.

```css
/* latin + latin étendu */
@font-face { font-family: 'CIA Display'; src: url('/fonts/baloo2-latin.woff2') format('woff2');
             font-weight: 400 800; unicode-range: U+0000-024F, U+2000-206F, U+20A0-20BF; font-display: swap; }
@font-face { font-family: 'CIA Text';    src: url('/fonts/figtree-latin.woff2') format('woff2');
             font-weight: 300 700; unicode-range: U+0000-024F, U+2000-206F, U+20A0-20BF; font-display: swap; }
/* cyrillique — même nom de famille, plage disjointe */
@font-face { font-family: 'CIA Display'; src: url('/fonts/nunito-cyrillic.woff2') format('woff2');
             font-weight: 400 900; unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; font-display: swap; }
@font-face { font-family: 'CIA Text';    src: url('/fonts/golostext-cyrillic.woff2') format('woff2');
             font-weight: 300 700; unicode-range: U+0400-04FF, U+0500-052F; font-display: swap; }
```

### Ce qui vit sous le drapeau, et ce qui n'y vit pas

**Le drapeau `?redesign=1` ne bascule que `--font-display` et `--font-text`.**
Rien d'autre n'entre dans `:root[data-redesign]` : ce qui y entre n'existe plus
quand le drapeau tombe. La palette, les neutres, la sémantique, les couleurs
CECR, les mappings shadcn, les élévations et les plans vivent dans `:root`, sans
condition.

Ce n'est pas une préférence, c'est une panne vécue : l'étape 0 y avait enfermé
toute la palette, et l'application sans drapeau s'est retrouvée sans une seule
couleur définie — `--background`, `--primary` et `--card` vides, fond
transparent, badges en aplats noirs. Le build passait, le typecheck passait, les
tests passaient. `src/test/palette.test.ts` lit désormais le CSS compilé et
échoue si la règle est enfreinte.

`Sacramento` est auto-hébergée avec les autres, et **c'est elle qui porte le
slogan** *(arbitré)*. `Better Together` n'est pas sur Google Fonts — la requête
renvoie « 400: Font family not found » — parce que c'est une **police
commerciale** de Katsia Jazwinska, vendue sur MyFonts et Creative Market. Elle
n'a donc jamais été chargée : le slogan d'`AuthShell` tombait sur le `cursive`
du navigateur, c'est-à-dire Comic Sans sous Windows, depuis le départ.

Si le CIA détient une licence web de cette police — elle vient probablement de
la charte graphique de la marque —, **c'est elle qu'il faut auto-héberger** :
ce serait la police d'origine du slogan. Les versions gratuites qui circulent
sont des démos, explicitement interdites d'usage commercial : elles ne sont pas
une option. En attendant, Sacramento, déjà dans `public/fonts/`, et la couleur
passée de `#e64353` en dur au token `cia-red-400` (348 67 % 55 % contre
354 77 % 58 % : une teinte à peine plus sourde, prise dans la palette).

**Précision sur le `<link>` retiré.** `Better+Together` y figurait bien, dans la
liste des familles demandées à Google Fonts. Mais Google ne l'a jamais servie :
demandée seule, l'URL renvoie « 400 : Missing font family » ; demandée au milieu
d'autres, elle est **silencieusement ignorée** et les autres arrivent
normalement (vérifié le 7/10 : l'URL d'origine complète répond 200, la même
réduite à `family=Better+Together` répond 400). Son retrait n'a donc rien cassé
— il n'y avait rien à casser —, et il n'y a aucun fichier Google à rapatrier.
Seule une licence commerciale permettrait de l'auto-héberger.

Le slogan reste **en anglais dans toutes les langues** *(arbitré)*, porté par
une constante et non par une clé i18n : une signature de marque se reconnaît,
elle ne se traduit pas. C'est la seule exception assumée à la règle « toute
chaîne passe par i18n ».

Le `<link>` Google Fonts a disparu d'`index.html`, préconnexions comprises :
**plus aucune ressource tierce au chargement.**

À vérifier au moment d'appliquer : le rendu de Baloo 2 en allemand (mots longs),
les chiffres tabulaires de Figtree à 48 px, et l'absence de saut visible entre
une ligne latine et une ligne cyrillique dans un même écran.

### Échelle

| rôle | taille | graisse | interlignage |
|---|---|---|---|
| chiffre de score | 40–56 pt | 800 | 1 |
| titre d'écran | 28 pt | 800 | 1,1 |
| titre de section | 20 pt | 700 | 1,2 |
| texte | 16 pt | 400 | 1,5 |
| étiquette mono | 10 pt, +0,2 em de lettrage, capitales | 500 | 1,2 |

---

## 6. Tokens — espacement, rayons, profondeur, z-index

**Espacement** : grille de 4. Marge latérale d'écran **24 pt** (mesure de référence).

**Rayons, par taille d'objet** — un rayon uniforme partout est en liste noire.

| objet | rayon |
|---|---|
| puce, étiquette | 6 pt |
| bouton, champ | 12 pt |
| carte, tuile | 16 pt |
| bannière d'unité, feuille | 20 pt |
| nœud, pastille, coffre | cercle complet |

**z-index — en tokens.** Les tokens existent désormais dans `src/index.css` et
sont exposés par Tailwind (`z-overlay`, `z-celebration`…). Le moment de fin de
niveau les utilise. **Les `z-[200]` / `z-[201]` posés en M4 sont encore là** dans
`LevelUpCelebration`, `StreakMilestone`, `XPBurst` et `AchievementToast` : ils
partiront avec la refonte de ces composants, pas avant.

```css
--z-base: 0;        /* contenu */
--z-sticky: 10;     /* en-têtes collants */
--z-bar: 30;        /* CheckBar, barre d'onglets */
--z-player: 100;    /* portal du player */
--z-overlay: 200;   /* voile des célébrations */
--z-celebration: 210;/* célébrations macro, toasts */
```

**Parallaxe et plans** sur le parcours : décor discret, compatible avec le fond
uniforme validé en juin. **Inclinaison 3D uniquement sur les objets de
récompense** (badge, coffre, carte de niveau), au doigt. Gyroscope seulement sur
validation explicite, avec demande d'autorisation iOS au premier geste pertinent
— jamais au lancement. Les transforms 3D sont isolées dans des wrappers ;
overlays, modales et feuilles passent en portail.

---

## 7. Illustration — **II, « Objets du quotidien »** *(arbitré)*

Croissant, ticket de bus, carte postale, clé d'hôtel, menu : les objets qu'on
rencontre en vivant la langue, un par module.

| | |
|---|---|
| traitement | contour de 2 px, aplats, légère ombre basse — le même langage que la tranche des objets tapables |
| palette | 3 à 4 couleurs par objet, tirées de la palette CIA |
| où ça vit | **nœuds du parcours**, cartes de leçon, coffres |
| volume | ~30 objets, un par module |
| priorité | les nœuds du parcours pilote en ont besoin dès l'étape 4 |

Les écrans clés ne sont plus « texte + icône Lucide » : c'est l'objet qui
identifie le module.

Les deux autres directions ne sont pas écartées définitivement — elles ne sont
simplement pas commandées maintenant. « Antibes plate » (6 scènes de lieux)
reste la piste naturelle pour les bannières d'unité et les écrans vides ;
« Spark en situation » reste celle des moments de célébration. On y reviendra
quand le parcours tiendra debout.

## 7 bis. États du parcours *(arbitrés)*

Deux états que le parcours n'avait pas, et que `DESIGN.md` ne décrivait pas.

### Premier contact — **chemin seul, nœud d'entrée surdimensionné**

Rien n'a été commencé, nulle part. **Pas de panneau d'accueil** : c'est le
chemin qui parle.

| | |
|---|---|
| nœud 1 | **110 pt**, tranche de 8 pt, son objet, pas d'anneau de progression — à 0 % il ne dit rien |
| Spark | taille habituelle (≈ 25 % de la largeur), posé à côté, du côté libre |
| bulle | « Commence ici » au lieu de « Commencer » |
| nœuds suivants | opacité 60 % — ils existent, ils se tapent, ils n'appellent pas le regard |

Les deux autres pistes sont écartées : un panneau d'accueil au-dessus ajoutait
un second objet là où la densité vise l'inverse ; une bannière d'unité agrandie
faisait mentir la bannière des unités suivantes.

Mesuré : **70,3 % de blanc** à 390 × 844, pour une cible de 70.

### Fin de niveau — **moment plein écran**

Le moment signature n° 4 de `MOTION.md`, et rien de persistant sur le chemin :
la bannière d'unité dit déjà « 5 / 5 modules ». Il se joue **une seule fois**,
à l'instant où le dernier module de l'unité tombe (`cia-units-celebrated` dans
le stockage local), jamais à chaque visite, et jamais sur une hausse d'XP.

Carte de 335 × 479 : bandeau à la teinte CECR du niveau terminé, médaillon
trophée en or, chiffre géant des modules faits, réaction de Spark, une seule
action — « Continuer en A2 ». Il passe par le Reward Director, comme tout le
reste.

## 8. Ce qui change dans le code, une fois arbitré

1. `public/fonts/` : Baloo 2 et Figtree sous-réglés latin, Comfortaa et Golos Text sous-réglés cyrillique, plus Sacramento et Better Together ; `@font-face` avec `unicode-range` dans `index.css` ; suppression du `<link>` Google Fonts de `index.html` ; `fontFamily` de `tailwind.config.ts` pointé sur `CIA Display` / `CIA Text`.
2. Tokens `-edge`, élévations, rayons par taille et z-index dans `src/index.css` et la config Tailwind.
3. Suppression de la variante `glass` de `Button`.
4. `LevelUpCelebration` et `StreakMilestone` : ajout d'un `DialogTitle` (avertissement console constaté en M4).
5. `src/design-system/` : les primitives naissent à partir de l'écran pilote ; `Pressable`, `RollingNumber` et `CheckBar` y migrent si pertinent.
