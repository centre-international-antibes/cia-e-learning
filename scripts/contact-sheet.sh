#!/usr/bin/env bash
# Contact sheet (1 frame per second, timecoded) + loudness report for a rendered film.
# Usage: bash scripts/contact-sheet.sh out/cia-presentation-60s-1920x1080-en.mp4 [out/contact-sheet.png]
set -euo pipefail
in="$1"
out="${2:-out/contact-sheet.png}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
n=$(python3 -c "import math;print(math.ceil(float('$dur')))")
cols=10
rows=$(( (n + cols - 1) / cols ))
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in" | head -1 | tr -d ",")
h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$in" | head -1 | tr -d ",")
tw=384; [[ $h -gt $w ]] && tw=216
ffmpeg -v error -y -i "$in" -vf "fps=1,scale=${tw}:-2,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.55,tile=${cols}x${rows}:padding=4:margin=4:color=white" -frames:v 1 "$out"
echo "contact sheet: $out (${n} frames)"
echo "frames: $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$in" | head -1 | tr -d ",")"
echo "loudness:"
ffmpeg -hide_banner -nostats -i "$in" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary:" | grep -E "I:|LRA:|Peak:"
