# Speech-to-Text (STT)

The Speech-to-Text extension transcribes spoken audio into text directly on-device using OpenAI's Whisper model paired with an integrated FSMN Voice Activity Detector (VAD).

The pipeline supports two primary workflows:

* [**Live Microphone Streaming**](#output-format--live-streaming): Streams real-time audio straight from the microphone. As the user speaks, Whisper continuously returns draft transcripts and automatically commits finalized sentences upon pauses.
* [**Pre-recorded Audio Transcription**](#pre-recorded-audio-transcription): Transcribes pre-recorded audio buffers or audio files in a single pass, with optional token-by-token streaming callbacks.

| iOS                                                       | Android                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| [](/react-native-executorch/media/speech-to-text-ios.mp4) | [](/react-native-executorch/media/speech-to-text-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useSpeechToText`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText) hook manages downloading model weights, the tokenizer, and the bundled VAD model. To capture live audio from the microphone, feed PCM chunks into [`streamInsert()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#streaminsert) using a microphone recorder such as [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api):

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
  // stt.downloadProgress — 0 to 100 download progress across all files
  // stt.error            — Error instance if download or load failed
  // stt.resource         — resolved config with all URLs replaced by local file paths

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/speech-to-text.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/speech-to-text.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen featuring microphone controls, live audio streaming, and animated transcription UI.

## Output Format & Live Streaming[​](#output-format--live-streaming "Direct link to Output Format & Live Streaming")

When streaming live microphone audio with [`stream()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#stream), the generator yields transcription updates on every voice activity event:

```typescript
type WhisperStreamUpdate = {
  /** Finalized transcript of completed sentences and clauses */
  readonly committed: string;
  /** Live in-progress transcript of the active speech segment that may still update */
  readonly nonCommitted: string;
};

```

### How Live Streaming Works[​](#how-live-streaming-works "Direct link to How Live Streaming Works")

* **Committed vs Non-Committed Text**: As the user speaks, Whisper continuously transcribes the active speech window into `nonCommitted` text. Once the speaker pauses or completes a clause (detected by the integrated Voice Activity Detector), that segment is finalized and appended to `committed` text.
* **Background Audio Buffer**: Audio chunks fed via [`streamInsert(pcmSamples)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#streaminsert) are accumulated in an internal audio ring buffer on a background thread without blocking the JavaScript UI.
* **Graceful Termination**: Calling [`streamStop()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#streamstop) signals the stream to process any remaining speech in the buffer, commit the final clause, and close the generator.

## Pre-Recorded Audio Transcription[​](#pre-recorded-audio-transcription "Direct link to Pre-Recorded Audio Transcription")

To transcribe an existing audio recording or batch audio buffer all at once, use [`transcribe()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribe):

```typescript
// audioData: Float32Array PCM samples at 16000 Hz
const transcript = await stt.transcribe(audioData, {
  language: 'en',
});

console.log('Full transcript:', transcript);

```

You can also pass an optional [`onToken`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribe) callback to receive decoded word/subword tokens in real time as Whisper generates them:

```typescript
const transcript = await stt.transcribe(audioData, { language: 'en' }, (token) => {
  console.log('Decoded token:', token);
});

```

To abort an in-flight transcription prematurely, call [`transcribeStop()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribestop):

```typescript
// Cancels active transcribe() execution and rejects the pending promise
stt.transcribeStop?.();

```

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background services, offline audio processors, or non-React component logic, instantiate the pipeline imperatively using [`createWhisperSpeechToText`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createWhisperSpeechToText):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For synchronous worklet execution contexts or frame-by-frame audio processors, [`createWhisperSpeechToText`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createWhisperSpeechToText) exposes a synchronous [`transcribeWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribeworklet) function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const transcript = stt.transcribeWorklet(audioData, { language: 'en' });

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use Whisper models from the [Software Mansion HuggingFace Whisper Collection](https://huggingface.co/collections/software-mansion/whisper), available in [`models.speechToText`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotext):

| Model Family      | Variants                                                                                                                                                                                                                                                          | Size Range         | Supported Backends                                            | Languages                                                                                                                                          | Notes                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Whisper Tiny**  | [`Multilingual`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotextwhispertiny), [`English`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotextwhisperentiny)   | 57.1 MB – 221.8 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | English / [`WHISPER_LANGUAGES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/WHISPER_LANGUAGES) (99+ languages) | Ultra-fast transcription with minimal RAM usage.                |
| **Whisper Base**  | [`Multilingual`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotextwhisperbase), [`English`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotextwhisperenbase)   | 97.8 MB – 380.2 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | English / [`WHISPER_LANGUAGES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/WHISPER_LANGUAGES) (99+ languages) | Balanced accuracy and speed for general voice dictation.        |
| **Whisper Small** | [`Multilingual`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotextwhispersmall), [`English`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotextwhisperensmall) | 276.0 MB – 1.05 GB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | English / [`WHISPER_LANGUAGES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/WHISPER_LANGUAGES) (99+ languages) | High-capacity model for complex, noisy, or multi-speaker audio. |

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useSpeechToText()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText) — React hook for Whisper model loading, downloading, and live transcription state.
* [`createWhisperSpeechToText()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createWhisperSpeechToText) — Imperative factory for Whisper Speech-to-Text pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`WhisperSpeechToText`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText) — Whisper runner interface ([`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribe), [`transcribeWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribeworklet), [`transcribeStop`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#transcribestop), [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#stream), [`streamInsert`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#streaminsert), [`streamStop`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSpeechToText#streamstop), `dispose`).
* [`WhisperSttModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSttModel) — Whisper model spec including model path, tokenizer path, and bundled VAD model.
* [`WhisperSttOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperSttOptions) — Per-call transcription options (`language`).
* [`WhisperStreamOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperStreamOptions) — Live microphone streaming options (`language`, `vadOptions`).
* [`WhisperLanguage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/WhisperLanguage) — Union of supported Whisper language codes.

### Constants & Model Presets[​](#constants--model-presets "Direct link to Constants & Model Presets")

* [`WHISPER_SAMPLE_RATE_HZ`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/WHISPER_SAMPLE_RATE_HZ) — Target audio sample rate expected by Whisper models (16000 Hz).
* [`WHISPER_LANGUAGES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/WHISPER_LANGUAGES) — Array of 99+ supported language codes.
* [`models.speechToText`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#speechtotext) — Pre-configured Whisper models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/speech/tasks/whisperSpeechToText.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts)
