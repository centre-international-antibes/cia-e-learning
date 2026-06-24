## Problèmes mobile dans la section Ligue/Classement

**1. Header `LeagueView` déborde sur mobile (~390 px)**
La rangée `[badge] [titre + compte à rebours] [Cette semaine + Rang]` est trop dense : le compte à rebours `04j 12h 49m 21s` force le bloc titre à être large, et le bloc droit ("Cette semaine / Rang") est tronqué.

**2. Pastille XP du podium qui passe sur 2 lignes**
Sur les onglets Global/Niveau/Streak, la grille `grid-cols-3 gap-2` à 390 px laisse ~120 px par carte. La pastille `⚡ 29,620 XP` passe en 2 lignes ("29,620 / XP") et casse le rythme visuel.

## Correctifs

**`src/components/leaderboard/LeagueView.tsx`**
- Sur mobile, passer la rangée du header en deux niveaux :
  - Ligne 1 : badge + titre + (XP/Rang à droite, format compact "⚡12,3k • #5").
  - Ligne 2 : le compte à rebours sur sa propre ligne pleine largeur.
- Desktop : conserver la disposition actuelle sur une seule ligne via `md:` overrides.
- Réduire le titre `text-2xl` → `text-xl md:text-2xl`.
- Ajouter `whitespace-nowrap` sur le compte à rebours pour éviter un wrap au milieu.

**`src/pages/Classement.tsx` — `PodiumCard`**
- Pastille XP : `whitespace-nowrap`, padding réduit (`px-2 py-0.5 md:px-3 md:py-1`), taille `text-[10px] md:text-xs` sur mobile pour rester sur une ligne dans la cellule ~120 px.
- Réduire le nom (`text-xs md:text-sm`) et le label rank (`text-[9px] md:text-[10px]`).
- Réduire l'avatar `lg` à `h-16 w-16 md:h-20 md:w-20` pour libérer de la place verticale.

## Validation
- Playwright en viewport mobile (390×844) sur `/classement` :
  - Onglet Ligue : header tient sans tronquer, compte à rebours sur sa propre ligne.
  - Onglet Global : pastilles XP sur une seule ligne dans le podium.

## Fichiers modifiés
- `src/components/leaderboard/LeagueView.tsx`
- `src/pages/Classement.tsx`
