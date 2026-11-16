# Crédits & licences — Film « Centre International d'Antibes — Présentation »

## Médias CIA (propriété du Centre International d'Antibes)

| Fichier dans `public/` | Source dans `assets-src/` | Utilisation |
|---|---|---|
| `photos/le-port-balcony-view-port-vauban.jpg` | `photos/le-port-balcony-view-port-vauban.jpg` | Scène 4 — Le Port |
| `photos/le-chateau-garden-a.jpg` | `photos/Photos CHATEAU Haute résolution-22.JPG` | Scène 4 — Le Château |
| `photos/castel-arabel-facade-tower.jpg` | `photos/castel-arabel-facade-tower.jpg` | Scène 4 — Castel Arabel |
| `photos/astor-room-balcony.jpg` | `photos/2.jpg` (résidence Astor, confirmé par le CIA) | Scène 4 — Astor |
| `photos/le-port-class-adults-groupwork.jpg` | `photos/le-port-class-adults-groupwork.jpg` | Scène 6 — LEARN |
| `photos/cooking-workshop-chef-b.jpg` | `photos/cooking-workshop-chef-b.jpg` | Scène 6 — TASTE (cadré en haut : brique de crème hors champ) |
| `video/riviera-aerial-bay.mp4` | `video/centre_international_antibes_cours_de_français_v1 (1080p).mp4`, 0,00–4,30 s (ralenti ×1,7) | Scène 1 |
| `video/sail-catamarans-offshore.mp4` | `video/junior_program_centre_international_antibes_v1 (1080p).mp4`, 0,04–1,96 s | Scène 6 — SAIL |
| `video/juniors-beach-from-back.mp4` | `video/junior_program_…_v1 (1080p).mp4`, 30,78–33,00 s | Scène 6 — EXPLORE (juniors de dos) |
| `video/live-antibes-ramparts-aerial.mp4` | `video/centre_international_antibes_cours_de_français_v1 (1080p).mp4`, 53,90–56,30 s (ralenti ×1,45) | Scène 6 — LIVE |
| `brand/*.svg` | `brand/logo-cia.pdf` (vectoriel) | Logos ; « Live it. » tracé depuis les glyphes de la baseline du logo |

Les extraits vidéo CIA sont recadrés ×1,08 (`prepare-assets.py`) pour retirer le logo CIA incrusté (et le badge « 40 ans » du film junior). Les films *Wine & Cooking* et *Senior Program* portent un badge « vimeo » non retirable dans la limite de zoom : ils ne sont pas utilisés.

Les personnes visibles sur les photos et vidéos CIA sont des modèles des tournages CIA : aucun nom, aucune citation, aucun rôle n'est indiqué. Autorisations parentales des juniors : **confirmées par le CIA (16/11/2026)**.

## Médias libres de droits

| Fichier | URL | Auteur | Licence |
|---|---|---|---|
| `media-free/cannes-vieux-port-wikimedia.jpg` → `public/photos/cannes-vieux-port-wikimedia.jpg` | https://commons.wikimedia.org/wiki/File:Cannes_Vieux_Port_01.jpg | Spike | CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0 |

Crédit affiché sur la carte de fin : `Photo Cannes: Spike, Wikimedia Commons, CC BY-SA 4.0`.
Aucun média Mixkit n'est utilisé dans cette version (les rushs CIA couvrent la mer et la voile).

## Données cartographiques

Trait de côte : **Natural Earth** 1:10m (domaine public), via le paquet npm `world-atlas` (ISC). Crédit affiché : `Map data: Natural Earth`.

## Polices

| Police | Licence | Usage |
|---|---|---|
| Nunito Sans (`@fontsource/nunito-sans`) | SIL OFL 1.1 | Remplace Avenir Next tant que ses fichiers ne sont pas dans `assets-src/fonts/` |
| Noto Sans, Noto Sans JP, Noto Sans SC (`@fontsource`) | SIL OFL 1.1 | Salutations cyrillique / japonaise / chinoise (scène 1) |
| Better Together | (glyphes issus du logo officiel `logo-cia.pdf`) | « Live it. » uniquement |

## Icônes

Lucide (`lucide-static`, ISC) : `graduation-cap`, `sun`, `users`.

## Musique et bruitages

Composition originale générée par `scripts/make-music.py` (numpy / scipy) — aucune musique sous droits.
Bruitages (souffle, tick, pop, plume) générés par le même script.
