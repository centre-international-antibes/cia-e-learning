# Où on en est — refonte

Point de reprise, à lire en premier après un `/clear`.
Dernière mise à jour : 2026-10-05.

## État

Branche `design/refonte-etape0`, **PR #33 ouverte, non fusionnée**.
Étapes 0 à 4 livrées. Le retour du pilote est traité aux trois quarts.

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
| 6 | « +500 XP » de la feuille | **fait à moitié** — le barème serveur remplace `50 × leçons`. Mais seules **10 leçons sur 300** ont du contenu en ligne, donc la feuille affiche « — » presque partout. L'XP sans faute mesurée sur ces 10 leçons : min 100, médiane 105, max 110. **Décision à prendre** : estimer les leçons sans contenu à ~105 XP, ou garder « — » |
| 7 | Footer vitrine pendant le chargement | **fait** — le footer est passé dans la frontière de Suspense et masqué sur les routes de l'app (`/programme`, `/dashboard`, `/defi-du-jour`, `/cours/`, `/test-vitesse/`). Vérifié : absent pendant le chargement comme après. **La liste des routes est à arbitrer** |
| 8 | Vidéo du parcours complet | **bloqué** — le player exige une connexion (`/cours/:id` redirige vers `/connexion` sans session). Sans compte de test, le trajet tap → leçon → fin → retour n'est pas enregistrable bout en bout. Il faut soit un compte, soit se contenter d'un montage Motion Lab |

## Ce qui n'est toujours pas fait du brief de l'étape 4

1. transition partagée nœud → player (`layoutId` vers l'en-tête de leçon) ;
2. player et écran de fin alignés sur la nouvelle direction ;
3. états **vierge** (premier contact) et **fin de niveau** ;
4. objectif du jour dans l'en-tête (la prop existe, rien ne l'alimente) ;
5. dessin progressif du chemin au retour de leçon ;
6. lot d'illustration : 8 objets dessinés, affectés par hachage — pas les ~30 par module.

## Décisions en attente

1. **Slogan** : `Better Together` n'existe pas sur Google Fonts (400). Garder le `cursive` par défaut, poser `Sacramento` (déjà auto-hébergée), ou commander une police ?
2. **`bouncy`** : 0,30 donne 4,6 % de dépassement. 0,37 donnerait les ~8 % annoncés. Lequel ?
3. **XP de la feuille** (cf. point 6) : estimer ou afficher « — » ?
4. **Routes sans footer** (cf. point 7) : la liste est-elle la bonne ?
5. **Suite** : finir le parcours, ou avancer en largeur sur l'écran suivant ?
6. **Illustration** : commander les ~30 objets, ou en dessiner encore quelques-uns ?

## Comment reprendre

```bash
npm run typecheck && npx vitest run && npx eslint . && npm run build
npx vite preview --host 127.0.0.1 --port 8081   # puis /programme?redesign=1
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
