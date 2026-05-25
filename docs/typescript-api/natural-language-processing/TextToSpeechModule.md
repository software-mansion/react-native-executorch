# TextToSpeechModule

TypeScript API implementation of the [useTextToSpeech](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextToSpeech.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `TextToSpeechModule` see: [`TextToSpeechModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule).
* For all text to speech models available out-of-the-box in React Native ExecuTorch see: [TTS Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-to-speech).
* For all supported voices in `TextToSpeechModule` please refer to: [Supported Voices](https://docs.swmansion.com/react-native-executorch/docs/api-reference#tts-supported-voices)

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
const model = await TextToSpeechModule.fromModelName(
  models.text_to_speech.kokoro.en_us.heart(),
  (progress) => console.log(progress)
);

await model.forward(text, 1.0);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `TextToSpeechModule` are explained in details here: [`TextToSpeechModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#frommodelname) factory method with the following parameters:

* [`config`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechModelConfig) - Object containing:

  * [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechModelConfig#model) - Model configuration.
  * [`voiceSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechModelConfig#voicesource) - Voice resource source.
  * [`phonemizerConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextToSpeechModelConfig#phonemizerconfig) - Phonemizer configuration.

* [`onDownloadProgress`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#frommodelname) - Optional callback to track download progress (value between 0 and 1).

This method returns a promise that resolves to a `TextToSpeechModule` instance once the assets are downloaded and loaded into memory.

For more information on resource sources, see [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md).

## Running the model[​](#running-the-model "Direct link to Running the model")

The module provides a way to generate speech using either raw text or pre-generated phonemes.

### Methods[​](#methods-1 "Direct link to Methods")

1. [**`forward(text, speed, phonemize)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#forward): Generates the complete audio waveform at once. Returns a promise resolving to a `Float32Array`.
   <!-- -->
   * `phonemize` defaults to `true`. When set to `false`, the input is expected to be a string of IPA phonemes.
2. [**`stream({ speed, phonemize, stopAutomatically, ... })`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#stream): An async generator that yields chunks of audio as they are computed. This is ideal for reducing the "time to first audio" for long sentences. In contrast to `forward`, it enables inserting text chunks dynamically into processing buffer with [**`streamInsert(text)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#streaminsert) and allows stopping generation early with [**`streamStop(instant)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToSpeechModule#streamstop).

### Using Phonemes[​](#using-phonemes "Direct link to Using Phonemes")

If you have pre-computed phonemes (e.g., from an external dictionary or a custom G2P model), you can skip the internal phoneme generation step by setting `phonemize: false` in the `forward` or `stream` methods.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Since `forward` processes the entire input at once, it might take a significant amount of time to produce audio for long inputs.

## Example[​](#example "Direct link to Example")

### Speech Synthesis[​](#speech-synthesis "Direct link to Speech Synthesis")

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = await TextToSpeechModule.fromModelName(
  models.text_to_speech.kokoro.en_us.heart()
);
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
import { models, TextToSpeechModule } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = await TextToSpeechModule.fromModelName(
  models.text_to_speech.kokoro.en_us.heart()
);
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

If you already have a phoneme string (e.g., from an external library), you can use `forward` or `stream` with the `phonemize: false` flag to synthesize audio directly, skipping the internal phonemizer stage.

```typescript
import { models, TextToSpeechModule } from 'react-native-executorch';
const tts = await TextToSpeechModule.fromModelName(
  models.text_to_speech.kokoro.en_us.heart()
);

// Example phonemes for "ExecuTorch"
const waveform = await tts.forward('həlˈO wˈɜɹld!', 1.0, false);

// Or stream from phonemes
for await (const chunk of tts.stream({
  text: 'ɐ mˈæn hˌu dˈʌzᵊnt tɹˈʌst hɪmsˈɛlf, kæn nˈɛvəɹ ɹˈiᵊli tɹˈʌst ˈɛniwˌʌn ˈɛls.',
  speed: 1.0,
  phonemize: false,
})) {
  // ... process chunk ...
}

```
