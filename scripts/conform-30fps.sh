#!/usr/bin/env bash
# Conform mixed-cadence sources to 30 fps by motion interpolation (brief V3 §10.1).
# COURS 25 fps, JR 23.976 fps → 30 fps. WC/SR already 30 fps (copied).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/video/30fps
for n in cours jr; do
  ffmpeg -v error -y -i "public/video/src/$n.mp4" \
    -vf "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
    -c:v libx264 -crf 14 -preset slow -an "public/video/30fps/$n.mp4" &
done
wait
cp public/video/src/wc.mp4 public/video/src/sr.mp4 public/video/30fps/
echo done
