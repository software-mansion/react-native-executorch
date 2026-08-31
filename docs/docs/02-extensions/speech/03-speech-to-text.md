---
title: Speech-to-Text (STT)
slug: /extensions/speech-to-text
description: 'Transcribe spoken audio in real time on-device in React Native using OpenAI Whisper with integrated Voice Activity Detection.'
keywords:
  [
    react native,
    speech to text,
    stt,
    asr,
    whisper,
    voice recognition,
    transcription,
    vad,
    live audio,
    mobile ml,
    on-device ai,
  ]
---

# Speech-to-Text (STT)

The Speech-to-Text extension transcribes spoken audio into text directly on-device using OpenAI's Whisper model paired with an integrated FSMN Voice Activity Detector (VAD).

The pipeline supports two primary workflows:

- **Live Microphone Streaming ([`stt.stream`](#output-format--live-streaming))**: Streams real-time audio straight from the microphone. As the user speaks, Whisper continuously returns draft transcripts and automatically commits finalized sentences upon pauses.
- **Pre-recorded Audio Transcription ([`stt.transcribe`](#pre-recorded-audio-transcription))**: Transcribes pre-recorded audio buffers or audio files in a single pass, with optional token-by-token streaming callbacks.

<!-- GIF DEMO PLACEHOLDER: Place STT demo gif here, e.g. ![Speech to Text Demo](./media/stt.gif) -->

## Quick Start

The [`useSpeechToText`](../../06-api-reference/functions/useSpeechToText.md) hook manages downloading model weights, the tokenizer, and the bundled VAD model. To capture live audio from the microphone, feed PCM chunks into `stt.streamInsert()` using a microphone recorder such as [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api):

```tsx
import { useState } from 'react';
import { models, useSpeechToText, WHISPER_SAMPLE_RATE_HZ } from 'react-native-executorch';
import { useAudioRecorder } from './hooks/useAudioRecorder'; // Custom helper built with react-native-audio-api

function TranscriptionComponent() {
  const [committedText, setCommittedText] = useState('');
  const [nonCommittedText, setNonCommittedText] = useState('');

  const stt = useSpeechToText(models.speechToText.WHISPER.EN.TINY.DEFAULT);
  const recorder = useAudioRecorder();

  // Hook state:
  // stt.isReady          — true once Whisper model, tokenizer, and VAD are loaded
  // stt.downloadProgress — 0.0 to 1.0 download progress across all files
  // stt.error            — Error instance if download or load failed

  const handleToggleRecording = async () => {
    if (recorder.isRecording) {
      await recorder.stopRecording();
      stt.streamStop?.(); // Signal stream to finalize and close
      return;
    }

    if (!stt.isReady || !stt.stream || !stt.streamInsert) return;

    setCommittedText('');
    setNonCommittedText('');

    // 1. Consume the live transcription stream in the background
    (async () => {
      const textStream = stt.stream!({ language: 'en' });
      for await (const update of textStream) {
        setCommittedText(update.committed);
        setNonCommittedText(update.nonCommitted);
      }
    })();

    // 2. Start microphone recording (16 kHz mono Float32 PCM)
    await recorder.startRecording(WHISPER_SAMPLE_RATE_HZ, (samples) => {
      stt.streamInsert?.(samples);
    });
  };
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/speech-to-text.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/speech-to-text.tsx) and [`src/hooks/useAudioRecorder.ts`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/hooks/useAudioRecorder.ts) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete example featuring microphone controls, live audio streaming, and animated transcription UI.
:::

## Output Format & Live Streaming

When streaming live microphone audio with `stt.stream()`, the generator yields transcription updates on every voice activity event:

```typescript
type WhisperStreamUpdate = {
  /** Finalized transcript of completed sentences and clauses */
  readonly committed: string;
  /** Live in-progress transcript of the active speech segment that may still update */
  readonly nonCommitted: string;
};
```

### How Live Streaming Works

- **Committed vs Non-Committed Text**: As the user speaks, Whisper continuously transcribes the active speech window into `nonCommitted` text. Once the speaker pauses or completes a clause (detected by the integrated Voice Activity Detector), that segment is finalized and appended to `committed` text.
- **Background Audio Buffer**: Audio chunks fed via `streamInsert(pcmSamples)` are accumulated in an internal audio ring buffer on a background thread without blocking the JavaScript UI.
- **Graceful Termination**: Calling `streamStop()` signals the stream to process any remaining speech in the buffer, commit the final clause, and close the generator.

## Pre-Recorded Audio Transcription

To transcribe an existing audio recording or batch audio buffer all at once, use `transcribe()`:

```typescript
// audioData: Float32Array PCM samples at 16000 Hz
const transcript = await stt.transcribe(audioData, {
  language: 'en',
});

console.log('Full transcript:', transcript);
```

You can also pass an optional `onToken` callback to receive decoded word/subword tokens in real time as Whisper generates them:

```typescript
const transcript = await stt.transcribe(audioData, { language: 'en' }, (token) => {
  console.log('Decoded token:', token);
});
```

## Imperative API

For background services, offline audio processors, or non-React component logic, instantiate the pipeline imperatively using [`createWhisperSpeechToText`](../../06-api-reference/functions/createWhisperSpeechToText.md):

```typescript
import { createWhisperSpeechToText, download, models } from 'react-native-executorch';

// Download and cache Whisper weights, tokenizer, and bundled VAD
const model = await download(models.speechToText.WHISPER.EN.TINY.DEFAULT);
const whisper = await createWhisperSpeechToText(model);

try {
  const transcript = await whisper.transcribe(audioData, { language: 'en' });
  console.log('Transcribed:', transcript);
} finally {
  // Always release native resources when finished
  whisper.dispose();
}
```

## Synchronous Execution

For synchronous worklet execution contexts or frame-by-frame audio processors, `createWhisperSpeechToText` exposes a synchronous `transcribeWorklet` function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const transcript = whisper.transcribeWorklet(audioData, { language: 'en' });
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides pre-configured Whisper models in [`models.speechToText`](../../06-api-reference/variables/models.md#speechtotext):

| Model                            | Variants                                              | Size (Default) | Supported Languages                                                    | Notes                                                                                    |
| :------------------------------- | :---------------------------------------------------- | :------------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Whisper Tiny (EN)**            | `XNNPACK_FP32`, `COREML_FP16`, `MLX_BF16`, `MLX_INT8` | 151 MB         | English                                                                | Ultra-fast, lightweight model optimized specifically for English transcription.          |
| **Whisper Tiny (Multilingual)**  | `XNNPACK_FP32`, `COREML_FP16`, `MLX_BF16`, `MLX_INT8` | 151 MB         | [99+ Languages](../../06-api-reference/variables/WHISPER_LANGUAGES.md) | Compact multilingual model for fast transcription across diverse languages.              |
| **Whisper Base (EN)**            | `XNNPACK_FP32`, `COREML_FP16`, `MLX_BF16`, `MLX_INT8` | 290 MB         | English                                                                | Balanced model offering higher English transcription accuracy.                           |
| **Whisper Base (Multilingual)**  | `XNNPACK_FP32`, `COREML_FP16`, `MLX_BF16`, `MLX_INT8` | 290 MB         | [99+ Languages](../../06-api-reference/variables/WHISPER_LANGUAGES.md) | High-accuracy multilingual model for multi-language transcription.                       |
| **Whisper Small (EN)**           | `XNNPACK_FP32`, `COREML_FP16`, `MLX_INT8`             | 967 MB         | English                                                                | High-capacity English model with superior transcription quality and vocabulary handling. |
| **Whisper Small (Multilingual)** | `XNNPACK_FP32`, `COREML_FP16`, `MLX_INT8`             | 967 MB         | [99+ Languages](../../06-api-reference/variables/WHISPER_LANGUAGES.md) | Best multilingual accuracy for complex, noisy, or domain-specific audio.                 |

## API Reference

### Hooks & Pipelines

- [`useSpeechToText()`](../../06-api-reference/functions/useSpeechToText.md) — React hook for Whisper model loading, downloading, and live transcription state.
- [`createWhisperSpeechToText()`](../../06-api-reference/functions/createWhisperSpeechToText.md) — Imperative factory for Whisper Speech-to-Text pipelines.

### Types & Options

- [`WhisperSpeechToText`](../../06-api-reference/type-aliases/WhisperSpeechToText.md) — Whisper runner interface (`transcribe`, `transcribeWorklet`, `transcribeStop`, `stream`, `streamInsert`, `streamStop`, `dispose`).
- [`WhisperSttModel`](../../06-api-reference/type-aliases/WhisperSttModel.md) — Whisper model spec including model path, tokenizer path, and bundled VAD model.
- [`WhisperSttOptions`](../../06-api-reference/type-aliases/WhisperSttOptions.md) — Per-call transcription options (`language`).
- [`WhisperStreamOptions`](../../06-api-reference/type-aliases/WhisperStreamOptions.md) — Live microphone streaming options (`language`, `vadOptions`).
- [`WhisperLanguage`](../../06-api-reference/type-aliases/WhisperLanguage.md) — Union of supported Whisper language codes.

### Constants & Model Presets

- [`WHISPER_SAMPLE_RATE_HZ`](../../06-api-reference/variables/WHISPER_SAMPLE_RATE_HZ.md) — Target audio sample rate expected by Whisper models (16000 Hz).
- [`WHISPER_LANGUAGES`](../../06-api-reference/variables/WHISPER_LANGUAGES.md) — Array of 99+ supported language codes.
- [`models.speechToText`](../../06-api-reference/variables/models.md#speechtotext) — Pre-configured Whisper models registry.
