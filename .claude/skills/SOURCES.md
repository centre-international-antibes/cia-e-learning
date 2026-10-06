# Sources des skills

Installés **à la main** (copie des fichiers), sans passer par `npx skills add` :
l'outil d'installation n'a pas été utilisé pour éviter toute remontée de
statistiques, conformément à la consigne du chantier.

Vérification faite avant copie sur les sept skills : **aucun fichier exécutable,
aucun script (`.sh`, `.py`, `.js`), aucun appel réseau, aucune télémétrie**. Le
mot « install » qu'on y lit désigne le collage de variables CSS dans le projet.

| skill | dépôt | commit | date | licence |
|---|---|---|---|---|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | `8a1541c` | 2026-09-28 | Apache 2.0 |
| `apple-design` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `e8a175d` | 2026-10-02 | MIT |
| `emil-design-eng` | emilkowalski/skills | `e8a175d` | 2026-10-02 | MIT |
| `review-animations` | emilkowalski/skills | `e8a175d` | 2026-10-02 | MIT |
| `animation-vocabulary` | emilkowalski/skills | `e8a175d` | 2026-10-02 | MIT |
| `transitions-dev` | [Jakubantalik/transitions.dev](https://github.com/Jakubantalik/transitions.dev) | `684ebde` | 2026-10-02 | Transitions.dev License |
| `transitions-polish` | Jakubantalik/transitions.dev | `684ebde` | 2026-10-02 | Transitions.dev License |

## Réserve sur `transitions-dev` et `transitions-polish`

Ces deux skills raisonnent en **CSS pur** : variables `--duration-*`,
`--ease-*`, transitions en durée sur des transforms. Notre app anime en
**framer-motion avec des springs**, et `MOTION.md` interdit la durée sur un
transform. Ils restent utiles comme grille d'audit (asymétrie ouverture/
fermeture, stagger, délais), mais leurs valeurs ne doivent pas être recopiées
telles quelles, et `_root.css` ne sera pas importé dans le projet.

## Mise à jour

Les dépôts ont été clonés en `--depth 1`. Pour rafraîchir un skill, recloner et
recopier le dossier, puis mettre à jour le commit dans ce tableau.
