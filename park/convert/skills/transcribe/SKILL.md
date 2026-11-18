---
name: transcribe
description: Transcribe an audio recording (m4a/mp3/wav/ogg/flac) to markdown locally with whisper.cpp. Auto-detects language (multilingual, tuned for EN/FR), CPU-only, private — no API, no GPU. Self-bootstrapping: builds the pipeline on first use if missing. Use when the user wants to transcribe audio, convert a recording to text, get a transcript, or turn a voice memo into markdown. Triggers include "transcribe", "transcription", "audio to text", "voice memo to markdown".
context: subagent
allowed-tools: [Bash, Read]
user-invocable: true
---

# Transcribe audio → markdown (local, whisper.cpp)

Local CPU transcription, language auto-detected (multilingual; tuned for EN/FR), no API/GPU. Output: markdown with
frontmatter + full text + timestamps. The wrapper `scripts/transcribe.sh` self-discovers whisper.cpp
(`$WHISPER_DIR` → `~/tools/whisper.cpp` → `~/whisper.cpp` → `/opt/whisper.cpp`). Invoke it via the
plugin root: `${CLAUDE_PLUGIN_ROOT}/skills/transcribe/scripts/transcribe.sh`.

## Instructions

1. **Resolve the audio file** from the request (`$ARGUMENTS`). Accept m4a/mp3/wav/ogg/flac; if none given, ask.
2. **Ensure the pipeline exists** — probe once: `bash "${CLAUDE_PLUGIN_ROOT}/skills/transcribe/scripts/transcribe.sh" --help >/dev/null 2>&1; echo $?`. Exit `2` (or "whisper.cpp not found") → follow `setup.md` to build it (warn: one-time ~10-min build + ~1.5 GB download), then continue.
3. **Run:** `bash "${CLAUDE_PLUGIN_ROOT}/skills/transcribe/scripts/transcribe.sh" "<audio-path>"` (output defaults to `<input>.md`). Flags on request: `--lang fr|en`, `--model small|large-v3` (only `medium` ships by default — others must be downloaded first, see `setup.md`), `--no-timestamps`, custom output as 2nd positional arg.
4. **Set expectations:** a 10–20 min file takes several minutes on CPU — let it run.
5. **When done:** Read the `.md` and show a short preview (frontmatter + first lines).

## Notes
- WSL-safe: wrapper does all decode/temp in native `/tmp`; only final `.md` + source may live on `/mnt/c`.
- Non-standard install: `export WHISPER_DIR=/path/to/whisper.cpp`.
- Frontmatter fields, limitations, and upgrade paths (diarization, word-level timestamps, long files): see `setup.md` § Reference.
