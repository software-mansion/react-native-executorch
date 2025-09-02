---
title: SpeechToTextModule
---

TypeScript API implementation of the [useSpeechToText](../../02-hooks/01-natural-language-processing/useSpeechToText.md) hook.

## Reference

```typescript
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';

const model = new SpeechToTextModule();
await model.load(WHISPER_TINY_EN, (progress) => {
  console.log(progress);
});

await model.transcribe(waveform);
```

### Methods

| Method         | Type                                                                                                       | Description                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`         | `(model: SpeechToTextModelConfig, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model specified by the config object. `onDownloadProgressCallback` allows you to monitor the current progress of the model download.                               |
| `encode`       | `(waveform: Float32Array): Promise<void>`                                                                  | Runs the encoding part of the model on the provided waveform. Stores the result internally.                                                                                  |
| `decode`       | `(tokens: number[]): Promise<Float32Array>`                                                                | Runs the decoder of the model. Returns the decoded waveform as a Float32Array.                                                                                               |
| `transcribe`   | `(waveform: number[], options?: DecodingOptions): Promise<string>`                                         | Starts a transcription process for a given input array (16kHz waveform). For multilingual models, specify the language in `options`. Returns the transcription as a string.  |
| `stream`       | `(options?: DecodingOptions): AsyncGenerator<{ committed: string; nonCommitted: string }>`                 | Starts a streaming transcription session. Yields objects with `committed` and `nonCommitted` transcriptions. Use with `streamInsert` and `streamStop` to control the stream. |
| `streamStop`   | `(): Promise<void>`                                                                                        | Stops the current streaming transcription session.                                                                                                                           |
| `streamInsert` | `(waveform: number[]): Promise<void>`                                                                      | Inserts a new audio chunk into the streaming transcription session.                                                                                                          |

:::info

- `committed` contains the latest part of the transcription that is finalized and will not change. To obtain the full transcription during streaming, concatenate all the `committed` values yielded over time. Useful for displaying stable results during streaming.
- `nonCommitted` contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.
  :::

<details>
<summary>Type definitions</summary>

```typescript
// Languages supported by whisper (Multilingual)
type SpeechToTextLanguage =
  | 'af'
  | 'sq'
  | 'ar'
  | 'hy'
  | 'az'
  | 'eu'
  | 'be'
  | 'bn'
  | 'bs'
  | 'bg'
  | 'my'
  | 'ca'
  | 'zh'
  | 'hr'
  | 'cs'
  | 'da'
  | 'nl'
  | 'et'
  | 'en'
  | 'fi'
  | 'fr'
  | 'gl'
  | 'ka'
  | 'de'
  | 'el'
  | 'gu'
  | 'ht'
  | 'he'
  | 'hi'
  | 'hu'
  | 'is'
  | 'id'
  | 'it'
  | 'ja'
  | 'kn'
  | 'kk'
  | 'km'
  | 'ko'
  | 'lo'
  | 'lv'
  | 'lt'
  | 'mk'
  | 'mg'
  | 'ms'
  | 'ml'
  | 'mt'
  | 'mr'
  | 'ne'
  | 'no'
  | 'fa'
  | 'pl'
  | 'pt'
  | 'pa'
  | 'ro'
  | 'ru'
  | 'sr'
  | 'si'
  | 'sk'
  | 'sl'
  | 'es'
  | 'su'
  | 'sw'
  | 'sv'
  | 'tl'
  | 'tg'
  | 'ta'
  | 'te'
  | 'th'
  | 'tr'
  | 'uk'
  | 'ur'
  | 'uz'
  | 'vi'
  | 'cy'
  | 'yi';

interface DecodingOptions {
  language?: SpeechToTextLanguage;
}

interface SpeechToTextModelConfig {
  isMultilingual: boolean;
  encoderSource: ResourceSource;
  decoderSource: ResourceSource;
  tokenizerSource: ResourceSource;
}
```

</details>

## Loading the model

Create an instance of SpeechToTextModule and use the `load` method. It accepts an object with the following fields:

**`model`** - Object containing:

- **`isMultilingual`** - A boolean flag indicating whether the model supports multiple languages.

- **`encoderSource`** - A string that specifies the location of a `.pte` file for the encoder.

- **`decoderSource`** - A string that specifies the location of a `.pte` file for the decoder.

- **`tokenizerSource`** - A string that specifies the location to the tokenizer for the model.

**`onDownloadProgressCallback`** - (Optional) Function that will be called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the `transcribe` method. It accepts one argument, which is an array of numbers representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

### Multilingual transcription

If you aim to obtain a transcription in other languages than English, use the multilingual version of whisper. To obtain the output text in your desired language, pass the `DecodingOptions` object with the `language` field set to your desired language code.

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
const audioArray = Array.from(audioBuffer);

// Transcribe the audio
try {
  const transcription = await model.transcribe(audioArray);
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
recorder.onAudioReady(async ({ buffer }) => {
  const bufferArray = Array.from(buffer.getChannelData(0));
  // Insert the audio into the streaming transcription
  await model.streamInsert(bufferArray);
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
await model.streamStop();
recorder.stop();
```
