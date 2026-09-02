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

- [**Live Microphone Streaming**](#output-format--live-streaming): Streams real-time audio straight from the microphone. As the user speaks, Whisper continuously returns draft transcripts and automatically commits finalized sentences upon pauses.
- [**Pre-recorded Audio Transcription**](#pre-recorded-audio-transcription): Transcribes pre-recorded audio buffers or audio files in a single pass, with optional token-by-token streaming callbacks.

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

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/speech-to-text.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/speech-to-text.tsx>) and [`src/hooks/useAudioRecorder.ts`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/hooks/useAudioRecorder.ts) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete example featuring microphone controls, live audio streaming, and animated transcription UI.
:::

## Output Format & Live Streaming

When streaming live microphone audio with [`stream()`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#stream), the generator yields transcription updates on every voice activity event:

```typescript
type WhisperStreamUpdate = {
  /** Finalized transcript of completed sentences and clauses */
  readonly committed: string;
  /** Live in-progress transcript of the active speech segment that may still update */
  readonly nonCommitted: string;
};
```

### How Live Streaming Works

- **Committed vs Non-Committed Text**: As the user speaks, Whisper continuously transcribes the active speech window into [`nonCommitted`](../../06-api-reference/type-aliases/WhisperStreamUpdate.md#noncommitted) text. Once the speaker pauses or completes a clause (detected by the integrated Voice Activity Detector), that segment is finalized and appended to [`committed`](../../06-api-reference/type-aliases/WhisperStreamUpdate.md#committed) text.
- **Background Audio Buffer**: Audio chunks fed via [`streamInsert(pcmSamples)`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#streaminsert) are accumulated in an internal audio ring buffer on a background thread without blocking the JavaScript UI.
- **Graceful Termination**: Calling [`streamStop()`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#streamstop) signals the stream to process any remaining speech in the buffer, commit the final clause, and close the generator.

## Pre-Recorded Audio Transcription

To transcribe an existing audio recording or batch audio buffer all at once, use [`transcribe()`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribe):

```typescript
// audioData: Float32Array PCM samples at 16000 Hz
const transcript = await stt.transcribe(audioData, {
  language: 'en',
});

console.log('Full transcript:', transcript);
```

You can also pass an optional [`onToken`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribe) callback to receive decoded word/subword tokens in real time as Whisper generates them:

```typescript
const transcript = await stt.transcribe(audioData, { language: 'en' }, (token) => {
  console.log('Decoded token:', token);
});
```

To abort an in-flight transcription prematurely, call [`stt.transcribeStop()`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribestop):

```typescript
// Cancels active transcribe() execution and rejects the pending promise
stt.transcribeStop?.();
```

## Imperative API

For background services, offline audio processors, or non-React component logic, instantiate the pipeline imperatively using [`createWhisperSpeechToText`](../../06-api-reference/functions/createWhisperSpeechToText.md):

```typescript
import { createWhisperSpeechToText, download, models } from 'react-native-executorch';

// Download and cache Whisper weights, tokenizer, and bundled VAD
const model = await download(models.speechToText.WHISPER.EN.BASE.DEFAULT);
const stt = await createWhisperSpeechToText(model);

try {
  const transcript = await stt.transcribe(audioData, { language: 'en' });
  console.log('Transcript:', transcript);
} finally {
  // Always release native resources when finished
  stt.dispose();
}
```

## Synchronous Execution

For synchronous worklet execution contexts or frame-by-frame audio processors, [`createWhisperSpeechToText`](../../06-api-reference/functions/createWhisperSpeechToText.md) exposes a synchronous [`transcribeWorklet`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribeworklet) function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const transcript = stt.transcribeWorklet(audioData, { language: 'en' });
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use Whisper models from the [Software Mansion HuggingFace Whisper Collection](https://huggingface.co/collections/software-mansion/whisper), available in [`models.speechToText`](../../06-api-reference/variables/models.md#speechtotext):

| Model Family      | Variants                                                                                                                                                                  | Size Range         | Supported Backends                                            | Languages                                                                                              | Notes                                                           |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| **Whisper Tiny**  | [`Multilingual`](../../06-api-reference/variables/models.md#speechtotextwhispertiny), [`English`](../../06-api-reference/variables/models.md#speechtotextwhisperentiny)   | 57.1 MB – 221.8 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | English / [`WHISPER_LANGUAGES`](../../06-api-reference/variables/WHISPER_LANGUAGES.md) (99+ languages) | Ultra-fast transcription with minimal RAM usage.                |
| **Whisper Base**  | [`Multilingual`](../../06-api-reference/variables/models.md#speechtotextwhisperbase), [`English`](../../06-api-reference/variables/models.md#speechtotextwhisperenbase)   | 97.8 MB – 380.2 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | English / [`WHISPER_LANGUAGES`](../../06-api-reference/variables/WHISPER_LANGUAGES.md) (99+ languages) | Balanced accuracy and speed for general voice dictation.        |
| **Whisper Small** | [`Multilingual`](../../06-api-reference/variables/models.md#speechtotextwhispersmall), [`English`](../../06-api-reference/variables/models.md#speechtotextwhisperensmall) | 276.0 MB – 1.05 GB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | English / [`WHISPER_LANGUAGES`](../../06-api-reference/variables/WHISPER_LANGUAGES.md) (99+ languages) | High-capacity model for complex, noisy, or multi-speaker audio. |

## API Reference

### Hooks & Pipelines

- [`useSpeechToText()`](../../06-api-reference/functions/useSpeechToText.md) — React hook for Whisper model loading, downloading, and live transcription state.
- [`createWhisperSpeechToText()`](../../06-api-reference/functions/createWhisperSpeechToText.md) — Imperative factory for Whisper Speech-to-Text pipelines.

### Types & Options

- [`WhisperSpeechToText`](../../06-api-reference/type-aliases/WhisperSpeechToText.md) — Whisper runner interface ([`transcribe`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribe), [`transcribeWorklet`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribeworklet), [`transcribeStop`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#transcribestop), [`stream`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#stream), [`streamInsert`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#streaminsert), [`streamStop`](../../06-api-reference/type-aliases/WhisperSpeechToText.md#streamstop), `dispose`).
- [`WhisperSttModel`](../../06-api-reference/type-aliases/WhisperSttModel.md) — Whisper model spec including model path, tokenizer path, and bundled VAD model.
- [`WhisperSttOptions`](../../06-api-reference/type-aliases/WhisperSttOptions.md) — Per-call transcription options (`language`).
- [`WhisperStreamOptions`](../../06-api-reference/type-aliases/WhisperStreamOptions.md) — Live microphone streaming options (`language`, `vadOptions`).
- [`WhisperLanguage`](../../06-api-reference/type-aliases/WhisperLanguage.md) — Union of supported Whisper language codes.

### Constants & Model Presets

- [`WHISPER_SAMPLE_RATE_HZ`](../../06-api-reference/variables/WHISPER_SAMPLE_RATE_HZ.md) — Target audio sample rate expected by Whisper models (16000 Hz).
- [`WHISPER_LANGUAGES`](../../06-api-reference/variables/WHISPER_LANGUAGES.md) — Array of 99+ supported language codes.
- [`models.speechToText`](../../06-api-reference/variables/models.md#speechtotext) — Pre-configured Whisper models registry.
