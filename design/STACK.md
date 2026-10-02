# Étape 2 — état de la pile

Relevé le 2026-10-02. Versions publiées vérifiées avec `npm view`, et non de mémoire.

## Décisions proposées

| paquet | installé | dernière stable (> 7 j) | proposition |
|---|---|---|---|
| `framer-motion` | 11.0.0 | **13.4.4** (25/09) — *14.0.0 publiée aujourd'hui, écartée* | migrer vers `motion@13.4.4`, voir plus bas |
| `vaul` | 0.9.9 | 1.1.2 (déc. 2024) | **monter en 1.1.2** : correctifs iOS Safari, API stable depuis 2 ans |
| `sonner` | 1.7.4 | 2.0.8 (août 2026) | **monter en 2.0.8** — les toasts sont entièrement re-stylés de toute façon |
| `lottie-react` | 2.4.1 | 3.1.2 (07/09) | monter en 3.1.2 **seulement si** Spark reste en Lottie (cf. Rive) |
| `canvas-confetti` | 1.9.4 | 1.9.4 | à jour |
| `@number-flow/react` | absent | 0.6.2 | **à évaluer sur l'écran pilote** |
| `@use-gesture/react` | absent | 10.3.1 | **reporté** : pas nécessaire au parcours pilote |
| `@rive-app/react-canvas` | absent | 4.36.0 | **ne rien installer tant qu'il n'y a pas d'animateur** |

## `framer-motion` 11 → `motion` 13 : l'écart est plus grand qu'annoncé

Le brief prévoyait « 11 → 12 ». La réalité : l'écosystème est à **14.0.0, publiée
aujourd'hui**, donc écartée par la règle des 7 jours. La cible raisonnable est
**`motion@13.4.4`** — deux majeures d'écart avec notre 11, pas une.

Ce que la migration apporte concrètement pour ce chantier :

- `visualDuration` + `bounce` : on décrit un ressort par ce qu'on voit (« 0,4 s,
  rebond 0,25 ») au lieu de `stiffness: 420, damping: 16`. C'est exactement le
  vocabulaire dont `MOTION.md` a besoin pour être recalé sur des mesures.
- moteur d'animation plus léger, et `motion` remplace `framer-motion` sous le
  même nom d'API.

Ce que ça coûte : 11 → 13 traverse deux majeures. Les points à vérifier un par un
sont `useReducedMotionConfig` (utilisé dans 5 composants M1–M4), `motion.create()`
(dans `Pressable`), les `MotionValue` écrites dans le DOM (dans `RollingNumber`)
et `AnimatePresence mode="wait"` (dans `CheckBar` et `CoursePlayer`).

**Proposition : migrer avant l'écran pilote, dans une PR isolée**, sans aucun
changement visuel, pour que l'écart soit lisible et réversible. Les presets
gardent leurs noms (`snappy`, `bouncy`, `gentle`, `slow`) et ne sont ré-exprimés
en `visualDuration`/`bounce` qu'ensuite, quand les mesures seront disponibles.

## `@rive-app/react-canvas` — à ne pas installer maintenant

Rive n'a d'intérêt que s'il y a quelqu'un pour **animer** Spark dedans. Sans
animateur, installer Rive ajoute 180 ko de runtime pour rejouer les mêmes fichiers
Lottie. La bonne séquence est : écrire le cahier des charges des états de Spark
(`MOTION.md`), le faire chiffrer par un animateur, et n'installer Rive qu'une fois
les fichiers commandés. D'ici là, l'interface du composant `Spark` est découplée
de son rendu, ce qui permet la bascule sans toucher aux appelants.

**Point à dire clairement : sans animateur, le plafond de qualité de Spark est
celui des fichiers Lottie actuels.** C'est aujourd'hui le facteur limitant le plus
sérieux sur les moments signature.
