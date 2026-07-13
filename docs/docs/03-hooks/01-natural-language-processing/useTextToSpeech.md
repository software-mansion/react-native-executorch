---
title: useTextToSpeech
keywords: [
    text to speech
    tts,
    voice synthesizer,
    transcription,
    kokoro,
    supertonic,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Learn how to use text-to-speech models in your React Native applications with React Native ExecuTorch's useTextToSpeech hook."
---

Text to speech is a task that allows to transform written text into spoken language. It is commonly used to implement features such as voice assistants, accessibility tools, or audiobooks.

:::info
It is recommended to use models provided by us, which are available at our Hugging Face repositories:
[Kokoro](https://huggingface.co/software-mansion/react-native-executorch-kokoro) and
[Supertonic 3](https://huggingface.co/software-mansion/react-native-executorch-supertonic).
You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useTextToSpeech` see: [`useTextToSpeech` API Reference](../../06-api-reference/functions/useTextToSpeech.md).
- For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](../../06-api-reference/index.md#models---text-to-speech).
- For all supported voices in `useTextToSpeech` please refer to: [Supported Voices](../../06-api-reference/index.md#tts-supported-voices)

## High Level Overview

You can play the generated waveform in any way most suitable to you; however, in the snippet below we utilize the react-native-audio-api library to play synthesized speech.

### Supertonic 3

```typescript
import { models, useTextToSpeech } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const model = useTextToSpeech(models.text_to_speech.supertonic.m1());

const audioContext = new AudioContext({ sampleRate: 44100 });

const handleSpeech = async (text: string) => {
  const waveform = await model.forward({
    text,
    totalSteps: 8,
    lang: 'en',
  });

  const audioBuffer = audioContext.createBuffer(1, waveform.length, 44100);
  audioBuffer.getChannelData(0).set(waveform);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};
```

### Kokoro

```typescript
import { models, useTextToSpeech } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const model = useTextToSpeech(models.text_to_speech.kokoro.en_us.heart());

const audioContext = new AudioContext({ sampleRate: 24000 });

const handleSpeech = async (text: string) => {
  const speed = 1.0;
  const waveform = await model.forward({ text, speed });

  const audioBuffer = audioContext.createBuffer(1, waveform.length, 24000);
  audioBuffer.getChannelData(0).set(waveform);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};
```

### Arguments

`useTextToSpeech` takes [`TextToSpeechModelConfig`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md) that consists of:

- `model` of type [`TextToSpeechModelSources`](../../06-api-reference/type-aliases/TextToSpeechModelSources.md) — model configuration.
- [`voiceSource`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#voicesource) of type [`ResourceSource`](../../06-api-reference/type-aliases/ResourceSource.md) — the voice tensor used for synthesis.
- [`phonemizerConfig`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#phonemizerconfig) of type [`TextToSpeechPhonemizerConfig`](../../06-api-reference/interfaces/TextToSpeechPhonemizerConfig.md) — Kokoro only: phonemizer configuration. Unused by Supertonic.
- [`lang`](../../06-api-reference/interfaces/TextToSpeechModelConfig.md#lang) of type [`TextToSpeechSupertonicLanguage`](../../06-api-reference/type-aliases/TextToSpeechSupertonicLanguage.md) — Supertonic only: default language token (e.g. `'en'`, `'na'`). Unused by Kokoro.

`useTextToSpeech`'s second optional argument is an object with:

- `preventLoad` which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useTextToSpeech` arguments check this section: [`useTextToSpeech` arguments](../../06-api-reference/functions/useTextToSpeech.md#parameters).
- For all text to speech models available out-of-the-box in React Native ExecuTorch see: [Text to Speech Models](../../06-api-reference/index.md#models---text-to-speech).
- For all supported voices in `useTextToSpeech` please refer to: [Supported Voices](../../06-api-reference/index.md#tts-supported-voices)
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useTextToSpeech` returns an object called `TextToSpeechType` containing bunch of functions to interact with TTS. To get more details please read: [`TextToSpeechType` API Reference](../../06-api-reference/interfaces/TextToSpeechType.md).

## Running the model

The module provides two ways to generate speech. The available parameters differ by model family:

| Parameter    | Kokoro | Supertonic |
| ------------ | ------ | ---------- |
| `speed`      | ✓      |            |
| `phonemize`  | ✓      |            |
| `totalSteps` |        | ✓          |
| `lang`       |        | ✓          |

### Using Text

1.  [**`forward({ text, speed, phonemize, totalSteps, lang })`**](../../06-api-reference/interfaces/TextToSpeechType.md#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.
2.  [**`stream({ speed, phonemize, totalSteps, lang, stopAutomatically, onNext, ... })`**](../../06-api-reference/interfaces/TextToSpeechType.md#stream): An async generator-like functionality (managed via callbacks like `onNext`) that yields chunks of audio as they are computed.
    This is ideal for reducing the "time to first audio" for long sentences. You can also dynamically insert text during the generation process using `streamInsert(text)`, force-partition trailing content without an end-of-sentence character via `streamFlush()`, and stop the stream with `streamStop(instant)`.

:::tip Recommendation
In most cases, the **`stream()`** method is recommended over `forward()`. It significantly reduces latency by allowing audio playback to begin as soon as the first chunk is synthesized, rather than waiting for the entire text to be processed.
:::

Both methods accept a `phonemize` parameter (defaults to `true`). This applies to **Kokoro only** — Supertonic maps text directly through a unicode indexer and does not use phonemization. When set to `true`, the input `text` is treated as raw text and converted to phonemes internally. When set to `false`, the input is expected to be a string of IPA phonemes.

### Using Phonemes (Kokoro only)

If you have pre-computed phonemes (e.g., from an external dictionary or a custom G2P model), you can skip the internal phoneme generation step:

1.  [**`forward({ text, phonemize: false, speed })`**](../../06-api-reference/interfaces/TextToSpeechType.md#forward): Generates the complete audio waveform from a phoneme string.
2.  [**`stream({ text, phonemize: false, speed, onNext, ... })`**](../../06-api-reference/interfaces/TextToSpeechType.md#stream): Streams audio chunks generated from a phoneme string.

:::note
Since `forward` and `stream` process the input, they might take a significant amount of time to produce audio for long inputs.
:::

## Example

### Raw Synthesis (forward)

```tsx
import React from 'react';
import { Button, View } from 'react-native';
import { models, useTextToSpeech } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

export default function App() {
  // Supertonic 3 — multilingual, any voice works for any language
  const tts = useTextToSpeech(models.text_to_speech.supertonic.m1());
  // Kokoro — language-specific voice bundle:
  // const tts = useTextToSpeech(models.text_to_speech.kokoro.en_us.heart());

  const generateAudio = async () => {
    const audioData = await tts.forward({
      text: 'Hello world! This is a sample text.',
      totalSteps: 8,
      lang: 'en',
      // Kokoro: text only (no totalSteps/lang):
      // text: 'Hello world! This is a sample text.',
    });

    // Playback — sample rate depends on the model
    const ctx = new AudioContext({ sampleRate: 44100 });
    // Kokoro: sampleRate: 24000
    const buffer = ctx.createBuffer(1, audioData.length, ctx.sampleRate);
    buffer.getChannelData(0).set(audioData);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Speak" onPress={generateAudio} disabled={!tts.isReady} />
    </View>
  );
}
```

### Streaming Synthesis

```tsx
import React, { useRef } from 'react';
import { Button, View } from 'react-native';
import { models, useTextToSpeech } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

export default function App() {
  // Supertonic 3
  const tts = useTextToSpeech(models.text_to_speech.supertonic.m1());

  const contextRef = useRef(new AudioContext({ sampleRate: 44100 }));

  const generateStream = async () => {
    const ctx = contextRef.current;

    await tts.stream({
      text: "This is a longer text, which is being streamed chunk by chunk. Let's see how it works!",
      totalSteps: 8,
      lang: 'en',
      onNext: async (chunk) => {
        return new Promise((resolve) => {
          const buffer = ctx.createBuffer(1, chunk.length, ctx.sampleRate);
          buffer.getChannelData(0).set(chunk);

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onEnded = () => resolve();
          source.start();
        });
      },
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Stream" onPress={generateStream} disabled={!tts.isReady} />
    </View>
  );
}
```

## Supported models

| Model                                                                                      |                                                                                                                                                     Language                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [Supertonic 3](https://huggingface.co/software-mansion/react-native-executorch-supertonic) | 31 languages + `na` (unknown) — Arabic, Bulgarian, Czech, Danish, Dutch, English, Finnish, French, German, Greek, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Malay, Norwegian, Polish, Portuguese, Romanian, Russian, Slovak, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Vietnamese |
| [Kokoro](https://huggingface.co/software-mansion/react-native-executorch-kokoro)           |                                                                                                                       English, French, German, Spanish, Portuguese, Italian, Polish, Hindi                                                                                                                       |
