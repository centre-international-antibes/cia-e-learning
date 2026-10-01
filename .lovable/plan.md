## Problème
Dans `CoursePlayer`, le passage d'une étape à l'autre via le bouton Suivant ne change pas de route — c'est juste `setCurrentStep(currentStep + 1)`. Le scroll reste à la position du clic (en bas), obligeant l'utilisateur à remonter manuellement.

## Correctif

**`src/components/course-player/CoursePlayer.tsx`**
- Ajouter un `useEffect` dépendant de `currentStep` qui effectue `window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })` à chaque changement d'étape.
- Respecter `prefers-reduced-motion` : utiliser `behavior: 'auto'` si réduit, sinon `'smooth'`.

Aucune autre page concernée (le hook `ScrollToTop` global sur changement de route fonctionne déjà ailleurs si présent, mais ici l'étape n'est pas une route).

## Fichiers modifiés
- `src/components/course-player/CoursePlayer.tsx`
