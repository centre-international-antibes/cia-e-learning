## Objectif
Alléger la carte module, permettre de cliquer une leçon pour la lancer, et corriger le blocage de scroll qui empêche d'atteindre la leçon n°10.

## 1. Alléger la carte (`ModuleDrawer.tsx`)

Trop d'infos redondantes. Refonte minimaliste :

- **Supprimer la grille 3 stats** (Leçons / Minutes / XP). Le compteur "1/10 leçons" est déjà dans la barre de progression juste au-dessus → doublon.
- **Remplacer par une ligne meta discrète** sous le titre : `120 min · +500 XP` (texte muted, inline, pas de cartes).
- **Supprimer le bloc `description`** (souvent vide ou redondant avec `theme`) — ne garder que `theme` sous le titre.
- **Garder** : hero icon, badge niveau + n° module, titre, thème, barre de progression Spark, liste des leçons.
- **Liste leçons** : retirer le cadre coloré sur l'item "Prochaine" (juste un ring fin + badge `Play` suffit) pour aérer.

Résultat : drawer ~40 % plus court, hiérarchie claire (Hero → Progression → Leçons → CTA).

## 2. Leçons cliquables

Chaque `<li>` devient un `<Link to={\`/cours/${lesson.contentKey}\`}>` (ou bouton pour les verrouillées/locked qui ne font rien).

- Nécessite de passer `contentKey` (ou route résolue) dans `DrawerLessonItem` depuis `Curriculum.tsx` — utiliser la même résolution que `getEntryLessonForModule` pour chaque leçon individuelle.
- Au clic : `onOpenChange(false)` puis navigation.
- Leçons verrouillées (module locked) : non cliquables, curseur `not-allowed`.

## 3. Correction scroll mobile

Cause : double scroll imbriqué — `ul` a `max-h-[260px] overflow-y-auto` à l'intérieur d'un `DrawerContent` (Vaul) qui intercepte déjà le drag/scroll vertical sur mobile. Résultat : on ne peut plus scroller jusqu'à la leçon 10.

Fix : un seul conteneur scrollable.
- Retirer `max-h-[260px] overflow-y-auto` sur `<ul>`.
- Mettre le **bloc central** (`<div className="px-6 py-4 space-y-4">`) en `flex-1 overflow-y-auto overscroll-contain` à l'intérieur d'un `DrawerContent` en `flex flex-col max-h-[90vh]`.
- Header + Footer restent fixes (sticky implicite via flex), seule la zone centrale scrolle, et elle scrolle correctement sur mobile et desktop.

## 4. Vérification

- Mobile 390×844 : ouvrir le module 01, scroller jusqu'à la leçon 10 → OK.
- Cliquer leçon 02 "Prochaine" → ouvre `/cours/<lesson>`.
- Cliquer une leçon complétée → ré-ouvre la leçon.
- Desktop : même comportement, drawer plus aéré.

## Fichiers modifiés
- `src/components/courses/ModuleDrawer.tsx`
- `src/pages/Curriculum.tsx` (enrichir `DrawerLesson` avec la route cible)

Hors scope : refonte du `ModuleNode` (mini-arc de progression), persistance serveur du `course_progress`.
