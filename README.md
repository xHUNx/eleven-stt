# ElevenLabs Speech-to-Text Skill for OpenClaw

A polished OpenClaw skill that unlocks ElevenLabs' Speech-to-Text stack (Scribe v2 + Realtime) with the same lean install experience as a built-in skill, plus secure API-key capture in the dashboard UI.

## Why this skill

- **Steroid-level transcription**: mirrors ElevenLabs’ Scribe v2 + Realtime capabilities—90+ languages, precise word-level timestamps, speaker diarization (up to 32 voices), entity detection, keyterm prompting, and dynamic audio-event tagging.
- **Easy install**: `scripts/install.sh` copies only the surfaced files into `~/.openclaw/skills/eleven-stt` and installs production deps so your workspace stays clean.
- **Secure dashboard config**: the skill declares `ELEVENLABS_STT_API_KEY` in `metadata.openclaw.requires`, so OpenClaw renders the masked API-key textbox and you can save it right inside the Skills tab.
- **Modern API + CLI**: use the exported `ElevenLabsSTT` class or the `eleven-stt` CLI for batch or realtime jobs without fiddling with raw HTTP.

## Features (drawn from ElevenLabs capabilities)

| Capability | Details |
| --- | --- |
| **Scribe v2 (batch)** | 90+ languages, speaker diarization up to 32 speakers, precise word-level timestamps, dynamic audio tagging, entity detection (PII/PHI/PCI), and keyterm prompting (up to 100 terms). Gentle fallback to the `response_format` you choose (JSON/text).
| **Scribe v2 Realtime** | Sub‑second latency (~150 ms), live transcript stream via WebSockets, same language coverage, and timestamps for every spoken token.
| **Uploader options** | File path, Buffer/stream, or public cloud storage URL. Supports MP3/WAV/M4A/OGG/FLAC/MP4/AVI/WebM/raw PCM up to the ElevenLabs 3 GB limit.
| **Outputs** | Structured JSON, plain text, SRT/VTT/custom formats via `additional_formats`, plus raw ElevenLabs response for debug/tracing.
| **Security & compliance** | API key stored in config/vault, transcripts deleted after retrieval (unless `retain_transcript` is true), and HIPAA-ready practices documented.

## Models at a glance

- **Scribe v2** – high accuracy transcription with diarization, entity detection, and tagging.
- **Scribe v2 Realtime** – streaming transcription with low latency, ideal for live agent workflows.

Need more models? Visit the ElevenLabs model overview: https://elevenlabs.io/docs/overview/models

## Installation

```bash
cd ~/.openclaw/skills
git clone https://github.com/xHUNx/eleven-stt.git
cd eleven-stt
./scripts/install.sh
```

The installer copies the skill into `~/.openclaw/skills/eleven-stt` and runs `npm install --production`. You can rerun it to refresh dependencies.

## Configuration

OpenClaw renders the API-key textbox in the Skills dashboard thanks to the `metadata.openclaw.requires.env` setting. Add your ElevenLabs STT key via the UI (or set `ELEVENLABS_STT_API_KEY` in `.env/config` if you prefer). Optional overrides live under `config.skillOverrides.eleven-stt`.

Example overrides:

```yaml
config:
  keys:
    elevenlabs_stt: "your-secret"
skillOverrides:
  eleven-stt:
    model_id: scribe_v2            # or scribe_v2_realtime
    language_code: null            # ISO-639 code or null for auto-detect
    diarize: true
    num_speakers: 3
    tag_audio_events: true
    timestamps_granularity: word
    response_format: json
```

## Usage

### JavaScript

```javascript
const { ElevenLabsSTT } = require('@openclaw/eleven-stt');
const client = new ElevenLabsSTT({ apiKey: process.env.ELEVENLABS_STT_API_KEY });

const result = await client.transcribe({
  file: './dialogue.mp3',
  diarize: true,
  num_speakers: 3,
  additional_formats: ['srt', 'vtt'],
  keyterm_prompts: ['budget', 'deadline'],
  response_format: 'json'
});
```

### CLI

```bash
eleven-stt --file notes.m4a --diarize --speakers 2 --formats srt,vtt --prompt "quarterly" --output json
```

### Realtime

Use `model_id: scribe_v2_realtime` and `cloud_storage_url` or leverage the WebSocket endpoint documented in the ElevenLabs realtime guide.

## Validation & packaging

- `npm run validate` → runs `validate.py` to ensure manifests + files match expectations.
- `python scripts/package_skill.py .` → zips the skill for ClawHub submissions.

## Support

Report issues via https://github.com/xHUNx/eleven-stt/issues with GIF/clip, CLI command, and your override block. For HIPAA compliance, contact ElevenLabs Sales before sending PHI.
