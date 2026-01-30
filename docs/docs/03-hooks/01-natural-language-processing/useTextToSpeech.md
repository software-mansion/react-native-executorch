---
title: useTextToSpeech
keywords: [
    text to speech
    tts,
    voice synthesizer,
    transcription,
    kokoro,
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

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-kokoro). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useTextToSpeech` see: [`useTextToSpeech` API Reference](../../06-api-reference/functions/useTextToSpeech.md).
* For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](../../06-api-reference/index.md#models---text-to-speech).
* For all supported voices in `useTextToSpeech` please refere to: [Supported Voices](../../06-api-reference/index.md#tts-supported-voices)

## Reference

You can play the generated waveform in any way most suitable to you; however, in the snippet below we utilize the react-native-audio-api library to play synthesized speech.

```typescript
import {
  useTextToSpeech,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const model = useTextToSpeech({
  model: KOKORO_MEDIUM,
  voice: KOKORO_VOICE_AF_HEART,
});

const audioContext = new AudioContext({ sampleRate: 24000 });

const handleSpeech = async (text: string) => {
  const speed = 1.0;
  const waveform = await model.forward(text, speed);

  const audioBuffer = audioContext.createBuffer(1, waveform.length, 24000);
  audioBuffer.getChannelData(0).set(waveform);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};
```

### Arguments

`useTextToSpeech` takes [`TextToSpeechProps`](../../06-api-reference/interfaces/TextToSpeechProps.md) that consists of:
* `model` of type [`KokoroConfig`](../../06-api-reference/interfaces/KokoroConfig.md) containing the [`durationPredictorSource`](../../06-api-reference/interfaces/KokoroConfig.md#durationpredictorsource), [`synthesizerSource`](../../06-api-reference/interfaces/KokoroConfig.md#synthesizersource), and [`type`](../../06-api-reference/interfaces/KokoroConfig.md#type). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/TextToSpeechProps.md#preventload) which prevents auto-loading of the model.
* [`voice`](../../06-api-reference/interfaces/TextToSpeechProps.md#preventload) of type [`VoiceConfig`](../../06-api-reference/interfaces/VoiceConfig.md) - configuration of specific voice used in TTS.

You need more details? Check the following resources:
* For detailed information about `useTextToSpeech` arguments check this section: [`useTextToSpeech` arguments](../../06-api-reference/functions/useTextToSpeech.md#parameters).
* For all text to speech models available out-of-the-box in React Native ExecuTorch see: [Text to Speech Models](../../06-api-reference/index.md#models---text-to-speech).
* For all supported voices in `useTextToSpeech` please refere to: [Supported Voices](../../06-api-reference/index.md#tts-supported-voices)
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useTextToSpeech` returns an object called `TextToSpeechType` containing bunch of functions to interact with TTS. To get more details please read: [`TextToSpeechType` API Reference](../../06-api-reference/interfaces/TextToSpeechType.md).

## Running the model

The module provides two ways to generate speech:

1.  [**`forward(text, speed)`**](../../06-api-reference/interfaces/TextToSpeechType.md#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.

:::note
Since it processes the entire text at once, it might take a significant amount of time to produce an audio for long text inputs.
:::

2.  [**`stream({ text, speed })`**](../../06-api-reference/interfaces/TextToSpeechType.md#stream): An async generator that yields chunks of audio as they are computed.
    This is ideal for reducing the "time to first audio" for long sentences.

## Example

### Speech Synthesis

```tsx
import React from 'react';
import { Button, View } from 'react-native';
import {
  useTextToSpeech,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

export default function App() {
  const tts = useTextToSpeech({
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const generateAudio = async () => {
    const audioData = await tts.forward({
      text: 'Hello world! This is a sample text.',
    });

    // Playback example
    const ctx = new AudioContext({ sampleRate: 24000 });
    const buffer = ctx.createBuffer(1, audioData.length, 24000);
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
import {
  useTextToSpeech,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

export default function App() {
  const tts = useTextToSpeech({
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const contextRef = useRef(new AudioContext({ sampleRate: 24000 }));

  const generateStream = async () => {
    const ctx = contextRef.current;

    await tts.stream({
      text: "This is a longer text, which is being streamed chunk by chunk. Let's see how it works!",
      onNext: async (chunk) => {
        return new Promise((resolve) => {
          const buffer = ctx.createBuffer(1, chunk.length, 24000);
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

| Model                                                                            | Language |
| -------------------------------------------------------------------------------- | :------: |
| [Kokoro](https://huggingface.co/software-mansion/react-native-executorch-kokoro) | English  |
