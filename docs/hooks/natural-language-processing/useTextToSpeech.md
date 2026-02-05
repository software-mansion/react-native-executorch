# useTextToSpeech

Text to speech is a task that allows to transform written text into spoken language. It is commonly used to implement features such as voice assistants, accessibility tools, or audiobooks.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-kokoro). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useTextToSpeech` see: [`useTextToSpeech` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech).
* For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-to-speech).
* For all supported voices in `useTextToSpeech` please refer to: [Supported Voices](https://docs.swmansion.com/react-native-executorch/docs/api-reference#tts-supported-voices)

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Arguments[​](#arguments "Direct link to Arguments")

`useTextToSpeech` takes [`TextToSpeechProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechProps) that consists of:

* `model` of type [`KokoroConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/KokoroConfig) containing the [`durationPredictorSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/KokoroConfig#durationpredictorsource), [`synthesizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/KokoroConfig#synthesizersource), and [`type`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/KokoroConfig#type).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechProps#preventload) which prevents auto-loading of the model.
* [`voice`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechProps#preventload) of type [`VoiceConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/VoiceConfig) - configuration of specific voice used in TTS.

You need more details? Check the following resources:

* For detailed information about `useTextToSpeech` arguments check this section: [`useTextToSpeech` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech#parameters).
* For all text to speech models available out-of-the-box in React Native ExecuTorch see: [Text to Speech Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-to-speech).
* For all supported voices in `useTextToSpeech` please refer to: [Supported Voices](https://docs.swmansion.com/react-native-executorch/docs/api-reference#tts-supported-voices)
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useTextToSpeech` returns an object called `TextToSpeechType` containing bunch of functions to interact with TTS. To get more details please read: [`TextToSpeechType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechType).

## Running the model[​](#running-the-model "Direct link to Running the model")

The module provides two ways to generate speech:

1. [**`forward(text, speed)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechType#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Since it processes the entire text at once, it might take a significant amount of time to produce an audio for long text inputs.

2. [**`stream({ text, speed })`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechType#stream): An async generator that yields chunks of audio as they are computed. This is ideal for reducing the "time to first audio" for long sentences.

## Example[​](#example "Direct link to Example")

### Speech Synthesis[​](#speech-synthesis "Direct link to Speech Synthesis")

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

### Streaming Synthesis[​](#streaming-synthesis "Direct link to Streaming Synthesis")

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

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                            | Language |
| -------------------------------------------------------------------------------- | -------- |
| [Kokoro](https://huggingface.co/software-mansion/react-native-executorch-kokoro) | English  |
