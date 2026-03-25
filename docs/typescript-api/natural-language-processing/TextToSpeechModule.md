# TextToSpeechModule

TypeScript API implementation of the [useTextToSpeech](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextToSpeech.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `TextToSpeechModule` see: [`TextToSpeechModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule).
* For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-to-speech).
* For all supported voices in `TextToSpeechModule` please refer to: [Supported Voices](https://docs.swmansion.com/react-native-executorch/docs/api-reference#tts-supported-voices)

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';

const model = await TextToSpeechModule.fromModelName(
  { model: KOKORO_MEDIUM, voice: KOKORO_VOICE_AF_HEART },
  (progress) => console.log(progress)
);

await model.forward(text, 1.0);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `TextToSpeechModule` are explained in details here: [`TextToSpeechModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#frommodelname) factory method with the following parameters:

* [`config`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechConfig) - Object containing:

  * [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechConfig#model) - Model configuration (e.g. `KOKORO_MEDIUM`).
  * [`voice`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechConfig#voice) - Voice configuration (e.g. `KOKORO_VOICE_AF_HEART`).

* [`onDownloadProgress`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#frommodelname) - Optional callback to track download progress (value between 0 and 1).

This method returns a promise that resolves to a `TextToSpeechModule` instance once the assets are downloaded and loaded into memory.

For more information on resource sources, see [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md).

## Running the model[​](#running-the-model "Direct link to Running the model")

The module provides two ways to generate speech using either raw text or pre-generated phonemes:

### Using Text[​](#using-text "Direct link to Using Text")

1. [**`forward(text, speed)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.
2. [**`stream({ speed, stopAutomatically, onNext, ... })`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#stream): An async generator that yields chunks of audio as they are computed. This is ideal for reducing the "time to first audio" for long sentences. In contrast to `forward`, it enables inserting text chunks dynamically into processing buffer with [**`streamInsert(text)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#streaminsert) and allows stopping generation early with [**`streamStop(instant)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#streamstop).

### Using Phonemes[​](#using-phonemes "Direct link to Using Phonemes")

If you have pre-computed phonemes (e.g., from an external dictionary or a custom G2P model), you can skip the internal phoneme generation step:

1. [**`forwardFromPhonemes(phonemes, speed)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#forwardfromphonemes): Generates the complete audio waveform from a phoneme string.
2. [**`streamFromPhonemes({ phonemes, speed, onNext, ... })`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#streamfromphonemes): Streams audio chunks generated from a phoneme string.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Since `forward` and `forwardFromPhonemes` process the entire input at once, they might take a significant amount of time to produce audio for long inputs.

## Example[​](#example "Direct link to Example")

### Speech Synthesis[​](#speech-synthesis "Direct link to Speech Synthesis")

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = await TextToSpeechModule.fromModelName({
  model: KOKORO_MEDIUM,
  voice: KOKORO_VOICE_AF_HEART,
});
const audioContext = new AudioContext({ sampleRate: 24000 });

try {
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

### Streaming Synthesis[​](#streaming-synthesis "Direct link to Streaming Synthesis")

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = await TextToSpeechModule.fromModelName({
  model: KOKORO_MEDIUM,
  voice: KOKORO_VOICE_AF_HEART,
});
const audioContext = new AudioContext({ sampleRate: 24000 });

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

### Synthesis from Phonemes[​](#synthesis-from-phonemes "Direct link to Synthesis from Phonemes")

If you already have a phoneme string (e.g., from an external library), you can use `forwardFromPhonemes` or `streamFromPhonemes` to synthesize audio directly, skipping the internal phonemizer stage.

```typescript
import {
  TextToSpeechModule,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';

const tts = await TextToSpeechModule.fromModelName({
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
