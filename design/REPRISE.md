# Où on en est — refonte

Point de reprise, à lire en premier après un `/clear`.
Dernière mise à jour : 2026-10-05 (fin du lot « finir le parcours »).

## État

Branche `design/refonte-etape0`, **PR #33 ouverte, non fusionnée**.
Étapes 0 à 4 livrées, plus le lot « finir le parcours ». Le retour du pilote est
traité aux trois quarts.

Tout vit derrière `?redesign=1` (`?redesign=0` pour revenir). Sans drapeau,
l'application est exactement celle d'avant.

## Retour du pilote — les 8 points

| # | point | état |
|---|---|---|
| 1 | États des nœuds : terminé / courant / à venir | **fait** — terminé en couleur pleine + coche, courant à 84 pt avec anneau de progression et bulle « Commencer », à venir en gris + cadenas. Démo réaliste obtenue en semant `course-progress` (leçons 1 à 30) + `user-cecr-level: A1` |
| 2 | Spark fort dans le chemin, ~25 % de large, état d'attente | **partiel** — Spark est posé à côté du nœud courant à ~25 % de la largeur, il flotte et saute d'un nœud à l'autre (`layoutId`). **Verdict sur les assets à rendre** : les cinq Lottie font 200 × 320 à 5 calques, ils tiennent le rendu à 96 px sans perte. Mais il n'existe **pas** d'état « attente / regard » distinct — `spark-idle` est une respiration de 3 s. Un vrai regard qui suit demande un animateur |
| 3 | Pictos maison partout, coffres sur le chemin | **fait** — cadenas, coche, coffre et trophée dessinés dans le même tracé que les objets ; plus aucune icône tierce dans un nœud ; un coffre tous les trois modules |
| 4 | Plus de monospace dans le parcours | **fait** — vérifié à 0 occurrence ; bannière et titres en Baloo 2, métadonnées en Figtree |
| 5 | Densité, zigzag plus ample | **fait** — espacement 80 pt (cible 76–95), amplitude 88 pt, moins de blanc entre les unités |
| 6 | « +500 XP » de la feuille | **fait à moitié** — le barème serveur remplace `50 × leçons`. **Correction du chiffre annoncé le 5/10 : ce n'est pas 10 leçons sur 300 qui ont du contenu, c'est 170.** Recompté sur `course-content.ts` : A1 20/50, A2 50/50, B1 50/50, B2 50/50, C1 et C2 0/50. XP sans faute sur ces 170 : min 75, médiane 105, moyenne 104, max 110. **Décision à prendre** : estimer les leçons sans contenu à ~105 XP, ou garder « — » |
| 7 | Footer vitrine pendant le chargement | **fait** — le footer est passé dans la frontière de Suspense et masqué sur les routes de l'app (`/programme`, `/dashboard`, `/defi-du-jour`, `/cours/`, `/test-vitesse/`). Vérifié : absent pendant le chargement comme après. **La liste des routes est à arbitrer** |
| 8 | Vidéo du parcours complet | **bloqué** — le player exige une connexion (`/cours/:id` redirige vers `/connexion` sans session). Sans compte de test, le trajet tap → leçon → fin → retour n'est pas enregistrable bout en bout. Il faut soit un compte, soit se contenter d'un montage Motion Lab |

## Lot « finir le parcours » — livré

| | |
|---|---|
| objectif du jour | **fait** — `lib/dailyGoal.ts` compte les leçons terminées aujourd'hui (jour de Paris, celui du défi du jour), plafonné à 3 : l'objectif se remplit, il n'affiche pas de dette |
| chemin qui se dessine | **fait** — tracé en deux couches, ratio calculé sur la longueur réelle du zigzag. Au retour d'une leçon (`?module=<id>`) il repart du nœud quitté ; Spark saute après, à 350 ms |
| état vierge | **fait** — chemin seul, nœud d'entrée à 110 pt sans anneau, Spark à côté, « Commence ici », nœuds suivants à 60 % d'opacité. Mesuré 70,3 % de blanc pour une cible de 70 |
| fin de niveau | **fait** — moment plein écran (`LevelCompleteMoment`), une fois par unité, par le Reward Director. Vérifié en fr, de, ru et sous `prefers-reduced-motion` |

Trois défauts trouvés en mesurant, et corrigés au passage :

1. **Les nœuds n'étaient pas sur le chemin.** Framer écrit `transform` pour
   animer, ce qui effaçait `-translate-x-1/2` : chaque nœud était décalé d'un
   demi-diamètre à droite du tracé, depuis l'étape 4.
2. **Spark se garait sur le nœud voisin** un nœud sur deux, quand le sien
   tombait au milieu du zigzag.
3. **Une récompense à l'écran se faisait couper.** La file rangeait les meso
   devant les macro, y compris devant une macro déjà affichée : un succès
   débloqué coupait le moment de fin de niveau en deux. La file retient
   désormais ce qui est vu (`markShown`).

Captures : `design/audit/parcours-fin/`, rejouables par
`node design/audit/capture-parcours.mjs` (après `npm run build` et le preview).

## Ce qui n'est toujours pas fait du brief de l'étape 4

1. transition partagée nœud → player (`layoutId` vers l'en-tête de leçon) —
   **reportée** : la cible n'existe pas encore, `/cours/:id` a toujours son
   héros image + dégradé, qui est en liste noire. Elle part avec le lot suivant ;
2. player et écran de fin alignés sur la nouvelle direction ;
3. lot d'illustration : 8 objets dessinés, affectés par hachage — pas les ~30 par module.

## Décisions tranchées le 6/10

1. **Slogan** → Sacramento, tout de suite. Couleur passée de `#e64353` en dur au
   token `cia-red-400`, et le slogan reste **en anglais partout**, porté par une
   constante, pas une clé i18n : une signature de marque ne se traduit pas.
   **À vérifier côté CIA** : `Better Together` est une police **commerciale** de
   Katsia Jazwinska (MyFonts, Creative Market), pas une police absente. Si la
   charte graphique du CIA en détient une licence web, c'est elle qu'il faut
   auto-héberger — c'est la police d'origine de la marque, et ça remplace
   Sacramento sans rien redessiner. Les versions gratuites en circulation sont
   des démos interdites d'usage commercial : à ne pas installer.
2. **`bouncy`** → 0,30, figé. 0,37 sortirait de la plage des standards, et le
   preset sert surtout aux cascades, là où l'animation se répète le plus.
3. **XP de la feuille** → estimation à 105 XP par leçon sans contenu.
   **Sans effet visible aujourd'hui** : aucun module n'est à moitié rempli —
   17 le sont entièrement, 13 pas du tout, zéro entre les deux. La règle ne
   servira que le jour où une leçon sera mise en ligne seule dans son module ;
   `remainingXp.test.ts` est là pour ce jour-là.
4. **Routes sans footer** → `/test-niveau` et `/classement` rejoignent la liste,
   `/profil` garde le sien.
5. **Durée d'un moment macro** → fermeture à la main, pas de minuterie, et
   `prefers-reduced-motion` ne raccourcit plus les durées.

## Deux correctifs du 6/10

- **Logo de la page de connexion.** `AuthShell` le tirait de
  `picto-cia.png.asset.json`, qui pointe vers `/__l5e/assets-v1/…` — une URL que
  seule la couche d'hébergement de Lovable résout. Hors de chez elle, la page de
  connexion s'affichait **sans logo**. Il pointe maintenant sur `/picto.png`,
  déjà dans le dépôt, au même octet près. Vérifié chargé (1 182 px de large) en
  préversion locale. Les deux `*.asset.json` restent en place, inutilisés :
  ce sont des manifestes Lovable, et Lovable est en pause — on ne les retire pas
  pendant ce temps-là.
- **Emoji 👋 de l'accueil.** Remplacé par Spark (`idle`, 96 pt) : l'écran
  d'accueil est un écran clé, la liste noire exclut l'emoji en guise d'icône, et
  le texte dit déjà « Je vais te guider » — c'est la mascotte qui parle.
  Restent deux emojis ailleurs, dans des phrases et non en guise d'icône :
  `DashboardHero` (« Bonjour, X 👋 ») et `AdminDashboard`. À trancher à part.

## Ce qui est urgent, et qui n'est pas du design

**Trois modules A1 sur cinq n'ont aucune leçon jouable** — A1.3, A1.4, A1.5,
soit les leçons 21 à 50. C'est le niveau d'entrée : un débutant qui finit A1.2
tombe dessus au bout de vingt leçons.

Reproduit le 6/10 : le tap sur « Commencer » **ne faisait rien**. La feuille se
fermait, l'URL ne bougeait pas, aucun message. Garde-fou posé — l'action est
désactivée et la feuille dit « Les leçons de ce module arrivent bientôt » — mais
ce n'est qu'un garde-fou : **il manque 130 leçons sur 300**, dont 30 en A1 et
les 100 de C1 et C2.

Ce qui reste à décider de ce côté : le nœud d'un module vide doit-il se
distinguer sur le chemin ? Trois pistes — un état « bientôt » propre (gris
teinté, pas de cadenas, puisque ce n'est pas verrouillé mais à paraître) ; le
nœud inchangé et seule la feuille qui parle, l'état d'aujourd'hui ; ou les
modules vides retirés du chemin tant qu'ils n'ont pas de contenu, ce qui
raccourcit le parcours mais ment sur le programme.

## Comment reprendre

```bash
npm run typecheck && npx vitest run && npx eslint . && npm run build
npx vite preview --host 127.0.0.1 --port 8081   # puis /programme?redesign=1
```

Les quatre états du parcours, sans rien semer à la main :

```
/programme?redesign=1                 # au choix, selon le localStorage
node design/audit/capture-parcours.mjs  # vierge, progression, retour, fin de niveau
```

Démo avec progression réaliste — à semer dans le `localStorage` avant chargement :

```js
localStorage.setItem('cia-onboarding-done', new Date().toISOString());
localStorage.setItem('course-progress', JSON.stringify(
  Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`lesson-${i + 1}`, { completed: true, score: 100 }]))));
localStorage.setItem('user-cecr-level', 'A1');  // sans ça, l'XP ferait dériver le niveau
localStorage.setItem('user-xp', '1240');
```

## Note de méthode

Cette session a coûté cher en contexte : une seule conversation pour six lots,
et surtout **trop de captures lues image par image**. Une image reste dans le
préfixe et se relit à chaque appel. Pour la suite : une conversation par lot,
les mesures en chiffres, les captures envoyées sans être relues.
