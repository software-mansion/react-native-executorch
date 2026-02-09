---
title: SpeechToTextModule
---

TypeScript API implementation of the [useSpeechToText](../../03-hooks/01-natural-language-processing/useSpeechToText.md) hook.

## API Reference

- For detailed API Reference for `SpeechToTextModule` see: [`SpeechToTextModule` API Reference](../../06-api-reference/classes/SpeechToTextModule.md).
- For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](../../06-api-reference/index.md#models---speech-to-text).

## High Level Overview

```typescript
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';

const model = new SpeechToTextModule();
await model.load(WHISPER_TINY_EN, (progress) => {
  console.log(progress);
});

await model.transcribe(waveform);
```

### Methods

All methods of `SpeechToTextModule` are explained in details here: [`SpeechToTextModule API Reference`](../../06-api-reference/classes/SpeechToTextModule.md)

:::info

- `committed` contains the latest part of the transcription that is finalized and will not change. To obtain the full transcription during streaming, concatenate all the `committed` values yielded over time. Useful for displaying stable results during streaming.
- `nonCommitted` contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.
  :::

## Loading the model

Create an instance of [`SpeechToTextModule`](../../06-api-reference/classes/SpeechToTextModule.md) and use the [`load`](../../06-api-reference/classes/SpeechToTextModule.md#load) method. It accepts an object with the following fields:

- [`model`](../../06-api-reference/classes/SpeechToTextModule.md#model) - Object containing:
  - [`isMultilingual`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#ismultilingual) - Flag indicating if model is multilingual.

  - [`encoderSource`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#encodersource) - The location of the used encoder.

  - [`decoderSource`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#decodersource) - The location of the used decoder.

  - [`tokenizerSource`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#tokenizersource) - The location of the used tokenizer.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/SpeechToTextModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`transcribe`](../../06-api-reference/classes/SpeechToTextModule.md#transcribe) method. It accepts one argument, which is an array of type `Float32Array` representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

### Multilingual transcription

If you aim to obtain a transcription in other languages than English, use the multilingual version of whisper. To obtain the output text in your desired language, pass the [`DecodingOptions`](../../06-api-reference/interfaces/DecodingOptions.md) object with the [`language`](../../06-api-reference/interfaces/DecodingOptions.md#language) field set to your desired language code.

```typescript
import { SpeechToTextModule, WHISPER_TINY } from 'react-native-executorch';

const model = new SpeechToTextModule();
await model.load(WHISPER_TINY, (progress) => {
  console.log(progress);
});

const transcription = await model.transcribe(spanishAudio, { language: 'es' });
```

## Example

### Transcription

```tsx
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

// Load the model
const model = new SpeechToTextModule();

// Download the audio file
const { uri } = await FileSystem.downloadAsync(
  'https://some-audio-url.com/file.mp3',
  FileSystem.cacheDirectory + 'audio_file'
);

// Decode the audio data
const audioContext = new AudioContext({ sampleRate: 16000 });
const decodedAudioData = await audioContext.decodeAudioDataSource(uri);
const audioBuffer = decodedAudioData.getChannelData(0);

// Transcribe the audio
try {
  const transcription = await model.transcribe(audioBuffer);
  console.log(transcription);
} catch (error) {
  console.error('Error during audio transcription', error);
}
```

### Streaming Transcription

```tsx
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

// Load the model
const model = new SpeechToTextModule();
await model.load(WHISPER_TINY_EN, (progress) => {
  console.log(progress);
});

// Configure audio session
AudioManager.setAudioSessionOptions({
  iosCategory: 'playAndRecord',
  iosMode: 'spokenAudio',
  iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
});
AudioManager.requestRecordingPermissions();

// Initialize audio recorder
const recorder = new AudioRecorder({
  sampleRate: 16000,
  bufferLengthInSamples: 1600,
});
recorder.onAudioReady(({ buffer }) => {
  // Insert the audio into the streaming transcription
  model.streamInsert(buffer.getChannelData(0));
});
recorder.start();

// Start streaming transcription
try {
  let transcription = '';
  for await (const { committed, nonCommitted } of model.stream()) {
    console.log('Streaming transcription:', { committed, nonCommitted });
    transcription += committed;
  }
  console.log('Final transcription:', transcription);
} catch (error) {
  console.error('Error during streaming transcription:', error);
}

// Stop streaming transcription
model.streamStop();
recorder.stop();
```
