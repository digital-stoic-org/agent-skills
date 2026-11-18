# setup.md — bootstrap the local transcription pipeline (run ONLY if missing)

This is the self-bootstrapping meta-prompt the `transcribe` skill runs when
`scripts/transcribe.sh` can't find a working whisper.cpp install. Follow exactly,
verify each step, report failures with command output instead of guessing.

GOAL: CPU-only audio→markdown pipeline via whisper.cpp. No GPU, no API keys,
no PyTorch. Workload: 10–20 min EN/FR recordings, fully local/private.

## DETECT FIRST
```bash
grep -qi microsoft /proc/version && echo WSL || echo native   # WSL? -> install in native $HOME, temp in native /tmp
for c in gcc g++ make cmake git ffmpeg python3; do command -v "$c" >/dev/null && echo "ok $c" || echo "MISSING $c"; done
nproc
```
If WSL: install under native Linux `$HOME` (e.g. `~/tools`), NEVER under `/mnt/c`.

## STEP 1 — system deps (Debian/Ubuntu; adapt per distro)
```bash
sudo apt-get update && sudo apt-get install -y build-essential cmake git ffmpeg curl python3
cmake --version ; ffmpeg -version | head -1
```

## STEP 2 — build whisper.cpp under native home
```bash
mkdir -p ~/tools && cd ~/tools
git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=ON -DWHISPER_BUILD_EXAMPLES=ON
cmake --build build -j "$(nproc)" --config Release
ls -lh build/bin/whisper-cli   # verify
```

## STEP 3 — download the medium model (~1.5 GB)
The `medium` model is **multilingual** — it auto-detects the spoken language per file
(~99 languages). EN/FR is the *tested* workload, not a hard limit.
```bash
bash ./models/download-ggml-model.sh medium
ls -lh models/ggml-medium.bin  # verify
```
**Default vs on-demand:** only `medium` is downloaded here, and the wrapper uses it by
default. To use `small` or `large-v3`, download it first: `bash ./models/download-ggml-model.sh <name>`
— otherwise `--model <name>` fails with "Model not found".

**Language selection (runtime):** the wrapper defaults to `--lang auto` (detect per file).
Force `--lang fr` or `--lang en` only when a recording opens quiet/ambiguous and auto-detect
guesses wrong — otherwise leave it on auto.

| Model | Size | FR/EN | 15-min clip | When |
|---|---|---|---|---|
| small | ~460 MB | EN good, FR weak | ~3–5 min | clean English (download first) |
| **medium** | **~1.5 GB** | **FR+EN solid** | **~8–15 min** | **default — shipped + used** |
| large-v3 | ~3 GB | best | ~15–25 min | quality > speed (download first) |

## STEP 4 — the wrapper (path-robust, ships with the skill)
The wrapper ships at `scripts/transcribe.sh` beside this file. It discovers the install dir
via `$WHISPER_DIR` then `~/tools/whisper.cpp`, `~/whisper.cpp`, `/opt/whisper.cpp`. Invoke it
through the plugin root: `${CLAUDE_PLUGIN_ROOT}/skills/transcribe/scripts/transcribe.sh`.
If whisper.cpp lives somewhere non-standard, export it: `export WHISPER_DIR=/actual/path/whisper.cpp`.

## STEP 5 — smoke test, then a real file
```bash
~/tools/whisper.cpp/build/bin/whisper-cli \
  -m ~/tools/whisper.cpp/models/ggml-medium.bin \
  -f ~/tools/whisper.cpp/samples/jfk.wav -l en
bash "${CLAUDE_PLUGIN_ROOT}/skills/transcribe/scripts/transcribe.sh" "/path/to/recording.m4a"
```

DELIVERABLE: confirm `transcribe.sh` runs, print the markdown of one transcription,
report wall-clock. Note deviations (distro, paths, model choice).

## Reference

**Output frontmatter fields:** `source`, `duration`, `language`, `model`, `transcribed`.

**Limitations / upgrades:**
- No speaker diarization → use `whisperX` (pyannote+PyTorch) or `tinydiarize` model.
- Noisy/accented FR → `--model large-v3`.
- Word-level timestamps → add `-ml 1` to the wrapper's `whisper-cli` call (or `-ojf` full JSON + adjust the formatter).
- Very long files (>1h) work but are slow; consider chunking or `large-v3-turbo`.
- Quiet openings can mis-detect language → pass `--lang fr`/`--lang en` explicitly.
