const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.elevenlabs.io/v1';
const TRANSCRIPTS_ROUTE = '/speech-to-text/transcripts';

const DEFAULTS = {
  model_id: 'scribe_v2',
  language_code: null,
  diarize: false,
  num_speakers: null,
  tag_audio_events: true,
  timestamps_granularity: 'word',
  response_format: 'json',
  additional_formats: [],
  keyterm_prompts: [],
  metadata: {},
  retain_transcript: false,
  poll_interval_ms: 2000,
  max_poll_attempts: 30,
};

const RETRYABLE_STATUS = [429, 500, 502, 503, 504];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isStream = (value) => value && typeof value.pipe === 'function';

class ElevenLabsSTT {
  constructor({ apiKey, defaults = {}, timeoutMs = 120000 } = {}) {
    this.apiKey = apiKey || process.env.ELEVENLABS_STT_API_KEY;
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is required (config.keys.elevenlabs_stt or ELEVENLABS_STT_API_KEY)');
    }

    this.defaults = {
      ...DEFAULTS,
      ...defaults,
      additional_formats: defaults.additional_formats ?? [...DEFAULTS.additional_formats],
      keyterm_prompts: defaults.keyterm_prompts ?? [...DEFAULTS.keyterm_prompts],
      metadata: { ...DEFAULTS.metadata, ...defaults.metadata },
    };

    this.poll_interval_ms = this.defaults.poll_interval_ms;
    this.max_poll_attempts = this.defaults.max_poll_attempts;

    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: timeoutMs,
      headers: {
        'xi-api-key': this.apiKey,
        'User-Agent': 'openclaw-eleven-stt/0.2.0 (+https://github.com/xHUNx/eleven-stt)',
      },
    });
  }

  normalizeOptions(options = {}) {
    const copy = {
      ...this.defaults,
      ...options,
      additional_formats: options.additional_formats ?? [...this.defaults.additional_formats],
      keyterm_prompts: options.keyterm_prompts ?? [...this.defaults.keyterm_prompts],
      metadata: { ...this.defaults.metadata, ...options.metadata },
    };

    if (!copy.file && !copy.cloud_storage_url) {
      throw new Error('Provide either a `file` or `cloud_storage_url` to transcribe.');
    }

    copy.additional_formats = copy.additional_formats.filter((value) => typeof value === 'string' && value.trim());
    copy.keyterm_prompts = copy.keyterm_prompts.filter((value) => typeof value === 'string' && value.trim());

    copy.poll_interval_ms = Math.max(options.poll_interval_ms ?? this.poll_interval_ms, 250);
    copy.max_poll_attempts = Math.max(options.max_poll_attempts ?? this.max_poll_attempts, 1);

    return copy;
  }

  normalizeFileInput(file) {
    if (!file) {
      return null;
    }

    if (Buffer.isBuffer(file)) {
      return { value: file, filename: 'transcript.bin' };
    }

    if (typeof file === 'string') {
      return {
        value: fs.createReadStream(path.resolve(file)),
        filename: path.basename(file),
      };
    }

    if (isStream(file)) {
      return { value: file, filename: 'transcript.bin' };
    }

    throw new Error('`file` must be a Buffer, path, or readable stream.');
  }

  buildForm(options) {
    const form = new FormData();

    if (options.cloud_storage_url) {
      form.append('cloud_storage_url', options.cloud_storage_url);
    } else {
      const attachment = this.normalizeFileInput(options.file);
      form.append('file', attachment.value, { filename: attachment.filename });
    }

    form.append('model_id', options.model_id);

    if (options.language_code) {
      form.append('language_code', options.language_code);
    }

    if (options.diarize) {
      form.append('diarize', 'true');
    }

    if (typeof options.num_speakers === 'number') {
      form.append('num_speakers', String(options.num_speakers));
    }

    form.append('tag_audio_events', options.tag_audio_events ? 'true' : 'false');
    form.append('timestamps_granularity', options.timestamps_granularity ?? 'word');
    form.append('response_format', options.response_format === 'text' ? 'text' : 'json');

    if (options.keyterm_prompts.length) {
      form.append('keyterm_prompts', JSON.stringify([...new Set(options.keyterm_prompts)]));
    }

    if (options.additional_formats.length) {
      form.append('additional_formats', JSON.stringify([...new Set(options.additional_formats)]));
    }

    if (options.metadata && Object.keys(options.metadata).length) {
      form.append('metadata', JSON.stringify(options.metadata));
    }

    return form;
  }

  async executeWithRetry(config = {}) {
    const maxRetries = config.maxRetries ?? 4;
    let attempt = 0;
    let lastError;

    while (attempt <= maxRetries) {
      try {
        return await this.client.request(config);
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const retryable = status ? RETRYABLE_STATUS.includes(status) : true;
        attempt += 1;
        if (!retryable || attempt > maxRetries) {
          throw error;
        }

        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await sleep(delay + Math.floor(Math.random() * 250));
      }
    }

    throw lastError;
  }

  async createTranscription(options) {
    const form = this.buildForm(options);
    const headers = { ...form.getHeaders(), 'xi-api-key': this.apiKey };

    const response = await this.executeWithRetry({
      method: 'post',
      url: '/speech-to-text',
      data: form,
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  }

  async waitForTranscript(transcriptionId, options) {
    const interval = options.poll_interval_ms;
    const attempts = options.max_poll_attempts;

    for (let i = 0; i < attempts; i += 1) {
      const { data } = await this.executeWithRetry({
        method: 'get',
        url: `${TRANSCRIPTS_ROUTE}/${transcriptionId}`,
      });

      const status = data.status || data.state;

      if (status === 'completed') {
        return data;
      }

      if (status === 'failed') {
        const reason = data.errors?.map((item) => item.message).join(', ') || data.error?.message;
        throw new Error(`ElevenLabs reported transcription failure: ${reason ?? JSON.stringify(data)}`);
      }

      await sleep(interval);
    }

    throw new Error('Timed out waiting for the ElevenLabs transcript.');
  }

  async deleteTranscript(transcriptionId) {
    try {
      await this.executeWithRetry({
        method: 'delete',
        url: `${TRANSCRIPTS_ROUTE}/${transcriptionId}`,
      });
    } catch (error) {
      if (error.response?.status === 404) {
        return;
      }
      throw error;
    }
  }

  normalizeTranscript(data, responseFormat) {
    if (responseFormat === 'text') {
      const text =
        data.text ||
        data.transcription?.text ||
        data.transcript ||
        data.output?.text ||
        '';
      return {
        text,
        confidence: data.confidence,
        language_code: data.language_code,
        meta: data,
      };
    }

    return data;
  }

  async transcribe(options = {}) {
    const normalized = this.normalizeOptions(options);
    const creation = await this.createTranscription(normalized);

    const transcriptionId =
      creation.transcription_id || creation.id || creation.result?.transcription_id;

    const transcript = await this.waitForTranscript(transcriptionId, normalized);

    if (!normalized.retain_transcript) {
      const transcriptId = transcript.transcription_id || transcript.id || transcriptionId;
      await this.deleteTranscript(transcriptId);
    }

    return this.normalizeTranscript(transcript, normalized.response_format);
  }
}

module.exports = {
  ElevenLabsSTT,
  transcribe: async (options) => {
    const client = new ElevenLabsSTT({
      apiKey: options.apiKey,
    });
    return client.transcribe(options);
  },
};
