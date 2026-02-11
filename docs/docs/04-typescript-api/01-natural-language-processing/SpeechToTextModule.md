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

// Standard transcription (returns string)
const text = await model.transcribe(waveform);

// Transcription with timestamps (returns Word[])
const textWithTimestamps = await model.transcribe(waveform, {
  enableTimestamps: true,
});
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

### Timestamps & Transcription Stat Data

You can obtain word-level timestamps and other useful parameters from transcription ([`transcribe`](../../06-api-reference/classes/SpeechToTextModule.md#transcribe) and [`stream`](../../06-api-reference/classes/SpeechToTextModule.md#stream) methods) by setting `verbose: true` in the options. The result mimics the _verbose_json_ format from OpenAI Whisper API. For more information please read [`transcribe`](../../06-api-reference/classes/SpeechToTextModule.md#transcribe), [`stream`](../../06-api-reference/classes/SpeechToTextModule.md#stream), and [`TranscriptionResult`](../../06-api-reference/interfaces/TranscriptionResult.md) API References.

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
//       start: 0;
//       end: 5.4;
//       text: "Example text for";
//       words: [
//         {
//            word: "Example"
//            start: 0,
//            end: 1.4,
//         },
//         ...
//       ]
//       tokens: [1, 32, 45, ...]
//       temperature: 0.0
//       avgLogprob: -1.235
//       compressionRatio: 1.632
//       noSpeechProb: 0.04
//     },
//     ...
//   ]
// }
```

## Example

### Transcription

```tsx
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const transcribeAudio = async () => {
  // Initialize with the model config
  const model = new SpeechToTextModule();
  await model.load(WHISPER_TINY_EN, (progress) => {
    console.log(progress);
  });

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
