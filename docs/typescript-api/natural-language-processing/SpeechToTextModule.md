# SpeechToTextModule

TypeScript API implementation of the [useSpeechToText](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useSpeechToText.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `SpeechToTextModule` see: [`SpeechToTextModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule).
* For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';

const model = new SpeechToTextModule();
await model.load(WHISPER_TINY_EN, (progress) => {
  console.log(progress);
});

await model.transcribe(waveform);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `SpeechToTextModule` are explained in details here: [`SpeechToTextModule API Reference`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule)

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

* `committed` contains the latest part of the transcription that is finalized and will not change. To obtain the full transcription during streaming, concatenate all the `committed` values yielded over time. Useful for displaying stable results during streaming.
* `nonCommitted` contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Create an instance of [`SpeechToTextModule`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule) and use the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#load) method. It accepts an object with the following fields:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#model) - Object containing:

  * [`isMultilingual`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#ismultilingual) - Flag indicating if model is multilingual.

  * [`encoderSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#encodersource) - The location of the used encoder.

  * [`decoderSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#decodersource) - The location of the used decoder.

  * [`tokenizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#tokenizersource) - The location of the used tokenizer.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#transcribe) method. It accepts one argument, which is an array of type `Float32Array` representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

### Multilingual transcription[​](#multilingual-transcription "Direct link to Multilingual transcription")

If you aim to obtain a transcription in other languages than English, use the multilingual version of whisper. To obtain the output text in your desired language, pass the [`DecodingOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions) object with the [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions#language) field set to your desired language code.

```typescript
import { SpeechToTextModule, WHISPER_TINY } from 'react-native-executorch';

const model = new SpeechToTextModule();
await model.load(WHISPER_TINY, (progress) => {
  console.log(progress);
});

const transcription = await model.transcribe(spanishAudio, { language: 'es' });

```

## Example[​](#example "Direct link to Example")

### Transcription[​](#transcription "Direct link to Transcription")

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

### Streaming Transcription[​](#streaming-transcription "Direct link to Streaming Transcription")

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
