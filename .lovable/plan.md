# Plan de correction du flux d’abonnement

## Objectif
Faire en sorte qu’après un paiement CB ou wallet validé, le compte passe immédiatement en Premium dans l’app, avec accès débloqué aux cours, badge Premium visible, et bouton de gestion d’abonnement disponible.

## Ce que je vais corriger

1. Fiabiliser l’écriture de l’abonnement côté backend
- Renforcer le traitement webhook pour journaliser précisément les erreurs d’écriture.
- Vérifier et corriger le mapping des données Stripe vers la table `subscriptions`.
- Ajouter un fallback robuste si l’événement principal n’écrit pas la ligne attendue.

2. Corriger la récupération de l’abonnement côté client
- Empêcher la page abonnement de rester bloquée sur l’état “non abonné” quand un paiement vient d’être validé.
- Mieux gérer le retour de paiement avec `session_id` pour forcer une resynchronisation fiable.
- Éviter qu’une ancienne ligne “free” masque une ligne payante plus récente ou qu’un état vide soit interprété comme non abonné trop tôt.

3. Corriger l’accès Premium dans l’interface
- Faire en sorte que la page “Mon abonnement” bascule bien vers l’état Premium dès que l’abonnement est confirmé.
- Réactiver le bouton “Gérer mon abonnement” dès qu’un `stripe_customer_id` existe.
- Vérifier que le badge Premium et les déblocages de contenu utilisent bien la même source de vérité.

4. Ajouter un diagnostic de sécurité fonctionnel
- Ajouter des logs ciblés pour voir si le souci vient du webhook, du fallback de synchronisation, ou de la lecture client.
- Vérifier le comportement sur le flux live/test pour éviter les faux négatifs dus à l’environnement.

## Détails techniques
- Vérifier `payments-webhook` et `check-subscription` pour confirmer pourquoi aucune ligne Stripe active n’est actuellement visible en base malgré des événements reçus.
- Corriger la stratégie de lecture dans `useSubscription` si nécessaire pour prendre la bonne ligne d’abonnement.
- Mettre à jour la page `Abonnement` pour traiter explicitement le retour Stripe et relancer la synchronisation tant que l’abonnement n’est pas encore visible.
- Si nécessaire, ajuster la requête de portail pour qu’elle s’appuie sur la ligne d’abonnement réellement active.

## Résultat attendu
Après paiement validé:
- la carte de paiement disparaît,
- la page passe en “Premium actif”,
- les cours Premium se débloquent,
- le badge Premium apparaît,
- la gestion d’abonnement fonctionne.