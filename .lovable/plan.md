## Cause de la page blanche

Quand un utilisateur connecté clique sur le logo (`<Link to="/">`), la route `/` rend `LandingOrRedirect` qui retourne `<Navigate to="/dashboard" replace />`. Ce composant est monté **à l'intérieur** d'un `<AnimatePresence mode="wait">` (cf. `AppLayout.tsx`) qui anime chaque route via la clé `location.pathname`.

Conséquence : `AnimatePresence` démarre la sortie de la page précédente, pendant que `<Navigate>` re-change le pathname (`/` → `/dashboard`). La `motion.div` clé `/` (qui ne contient rien — `Navigate` rend `null`) reste figée à `opacity:0`, le `<main>` apparaît vide → page blanche avec uniquement header + footer.

## Correctif

### 1. `src/components/layout/Header.tsx`
Logo intelligent : cibler `/dashboard` quand l'utilisateur est connecté, `/` sinon. Plus aucune redirection à traverser.

```tsx
<Link to={user ? '/dashboard' : '/'} ...>
```

### 2. `src/App.tsx`
- Remplacer le `<Navigate>` de `LandingOrRedirect` par une redirection via `useEffect` + `useNavigate`, et afficher `RouteFallback` pendant l'instant intermédiaire.
- Même traitement pour `ProtectedRoute` afin qu'une session expirée ne re-déclenche jamais le bug dans `AnimatePresence`.

### 3. `src/components/states/ErrorBoundary.tsx`
Vérifier que le fallback affiche un message visible ("une erreur est survenue, recharger la page"), pour que tout futur écran blanc soit immédiatement identifié.

### Vérification

- Connecté, sur `/parcours/A1` → clic logo → ouverture immédiate de `/dashboard`.
- Déconnecté → clic logo → landing s'affiche.
- Tentative d'accès à `/dashboard` non connecté → redirection propre vers `/connexion?redirect=…`.

### Hors périmètre
Pas de changement visuel ; pas de modification du système d'animation `pageTransition`.
