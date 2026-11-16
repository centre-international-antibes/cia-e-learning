#!/usr/bin/env bash
# Conform mixed-cadence sources to 30 fps by motion interpolation (brief V3 §10.1).
# COURS 25 fps, JR 23.976 fps → 30 fps; WC/SR (25p in a 30 fps file) → decimate + 30 fps.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/video/30fps
for n in cours jr; do
  ffmpeg -v error -y -i "public/video/src/$n.mp4" \
    -vf "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
    -c:v libx264 -crf 14 -preset slow -an "public/video/30fps/$n.mp4" &
done
wait
# WC and SR are 25p material padded to 30 fps (1 duplicate every 6 frames):
# drop the duplicates first, then interpolate to true 30 fps.
for n in wc sr; do
  ffmpeg -v error -y -i "public/video/src/$n.mp4" \
    -vf "decimate=cycle=6,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
    -c:v libx264 -crf 14 -preset slow -an "public/video/30fps/$n.tmp.mp4" &
done
wait
for n in wc sr; do mv "public/video/30fps/$n.tmp.mp4" "public/video/30fps/$n.mp4"; done
echo done
