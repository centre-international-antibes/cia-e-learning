# Plan de correction

## Objectif
Supprimer l’écran blanc après connexion sans hard refresh, en fiabilisant la phase de restauration de session et les redirections des pages protégées.

## Ce que je vais faire

1. Renforcer l’état “auth prête”
- Ajuster le hook d’auth pour ne pas déclarer l’application prête trop tôt pendant la restauration de session.
- Éviter la fenêtre où l’utilisateur existe partiellement mais où les requêtes protégées partent encore dans un état instable.
- Garder un état de chargement explicite tant que la session initiale n’est pas vraiment appliquée.

2. Supprimer les écrans protégés qui peuvent se vider
- Remplacer les `return null` liés à l’auth dans les pages concernées par un fallback visuel stable.
- Centraliser le comportement: soit spinner/skeleton, soit redirection fiable, mais jamais page vide.
- Vérifier en priorité `Connexion`, `Profil`, `Abonnement` et les routes protégées globales.

3. Bloquer les requêtes dépendantes de l’utilisateur tant que l’auth n’est pas prête
- Faire en sorte que les hooks/pages qui chargent les données du dashboard ne tirent pas trop tôt.
- Ajouter un guard simple pour les lectures profil/progression/abonnement quand l’état auth n’est pas encore stabilisé.
- Préserver les skeletons existants au lieu de laisser `<main>` sans contenu.

4. Vérifier le flux exact après login
- Contrôler la transition `/connexion -> dashboard` pour qu’elle passe toujours par un état visible.
- Vérifier aussi le chargement depuis un refresh normal, pas seulement après soumission du formulaire.
- Confirmer que le header/footer restent, mais que le contenu principal se remplit sans intervention manuelle.

## Fichiers probablement touchés
- `src/hooks/useAuth.tsx`
- `src/App.tsx`
- `src/pages/Connexion.tsx`
- `src/pages/Profil.tsx`
- `src/pages/Abonnement.tsx`
- éventuellement les hooks de données utilisés immédiatement après connexion

## Détail technique
Le symptôme actuel ressemble à une course d’initialisation auth: certaines vues protégées peuvent rendre `null` ou lancer leurs requêtes alors que la session restaurée n’est pas encore totalement exploitable. Résultat: la route est montée, le header/footer restent, mais le contenu principal n’affiche rien jusqu’au hard refresh. La correction consiste à synchroniser plus strictement la disponibilité auth avec les redirections et les fetchs, et à interdire tout “empty render” sur ces chemins.
