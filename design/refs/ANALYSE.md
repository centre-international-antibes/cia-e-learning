# Décorticage des références — Duolingo

> Étape 0 du chantier de refonte. Ce document mesure, il ne décrit pas.
> Tout ce qui est chiffré ici a été relevé sur les fichiers de `design/refs/`.
> Tout ce qui ne l'est pas est marqué **non mesurable** avec la raison.

Dernière mise à jour : 2026-10-02.

---

## 1. Ce que contiennent les références fournies

| fichier | durée | format | contenu |
|---|---|---|---|
| `duo-01.mov` | 32,4 s | 858 × 1114, h264 | Duolingo — lancement, onboarding (Duo se présente, « 7 quick questions », choix de la langue) |
| `duo-02.mov` | 28,7 s | 858 × 1114, h264 | Duolingo — lancement, **parcours**, **player** (traduction par banque de mots), **bonne réponse**, **combo « PERFECT »** |

`duo-01.mov` a été coupé à 32,4 s : au-delà, l'enregistrement quittait Duolingo
pour une autre application. Cette partie n'a pas été conservée.

### Ce que les deux fichiers sont réellement

Ce ne sont pas des captures d'écran de l'application sur un téléphone. Ce sont
des **captures d'écran d'un navigateur jouant des clips Duolingo dans une
bibliothèque de références** (type Mobbin). Trois conséquences, mesurées :

| mesure | relevé | conséquence |
|---|---|---|
| frames identiques à la précédente | **71 % à 94 %** selon le plan | cadence réelle de 6 à 17 images distinctes par seconde, pas 60 |
| coupures franches en plein mouvement | 11 dans `duo-02` | les plans sont des clips différents mis bout à bout, pas une session continue |
| frames assombries par le lecteur | **1 397 / 1 643** dans `duo-02` | les couleurs ne sont fidèles que sur 246 frames |

**Donc : aucune durée, aucune courbe, aucun dépassement ne peut être mesuré sur
ces fichiers.** Une micro-interaction de 180 ms y serait représentée par 1 à 3
images distinctes. Les valeurs de `MOTION.md` ne peuvent pas en être tirées.

Ce qui reste parfaitement exploitable, et qui est mesuré plus bas : **la
géométrie, la densité, la hiérarchie et la palette**, relevées sur les frames
non assombries.

### Ce qu'il manque pour la partie mouvement

Il faut des enregistrements d'écran **faits sur le téléphone**, application
réelle, 60 fps, un moment par fichier (l'enregistreur iOS natif suffit) :

1. un nœud du parcours qui se débloque, depuis la fin de la leçon jusqu'au saut de la mascotte ;
2. l'ouverture d'une leçon depuis un nœud (le tap, la feuille, l'entrée dans le player) ;
3. **une mauvaise réponse** (absente des deux fichiers) ;
4. une bonne réponse isolée, sans combo ;
5. un combo qui monte sur 3 ou 4 réponses d'affilée ;
6. **l'écran de fin de leçon** (absent) ;
7. **l'écran de série** (absent) ;
8. **un passage de ligue ou de section** (absent).

Sans ces fichiers, les presets de `MOTION.md` resteront des valeurs posées à
l'estime et recalées à l'œil sur la preview — ce que ce chantier cherche
justement à éviter.

---

## 2. Méthode

- Extraction image par image : `ffmpeg`, 60 fps nominal, recadrage sur l'écran du téléphone.
- Détection des coupures et des plages figées : différence moyenne par pixel entre images successives.
- Détection des frames assombries : 95ᵉ centile de luminance (une frame nette plafonne à 253, une frame assombrie à ~210).
- Mesures de géométrie : conversion px → points via l'écran détecté, **392 × 847 pt** → facteur **1,260 px/pt** (iPhone 393 × 852 pt).
- Toutes les valeurs ci-dessous sont en **points**, directement comparables à nos captures Playwright en 390 × 844.

Frames de référence conservées dans `design/refs/frames/` pour relecture sans les vidéos.

---

## 3. Mesures — écran Parcours (`frames/parcours.png`)

| élément | mesuré | note |
|---|---|---|
| écran | 392 × 847 pt | |
| surface quasi blanche | **70 %** | beaucoup d'air, mais pas vide |
| une seule couleur saturée dominante | **12,3 % de l'écran** en bleu `#18A8F0` | l'accent occupe un huitième de l'écran |
| bannière d'unité | pleine largeur, **109 pt de haut** | bloc plein, pas une carte posée sur du blanc |
| largeur de la bannière | 344 pt | soit 392 − 2 × 24 pt de marge |
| nœud de leçon | **≈ 67 pt** de diamètre | cible tactile très au-dessus des 44 pt |
| tranche 3D sous le nœud | **≈ 5,6 pt** | ombre basse pleine, pas de flou |
| pas vertical entre nœuds | **76 à 95 pt** | resserré : plusieurs nœuds visibles d'un coup |

Lecture : l'écran tient sur **un bloc de couleur pleine en tête**, une **chaîne
d'objets tapables gros et rapprochés**, et **du blanc partout ailleurs**. La
profondeur vient uniquement de la tranche basse de chaque objet.

### Objets présents que nous n'avons pas

Illustration de personnage posée dans le chemin · coffre · étoiles de score sous
le nœud terminé · nœuds verrouillés en gris plein · barre d'onglets à 6 entrées
colorées · compteurs en tête (langue, série, gemmes, énergie).

---

## 4. Mesures — Player et pied de validation (`frames/player-pied-vert.png`)

| élément | mesuré |
|---|---|
| surface quasi blanche | **68 %** |
| barre de progression | pleine largeur, **18 pt de haut**, orange `#FA9508` en mode série |
| ligne de réponse | **45 pt** de haut, fond vert pâle |
| **pied de validation** | pleine largeur, **93 pt**, ancré en bas, fond vert pâle |
| accents | vert `#48C000`, orange `#F09000`, rouge `#F04848` |

Le pied de validation est **une bande pleine largeur** : icône + « Awesome! » sur
une ligne, **bouton pleine largeur en dessous**. Notre `CheckBar` met le panneau
et le bouton côte à côte — c'est la différence de structure la plus visible.

### Combo (`frames/combo-perfect.png`)

- la barre de progression **change de couleur** (vert → orange) et affiche « 17 IN A ROW » au-dessus ;
- un mot-marque « PERFECT » est **tamponné par-dessus la zone de réponse**, en or, légèrement incliné, avec contour blanc ;
- un faisceau clair part du bas de l'écran ;
- le reste de l'écran ne bouge pas.

Nous avons déjà le badge de combo et la barre qui passe en or à 5 d'affilée : le
principe est en place, c'est l'**amplitude** qui manque (chez eux le combo
repeint la barre, chez nous il ajoute un petit badge de 24 pt).

---

## 5. Ce qu'on reprend, ce qu'on rejette

| principe observé | on reprend | on rejette |
|---|---|---|
| Profondeur par tranche basse pleine, jamais par flou | **oui** — c'est déjà le langage de `Pressable`, à étendre aux nœuds et aux cartes | — |
| Un seul accent saturé occupant ~12 % de l'écran | **oui** — notre parcours est à 4,3 % | — |
| Bloc de couleur pleine largeur en tête de section | **oui** — bannière d'unité aux couleurs du niveau CECR | — |
| Objets tapables très gros (67 pt) et rapprochés (76–95 pt) | **oui** | — |
| Pied de validation pleine largeur, bouton pleine largeur | **oui** | — |
| Combo qui repeint la barre de progression | **oui**, avec notre or | — |
| Illustration de personnages dans le chemin | le **principe** (le chemin est habité) | leur style, leurs personnages |
| Mot-marque tamponné (« PERFECT ») | le **principe** du tampon | la typo Feather, le mot anglais, leur or |
| Vert comme couleur d'action principale | — | **non** : chez nous le bleu CIA est l'action, le vert reste la bonne réponse |
| Barre d'onglets à 6 entrées colorées | — | **non** : six entrées de couleurs différentes cassent la règle « une couleur = un rôle » |
| Compteurs d'énergie / gemmes en tête | — | **non** : monnaie et énergie, hors de notre modèle |
| Mascotte qui culpabilise | — | **non** : invariant |

---

## 6. Audit de l'existant, mesuré de la même façon

Captures Playwright de notre application, 390 × 844, `design/audit/`.

| écran | blanc | pixels saturés | bande pleine largeur | écart principal |
|---|---|---|---|---|
| **Parcours** (`/programme`) | **87 %** | **4,3 %** | **aucune** | trop vide, aucun ancrage de couleur, pas de bannière |
| Catalogue | 69 % | **1,9 %** | aucune | quasi monochrome |
| Défi du jour | 61 % | 8,8 % | une, 47 pt | la plus proche de la cible |
| Landing | **12 %** | **25,7 %** | une, 161 pt | problème inverse : dégradé bleu pâle sur presque tout l'écran |
| *référence parcours* | *70 %* | *12,3 % pour le seul bleu* | *109 pt* | |

Deux défauts opposés, tous les deux chiffrés :

1. **Les écrans applicatifs sont délavés.** Le parcours est à 87 % de blanc pour
   4,3 % de pixels saturés, répartis sur cinq teintes dont aucune ne dépasse
   1,8 %. La référence concentre 12,3 % sur **une seule** couleur. Il n'y a
   aucun bloc de couleur pleine largeur sur lequel l'œil se pose.
2. **La landing est l'excès inverse.** 25,7 % de pixels saturés, dominés par des
   bleus pâles (`#90C0F0`, `#A8D8F0`) : c'est un dégradé décoratif de grande
   surface, précisément ce que la liste noire de `DESIGN.md` interdit.

### Écarts relevés à l'œil sur le parcours, à corriger

- Les nœuds sont des cercles plats cerclés d'un trait fin : **aucune tranche
  basse**, alors que `Pressable` l'applique déjà aux boutons. Le parcours ne
  parle pas la langue de profondeur de l'app.
- Les icônes des nœuds sont des **icônes Lucide non retouchées** — interdit par
  la liste noire.
- Le chemin est une courbe verte pâle et fine : décorative, sans lisibilité de
  progression.
- La bannière d'unité est une **carte blanche posée sur du blanc** ; la
  référence en fait un bloc plein.
- Pas d'état de réussite par nœud (la référence montre 3 étoiles), pas de coffre,
  pas de personnage dans le chemin.
- Pas de barre d'onglets : la navigation passe par un menu hamburger.

---

## 7. Ce que ce document ne fixe pas

- **Les durées, courbes et dépassements** : non mesurables sur les fichiers
  fournis (§ 1). À reprendre dès réception des enregistrements téléphone.
- **Le son et l'haptique** : les deux fichiers sont muets. Impossible de situer
  un son à l'image, impossible de comparer notre synthèse Web Audio aux
  références. À reprendre avec des captures avec son.
- **Les couleurs exactes de la référence** : relevées sur frames non assombries,
  mais à travers un encodage h264 et un lecteur. Elles donnent un ordre de
  grandeur et un rôle, pas une valeur à copier — ce qui est sans conséquence,
  puisque la palette CIA est un invariant.
