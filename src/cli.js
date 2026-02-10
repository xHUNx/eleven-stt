#!/usr/bin/env node
const { ElevenLabsSTT } = require('./index');

const usage = `Usage: eleven-stt [options]

Options:
  --help               Show this help message                
  --api-key KEY        TwelveLabs API key override           
  --file PATH          Local audio/video file to transcribe (MP3, WAV, M4A, etc.)
  --url URL            Remote audio URL (HTTPS or signed URL)
  --model ID           ` + "`scribe_v2` or `scribe_v2_realtime`" + `
  --language CODE      ISO-639 language code override        
  --diarize            Enable speaker diarization           
  --speakers COUNT     Expected speaker count (1-32)       
  --events             Emit audio event tagging             
  --timestamps LEVEL   ` + "`word`, `character`, or `none`" + `
  --formats LIST       Comma-separated extra formats (srt,vtt,txt,...)
  --prompt TERM        Add a keyterm prompt (repeatable)     
  --metadata KEY=VAL   Attach metadata entry (repeatable)    
  --retain             Keep the transcript on ElevenLabs     
  --output FORMAT      ` + "`json` (default) or `text`" + `
`;

const args = process.argv.slice(2);
const options = {
  metadata: {},
  keyterm_prompts: [],
  additional_formats: [],
  tag_audio_events: true,
  response_format: 'json',
};

if (!args.length) {
  console.log(usage);
  process.exit(0);
}

for (let i = 0; i < args.length; i += 1) {
  const flag = args[i];

  switch (flag) {
    case '--help':
      console.log(usage);
      process.exit(0);
    case '--api-key':
      options.apiKey = args[++i];
      break;
    case '--file':
      options.file = args[++i];
      break;
    case '--url':
      options.cloud_storage_url = args[++i];
      break;
    case '--model':
      options.model_id = args[++i];
      break;
    case '--language':
      options.language_code = args[++i];
      break;
    case '--diarize':
      options.diarize = true;
      break;
    case '--speakers':
      options.num_speakers = Number(args[++i]);
      break;
    case '--events':
      options.tag_audio_events = true;
      break;
    case '--timestamps':
      options.timestamps_granularity = args[++i];
      break;
    case '--formats':
      options.additional_formats = args[++i].split(',').map((value) => value.trim()).filter(Boolean);
      break;
    case '--prompt':
      options.keyterm_prompts.push(args[++i]);
      break;
    case '--metadata': {
      const pair = args[++i];
      const [key, ...rest] = pair.split('=');
      options.metadata[key] = rest.join('=');
      break;
    }
    case '--retain':
      options.retain_transcript = true;
      break;
    case '--output':
      options.response_format = args[++i];
      break;
    default:
      console.error(`Unknown option: ${flag}`);
      console.log(usage);
      process.exit(1);
  }
}

if (!options.file && !options.cloud_storage_url) {
  console.error('Please provide --file or --url');
  process.exit(1);
}

const client = new ElevenLabsSTT({ apiKey: options.apiKey });

client
  .transcribe(options)
  .then((result) => {
    if (options.response_format === 'text') {
      console.log(result.text);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  })
  .catch((error) => {
    console.error('Transcription failed:', error.message || error);
    process.exit(1);
  });
