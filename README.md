# ElevenLabs Speech-to-Text Skill for OpenClaw

ElevenLabs Speech-to-Text skill for OpenClaw mirroring the Scribe v2 capability stack: GUI API-key storage, multi-channel batch + realtime support, speaker diarization, 90+ language recognition, keyterm prompting, entity detection, precise timestamps, audio-event tagging, and HIPAA-aware cleanup for every transcript.

## Overview

This skill integrates with ElevenLabs' cutting-edge Speech-to-Text API, providing high-accuracy transcription capabilities with support for both batch and real-time processing. The skill is designed to handle a wide variety of audio formats and offers extensive configuration options for optimal transcription quality.

## Features

- **High Accuracy Transcription**: Leverages ElevenLabs' Scribe v2 model for superior transcription quality
- **Batch & Real-time Support**: Choose between batch processing for accuracy or real-time for low latency
- **Multi-language Support**: Auto-detection or manual specification of 90+ languages
- **Speaker Diarization**: Identify and separate different speakers in audio (up to 32)
- **Audio Event Tagging**: Detect and tag non-speech events like laughter, applause, music
- **Precise Timestamps**: Word-level or character-level timing information
- **Entity Detection**: Identify PII, PHI, PCI, and other sensitive information
- **Keyterm Prompting**: Bias recognition toward specific vocabulary
- **Multiple Output Formats**: Support for SRT, VTT, PDF, DOCX, and more
- **HIPAA Compliance**: Secure handling with automatic cleanup

## Prerequisites

- OpenClaw v1.0.0 or higher
- ElevenLabs API key with Speech-to-Text access
- Node.js 16+ (for development)

## Installation

1. Clone the repository to your OpenClaw skills directory:
```bash
cd ~/.openclaw/skills
git clone https://github.com/xHunx/eleven-stt.git
```

2. Configure your ElevenLabs API key:
```bash
# Set in your OpenClaw config
config.keys.elevenlabs_stt = "your_api_key_here"
```

## Configuration

The skill supports various configuration options that can be set in your OpenClaw configuration:

```yaml
skillOverrides:
  eleven-stt:
    model_id: "scribe_v2"                 # "scribe_v2" or "scribe_v2_realtime"
    language_code: null                    # ISO-639 code or null for auto-detect
    diarize: false                        # Enable speaker diarization
    num_speakers: null                     # Number of expected speakers (1-32)
    tag_audio_events: true                # Tag audio events like laughter
    timestamps_granularity: "word"         # "word", "character", or "none"
    response_format: "json"               # "json" or "text"
    keyterm_prompts: []                   # Array of key terms to prioritize
    additional_formats: []                # Additional output formats
```

## Usage

The skill is automatically triggered when OpenClaw needs transcription services. You can also invoke it directly with audio files:

### File Upload
```javascript
// Example usage within OpenClaw
const result = await skill('eleven-stt', {
  file: '/path/to/audio.mp3',
  diarize: true,
  language_code: 'en'
});
```

### URL-based Processing
```javascript
const result = await skill('eleven-stt', {
  cloud_storage_url: 'https://example.com/audio.mp3',
  tag_audio_events: true
});
```

## API Integration

The skill seamlessly integrates with ElevenLabs' API endpoints:

- **Batch Transcription**: `POST /v1/speech-to-text`
- **Real-time Transcription**: `wss://api.elevenlabs.io/v1/speech-to-text/realtime`
- **Get Transcript**: `GET /v1/speech-to-text/transcripts/{transcription_id}`
- **Delete Transcript**: `DELETE /v1/speech-to-text/transcripts/{transcription_id}`

## Supported Audio Formats

The skill supports all major audio and video formats accepted by ElevenLabs:

- **Audio**: MP3, WAV, AAC, OGG, M4A, FLAC, etc.
- **Video**: MP4, AVI, WebM, MOV, etc.
- **Raw PCM**: 16-bit PCM at 16kHz (little-endian, mono)

Maximum file size: 3 GB for batch processing.

## Output Format

Depending on the configuration, the skill returns structured data:

```javascript
{
  transcript: "The transcribed text...",
  language_code: "en",
  language_probability: 0.98,
  words: [...], // Array of word objects with timing
  diarization: [...], // Speaker information if enabled
  audio_events: [...], // Tagged audio events if enabled
  entities: [...], // Detected entities if enabled
  duration_ms: 12345,
  confidence: 0.95,
  meta: {
    raw: {...}, // Raw ElevenLabs response
    transcription_id: "..."
  }
}
```

## Security & Privacy

- **Automatic Cleanup**: Transcripts are deleted after retrieval to ensure privacy
- **Secure Storage**: API keys stored securely in OpenClaw's configuration system
- **Zero Retention Mode**: Enterprise users can enable zero retention for enhanced privacy
- **HIPAA Compliance**: Designed with healthcare use cases in mind

## Troubleshooting

### Common Issues

1. **API Key Not Found**: Ensure your API key is properly set in `config.keys.elevenlabs_stt`
2. **Unsupported File Type**: Convert audio to a supported format (WAV, MP3, OGG)
3. **Large File Error**: Break files larger than 3GB into smaller segments
4. **Rate Limiting**: Implement appropriate backoff strategies for high-volume usage

### Error Messages

- `"ElevenLabs API key not configured"`: Set the API key in your config
- `"File too large"`: Reduce file size or split into smaller segments
- `"Unsupported format"`: Convert to a supported audio format

## Development

To contribute to this skill:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Testing

The skill includes testing utilities for verification:

```bash
# Use sample audio for testing
https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the maintainer.

## Credits

- Built for OpenClaw ecosystem
- Powered by ElevenLabs Speech-to-Text API
- Created by Daniel A
