## Problème
"Refaire le tour d'introduction" se lance puis disparaît instantanément.

**Cause** : `useOnboarding.restart()` redirige vers `/?welcome=1`. Pour un utilisateur connecté, `LandingOrRedirect` (`src/App.tsx`) le réoriente vers `/dashboard` avec `{ replace: true }`, supprimant la query `welcome=1`. `OnboardingFlow` ne détecte plus `forceWelcome`, et comme `needsOnboarding=false` (onboarding déjà marqué fait en BDD), le modal ne s'ouvre pas.

## Correctif

**1. `src/hooks/useOnboarding.ts` — `restart()`**
- Pour un utilisateur connecté : rediriger directement vers `/dashboard?welcome=1` au lieu de `/?welcome=1`, pour éviter la perte de query lors du redirect `LandingOrRedirect`.
- Utiliser `window.location.assign('/dashboard?welcome=1')` (full reload garde la logique actuelle simple et garantit un état propre).

**2. `src/App.tsx` — `LandingOrRedirect` (filet de sécurité)**
- Préserver `location.search` lors du redirect vers `/dashboard` : `navigate('/dashboard' + location.search, { replace: true })`. Ainsi, si un autre code arrive un jour sur `/?welcome=1` connecté, le flag est conservé.

## Validation
- Profil → cliquer "Refaire le tour d'introduction" → vérifier que le modal Welcome s'ouvre et reste visible sur `/dashboard?welcome=1`.
- Parcourir Welcome → Profil → Niveau → Tour → vérifier que la query `welcome` est nettoyée à la fin via le `navigate(location.pathname, { replace: true })` déjà présent dans `close()`/`handleSkip()`.

## Fichiers modifiés
- `src/hooks/useOnboarding.ts`
- `src/App.tsx`
