#!/usr/bin/env bash
# transcribe.sh — local audio -> markdown via whisper.cpp (CPU, EN/FR auto-detect)
# Portable: install dir is discovered, never hardcoded.
# Usage:
#   transcribe.sh <audio> [output.md] [--lang auto|en|fr] [--model medium|large-v3|small] [--no-timestamps]
#
# Install-dir resolution order (first hit wins):
#   1. $WHISPER_DIR env var (points at the whisper.cpp checkout)
#   2. ~/tools/whisper.cpp
#   3. ~/whisper.cpp
#   4. /opt/whisper.cpp
set -euo pipefail

resolve_whisper_dir() {
  if [[ -n "${WHISPER_DIR:-}" && -x "$WHISPER_DIR/build/bin/whisper-cli" ]]; then
    echo "$WHISPER_DIR"; return 0
  fi
  for d in "$HOME/tools/whisper.cpp" "$HOME/whisper.cpp" "/opt/whisper.cpp"; do
    [[ -x "$d/build/bin/whisper-cli" ]] && { echo "$d"; return 0; }
  done
  return 1
}

WHISPER_DIR="$(resolve_whisper_dir)" || {
  echo "whisper.cpp not found. Set \$WHISPER_DIR or install under ~/tools/whisper.cpp" >&2
  echo "(see setup.md — the self-bootstrapping meta-prompt)" >&2
  exit 2
}
CLI="$WHISPER_DIR/build/bin/whisper-cli"
THREADS="$(nproc)"

LANG="auto"; MODEL="medium"; TIMESTAMPS=1; IN=""; OUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lang)          LANG="$2"; shift 2 ;;
    --model)         MODEL="$2"; shift 2 ;;
    --no-timestamps) TIMESTAMPS=0; shift ;;
    -*)              echo "Unknown flag: $1" >&2; exit 1 ;;
    *)               if [[ -z "$IN" ]]; then IN="$1"; elif [[ -z "$OUT" ]]; then OUT="$1"; fi; shift ;;
  esac
done

[[ -z "$IN" ]] && { echo "Usage: transcribe.sh <audio> [output.md] [--lang auto|en|fr] [--model medium] [--no-timestamps]" >&2; exit 1; }
[[ -f "$IN" ]] || { echo "Input not found: $IN" >&2; exit 1; }
MODEL_BIN="$WHISPER_DIR/models/ggml-${MODEL}.bin"
[[ -f "$MODEL_BIN" ]] || { echo "Model not found: $MODEL_BIN" >&2; exit 1; }
[[ -x "$CLI" ]] || { echo "whisper-cli not built at $CLI" >&2; exit 1; }
[[ -z "$OUT" ]] && OUT="${IN%.*}.md"

# WSL-safe: decode + temp in native /tmp, never /mnt/c
WORK="$(mktemp -d /tmp/transcribe.XXXXXX)"; trap 'rm -rf "$WORK"' EXIT
WAV="$WORK/audio.wav"; JSON_BASE="$WORK/out"

echo "Converting -> 16kHz mono WAV ..."
ffmpeg -hide_banner -loglevel error -y -i "$IN" -ar 16000 -ac 1 -c:a pcm_s16le "$WAV"
DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WAV" 2>/dev/null || echo '?')"

echo "Transcribing model=$MODEL lang=$LANG threads=$THREADS (slow part) ..."
"$CLI" -m "$MODEL_BIN" -f "$WAV" -l "$LANG" -t "$THREADS" -oj -of "$JSON_BASE" >/dev/null 2>&1

SRC_NAME="$(basename "$IN")"
python3 - "$JSON_BASE.json" "$OUT" "$SRC_NAME" "$MODEL" "$DURATION" "$TIMESTAMPS" <<'PY'
import json, sys, datetime, re
jpath, out, src, model, dur, ts = sys.argv[1:7]
ts = ts == "1"
data = json.load(open(jpath, encoding="utf-8"))
segs = data.get("transcription", [])
lang = data.get("result", {}).get("language", "?")
try:
    d = float(dur); dur_str = f"{int(d//60)}m{int(d%60):02d}s"
except Exception:
    dur_str = "?"
full = re.sub(r"\s+", " ", " ".join(s.get("text","").strip() for s in segs)).strip()
today = datetime.date.today().isoformat()
lines = ["---", f"source: {src}", f"duration: {dur_str}", f"language: {lang}",
         f"model: whisper.cpp ggml-{model}", f"transcribed: {today}", "---", "",
         f"# Transcript — {src}", "", "## Full text", "", full, ""]
if ts:
    lines += ["## Timestamped", ""]
    for s in segs:
        frm = s.get("offsets", {}).get("from", 0)//1000
        mm, ss = divmod(int(frm), 60)
        txt = s.get("text","").strip()
        if txt: lines.append(f"- `[{mm:02d}:{ss:02d}]` {txt}")
    lines.append("")
open(out, "w", encoding="utf-8").write("\n".join(lines))
print(f"Wrote {out}  ({len(segs)} segments, lang={lang}, {dur_str})")
PY
