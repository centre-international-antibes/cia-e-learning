## Objectif
Stabiliser le passage `/connexion` → `/dashboard` pour qu’il n’existe plus d’état où le header et le footer restent visibles pendant que le contenu central disparaît jusqu’au hard refresh.

## Ce que je vais corriger
1. Refaire le garde-fou d’authentification pour que l’app n’entre jamais dans un état “connecté mais pas encore prêt à rendre la route”.
2. Simplifier la logique de redirection login/dashboard pour éviter les navigations concurrentes et les transitions qui laissent `<main>` vide.
3. Sécuriser le rendu animé des pages pour que le contenu central affiche toujours soit la page, soit un loader visible, jamais du blanc.
4. Vérifier que les hooks du dashboard et les lectures base de données ne partent qu’une fois l’auth réellement prête.
5. Tester spécifiquement le scénario utilisateur: connexion, arrivée sur `/dashboard`, navigation répétée, refresh normal.

## Hypothèse de cause racine
Le problème n’est pas seulement le formulaire de connexion. Il reste un enchaînement fragile entre:
- l’initialisation de session dans `useAuth.tsx`
- la protection de route dans `App.tsx`
- la transition `AnimatePresence mode="wait"` dans `AppLayout.tsx`
- le lazy loading/suspense des pages

Résultat probable: la route passe bien à `/dashboard`, mais le conteneur animé a déjà démonté l’ancien contenu avant que le nouvel arbre soit considéré comme “prêt”, ce qui laisse le centre vide sans récupération automatique.

## Plan d’implémentation
### 1) Durcir l’état d’auth prêt
- Introduire un état explicite de “session hydratée / auth prête”.
- Faire en sorte que l’état auth ne dépende pas d’une course entre `getSession()` et `onAuthStateChange()`.
- Éviter tout déblocage prématuré de l’UI tant que la première session utile n’est pas réconciliée.

### 2) Unifier les redirections auth
- Supprimer les redirections impératives dispersées quand elles se chevauchent.
- Centraliser la décision “utilisateur connecté/non connecté” au niveau des gardes de route.
- Remplacer autant que possible les `navigate()` dans les effets par un chemin de rendu plus déterministe.

### 3) Sécuriser le shell de route animé
- Ajuster `AppLayout.tsx` pour que la transition de page ne puisse plus afficher un `<main>` vide.
- Si nécessaire, déplacer ou simplifier `AnimatePresence mode="wait"` autour des routes authentifiées/lazy.
- Garantir qu’un fallback visuel reste affiché pendant toute transition ou suspension.

### 4) Gater les hooks du dashboard
- Empêcher les requêtes et effets dépendants de l’utilisateur de partir avant que l’auth soit prête.
- Conserver un squelette stable tant que les données minimales du dashboard ne sont pas décidées.
- Éviter les branches silencieuses qui finissent sans contenu visible.

### 5) Validation
- Tester le flux connexion → dashboard plusieurs fois.
- Vérifier qu’en cas de délai de session ou de chargement lazy, un loader/skeleton reste visible.
- Vérifier qu’un refresh standard ne soit plus nécessaire.

## Détails techniques
Fichiers visés:
- `src/hooks/useAuth.tsx`
- `src/App.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/pages/Connexion.tsx`
- `src/pages/Dashboard.tsx`
- éventuellement les hooks dashboard si le gating doit être ajouté côté requêtes

Résultat attendu:
- après connexion, `/dashboard` s’affiche toujours normalement
- aucune page protégée ne peut rendre un centre vide
- les transitions animées restent fluides sans casser le rendu