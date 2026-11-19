# MUSIQUE — Montage de la piste sur le film (90 s)

Piste : `assets-src/audio/kulakovka-ambient-house-624653.mp3` (166,8 s, 44,1 kHz stéréo, −10,7 LUFS).
Analyse librosa (à revérifier de ton côté) :
- **Tempo : 117,45 BPM** (1 temps = 0,5108 s = **15,33 images** à 30 fps ; 1 mesure = 2,0434 s). **Ce n'est pas 120 BPM** : la grille de 15 f de CORRECTIONS-V4 §B est remplacée par **les temps réels de la piste**.
- Structure de la piste source : intro ambient 0–16 s (sans batterie) → montée 16–31,8 s → **drop à 31,79 s** → groove plein jusqu'à 96,92 s → **break** 96,92–113,20 s (plus aéré) → **re-drop à 113,20 s** → groove jusqu'à 145,73 s → outro 146–160 s.

## Carte de montage (coupes sur des débuts de mesure, à affiner à l'échantillon près)

| Film | Source | Rôle |
|---|---|---|
| 0,00 → 22,50 s | 25,612 → 48,112 s | montée (accroche) puis **drop à 6,18 s du film** = titre / « Bonjour » |
| 22,50 → 30,65 s | 39,962 → 48,112 s (4 mesures répétées) | rallonge le groove pour que le break tombe sur la finale |
| 30,65 → 79,46 s | 48,112 → 96,920 s | groove : Juniors, Adultes, Résidences, Excursions, Wine & Cooking |
| 79,46 → 85,59 s | 96,920 → 103,050 s (3 mesures du break) | **finale aérée** : Rencontres. → Émotions. → Souvenirs. (1 mot par mesure) |
| 85,59 → 90,00 s | 113,197 → 117,607 s | **re-drop** sur « Live it. », puis carte de fin ; fondu de sortie sur les 1,5 dernières secondes |

- Chaque raccord : sur un début de mesure, fondu enchaîné audio de **20–30 ms** (aucun clic), vérifié à l'écoute et sur la forme d'onde.
- Recalcule les temps exacts avec `librosa.beat.beat_track` + détection des premiers temps de mesure, puis génère la liste des temps **dans le film** (après montage audio) : c'est **la** grille de toutes les coupes (arrondi à l'image la plus proche, tolérance ±1 image).
- Recale les sections du film sur cette carte : titre sur le drop (6,18 s), début de la finale sur le break (79,46 s), « Live it. » sur le re-drop (85,59 s).
- Mixage : **−14 LUFS intégrés**, crête vraie ≤ −1 dBTP. Bruitages discrets (whoosh sur les whip pans, impact sur le drop et le re-drop) sous la musique.

## Licence
Piste téléchargée par Jules (Pixabay). Garder la preuve de téléchargement. Avant publication sur YouTube, vérifier qu'elle ne déclenche pas de revendication Content ID.
