# DESIGN.md — direction artistique de CIA e-learning

> Source de vérité du visuel. Toute décision validée est reportée ici **avant**
> d'être appliquée. Une consigne qui contredit ce fichier doit être signalée
> avant d'être suivie.
>
> État : **étape 3 — en attente d'arbitrages.** Les sections marquées
> **À ARBITRER** proposent trois options et ne sont pas tranchées.

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

### **À ARBITRER — trois déclinaisons de surfaces et d'états**

Même palette, trois façons de construire les fonds de carte, les survols et les états désactivés.

| | **A — Papier** | **B — Teinté** | **C — Encre** |
|---|---|---|---|
| fond de page | blanc pur | `ink-50` (gris très clair) | blanc pur |
| carte | blanc, bordure `ink-200` 2 px | blanc, **pas de bordure**, tranche `ink-edge` | `ink-50`, bordure `ink-300` 2 px |
| survol | bordure → `cia-blue-200` | la carte monte de 2 pt | fond → blanc |
| actif / sélectionné | fond `cia-blue-50`, bordure `cia-blue-500` | fond `cia-blue-50`, tranche `cia-blue-edge` | fond `cia-blue-500`, texte blanc |
| désactivé | opacité 45 %, tranche supprimée | niveaux de gris, tranche conservée | opacité 45 % |
| effet | le plus proche des références : beaucoup de blanc, structure par les contours | le plus « jouet » : tout a une tranche, tout a l'air tapable | le plus sobre : contraste par le fond, peu de contours |
| risque | peut paraître sec sans illustration | peut devenir bruyant si tout semble tapable | s'éloigne du « 70 % de blanc » |

Recommandation : **A**, parce que c'est elle qui atteint les 70 % de blanc
mesurés tout en laissant la tranche faire la différence entre tapable et pas
tapable. **B** si on veut assumer le ton jeu.

---

## 5. Tokens — typographie

Deux fontes : une **d'affichage**, très grasse et arrondie, pour titres et
chiffres ; une **de texte** pour tout le reste. `JetBrains Mono` reste pour les
étiquettes en petites capitales. Les deux doivent être **auto-hébergées**
(`public/fonts/`, `@font-face` dans `index.css`, suppression du `<link>` Google
Fonts dans `index.html`), en `woff2`, sous-réglées latin + cyrillique.

**Vérification obligatoire avant arbitrage** : rendu en russe (cyrillique), en
allemand (mots longs), et des chiffres tabulaires lisibles à 48 px.

### **À ARBITRER — trois couples**

| | affichage | texte | licence | pourquoi |
|---|---|---|---|---|
| **1 — Continuité** | **Plus Jakarta Sans** 800 *(déjà la police de titre de la charte)* | **Source Sans 3** | OFL | Le moins de rupture : la charte CIA garde sa voix. Source Sans 3 remplace Inter sans changer la couleur de page, et couvre le cyrillique. |
| **2 — Rondeur** | **Nunito** 900 | **Nunito Sans** | OFL | Le plus proche du langage de référence : terminaisons arrondies, chiffres très larges, parfait pour les gros scores. Une seule famille à deux graisses, donc cohérence garantie et poids minimal. |
| **3 — Caractère** | **Baloo 2** 800 | **Figtree** | OFL | Le plus marqué : Baloo 2 est une display ronde avec du caractère, Figtree reste neutre dessous. Couvre le latin étendu ; **le cyrillique est à vérifier sur Baloo 2** avant de choisir cette option. |

Toutes sont hors liste noire. Aucune n'est Inter.

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

**z-index — en tokens.** Les `z-[200]` / `z-[201]` posés en M4 disparaissent.

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

## 7. **À ARBITRER — trois directions d'illustration**

Les écrans clés ne doivent plus être « texte + icône Lucide ». Trois directions,
toutes réalisables en SVG plat et compatibles avec Spark.

| | **I — Antibes plate** | **II — Objets du quotidien** | **III — Spark en situation** |
|---|---|---|---|
| sujet | lieux : remparts, port, marché, cap, Fort Carré | objets : croissant, ticket de bus, carte postale, clé d'hôtel, menu | Spark mis en scène dans la situation de la leçon |
| traitement | formes plates, 3 à 4 couleurs par scène, aucun dégradé, ombre portée unique | contour de 2 px, aplats, légère ombre basse | pas de contour, volumes pleins, le halo de Spark comme seule lumière |
| où ça vit | bannières d'unité, écrans vides, fin de module | nœuds du parcours, cartes de leçon, coffres | fin de leçon, célébrations, onboarding |
| production | 6 scènes couvrent les 6 niveaux CECR | ~30 objets, un par module | 8 à 10 poses de Spark |
| force | ancre l'école dans sa ville, différencie immédiatement | passe à l'échelle, chaque module a son objet | un seul personnage à produire, cohérence maximale |
| risque | 6 scènes ne suffisent pas à 30 modules | demande un vrai illustrateur pour rester cohérent sur 30 objets | tout repose sur Spark, qui plafonne sans animateur |

Elles sont **combinables** : I pour les bannières, II pour les nœuds, III pour
les moments. C'est la combinaison que je recommande, en commençant par II
(le parcours pilote en a besoin tout de suite).

---

## 8. Ce qui change dans le code, une fois arbitré

1. `public/fonts/` + `@font-face`, suppression du `<link>` Google Fonts de `index.html`, mise à jour de `fontFamily` dans `tailwind.config.ts`.
2. Tokens `-edge`, élévations, rayons par taille et z-index dans `src/index.css` et la config Tailwind.
3. Suppression de la variante `glass` de `Button`.
4. `LevelUpCelebration` et `StreakMilestone` : ajout d'un `DialogTitle` (avertissement console constaté en M4).
5. `src/design-system/` : les primitives naissent à partir de l'écran pilote ; `Pressable`, `RollingNumber` et `CheckBar` y migrent si pertinent.
