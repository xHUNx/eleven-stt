# ElevenLabs Speech-to-Text Skill for OpenClaw

![ElevenLabs Logo](https://example.com/elevenlabs-logo.png)  

A polished OpenClaw skill that unlocks ElevenLabs' Speech-to-Text stack (Scribe v2 + Realtime) with the same lean install experience as a built-in skill, plus secure API-key capture in the dashboard UI.

## Why This Skill

- **Steroid-level transcription**: mirrors ElevenLabs’ Scribe v2 + Realtime capabilities—90+ languages, precise word-level timestamps, speaker diarization (up to 32 voices), entity detection, keyterm prompting, and dynamic audio-event tagging.
- **Easy install**: `scripts/install.sh` copies only the surfaced files into `~/.openclaw/skills/eleven-stt` and installs production deps so your workspace stays clean.
- **Secure dashboard config**: the skill declares `ELEVENLABS_STT_API_KEY` in `metadata.openclaw.requires`, so OpenClaw renders the masked API-key textbox and you can save it right inside the Skills tab.
- **Modern API + CLI**: use the exported `ElevenLabsSTT` class or the `eleven-stt` CLI for batch or realtime jobs without fiddling with raw HTTP.

## Features

| Capability | Details |
| --- | --- |
| **Scribe v2 (batch)** | 90+ languages, speaker diarization up to 32 speakers, precise word-level timestamps, dynamic audio tagging, entity detection (PII/PHI/PCI), and keyterm prompting (up to 100 terms). Gentle fallback to the `response_format` you choose (JSON/text).
| **Scribe v2 Realtime** | Sub‑second latency (~150 ms), live transcript stream via WebSockets, same language coverage, and timestamps for every spoken token.
| **Uploader options** | File path, Buffer/stream, or public cloud storage URL. Supports MP3/WAV/M4A/OGG/FLAC/MP4/AVI/WebM/raw PCM up to the ElevenLabs 3 GB limit.
| **Outputs** | Structured JSON, plain text, SRT/VTT/custom formats via `additional_formats`, plus raw ElevenLabs response for debug/tracing.
| **Security & compliance** | API key stored in config/vault, transcripts deleted after retrieval (unless `retain_transcript` is true), and HIPAA-ready practices documented.

## Models

- **Scribe v2** – high accuracy transcription with diarization, entity detection, and tagging.
- **Scribe v2 Realtime** – streaming transcription with low latency, ideal for live agent workflows.

Need more models? Visit the ElevenLabs model overview: https://elevenlabs.io/docs/overview/models

## Installation

```bash
# Clone the repository
cd ~/.openclaw/skills
git clone https://github.com/xHUNx/eleven-stt.git
cd eleven-stt

# Install the skill
./scripts/install.sh

# The installer copies the skill into `~/.openclaw/skills/eleven-stt` and runs `npm install --production`. You can rerun it to refresh dependencies.
```

```bash
cd ~/.openclaw/skills
git clone https://github.com/xHUNx/eleven-stt.git
cd eleven-stt
./scripts/install.sh
```

The installer copies the skill into `~/.openclaw/skills/eleven-stt` and runs `npm install --production`. You can rerun it to refresh dependencies.

## Configuration

To configure the ElevenLabs Speech-to-Text skill, set the following environment variables in your OpenClaw configuration.

### Environment Variables

```yaml
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

The skill will use these settings to authenticate and configure the ElevenLabs API.

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
# Basic transcription

# Transcribe an audio file
# Usage: eleven-stt --file <path-to-audio-file> [options]

# Example:
# Transcribe an audio file with diarization for 2 speakers, output in SRT and VTT formats, and prompt for the term 'quarterly'
eleven-stt --file notes.m4a --diarize --speakers 2 --formats srt,vtt --prompt "quarterly" --output json

# Realtime transcription

# Use the realtime model for live transcription
# Usage: eleven-stt --realtime --cloud-storage-url <url-to-audio-file> [options]

# Example:
# Transcribe a live audio stream from a cloud storage URL
eleven-stt --realtime --cloud-storage-url https://example.com/audio-stream.mp3 --diarize --speakers 2 --formats srt,vtt --prompt "quarterly" --output json
```

### Realtime

For realtime transcription, use the `scribe_v2_realtime` model and provide a cloud storage URL or leverage the WebSocket endpoint documented in the [ElevenLabs realtime guide](https://elevenlabs.io/docs/overview/models).

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

## Validation & Packaging

### Validation

To validate the skill, run the following command:

```bash
npm run validate

# This runs `validate.py` to ensure manifests and files match expectations.
```

### Packaging

To package the skill for submission to ClawHub, run the following command:

```bash
python scripts/package_skill.py .

# This zips the skill for ClawHub submissions.
```

- `npm run validate` → runs `validate.py` to ensure manifests + files match expectations.
- `python scripts/package_skill.py .` → zips the skill for ClawHub submissions.

## Support

For support, please report issues via [GitHub Issues](https://github.com/xHUNx/eleven-stt/issues). When reporting an issue, please include:

1. A GIF or clip demonstrating the issue.
2. The CLI command you used.
3. Your override block.

For HIPAA compliance, contact ElevenLabs Sales before sending PHI.

Report issues via https://github.com/xHUNx/eleven-stt/issues with GIF/clip, CLI command, and your override block. For HIPAA compliance, contact ElevenLabs Sales before sending PHI.
