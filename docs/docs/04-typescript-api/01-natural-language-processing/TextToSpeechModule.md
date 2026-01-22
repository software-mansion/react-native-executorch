---
title: TextToSpeechModule
---

TypeScript API implementation of the [useTextToSpeech](../../03-hooks/01-natural-language-processing/useTextToSpeech.md) hook.

## Reference

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

| Method       | Type                                                                                                   | Description                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `load`       | `(config: TextToSpeechConfig, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model and voice assets specified by the config object. `onDownloadProgressCallback` allows you to monitor the current progress. |
| `delete`     | `(): void`                                                                                             | Unloads the model from memory.                                                                                                            |
| `forward`    | `(text: string, speed?: number): Promise<Float32Array>`                                                | Synthesizes the provided text into speech. Returns a promise that resolves to the full audio waveform as a `Float32Array`.                |
| `stream`     | `(input: TextToSpeechStreamingInput): AsyncGenerator<Float32Array>`                                    | Starts a streaming synthesis session. Yields audio chunks as they are generated.                                                          |
| `streamStop` | `(): void`                                                                                             | Stops the streaming process if there is any ongoing.                                                                                      |

<details>
<summary>Type definitions</summary>

```typescript
interface TextToSpeechConfig {
  model: KokoroConfig;
  voice: VoiceConfig;
}

interface TextToSpeechStreamingInput {
  text: string;
  speed?: number;
  onBegin?: () => void | Promise<void>;
  onNext?: (chunk: Float32Array) => Promise<void> | void;
  onEnd?: () => Promise<void> | void;
}
```

</details>

## Loading the model

To initialize the module, create an instance and call the `load` method with a configuration object. This method returns a promise that resolves once the assets are downloaded and loaded into memory.

**`config`** - Object containing:

- **`model`** (`KokoroConfig`): Specifies the source files for the Kokoro TTS model (duration predictor, synthesizer).
- **`voice`** (`VoiceConfig`): Specifies the voice data and additional phonemizer assets (tagger and lexicon). Each voice is associated with a concrete speech language.

**`onDownloadProgressCallback`** - (Optional) A callback function to track the download progress of the model and voice assets.

For more information on resource sources, see [loading models](../../01-fundamentals/02-loading-models.md).

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
