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

## Reference

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

**`model`** (`KokoroConfig`) - Object specifying the source files for the Kokoro TTS model (duration predictor, synthesizer).

**`voice`** (`VoiceConfig`) - Object specifying the voice data and phonemizer assets (tagger and lexicon).

**`preventLoad?`** - Boolean that can prevent automatic model loading after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field              | Type                                                      | Description                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forward`          | `(text: string, speed?: number) => Promise<Float32Array>` | Synthesizes a full text into speech. Returns a promise resolving to the full audio waveform as a `Float32Array`.                                                                     |
| `stream`           | `(input: TextToSpeechStreamingInput) => Promise<void>`    | Starts a streaming synthesis session. Takes a text input and callbacks to handle audio chunks as they are generated. Ideal for reducing the "time to first audio" for long sentences |
| `delete`           | `() => void`                                              | Unloads the model from memory.                                                                                                                                                       |
| `error`            | `string \| null`                                          | Contains the error message if the model failed to load or synthesis failed.                                                                                                          |
| `isGenerating`     | `boolean`                                                 | Indicates whether the model is currently processing a synthesis.                                                                                                                     |
| `isReady`          | `boolean`                                                 | Indicates whether the model has successfully loaded and is ready for synthesis.                                                                                                      |
| `downloadProgress` | `number`                                                  | Tracks the progress of the model and voice assets download process.                                                                                                                  |

<details>
<summary>Type definitions</summary>

```typescript
interface TextToSpeechStreamingInput {
  text: string;
  speed?: number;
  onBegin?: () => void | Promise<void>;
  onNext?: (chunk: Float32Array) => Promise<void> | void;
  onEnd?: () => Promise<void> | void;
}

interface KokoroConfig {
  durationSource: ResourceSource;
  synthesizerSource: ResourceSource;
}

interface VoiceConfig {
  voiceSource: ResourceSource;
  extra: {
    taggerSource: ResourceSource;
    lexiconSource: ResourceSource;
  };
}
```

</details>

## Running the model

The module provides two ways to generate speech:

1.  **`forward(text, speed)`**: Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.

:::note
Since it processes the entire text at once, it might take a significant amount of time to produce an audio for long text inputs.
:::

2.  **`stream({ text, speed })`**: An async generator that yields chunks of audio as they are computed.
    This is ideal for reducing the "time to first audio" for long sentences.

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

## Supported models

| Model                                               | Language |
| --------------------------------------------------- | :------: |
| [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) | English  |

## Benchmarks

### Model size

| Model         | XNNPACK [MB] |
| ------------- | :----------: |
| KOKORO_SMALL  |    329.6     |
| KOKORO_MEDIUM |    334.4     |

### Memory usage

| Model         | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------- | :--------------------: | :----------------: |
| KOKORO_SMALL  |          820           |        820         |
| KOKORO_MEDIUM |          1140          |        1100        |

:::info
The reported memory usage values include the memory footprint of the Phonemis package, which is used for phonemizing input text. Currently, this can range from 100 to 150 MB depending on the device.
:::
