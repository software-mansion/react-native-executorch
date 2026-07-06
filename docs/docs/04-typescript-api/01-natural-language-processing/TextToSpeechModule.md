---
title: TextToSpeechModule
---

TypeScript API implementation of the [useTextToSpeech](../../03-hooks/01-natural-language-processing/useTextToSpeech.md) hook.

## API Reference

- For detailed API Reference for `TextToSpeechModule` see: [`TextToSpeechModule` API Reference](../../06-api-reference/classes/TextToSpeechModule.md).
- For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](../../06-api-reference/index.md#models---text-to-speech).
- For all supported voices in `TextToSpeechModule` please refer to: [Supported Voices](../../06-api-reference/index.md#tts-supported-voices)

## High Level Overview

### Supertonic 3

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
const model = await TextToSpeechModule.fromModelName(
  models.text_to_speech.supertonic.m1(),
  (progress) => console.log(progress)
);

await model.forward('Hello world!', 1.0, true, 8, 'en');
```

### Kokoro

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
const model = await TextToSpeechModule.fromModelName(
  models.text_to_speech.kokoro.en_us.heart(),
  (progress) => console.log(progress)
);

await model.forward(text, 1.0);
```

### Methods

All methods of `TextToSpeechModule` are explained in details here: [`TextToSpeechModule` API Reference](../../06-api-reference/classes/TextToSpeechModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/TextToSpeechModule.md#frommodelname) factory method with the following parameters:

- [`config`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md) - Object containing:
  - [`model`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#model) - Model configuration.
  - [`voiceSource`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#voicesource) - Voice resource source.
  - [`phonemizerConfig`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#phonemizerconfig) - Phonemizer configuration. Kokoro only; unused by Supertonic.
  - [`lang`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#lang) - Default language token. Supertonic only; unused by Kokoro.

- [`onDownloadProgress`](../../06-api-reference/classes/TextToSpeechModule.md#frommodelname) - Optional callback to track download progress (value between 0 and 1).

This method returns a promise that resolves to a `TextToSpeechModule` instance once the assets are downloaded and loaded into memory.

For more information on resource sources, see [loading models](../../01-fundamentals/02-loading-models.md).

## Running the model

The module provides two ways to generate speech. The available parameters differ by model family:

| Parameter    | Kokoro | Supertonic |
| ------------ | ------ | ---------- |
| `speed`      | ✓      |            |
| `phonemize`  | ✓      |            |
| `totalSteps` |        | ✓          |
| `lang`       |        | ✓          |

### Methods

1.  [**`forward(text, speed, phonemize, totalSteps, lang)`**](../../06-api-reference/classes/TextToSpeechModule.md#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.
    - `phonemize` (Kokoro only) defaults to `true`. When set to `false`, the input is expected to be a string of IPA phonemes.
2.  [**`stream({ speed, phonemize, totalSteps, lang, stopAutomatically, ... })`**](../../06-api-reference/classes/TextToSpeechModule.md#stream): An async generator that yields chunks of audio as they are computed. This is ideal for reducing the "time to first audio" for long sentences. In contrast to `forward`, it enables inserting text chunks dynamically into the processing buffer with [**`streamInsert(text)`**](../../06-api-reference/classes/TextToSpeechModule.md#streaminsert), force-partitioning trailing un-terminated content via [**`streamFlush()`**](../../06-api-reference/classes/TextToSpeechModule.md#streamflush), and stopping generation early with [**`streamStop(instant)`**](../../06-api-reference/classes/TextToSpeechModule.md#streamstop).

### Using Phonemes (Kokoro only)

If you have pre-computed phonemes (e.g., from an external dictionary or a custom G2P model), you can skip the internal phoneme generation step by setting `phonemize: false` in the `forward` or `stream` methods.

:::note
Since `forward` processes the entire input at once, it might take a significant amount of time to produce audio for long inputs.
:::

## Example

### Raw Synthesis (forward)

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

// Supertonic 3 — multilingual, any voice works for any language
const tts = await TextToSpeechModule.fromModelName(
  models.text_to_speech.supertonic.m1(),
  (progress) => console.log(progress)
);
// Kokoro — language-specific voice bundle:
// const tts = await TextToSpeechModule.fromModelName(
//   models.text_to_speech.kokoro.en_us.heart(),
//   (progress) => console.log(progress)
// );

const audioContext = new AudioContext({ sampleRate: 44100 });
// Kokoro: sampleRate: 24000

try {
  const waveform = await tts.forward(
    'Hello from ExecuTorch!',
    1.0,
    true,
    8,
    'en'
  );
  // Kokoro: tts.forward('Hello from ExecuTorch!', 1.0)

  // Create audio buffer and play
  const audioBuffer = audioContext.createBuffer(
    1,
    waveform.length,
    audioContext.sampleRate
  );
  audioBuffer.getChannelData(0).set(waveform);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
} catch (error) {
  console.error('Text-to-speech failed:', error);
}
```

### Streaming Synthesis

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

// Supertonic 3
const tts = await TextToSpeechModule.fromModelName(
  models.text_to_speech.supertonic.m1(),
  (progress) => console.log(progress)
);
// Kokoro:
// const tts = await TextToSpeechModule.fromModelName(
//   models.text_to_speech.kokoro.en_us.heart(),
//   (progress) => console.log(progress)
// );

const audioContext = new AudioContext({ sampleRate: 44100 });
// Kokoro: sampleRate: 24000

try {
  for await (const chunk of tts.stream({
    text: 'This is a streaming test, with a sample input.',
    totalSteps: 8,
    lang: 'en',
    // Kokoro: use speed: 1.0 instead of totalSteps/lang
  })) {
    // Play each chunk sequentially
    await new Promise<void>((resolve) => {
      const audioBuffer = audioContext.createBuffer(
        1,
        chunk.length,
        audioContext.sampleRate
      );
      audioBuffer.getChannelData(0).set(chunk);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onEnded = () => resolve();
      source.start();
    });
  }
} catch (error) {
  console.error('Streaming failed:', error);
}
```
