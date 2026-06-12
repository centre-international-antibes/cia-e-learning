# Plan de correction

## Objectif
Supprimer les écrans blancs quand l’application navigue trop vite entre pages ou onglets, en particulier après connexion et dans la page Classement/Ligue.

## Ce que je vais corriger
1. **Stabiliser la navigation globale**
   - Faire en sorte qu’une route protégée n’essaie jamais d’afficher son contenu avant que l’état d’auth soit réellement prêt.
   - Remplacer les redirections impératives fragiles par des gardes de rendu déterministes là où c’est nécessaire.
   - Garantir qu’un fallback visible reste affiché tant que la page suivante n’est pas prête.

2. **Sécuriser les transitions de layout**
   - Vérifier la chaîne `Auth -> ProtectedRoute -> AppLayout -> lazy route` pour qu’aucune étape ne puisse laisser `<main>` vide.
   - Uniformiser les états de chargement pour que le header/footer restent accompagnés d’un contenu de secours visible.

3. **Corriger la page Classement / Ligue**
   - Durcir la logique de changement d’onglets pour éviter qu’un onglet lent démonte l’ancien contenu trop tôt.
   - Garder un état stable pendant le chargement au lieu de basculer vers un arbre qui peut momentanément être vide.
   - Ajouter des protections contre les mises à jour asynchrones tardives quand on quitte la page en plein chargement.

4. **Fiabiliser les hooks asynchrones concernés**
   - Ajouter des garde-fous dans les hooks de données utilisés par Ligue/Classement pour ignorer les réponses obsolètes après navigation.
   - Éviter les `setState` concurrents qui peuvent remettre une page dans un état incohérent après un changement d’onglet ou de route.

5. **Validation ciblée**
   - Reproduire le scénario: connexion -> dashboard, puis navigation rapide entre onglets de Ligue, puis départ vers une autre page.
   - Vérifier qu’on voit toujours soit le contenu, soit un skeleton/spinner, mais jamais une zone principale blanche bloquée.

## Détail technique
- **Fichiers principaux visés**
  - `src/App.tsx`
  - `src/hooks/useAuth.tsx`
  - `src/components/layout/AppLayout.tsx`
  - `src/pages/Classement.tsx`
  - `src/components/leaderboard/LeagueView.tsx`
  - `src/hooks/useLeague.ts`
- **Type de correctifs**
  - gardes de chargement cohérents
  - transitions non bloquantes
  - conservation de contenu précédent pendant fetch lent
  - protection contre réponses async obsolètes
  - fallback visible systématique

## Résultat attendu
Après implémentation, même si un onglet Ligue ou une page met plus de temps à charger, l’app ne doit plus afficher une page blanche: elle doit rester sur le contenu précédent ou montrer un état de chargement propre jusqu’à ce que la nouvelle vue soit prête.