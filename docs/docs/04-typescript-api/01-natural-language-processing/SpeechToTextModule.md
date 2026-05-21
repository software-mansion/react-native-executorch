---
title: SpeechToTextModule
---

The `SpeechToTextModule` class provides a direct interface to the library's speech-to-text (STT) capabilities. While [`useSpeechToText`](../../03-hooks/01-natural-language-processing/useSpeechToText.md) is the preferred way for React components, this module offers full control over the model's lifecycle and is suitable for non-React contexts or advanced use cases.

## API Reference

- [`SpeechToTextModule` API Reference](../../06-api-reference/classes/SpeechToTextModule.md)
- [STT Models List](../../06-api-reference/index.md#models---speech-to-text)

## High Level Overview

You can transcribe audio in two ways: **one-shot** (for files/short clips) and **streaming** (for live microphone input).

```typescript
import {
  SpeechToTextModule,
  WHISPER_TINY_EN,
  FSMN_VAD,
} from 'react-native-executorch';

// Initialize the model with VAD submodule
const model = await SpeechToTextModule.fromModelName(
  WHISPER_TINY_EN,
  FSMN_VAD, // Optional VAD submodule
  (progress) => {
    console.log(`Loading: ${progress * 100}%`);
  }
);

// 1. One-shot transcription (returns TranscriptionResult)
const result = await model.transcribe(waveform);
console.log(result.text);

// 2. Live streaming (yields partial/stable results)
model.streamInsert(audioChunk);
const stream = model.stream({ useVAD: true }); // Enable VAD logic
for await (const { committed, nonCommitted } of stream) {
  // Update UI live with stable and partial text
}
```

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/SpeechToTextModule.md#frommodelname) factory method. It accepts a configuration object with the following fields:

- [`isMultilingual`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#ismultilingual) - Flag indicating if model is multilingual.
- [`modelSource`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#modelsource) - The location of the used model (bundled encoder + decoder functionality).
- [`tokenizerSource`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#tokenizersource) - The location of the used tokenizer.

And an optional second argument:

- `onDownloadProgress` - Callback to track download progress (returns a value between 0 and 1).

For more information on resource management, see [loading models](../../01-fundamentals/02-loading-models.md).

## Transcription (Files & Short Clips)

To run transcription on a complete audio clip, use the [`transcribe`](../../06-api-reference/classes/SpeechToTextModule.md#transcribe) method. It accepts a `Float32Array` representing a waveform at **16kHz sampling rate**.

### Transcribe Options

The `transcribe()` function accepts an optional configuration object:

- `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
- `verbose`: If `true`, the method returns a detailed `TranscriptionResult` object following the OpenAI Whisper `verbose_json` format (including segments and word-level timestamps).

## Live Streaming Transcription

The **Streaming API** is optimized for live microphone input or real-time audio feeds. It handles audio inputs of arbitrary length by automatically managing context windows to bypass the standard 30-second limit.

### Streaming Options

The `stream()` function accepts several optional parameters:

- `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
- `verbose`: If `true`, includes word-level timestamps and segment metadata in the result objects.
- `timeout`: (Advanced) The interval (in milliseconds) between processing consecutive audio chunks. Lower values provide more frequent updates, while higher values reduce CPU consumption. Defaults to `100`.
- `useVAD`: Enable the Voice Activity Detection submodule (if configured during load) to improve performance by skipping silence.

:::info

- **`committed`**: Finalized transcription that is stable and will not change. Useful for building a persistent transcript record.
- **`nonCommitted`**: Partial transcription that is still being processed and may update as more context arrives. Useful for live UI updates.
  :::

### Live Example

In this example, we use [`react-native-audio-api`](https://docs.swmansion.com/react-native-audio-api/) to feed live audio into the model.

```tsx
import {
  SpeechToTextModule,
  WHISPER_TINY_EN,
  FSMN_VAD,
} from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

const model = await SpeechToTextModule.fromModelName(WHISPER_TINY_EN, FSMN_VAD);

// 1. Configure audio session & permissions
AudioManager.setAudioSessionOptions({
  iosCategory: 'playAndRecord',
  iosMode: 'spokenAudio',
  iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
});
await AudioManager.requestRecordingPermissions();

// 2. Setup Audio Recorder
const recorder = new AudioRecorder({
  sampleRate: 16000,
  channelCount: 1,
});

recorder.onAudioReady((chunk) => {
  // Feed chunks directly into the model's buffer
  model.streamInsert(chunk.buffer.getChannelData(0));
});

await recorder.start();

// 3. Process the Stream
try {
  let stableTranscript = '';
  const streamIter = model.stream({ useVAD: true });

  for await (const { committed, nonCommitted } of streamIter) {
    if (committed.text) stableTranscript += committed.text;

    // UI should display: stableTranscript + nonCommitted.text
    console.log('Live Transcript:', stableTranscript + nonCommitted.text);
  }
} catch (error) {
  console.error('Streaming error:', error);
}

// 4. Cleanup
model.streamStop();
recorder.stop();
```

## Advanced Features

### VAD Integration (Recommended for Live)

Integrating **Voice Activity Detection (VAD)** as a submodule improves streaming performance by automatically removing silence. This reduces CPU usage, saves battery, and prevents hallucinations during silent periods.

To use it, provide the VAD model configuration when loading the module and enable `useVAD` in the stream options:

```typescript
const model = await SpeechToTextModule.fromModelName(
  WHISPER_TINY_EN,
  FSMN_VAD // Optional VAD submodule
);

// Enable VAD logic in the stream context
const stream = model.stream({ useVAD: true });
```

### Multilingual Transcription

If you aim to obtain a transcription in languages other than English, use a multilingual Whisper model. To get the output in your desired language, pass the [`DecodingOptions`](../../06-api-reference/interfaces/DecodingOptions.md) object with the [`language`](../../06-api-reference/interfaces/DecodingOptions.md#language) field set to the target language code.

```typescript
const transcription = await model.transcribe(spanishAudio, { language: 'es' });
```

### Timestamps & Detailed Results

Set `verbose: true` in the options to obtain word-level timestamps and other parameters. The result mimics the _verbose_json_ format from OpenAI Whisper API.

```typescript
const result = await model.transcribe(audioBuffer, { verbose: true });
```

## Supported models

| Model                                                              |   Language   |
| ------------------------------------------------------------------ | :----------: |
| [whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en)   |   English    |
| [whisper-tiny](https://huggingface.co/openai/whisper-tiny)         | Multilingual |
| [whisper-base.en](https://huggingface.co/openai/whisper-base.en)   |   English    |
| [whisper-base](https://huggingface.co/openai/whisper-base)         | Multilingual |
| [whisper-small.en](https://huggingface.co/openai/whisper-small.en) |   English    |
| [whisper-small](https://huggingface.co/openai/whisper-small)       | Multilingual |
