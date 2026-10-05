# CLAUDE.md — CIA e-learning

Avant toute modification UI : lire `DESIGN.md` et `MOTION.md`, respecter les INVARIANTS.
Aucune couleur, taille, ombre, durée, easing ou z-index en dur : tokens et presets uniquement.
Tout choix esthétique non couvert par `DESIGN.md` : proposer 3 options, ne jamais trancher seul.
Après chaque itération UI : capture Playwright 390×844 et 1440×900, comparaison avec `design/refs/`,
passe `review-animations` + `frontend-design` en mode critique, liste des écarts restants chiffrés.
Toute chaîne passe par i18n ; tester fr + de + ru.
Typecheck : `npm run typecheck`. Ne jamais fusionner une PR.

---

## Commandes

| | |
|---|---|
| typecheck | `npm run typecheck` — **pas** `npx tsc --noEmit`, qui ne vérifie rien ici (`tsconfig.json` a `"files": []`) |
| tests | `npx vitest run` |
| lint | `npx eslint .` — ne pas dépasser le total de `main` |
| build | `npm run build` |
| parité i18n | `node scripts/i18n-check.mjs` — 5 locales ont 2 clés `achievements.premium.*` manquantes, préexistant |

## Repères du projet

- **Pile** : Vite 5, React 18, TypeScript strict, Tailwind 3, shadcn/ui, framer-motion 11.18.2, Supabase (Lovable Cloud), i18next sur 6 langues.
- **Mouvement** : `@/lib/motion` (presets `visualDuration` / `bounce`), réglables dans `/admin/motion-lab` → Réglage. `@/lib/animations` est déprécié.
- **Récompenses** : tout passe par le Reward Director (`@/features/rewards`) — jamais de toast de célébration appelé directement.
- **XP** : le serveur est la seule autorité (`complete_lesson`). `computeLessonXp` n'est qu'un aperçu client et le mode anonyme ; toute modification doit être répercutée dans la migration SQL, et inversement.
- **Niveau CECR** : il suit la progression pédagogique, jamais l'XP.
- **Lovable est en pause pendant la refonte.** Toute modification venue de Lovable sur cette période doit être signalée.

## Références

`design/refs/ANALYSE.md` — ce que les références mesurent, et ce qu'elles ne mesurent pas.
`design/STACK.md` — état des paquets et décisions de version.
`.claude/skills/SOURCES.md` — provenance et licences des skills installés.
