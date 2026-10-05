# MOTION.md — le mouvement de CIA e-learning

> Source de vérité du mouvement, avec `DESIGN.md`. Toute décision validée est
> reportée ici **avant** d'être appliquée.
>
> État : **étape 3 — valeurs de départ posées, réglage à venir.** Les presets
> ci-dessous sont un point de départ mesuré ; ils se règlent dans
> `/admin/motion-lab` → **Réglage**, et les valeurs validées sur téléphone
> reviennent ici.

---

## 1. D'où viennent les valeurs

La mesure temporelle sur les références a été **abandonnée** : les
enregistrements fournis sont des captures d'un lecteur vidéo, figées de 71 à
94 %, avec onze coupures franches (cf. `design/refs/ANALYSE.md`, § 1). Aucune
durée n'en est tirable.

Les valeurs ci-dessous viennent donc de trois sources, dans cet ordre :

1. **Les plages du brief** — micro-interaction 120–180 ms, transition
   250–400 ms, moment fort 500–800 ms.
2. **Les standards des skills installés** (`review-animations/STANDARDS.md`) —
   les animations d'interface restent sous 300 ms ; le rebond reste **entre 0,1
   et 0,3**, au-delà c'est réservé au joueur assumé ; le stagger tient entre 30
   et 80 ms ; jamais d'`ease-in` sur de l'interface.
3. **La mesure de nos presets existants**, obtenue en exécutant le générateur de
   ressort de framer-motion — pas en lisant la doc.

Ce qui reste à faire : **le réglage à l'œil, sur téléphone.** C'est lui qui
tranche, et c'est lui qui remplacera ces chiffres.

---

## 2. Presets

Exprimés en **`visualDuration`** (temps d'arrivée visible) et **`bounce`**
(dépassement). C'est le seul vocabulaire qui se vérifie à l'œil : « 0,35 s,
rebond léger » se discute, « stiffness 210, damping 26 » non.

**framer-motion 11.18.2 accepte déjà ces deux paramètres** — vérifié en
exécutant le générateur, pas en se fiant au changelog. **La migration vers
`motion` 13 n'est donc pas nécessaire** pour ce chantier : sa principale
justification tombe. Elle reste possible plus tard, pour d'autres raisons.

| preset | arrivée | rebond | mesuré : arrivée / dépassement / stabilisation | usage | plage |
|---|---|---|---|---|---|
| `press` | 0,110 s | 0 | 140 ms / 0 % / 160 ms | enfoncement d'un `Pressable` | micro ✅ |
| `snappy` | 0,205 s | 0,17 | 170 ms / 0,9 % / 365 ms | appui, bascule, sélection | micro ✅ |
| `bouncy` | 0,245 s | **0,30** | 150 ms / 4,6 % / 398 ms | pop de badge, check, combo | micro ✅ |
| `gentle` | 0,350 s | 0,09 | 355 ms / 0,1 % / 460 ms | panneau, feuille, mise en page | transition ✅ |
| `sheet` | 0,515 s | 0,25 | 350 ms / 2,8 % / 825 ms | ouverture de feuille | transition ✅ |
| `stamp` | 0,520 s | 0,44 | 260 ms / 12 % / 1 055 ms | tampon qui frappe | transition ⚠️ |
| `slow` | 0,450 s | 0 | 575 ms / 0 % / 735 ms | macro | moment ✅ |
| `hero` | 0,880 s | 0,28 | 560 ms / 3,8 % / 1 340 ms | moment signature | moment ✅ |

`snappy`, `gentle` et `slow` **reproduisent exactement** le comportement de
leurs versions M1 : l'expression change, le mouvement de l'app ne bouge pas.
`bouncy` est le seul dont le comportement change (cf. ci-dessous). Les quatre autres sont introduits par la refonte et ne sont pas
encore utilisés en production.

### `bouncy`, ramené dans la norme *(arbitré)*

Le rebond passe de **0,59 à 0,30**, ce qui ramène le preset dans la plage micro :
arrivée à 150 ms au lieu de 102, dépassement à **4,6 %** au lieu de 24,2, et
stabilisation à 398 ms au lieu de 636. C'est le seul preset de M1 dont le
comportement change.

Rectification de ce que j'avais annoncé : j'avais écrit qu'un rebond de 0,30
donnerait « ~8 % de dépassement ». C'est faux — il en donne **4,6 %**. Pour
8 %, il faudrait **0,37**. La valeur appliquée est bien 0,30 comme demandé ;
le curseur du Réglage permet de monter à 0,37 si 4,6 % paraît trop sage.

**`stamp` se stabilise en 1 055 ms.** C'est long, mais le tampon est fait pour
être regardé. À juger à l'œil au Réglage.

### `stagger`

`tight` **30 ms** · `base` **50 ms** · `loose` **70 ms** *(arbitré)*. La cascade
rentre dans la plage de 30 à 80 ms des standards. `loose` passe de 120 à 70 ms :
la cascade des trois tuiles de l'écran de fin M4 s'en trouve resserrée de 240 à
140 ms au total.

### `fade`

`fast` 120 ms · `base` 200 ms · `slow` 350 ms. **Réservé à l'opacité et aux
couleurs.** Jamais une durée sur une transform : une transform prend un ressort.

---

## 3. Règles

- Micro-interaction **120–180 ms**, transition **250–400 ms**, moment fort **500–800 ms**.
- **La sortie est plus rapide que l'entrée.** Un élément qui part n'a pas besoin d'être regardé.
- **Tout est interruptible et passable.** Un ressort garde sa vitesse quand on le coupe ; une suite d'images repart de zéro — raison de plus pour préférer les ressorts.
- **Le contenu reste utilisable pendant l'animation.** Une cascade ne bloque jamais un clic.
- **L'écran reste correct si une animation ne joue pas.** Aucun état final ne dépend d'un `onAnimationComplete`.
- Jamais d'`ease-in` sur de l'interface : ça retarde l'instant qu'on regarde.
- Animer **`transform` et `opacity`** uniquement. `will-change` ponctuel, retiré après.

---

## 4. Anticipation, impact, suivi

C'est ce qui manque le plus aujourd'hui : nos mouvements vont du point A au
point B sans rien raconter. Chaque mouvement important se décompose en trois
temps, et chacun est documenté par moment au § 6.

| temps | ce que c'est | ordre de grandeur |
|---|---|---|
| **anticipation** | léger recul **à contresens** avant le départ | 60–90 ms, 4 à 8 % d'amplitude |
| **impact** | écrasement à l'arrivée — l'objet encaisse | 80–120 ms, 6 à 10 % d'écrasement |
| **suivi** | ce que l'impact provoque : rebond, poussière, particules, halo | 200–400 ms après l'impact |

Un `Pressable` a déjà l'anticipation (l'enfoncement) et l'impact (la tranche qui
s'écrase) ; il n'a **pas de suivi**. Les objets de récompense, eux, doivent avoir
les trois.

---

## 5. Chorégraphie

- Cascade de **30 à 80 ms**, **8 éléments au plus**. Au-delà, on groupe.
- `layoutId` partagé entre le **nœud du parcours** et l'**en-tête de la leçon** : l'objet tapé devient l'écran, il ne disparaît pas pour être remplacé.
- Squelettes **à la forme exacte** du contenu qu'ils remplacent — pas de rectangle générique.
- Une seule chose bouge à la fois dans le champ de vision. Le reste tient en place.

---

## 6. Son et haptique

Point de départ : **les sons synthétisés de M1** (`src/lib/feedback/`, Web
Audio, scopes `player` / `app`). Les références fournies sont muettes : aucune
comparaison n'est possible, l'ajustement se fera au rendu.

| moment | son | instant exact | haptique |
|---|---|---|---|
| appui sur un objet tapable | `tap` | au `pointerdown`, pas au `click` | `tap`, dans le player seul |
| sélection d'une option | `select` | à la pose de l'option | `tap`, player seul |
| bonne réponse | `correct`, hauteur montant avec la série (0→7) | à la révélation, avec l'apparition du panneau | `correct`, ou `combo` dès la 2ᵉ d'affilée |
| mauvaise réponse | `wrong`, doux | à la révélation | `wrong` |
| palier de combo (3, 5, 10) | `correct` au degré du palier | **au moment où le badge atteint sa taille**, pas à son apparition | `combo` |
| fin de leçon | `complete` | à l'entrée de Spark, premier temps de la chorégraphie | `celebrate` |
| tampon « Parfait ! » | `chest` | **à l'impact du tampon**, pas à son départ | `combo` |
| éclat d'XP qui arrive | `tap` léger | à l'arrivée de chaque éclat, **4 au maximum** | aucune |
| nœud débloqué | `chest` | quand la tranche du nœud reprend sa hauteur | `combo` |
| passage de niveau | `levelUp` | à la pose de la carte, après l'impact | `celebrate` |
| palier de série | `complete` | à l'arrivée du chiffre | `celebrate` |

Règle qui ne bouge pas : **le son se pose sur l'impact, jamais sur le départ.**
Un son qui précède ce qu'on voit donne l'impression d'un décalage.

### Si la synthèse ne tient pas

À juger au rendu, pas avant. Si elle ne tient pas, le cahier des charges pour un
sound designer est : 11 sons, 120 à 600 ms chacun, format `.webm` + `.m4a`,
**40 ko au total**, pas de queue de réverbération (elles se superposent mal en
file), une famille timbrale unique, et les sons de progression accordés entre
eux sur une gamme pour que le combo monte musicalement.

---

## 7. Moments signature — cinq, pas plus

Rares, donc précieux. Entre eux, l'app reste calme : le contraste fait partie de
l'effet. Tous rejouables dans `/admin/motion-lab` → **Réglage**.

**Célébration en trois temps**, commune aux cinq : chiffre géant qui compte ce
qui a été fait (impact à l'arrivée, halo qui pulse) → réaction de Spark → CTA.
Particules aux formes CIA (éclats d'or, flammes, étoiles), jamais de confetti
générique.

### 1. Bonne réponse en série

La barre de progression **se repeint en or** et le badge de combo arrive en
`bouncy`. Anticipation : le badge part de l'échelle 0. Impact : le dépassement.
Suivi : la barre garde sa couleur jusqu'à la prochaine erreur. Son au moment où
le badge atteint sa taille.

*Écart avec la référence : chez eux le combo repeint toute la barre et l'annonce
en tête (« 17 IN A ROW ») ; chez nous il ajoute un badge de 24 pt. L'amplitude
est à monter.*

### 2. Fin de leçon

Déjà en place (M4) : Spark, titre, trois tuiles en cascade, tampon, CTA, éclats
d'XP vers la pastille du total. Reste à porter au niveau des références :
l'amplitude des tuiles et la cascade (`stagger.loose` est peut-être trop lent).

### 3. Nœud du parcours débloqué

Le nœud terminé s'enfonce et se **tamponne** (`press` puis `stamp`), le chemin
**se dessine** jusqu'au nœud suivant, **Spark saute** sur ce nœud (`hero`), et le
nœud suivant perd son gris. Trois temps nets : anticipation au recul de Spark,
impact à l'atterrissage, suivi en poussière et en halo.

### 4. Passage de niveau CECR

Le plus rare et le plus fort. La carte de niveau arrive de loin, pivote et se
pose (`hero`). C'est le seul moment où l'inclinaison 3D au doigt est permise.
Jamais déclenché par l'XP — uniquement par la progression pédagogique.

### 5. Palier de série

La flamme grossit, le chiffre encaisse. Ton toujours positif : **une série
perdue ne se célèbre pas à l'envers** — pas de mascotte triste, pas de
dramatisation (invariant).

---

## 8. Spark — machine à états

Composant à **machine à états explicite**, qui réagit à l'état réel de
l'application. Jamais de boucle décorative. **Un seul Spark à l'écran.** Jamais
triste ni menaçant.

| état | déclencheur | sortie |
|---|---|---|
| `idle` | aucun événement depuis 3 s | boucle lente |
| `attentive` | l'apprenant a commencé à répondre | retour à `idle` après 8 s |
| `listening` | étape d'écoute, audio en cours | fin de l'audio |
| `encouraging` | mauvaise réponse, ou intertitre de rejeu | 2 s |
| `celebrating` | bonne réponse, fin de leçon, déblocage | 2 s |
| `surprised` | palier de combo, coffre ouvert | 1,2 s |
| `sleeping` | aucune interaction depuis 60 s | au premier geste |

Transitions : toujours par `idle`, jamais d'un état fort à un autre
directement. Durée de transition : 200 ms en fondu.

**Logique et rendu séparés.** Le rendu est aujourd'hui en Lottie ; l'interface du
composant ne dépend pas du moteur, de sorte qu'un passage à Rive ou à des
séquences d'images ne touche aucun appelant.

Ce tableau est le **cahier des charges d'un animateur**. À dire sans détour :
**sans animateur, le plafond de qualité de Spark est celui des fichiers Lottie
actuels**, et c'est aujourd'hui le facteur limitant le plus sérieux sur les
moments signature. `@rive-app/react-canvas` ne sera pas installé tant que les
fichiers ne sont pas commandés : ce serait 180 ko de runtime pour rejouer les
mêmes Lottie.

---

## 9. Accessibilité et performance

**Sous `prefers-reduced-motion`** (via `useReducedMotionConfig`, et
`MotionConfig reducedMotion="user"` à la racine) : on garde les **fondus** et les
**sons** ; on supprime déplacements, parallaxe, inclinaison et particules. Tout
état final est atteint immédiatement.

**Performance** : `transform` et `opacity` seules ; `will-change` posé juste
avant et retiré après ; transforms 3D isolées dans des wrappers. **Mesure à CPU
ralenti 4×** dans chaque livrable — 60 fps sur un iPhone d'il y a trois ans en
Safari mobile est la cible, pas 60 fps sur un portable de développement.
