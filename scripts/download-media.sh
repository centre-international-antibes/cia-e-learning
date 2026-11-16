#!/usr/bin/env bash
# Download the free-licence media used by the film into media-free/.
# Only places (no people), each with its licence recorded in CREDITS-LICENCES.md.
# Wikimedia rate-limits original files (HTTP 429): we use its standard 1920 px
# thumbnails, one request at a time, with a pause between requests.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media-free
UA="cia-film-media-script/1.0"

fetch() { # url dest
  local url="$1" dest="$2"
  if [[ -s "$dest" ]] && file -b "$dest" | grep -qiE 'jpeg|png|mp4|iso media'; then
    echo "ok (cached) $dest"; return
  fi
  for i in 1 2 3 4; do
    if curl -sfL -A "$UA" -o "$dest" "$url" && file -b "$dest" | grep -qiE 'jpeg|png|mp4|iso media'; then
      echo "ok $dest ($(file -b "$dest" | cut -c1-60))"; return
    fi
    echo "retry $i for $dest"; sleep $((i * 10))
  done
  rm -f "$dest"
  echo "FAILED: $url — stop and report (do not work around)" >&2
  exit 1
}

# Cannes — Vieux Port, Croisette and Le Suquet, seen from Suquet Tower.
# Author: Spike — CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Cannes_Vieux_Port_01.jpg
fetch "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Cannes_Vieux_Port_01.jpg/1920px-Cannes_Vieux_Port_01.jpg" \
      media-free/cannes-vieux-port-wikimedia.jpg
