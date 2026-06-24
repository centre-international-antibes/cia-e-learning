## Problème
Sur mobile, le modal d'onboarding (`OnboardingFlow.tsx`) et le tour guidé (`Coachmark.tsx`) débordent de l'écran :
- Le modal utilise `max-w-md` + `p-6 md:p-8` sans contrainte de largeur réelle sur très petits écrans.
- Les cartes de choix de profil (Débutant / Faux-débutant / Confirmé) ont un padding interne `p-4` + icône + texte qui peut déborder sur largeurs < 360px.
- La grille des niveaux (`grid-cols-3` avec boutons `h-12 font-display text-lg`) reste à 3 colonnes même sur très petit écran.
- Le `Coachmark` calcule une largeur fixe `bubbleW = 320` et un positionnement qui peut sortir du viewport sur mobile.

## Correctifs proposés

**1. `src/components/onboarding/OnboardingFlow.tsx`**
- Réduire le padding mobile du conteneur modal : `p-5 md:p-8` au lieu de `p-6 md:p-8`.
- Ajouter une contrainte largeur : `w-[calc(100vw-1.5rem)] max-w-md` pour garantir une marge à gauche/droite.
- Sur la phase `profile` : réduire le padding interne des cartes (`p-3 md:p-4`), permettre au texte de wrap (`min-w-0` + `break-words` sur le bloc texte), réduire la taille de l'icône sur mobile.
- Sur la phase `level` : la grille `grid-cols-3` reste OK mais réduire la hauteur/texte des boutons sur mobile (`h-11 text-base md:h-12 md:text-lg`).
- Vérifier que le bouton de fermeture (X) ne chevauche pas le titre sur petit écran.

**2. `src/components/onboarding/Coachmark.tsx`**
- Rendre la bulle responsive : largeur `min(320px, calc(100vw - 24px))` au lieu de fixe `w-[320px]`.
- Recalculer `bubbleW` dynamiquement selon la largeur viewport pour le positionnement.
- S'assurer que la bulle ne déborde jamais sous le header/footer mobile.

**3. Validation**
- Tester via Playwright en viewport mobile (375×812 et 320×640) :
  - Phase welcome → profile → level : aucune carte ne sort de l'écran.
  - Tour guidé : la bulle reste dans le viewport.

## Fichiers modifiés
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/Coachmark.tsx`

Aucun changement de logique métier — pur correctif responsive CSS/Tailwind.
