# ElevenLabs Speech-to-Text Skill for OpenClaw

Lean installer. Steroid-level capabilities.

A production-ready wrapper around ElevenLabs’ Scribe v2 and realtime streams, built so your OpenClaw deployment can transcribe every channel (batch, live, diarized, multilingual, tagged, and timestamped) without a six-step setup.

## Highlights

- **Full Scribe v2 stack**: batch + realtime, automatic language detection, speaker diarization (32 speakers), entity detection, keyterm prompting, audio-event tags, and choice of JSON/text outputs.
- **Zero-hassle install**: `scripts/install.sh` copies only the surfaced files into `~/.openclaw/skills/eleven-stt`, wires up npm dependencies, and leaves your workspace clean.
- **Developer-friendly API**: use the `ElevenLabsSTT` class from `src/index.js` or the `eleven-stt` CLI for quick testing.
- **Secure by design**: API keys live in `config.keys.elevenlabs_stt` (or `ELEVENLABS_STT_API_KEY`) and transcripts are deleted after retrieval unless you opt in to retain them.

## Installation

```bash
cd ~/.openclaw/skills
git clone https://github.com/xHUNx/eleven-stt.git
cd eleven-stt
./scripts/install.sh
```

The installer copies just the skill manifest, scripts, docs, and source code into your skills directory, then runs `npm install --production` inside the target path so the skill stays lean.

If you prefer manual control:

1. Copy the repository to `~/.openclaw/skills/eleven-stt`.
2. Run `npm install --production` inside that directory.
3. Wire up your ElevenLabs API key (see below).

## Configuration

Set your ElevenLabs API key in OpenClaw’s config:

```yaml
config:
  keys:
    elevenlabs_stt: your-secret-api-key
```

The skill also falls back to the `ELEVENLABS_STT_API_KEY` environment variable for CLI or workflow runs outside the GUI.

Optional overrides go under `config.skillOverrides.eleven-stt`:

| Key | Purpose | Values |
| --- | ------- | ------ |
| `model_id` | Choose between batch and realtime engines | `scribe_v2` (batch), `scribe_v2_realtime` (stream) |
| `language_code` | Force a language | ISO-639 string (e.g. `hu`, `en`, `en-US`), `null` for auto-detect |
| `diarize` / `num_speakers` | Separate multiple voices | `true`/`false`, integer 1–32 |
| `tag_audio_events` | Capture applause, laughter, etc. | `true`/`false` |
| `timestamps_granularity` | Level of timestamps | `word`, `character`, `none` |
| `keyterm_prompts` | Vocabulary to bias toward | Array of strings |
| `additional_formats` | Export extra formats | Array of `srt`, `vtt`, `txt`, etc. |
| `response_format` | Return raw JSON or flat text | `json`/`text` |
| `retain_transcript` | Keep the transcript on ElevenLabs for reuse | `true`/`false` (default is `false`) |

Tip: use `keyterm_prompts` and `num_speakers` together when you have known names or expected interlocutors.

## Usage

### Programmatic (JavaScript)

```javascript
const { ElevenLabsSTT } = require('@openclaw/eleven-stt');

const client = new ElevenLabsSTT({ apiKey: process.env.ELEVENLABS_STT_API_KEY });

const result = await client.transcribe({
  file: './dialogue.mp3',
  diarize: true,
  num_speakers: 3,
  keyterm_prompts: ['project', 'budget'],
  additional_formats: ['srt', 'vtt'],
  response_format: 'json'
});

console.log('Transcript', result.transcription.text);

// The raw ElevenLabs response lives in result.meta if you need it.
```

The `transcribe()` call accepts:

- `file`: path, Buffer, or stream
- `cloud_storage_url`: HTTPS URL or signed URL
- `model_id`, `language_code`, `diarize`, `num_speakers`, `tag_audio_events`
- `timestamps_granularity`, `response_format`, `keyterm_prompts`, `additional_formats`
- `metadata`: key/value pairs forwarded to ElevenLabs for tracing
- `retain_transcript`: keep the transcript on ElevenLabs after fetch (use with care)

### CLI (fast experimentation)

```bash
eleven-stt --file notes.m4a --diarize --speakers 2 --formats srt,vtt --prompt "quarterly" --output text
```

CLI options:

| Flag | Description |
| --- | ----------- |
| `--api-key` | Override the stored API key (defaults to `ELEVENLABS_STT_API_KEY`) |
| `--file` | Local audio/video file (path) |
| `--url` | Remote/cloud URL |
| `--model` | `scribe_v2` or `scribe_v2_realtime` |
| `--language` | ISO code to pin the language |
| `--diarize` | Enable speaker diarization |
| `--speakers` | Number of expected speakers for diarization |
| `--events` | Enable audio-event tagging |
| `--timestamps` | `word`, `character`, or `none` |
| `--formats` | Comma-separated list of extra formats (`srt`, `vtt`, `txt`, …) |
| `--prompt` | Add a keyterm prompt (repeatable) |
| `--metadata` | Attach metadata in `key=value` form (repeatable) |
| `--retain` | Skip automatic transcript deletion |
| `--output` | `json` (default) or `text` |
| `--help` | Show help and exit |

CLI outputs the full response in JSON or a concise object when `--output text` is provided.

## Packaging & Release

- Run `npm run validate` (calls `validate.py`) before publishing.
- Use `python scripts/package_skill.py .` to generate a distributable `.zip` containing the manifest, docs, and supporting scripts.

When you publish to ClawHub or a private registry, the `.zip` file can be uploaded as-is; OpenClaw’s skill loader only needs the manifest, scripts, and `src/` code.

## Testing

We ship two validators for CI:

```bash
npm run validate     # runs validate.py
python test_skill.py  # alternate validator with YAML parser
```

Use the sample clip `https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3` with diarization and tagging enabled to verify the JSON payload and timing accuracy.

## Support

Open an issue on GitHub and include:

- Audio sample (if you can share) or format details
- CLI command you ran
- Configuration overrides from `config.skillOverrides.eleven-stt`

We’re watching this repo; expect updates whenever ElevenLabs changes the Scribe contract.
