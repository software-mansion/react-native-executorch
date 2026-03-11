---
title: TextToSpeechModule
---

TypeScript API implementation of the [useTextToSpeech](../../03-hooks/01-natural-language-processing/useTextToSpeech.md) hook.

## API Reference

- For detailed API Reference for `TextToSpeechModule` see: [`TextToSpeechModule` API Reference](../../06-api-reference/classes/TextToSpeechModule.md).
- For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](../../06-api-reference/index.md#models---text-to-speech).
- For all supported voices in `TextToSpeechModule` please refer to: [Supported Voices](../../06-api-reference/index.md#tts-supported-voices)

## High Level Overview

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';

const model = new TextToSpeechModule();
await model.load(
  {
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AF_HEART,
  },
  (progress) => {
    console.log(progress);
  }
);

await model.forward(text, 1.0);
```

### Methods

All methods of `TextToSpeechModule` are explained in details here: [`TextToSpeechModule` API Reference](../../06-api-reference/classes/TextToSpeechModule.md)

## Loading the model

To initialize the module, create an instance and call the [`load`](../../06-api-reference/classes/TextToSpeechModule.md#load) method with the following parameters:

- [`config`](../../06-api-reference/classes/TextToSpeechModule.md#config) - Object containing:
  - [`model`](../../06-api-reference/interfaces/TextToSpeechConfig.md#model) - Model configuration.
  - [`voice`](../../06-api-reference/interfaces/TextToSpeechConfig.md#voice) - Voice configuration.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/TextToSpeechModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise that resolves once the assets are downloaded and loaded into memory.

For more information on resource sources, see [loading models](../../01-fundamentals/02-loading-models.md).

## Running the model

The module provides two ways to generate speech using either raw text or pre-generated phonemes:

### Using Text

1.  [**`forward(text, speed)`**](../../06-api-reference/classes/TextToSpeechModule.md#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.
2.  [**`stream({ speed, stopAutomatically, onNext, ... })`**](../../06-api-reference/classes/TextToSpeechModule.md#stream): An async generator that yields chunks of audio as they are computed. This is ideal for reducing the "time to first audio" for long sentences. In contrast to `forward`, it enables inserting text chunks dynamically into processing buffer with [**`streamInsert(text)`**](../../06-api-reference/classes/TextToSpeechModule.md#streaminsert) and allows stopping generation early with [**`streamStop(instant)`**](../../06-api-reference/classes/TextToSpeechModule.md#streamstop).

### Using Phonemes

If you have pre-computed phonemes (e.g., from an external dictionary or a custom G2P model), you can skip the internal phoneme generation step:

1.  [**`forwardFromPhonemes(phonemes, speed)`**](../../06-api-reference/classes/TextToSpeechModule.md#forwardfromphonemes): Generates the complete audio waveform from a phoneme string.
2.  [**`streamFromPhonemes({ phonemes, speed, onNext, ... })`**](../../06-api-reference/classes/TextToSpeechModule.md#streamfromphonemes): Streams audio chunks generated from a phoneme string.

:::note
Since `forward` and `forwardFromPhonemes` process the entire input at once, they might take a significant amount of time to produce audio for long inputs.
:::

## Example

### Speech Synthesis

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = new TextToSpeechModule();
const audioContext = new AudioContext({ sampleRate: 24000 });

try {
  await tts.load({
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const waveform = await tts.forward('Hello from ExecuTorch!', 1.0);

  // Create audio buffer and play
  const audioBuffer = audioContext.createBuffer(1, waveform.length, 24000);
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
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = new TextToSpeechModule();
const audioContext = new AudioContext({ sampleRate: 24000 });

await tts.load({ model: KOKORO_MEDIUM, voice: KOKORO_VOICE_AF_HEART });

try {
  for await (const chunk of tts.stream({
    text: 'This is a streaming test, with a sample input.',
    speed: 1.0,
  })) {
    // Play each chunk sequentially
    await new Promise<void>((resolve) => {
      const audioBuffer = audioContext.createBuffer(1, chunk.length, 24000);
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

### Synthesis from Phonemes

If you already have a phoneme string (e.g., from an external library), you can use `forwardFromPhonemes` or `streamFromPhonemes` to synthesize audio directly, skipping the internal phonemizer stage.

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';

const tts = new TextToSpeechModule();

await tts.load({
  model: KOKORO_MEDIUM,
  voice: KOKORO_VOICE_AF_HEART,
});

// Example phonemes for "ExecuTorch"
const waveform = await tts.forwardFromPhonemes('həlˈO wˈɜɹld!', 1.0);

// Or stream from phonemes
for await (const chunk of tts.streamFromPhonemes({
  phonemes:
    'ɐ mˈæn hˌu dˈʌzᵊnt tɹˈʌst hɪmsˈɛlf, kæn nˈɛvəɹ ɹˈiᵊli tɹˈʌst ˈɛniwˌʌn ˈɛls.',
  speed: 1.0,
})) {
  // ... process chunk ...
}
```
