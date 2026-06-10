## Objectif

Rendre le `CoursePlayer` confortable sur mobile : scroll fluide, contenu jamais coupé, et remplacer la barre latérale bleue (Spark + XP + progression + bulle de feedback) par un panneau bas compact et fixe, sans rien perdre des fonctionnalités côté desktop.

## Périmètre

Uniquement la couche présentation du lecteur de cours et de ses étapes. Pas de changement de logique XP, de scoring, ni de modèle de données.

Fichiers principaux concernés :
- `src/components/course-player/CoursePlayer.tsx` (refonte layout mobile)
- `src/components/course-player/SparkBubble.tsx` et `StepCharacterBubble.tsx` (taille mobile)
- `src/components/course-player/{LessonStep,QCMStep,FillBlankStep,DragDropStep,FlashcardStep,ListeningStep,FinalQuizStep}.tsx` (paddings/typo/CTA mobile, plus de débordements)
- `src/components/layout/AppLayout.tsx` (vérifier que `pageTransition` ne bloque pas le scroll vertical interne)

## Diagnostic actuel

1. Sur mobile, le `CoursePlayer` est monté via Portal avec `fixed inset-0` + `document.body.style.overflow = 'hidden'`. La zone `main` a bien `overflow-y-auto`, mais :
   - Le header sticky n'a pas de `safe-area` (notch) et mange de la hauteur.
   - Aucune zone n'a `min-h-0` dans la chaîne flex, donc sur certains navigateurs mobiles le `main` ne devient jamais scrollable et le contenu déborde sous l'écran (pas de scroll possible, observé par l'utilisateur).
   - Pas de padding-bottom pour compenser le futur dock + la barre d'URL iOS.
2. La barre latérale `cia-blue-500` est en `hidden lg:flex` → invisible sur mobile, donc le feedback Spark (mood, bulle « Bien joué ! »), le compteur XP en temps réel et la progression « ÉTAPE x / y » sont absents sur mobile (l'utilisateur ne voit qu'un fin liseré dans le header).
3. Les étapes (`LessonStep`, `QCMStep`, etc.) utilisent `max-w-2xl` + paddings desktop ; sur 390 px, les cartes/options débordent ou collent aux bords.

## Plan d'implémentation

### 1. Layout mobile-first du `CoursePlayer`

- Restructurer le conteneur racine en `flex flex-col` avec `h-[100dvh]` (au lieu de `inset-0` seul) pour gérer correctement la barre d'URL mobile.
- Ajouter `min-h-0` sur les niveaux flex intermédiaires pour que `main` devienne réellement scrollable sur iOS/Android.
- Ajouter `pt-safe` au header mobile et `pb-safe` au dock mobile (en réutilisant les utilitaires `pl-safe/pr-safe` déjà présents dans `AppLayout`).
- Donner au `main` mobile un `padding-bottom` ≈ 140 px pour ne jamais passer sous le nouveau dock.

### 2. Nouveau « dock Spark » bas sur mobile

Remplacer la sidebar bleue par un panneau fixe en bas d'écran, visible uniquement < `lg` :

```
┌──────────────────────────────────────────────┐
│  [Spark 56px]   ÉTAPE 3 / 8        +15 XP    │
│                 ▓▓▓▓▓░░░░░░░░░░░░░░░         │
│  ← bulle feedback « Bien joué ! » au-dessus  │
└──────────────────────────────────────────────┘
```

- Fond `bg-cia-blue-500 text-white`, coins arrondis en haut, ombre `shadow-elev-lg`, `pb-safe`.
- Spark à gauche (`Spark size={56}` avec `mood`/`halo` réutilisés tels quels), bloc droit avec libellé `ÉTAPE n/N` + compteur `+XP` animé (`scoreBump`).
- Progress bar pleine largeur sous le bloc texte (réutilise le même calcul `progressPct`, mêmes tokens `bg-g-shine`).
- Bulle de feedback (`bubble.text`, mood encouraging/sad) : `AnimatePresence` au-dessus du dock, ancrée sur Spark, flèche pointant vers le bas. Même durée `BUBBLE_LIFETIME`.

Sur `lg+`, le dock est masqué et la sidebar desktop existante est conservée à l'identique (zéro régression desktop).

### 3. Nettoyage du header mobile

- Le header mobile actuel devient minimal : seulement le bouton fermer `X` + titre tronqué du cours. Toute la partie progression/XP migre dans le dock bas pour libérer de la hauteur utile.

### 4. Adaptation mobile-first des étapes

Pour chaque composant `*Step` :
- Réduire les paddings (`p-4` mobile, `p-6` desktop) et la taille des titres (`text-lg` mobile → `text-xl` desktop).
- Forcer `w-full` + `min-w-0` sur les cartes/options, et `break-words` sur les textes longs (évite les débordements horizontaux signalés).
- CTA `Continuer` : `w-full` mobile, sticky-friendly (pas de position fixe, juste un `mt-auto` dans le flux pour rester atteignable sans recouvrir le dock).
- Vérifier qu'`AppLayout` n'applique pas de `overflow-hidden` parasite quand le portal est monté (lecture de `pageTransition.style` pour confirmer).

### 5. Vérifications

- Tester à 320 / 375 / 390 / 414 px via `preview_ui--set_preview_device_viewport mobile` + capture sur `/cours/lesson-2` :
  - Scroll vertical OK sur toutes les étapes.
  - Aucun débordement horizontal (`overflow-x: hidden` sur la racine du player en garde-fou).
  - Dock toujours visible, jamais recouvert par le clavier (le clavier le pousse, comportement natural d'un élément en flux + `safe-area`).
- Vérifier desktop ≥ `lg` : sidebar inchangée, bulle Spark inchangée.

## Hors périmètre (suite possible)

- Refonte mobile-first globale de l'app (Header, Catalogue, Programme, Profil…) : à traiter dans un second plan dédié, écran par écran, pour ne pas mélanger avec la refonte du lecteur.
- Migration du contenu pédagogique vers Supabase (déjà planifiée Sprint 4).
