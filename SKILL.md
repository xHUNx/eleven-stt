---
name: eleven-stt
version: 0.2.0
description: "Official ElevenLabs Speech-to-Text skill mirroring the Scribe v2 capability stack: GUI API-key storage, multi-channel batch + realtime support, speaker diarization, 90+ language recognition, keyterm prompting, entity detection, precise timestamps, audio-event tagging, and HIPAA-aware cleanup for every transcript."
---

# ElevenLabs Speech-to-Text

## Trigger
Leverage this skill whenever OpenClaw needs high-accuracy transcription via ElevenLabs’ Speech-to-Text API—batch (Scribe v2) or realtime (Scribe v2 Realtime)—especially when you care about multilingual support, keyterm prompting, speaker diarization, entity detection, audio-event tagging, or per-word timestamps.

## Authentication & configuration
- Store the ElevenLabs API key under `config.keys.elevenlabs_stt` so the skill keeps it separate from the TTS entry and the GUI can show a dedicated text field. Fall back to the environment variable `ELEVENLABS_STT_API_KEY` if the key isn’t set there, and never hard-code secrets in the skill itself. HIPAA customers must contact ElevenLabs Sales for a BAA before sending protected health data.
- Optional configuration knobs (default in `config.skillOverrides.eleven-stt`):
  - `model_id` (string, default `scribe_v2`) — choose `scribe_v2` for batch accuracy or `scribe_v2_realtime` for streaming/low latency.
  - `language_code` (string/`null`, default `null`) — let the model detect from 90+ languages or pin an ISO-639 code for stubborn accents.
  - `diarize` (boolean, default `false`) — capture up to 32 speaker turns with diarization.
  - `num_speakers` (integer, 1–32) — hint how many voices the diarizer should expect.
  - `tag_audio_events` (boolean, default `true`) — tag laughter, music, footsteps, applause, and similar dynamic sounds.
  - `keyterm_prompts` (array, optional) — provide up to 100 terms so Scribe highlights the vocabulary that matters.
  - `timestamps_granularity` (enum: `word`, `character`, default `word`) — deliver word- or character-level offsets for every token.
  - `additional_formats` (array) — request SRT, VTT, or other format dumps alongside JSON.
  - `response_format` (enum: `json`, `text`, default `json`) — choose whether you need the structured metadata or plain text.

## Input
Call the skill’s action with either:
1. A file upload (speech clip, any audio/video format supported by ElevenLabs—MP3, WAV, OGG, M4A, AVI, MP4, WebM, FLAC, etc., up to the 3 GB limit) attached to the request. OpenClaw should read the binary without writing to disk if possible.
2. A reference URL to an accessible audio file (supports HTTPS or signed cloud URLs).
3. Metadata (optional) such as `speaker_context`, `expected_language`, or `fade_in_seconds` if you want to bias detection.

## Supported formats
- ElevenLabs accepts every major audio/video container (MP3, WAV, AAC, OGG, M4A, WebM, MP4, AVI, FLAC, etc.) and each request may be as big as 3 GB. Provide encoded files or raw PCM—`file_format=pcm_s16le_16` for raw, `other` for everything else.
- Use `language_code` when available to lock the transcript, but the model auto-detects if you leave it blank.
- Combine `diarize`, `num_speakers`, `tag_audio_events`, `timestamps_granularity`, and `additional_formats` to expose the exact metadata you need.

## Flow
1. Read `config.keys.elevenlabs_stt` (falling back to `ELEVENLABS_STT_API_KEY`) and any overrides from `config.skillOverrides.eleven-stt`.
2. POST to `https://api.elevenlabs.io/v1/speech-to-text` for batch jobs or connect to `wss://api.elevenlabs.io/v1/speech-to-text/realtime` for streaming scenarios.
3. Attach the audio as multipart `file` or `cloud_storage_url`, set `model_id`, `language_code`, `diarize`, `num_speakers`, `tag_audio_events`, `timestamps_granularity`, `keyterm_prompts`, `additional_formats`, and the requested `response_format` per the configuration or overrides.
4. Handle auth with `xi-api-key: <value>` and track `transcription_id` for GET/DELETE follow-ups.
5. Forward extra metadata (e.g., `session_id`, `turn_id`, `webhook_metadata`, `speaker_context`) into the body or websocket session.
6. Back off on 429/5xx responses with exponential retry before failing.
7. After POST completes, GET `https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcription_id}` to fetch the full transcript/metadata, then DELETE the transcript to honor the clean-room workflow unless instructed otherwise.

## Output
Return:
- `transcript` (string or already formatted text depending on `response_format`).
- `language_code` detected.
- `diarization` array (if enabled) with start/end timestamps plus speaker tags.
- `audio_events` list (if enabled).
- `duration_ms` and `confidence` when provided.
- Raw ElevenLabs response in `meta.raw` for debugging.

If `response_format` is `text`, include the raw text. If `json`, preserve the structure of ElevenLabs’ response (e.g., `transcription.text`, `diarization`, `tags`).

## Developer API
The skill ships with a JavaScript wrapper (`src/index.js`) that exports the `ElevenLabsSTT` class and a `transcribe` helper. Use it anywhere in OpenClaw or your own Node workflows, and use the bundled CLI (`eleven-stt`) for quick experimentation.

```javascript
const { ElevenLabsSTT } = require('@openclaw/eleven-stt');
const client = new ElevenLabsSTT({ apiKey: process.env.ELEVENLABS_STT_API_KEY });
const transcript = await client.transcribe({ file: './dialogue.mp3', diarize: true });
```

## Errors
- Surface ElevenLabs error messages (code/message) in a user-friendly sentence (e.g., “ElevenLabs rejected the upload: file is bigger than 50 MB”).
- When the API key is missing, return `ElevenLabs API key not configured; set config.keys.elevenlabs`.
- If the user attaches unsupported file types, instruct them to convert to WAV/MP3/OGG first.

## Testing / validation
- Use the quickstart sample clip (`https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3`) with diarization + tagging to verify the JSON output.
- Compare Hungarian clips against large local Whisper to confirm timing and accuracy.
- Document any rate limits or size limits observed (ElevenLabs ~50 MB per request at the time of writing).

## Submission notes
- Once implemented, package with `scripts/package_skill.py skills/eleven-stt` and submit via ClawHub same as other published skills.
- Include this SKILL in the official registry so Dan/Nora can trigger it via the configured skill name.
