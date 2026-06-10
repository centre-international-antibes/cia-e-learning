## Problème

Dans le parcours, la carte qui s'ouvre au tap d'un module (`ModuleDrawer`) :
- n'indique pas combien de leçons sur 10 sont déjà terminées,
- n'affiche la barre de progression qu'entre 1 % et 99 % (donc invisible quand `progress = 0`, et le compteur n'augmente jamais leçon par leçon car `progress` vaut aujourd'hui uniquement 0 ou 100 dans `Curriculum.tsx`),
- ne liste pas les leçons, donc impossible de voir « j'en suis à la 3/10 » et de savoir quelle leçon est la prochaine.

## Objectif

Donner une vision claire et instantanée de l'avancement par module : nombre exact de leçons terminées, prochaine leçon à faire, et thèmes couverts.

## Périmètre

- `src/pages/Curriculum.tsx` : calculer `completedLessons` par module à partir de `readCourseProgressMap()` (clé `lesson-${id}`), et propager au drawer.
- `src/components/courses/ModuleDrawer.tsx` : refonte de la carte stat + ajout d'une liste compacte des leçons + progress bar toujours visible.
- `src/i18n/locales/*.json` : 2 ou 3 nouvelles clés (`curriculum.drawer.lessons_done`, `curriculum.drawer.next_lesson`, `curriculum.drawer.lessons_list`).

Aucun changement de logique XP/déblocage. Pas de migration DB (le suivi par leçon est déjà persisté localement via `readCourseProgressMap`).

## Diagnostic technique

- `Curriculum.tsx` calcule actuellement `progress: isDemoCompleted ? 100 : 0`. On va remplacer par :
  - `completedLessons = m.lessons.filter(l => completedIds.has(\`lesson-${l.id}\`)).length`
  - `progress = totalLessons > 0 ? Math.round(completedLessons / totalLessons * 100) : 0`
  - `state` reste calé sur `isDemoCompleted` (= module 100 % fini) pour préserver le déblocage du module suivant.
- Le drawer reçoit déjà `totalLessons` ; on lui ajoute `completedLessons` et la liste `lessons: { id, title, completed }[]`.

## Plan d'implémentation

### 1. `Curriculum.tsx`

- Importer `readCourseProgressMap` et construire `completedIds: Set<string>` une seule fois dans le `useMemo` des sections (mêmes deps + clé qui change quand `demoCompleted` change déjà).
- Pour chaque module :
  - calculer `completedLessons` et `progress` réels,
  - construire `lessons = m.lessons.map(l => ({ id: l.id, title: l.title, completed: completedIds.has(\`lesson-${l.id}\`) }))`.
- Étendre le type `ModuleWithMeta` avec `completedLessons: number` et `lessons: { id: number; title: string; completed: boolean }[]`.
- Passer ces deux nouvelles props à `<ModuleDrawer />`.

### 2. `ModuleDrawer.tsx`

Ajouter aux props : `completedLessons: number`, `lessons: { id: number; title: string; completed: boolean }[]`.

Refonte du contenu du drawer :

1. **Hero header** : inchangé (icône + badge niveau + « Module 01 » + titre + thème).

2. **Compteur d'avancement bien visible** (juste sous le titre) :

```
   ┌────────────────────────────────────────┐
   │  3 / 10 leçons terminées        30 %   │
   │  ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
   └────────────────────────────────────────┘
```

   - Barre `bg-cia-blue-500` toujours rendue (même à 0 %), avec libellé « X / Y leçons terminées » à gauche et pourcentage à droite, tabular-nums.
   - Si `state === 'completed'` : pastille « Terminé ✓ » verte à la place du pourcentage.

3. **Stats compactes** (grille 3 colonnes existante) : remplacer la carte « Leçons » par une carte **« X / Y leçons »** (au lieu de juste `10`), pour rappeler l'avancement même au coup d'œil. Durée et XP inchangés.

4. **Liste des leçons** (nouvelle section, scroll interne max-h ≈ 280 px) :
   - Une ligne par leçon avec :
     - Index `01`, `02`, … (mono, tabular)
     - Titre de la leçon (`truncate`)
     - Pastille à droite : `Check` vert si terminée, `Play` bleu sur la prochaine leçon à faire (= 1re non-completed du module si état non-locked), gris sinon.
   - La 1re leçon non terminée est visuellement mise en avant (`bg-cia-blue-50` + ring `cia-blue-500/30`) → c'est la « prochaine leçon » et on saura instantanément où on en est.
   - Sur module `locked`, liste rendue grisée non interactive.

5. **CTA** : inchangé, mais le libellé `continue_cta` reste pertinent puisque `entryLesson` pointe déjà sur la 1re leçon non terminée.

### 3. i18n

Ajouter dans les 6 fichiers `src/i18n/locales/*.json` :
- `curriculum.drawer.lessons_done` → ex. « {{done}} / {{total}} leçons terminées »
- `curriculum.drawer.lessons_list` → ex. « Leçons du module »
- `curriculum.drawer.next_lesson` → ex. « Prochaine » (badge)
- `curriculum.drawer.completed_badge` → ex. « Terminé »

### 4. Vérification

- Ouvrir `/parcours`, taper sur le module A1.1 :
  - vérifier que le compteur affiche le bon `X / 10`,
  - vérifier que la barre de progression est visible même à 0 %,
  - vérifier que la liste met en évidence la prochaine leçon,
  - vérifier qu'après avoir terminé une leçon (en revenant sur le parcours), le compteur incrémente bien.
- Vérifier mobile (390 px) : drawer reste scrollable et la liste n'écrase pas le CTA.

## Hors périmètre

- Suivi serveur-side du `course_progress` (déjà tracé dans Sprint 4 — migration des leçons vers Supabase).
- Refonte des nœuds de module sur le parcours (afficher un mini-arc de progression autour du `ModuleNode`) → à proposer ensuite si le drawer ne suffit pas.
