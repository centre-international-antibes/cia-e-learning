# Pages blanches intermittentes — diagnostic & correctif

## Symptôme
Toutes les 5–10 navigations, le contenu central disparaît (header + footer restent), un hard refresh résout. Pas d'erreur visible côté ErrorBoundary.

## Causes identifiées

### 1. `AnimatePresence mode="wait"` + `React.lazy` + `Suspense` (cause principale)
Dans `src/components/layout/AppLayout.tsx`, chaque route est enveloppée dans un `motion.div` à l'intérieur d'`AnimatePresence mode="wait"`. À l'extérieur, `App.tsx` enveloppe le tout dans `<Suspense>` avec des routes lazy.

Problème connu de framer-motion : quand on navigue vers une route dont le chunk JS n'est pas encore chargé, `Suspense` suspend le rendu du nouvel enfant pendant que `AnimatePresence` attend la fin de l'exit animation de l'ancien. Si la suspension se résout avant/après l'exit, le nouveau `motion.div` peut être monté sans contenu, ou l'ancien reste accroché sans children. Résultat : `<main>` vide jusqu'au prochain re-render forcé (hard refresh).

### 2. `recoverPreview` ne s'arme qu'une fois (cause secondaire/aggravante)
Dans `src/main.tsx`, `PREVIEW_RECOVERY_MAX = 1` dans une fenêtre de 10s. Si un chunk preload échoue (réseau lent, déploiement en cours), un reload auto se déclenche. Mais si un deuxième échec arrive dans les 10s, le reload est **supprimé** et la page reste blanche silencieusement.

## Plan de correction

### Fix 1 — Déplacer `Suspense` à l'intérieur d'`AnimatePresence`
Dans `AppLayout.tsx`, mettre la `Suspense` boundary **dans** le `motion.div` (par route), avec un fallback minimal. Cela garantit que :
- l'exit animation de l'ancien `motion.div` se termine proprement avant le mount du nouveau,
- le nouveau `motion.div` est toujours monté avec un fallback visible (jamais vide),
- le `key={location.pathname}` reste cohérent.

Retirer la `Suspense` globale dans `App.tsx` (ou la garder uniquement pour AdminLayout qui n'utilise pas AnimatePresence) et l'inclure dans AppLayout autour de `<Outlet />`.

### Fix 2 — Assouplir la garde de recovery
Dans `src/main.tsx` :
- passer `PREVIEW_RECOVERY_MAX` à `2` ou `3` (un seul retry est trop strict pour des erreurs réseau qui s'enchaînent),
- en cas de suppression, au lieu de ne rien faire, afficher un overlay minimal "Rechargement nécessaire — cliquer ici" pour que l'utilisateur ne reste pas devant un écran blanc.

### Fix 3 — Garde-fou visuel
Ajouter dans `AppLayout` un `min-height` sur `<main>` égal à la hauteur de viewport restante, et un fallback de dernier recours (skeleton) si `<Outlet />` ne rend rien après X ms — purement défensif, ne devrait pas se déclencher après Fix 1.

## Fichiers modifiés
- `src/components/layout/AppLayout.tsx` — Suspense interne à AnimatePresence
- `src/App.tsx` — retirer/restreindre la Suspense globale
- `src/main.tsx` — relever `PREVIEW_RECOVERY_MAX`, fallback UI si reload supprimé

## Vérification
- Naviguer rapidement entre 10–15 routes différentes (catalogue → programme → profil → dashboard → cours → …) sans hard refresh.
- Throttle réseau "Slow 3G" dans DevTools puis naviguer : le contenu doit toujours afficher un spinner, jamais un blanc.
- Vérifier qu'aucune regression d'animation de transition n'apparaît.
