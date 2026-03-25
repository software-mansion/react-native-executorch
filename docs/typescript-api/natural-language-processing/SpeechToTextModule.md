# SpeechToTextModule

TypeScript API implementation of the [useSpeechToText](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useSpeechToText.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `SpeechToTextModule` see: [`SpeechToTextModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule).
* For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';

const model = await SpeechToTextModule.fromModelName(
  WHISPER_TINY_EN,
  (progress) => {
    console.log(progress);
  }
);

// Standard transcription (returns string)
const text = await model.transcribe(waveform);

// Transcription with timestamps (returns Word[])
const textWithTimestamps = await model.transcribe(waveform, {
  enableTimestamps: true,
});

```

### Methods[​](#methods "Direct link to Methods")

All methods of `SpeechToTextModule` are explained in details here: [`SpeechToTextModule API Reference`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule)

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

* `committed` contains the latest part of the transcription that is finalized and will not change. To obtain the full transcription during streaming, concatenate all the `committed` values yielded over time. Useful for displaying stable results during streaming.
* `nonCommitted` contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#frommodelname) factory method. It accepts an object with the following fields:

* [`isMultilingual`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#ismultilingual) - Flag indicating if model is multilingual.
* [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#modelsource) - The location of the used model (bundled encoder + decoder functionality).
* [`tokenizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#tokenizersource) - The location of the used tokenizer.

And an optional second argument:

* `onDownloadProgress` - Callback to track download progress.

This method returns a promise resolving to a `SpeechToTextModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#transcribe) method. It accepts one argument, which is an array of type `Float32Array` representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

### Multilingual transcription[​](#multilingual-transcription "Direct link to Multilingual transcription")

If you aim to obtain a transcription in other languages than English, use the multilingual version of whisper. To obtain the output text in your desired language, pass the [`DecodingOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions) object with the [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions#language) field set to your desired language code.

```typescript
import { SpeechToTextModule, WHISPER_TINY } from 'react-native-executorch';

const model = await SpeechToTextModule.fromModelName(
  WHISPER_TINY,
  (progress) => {
    console.log(progress);
  }
);

const transcription = await model.transcribe(spanishAudio, { language: 'es' });

```

### Timestamps & Transcription Stat Data[​](#timestamps--transcription-stat-data "Direct link to Timestamps & Transcription Stat Data")

You can obtain word-level timestamps and other useful parameters from transcription ([`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#transcribe) and [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#stream) methods) by setting `verbose: true` in the options. The result mimics the *verbose\_json* format from OpenAI Whisper API. For more information please read [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#transcribe), [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#stream), and [`TranscriptionResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TranscriptionResult) API References.

```typescript
const transcription = await model.transcribe(audioBuffer, { verbose: true });
// Example result
//
// transcription: {
//   task: "transcription",
//   text: "Example text for a ...",
//   duration: 9.05,
//   language: "en",
//   segments: [
//     {
//       start: 0,
//       end: 5.4,
//       text: "Example text for",
//       words: [
//         {
//            word: "Example",
//            start: 0,
//            end: 1.4
//         },
//         ...
//       ]
//       tokens: [1, 32, 45, ...],
//       temperature: 0.0,
//       avgLogprob: -1.235,
//       compressionRatio: 1.632
//     },
//     ...
//   ]
// }

```

## Example[​](#example "Direct link to Example")

### Transcription[​](#transcription "Direct link to Transcription")

```tsx
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const transcribeAudio = async () => {
  // Initialize with the model config
  const model = await SpeechToTextModule.fromModelName(
    WHISPER_TINY_EN,
    (progress) => {
      console.log(progress);
    }
  );

  // Download the audio file
  const { uri } = await FileSystem.downloadAsync(
    'https://some-audio-url.com/file.mp3',
    FileSystem.cacheDirectory + 'audio_file'
  );

  // Decode the audio data (Correct as per your previous code)
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const decodedAudioData = await audioContext.decodeAudioData(uri);
  const audioBuffer = decodedAudioData.getChannelData(0);

  // Transcribe the audio
  try {
    // Option 1: Text only
    const resultText = await model.transcribe(audioBuffer);
    console.log('Text:', resultText.text); // .text is the standard property now

    // Option 2: With timestamps (Use 'verbose' instead of 'enableTimestamps')
    const resultVerbose = await model.transcribe(audioBuffer, {
      verbose: true,
    });

    console.log('Full Text:', resultVerbose.text);
    console.log('Segments:', resultVerbose.segments); // Contains start/end/more parameters
  } catch (error) {
    console.error('Error during audio transcription', error);
  }
};

```

### Streaming Transcription[​](#streaming-transcription "Direct link to Streaming Transcription")

```tsx
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

// Load the model
const model = await SpeechToTextModule.fromModelName(
  WHISPER_TINY_EN,
  (progress) => {
    console.log(progress);
  }
);

// Configure audio session
AudioManager.setAudioSessionOptions({
  iosCategory: 'playAndRecord',
  iosMode: 'spokenAudio',
  iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
});
await AudioManager.requestRecordingPermissions();

// Initialize audio recorder with FULL config in constructor
const recorder = new AudioRecorder({
  sampleRate: 16000,
  channelCount: 1,
  bitsPerSample: 16,
  bufferLengthInSamples: 16000, // e.g. 1 second buffer
});

// Pass ONLY the callback to onAudioReady
recorder.onAudioReady((chunk) => {
  // Insert the audio into the streaming transcription
  model.streamInsert(chunk.buffer.getChannelData(0));
});

await recorder.start();

// Start streaming transcription
try {
  let finalTranscription = '';

  // Use 'verbose' flag for timestamps/segments
  const streamIter = model.stream({ verbose: true });

  for await (const { committed, nonCommitted } of streamIter) {
    // Note: committed/nonCommitted are objects { text, segments } now
    console.log('Committed Text:', committed.text);
    console.log('Live Text:', nonCommitted.text);

    if (committed.text) {
      finalTranscription += committed.text;
    }
  }
  console.log('Final transcription:', finalTranscription);
} catch (error) {
  console.error('Error during streaming transcription:', error);
}

// Stop streaming transcription
model.streamStop();
recorder.stop();

```
