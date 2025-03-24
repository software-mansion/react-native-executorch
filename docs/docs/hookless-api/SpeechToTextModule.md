---
title: SpeechToTextModule
sidebar_position: 6
---

Hookless implementation of the [useSpeechToText](../speech-to-text/useSpeechToText.md) hook.

## Reference

```typescript
import { useSpeechToText } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const loadAudio = async (url: string) => {
  const audioContext = new AudioContext({ sampleRate: 16e3 });
  const audioBuffer = await FileSystem.downloadAsync(
    url,
    FileSystem.documentDirectory + '_tmp_transcribe_audio.mp3'
  ).then(({ uri }) => {
    return audioContext.decodeAudioDataSource(uri);
  });
  return audioBuffer?.getChannelData(0);
};

const audioUrl = ...; // URL with audio to transcribe

// Loading the model
const onSequenceUpdate = (sequence) => {
    console.log(sequence);
};
await SpeechToTextModule.load('moonshine', onSequenceUpdate);

// Loading the audio and running the model
const waveform = await loadAudio(audioUrl);
const transcribedText = await SpeechToTextModule.transcribe(waveform);
```

### Methods

| Method               | Type                                                                                                                                                                                                                                                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `load`               | <code>(modelName: 'whisper' &#124 'moonshine, transcribeCallback?: (sequence: string) => void, modelDownloadProgressCalback?: (downloadProgress: number) => void, encoderSource?: ResourceSource, decoderSource?: ResourceSource, tokenizerSource?: ResourceSource)</code> | Loads the model specified with `modelName`, where `encoderSource`, `decoderSource`, `tokenizerSource` are strings specifying the location of the binaries for the models. `modelDownloadProgressCallback` allows you to monitor the current progress of the model download, while `transcribeCallback` is invoked with each generated token                                                                                                                                                                                                                                                                                    |
| `transcribe`         | `(waveform: number[]): Promise<string>`                                                                                                                                                                                                                                    | Starts a transcription process for a given input array, which should be a waveform at 16kHz. Resolves a promise with the output transcription when the model is finished.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `encode`             | `(waveform: number[]) => Promise<number[]>`                                                                                                                                                                                                                                | Runs the encoding part of the model. Returns a float array representing the output of the encoder.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `decode`             | `(tokens: number[], encodings?: number[]) => Promise<number[]>`                                                                                                                                                                                                            | Runs the decoder of the model. Returns a single token representing a next token in the output sequence. If `encodings` are provided then they are used for decoding process, if not then the cached encodings from most recent `encode` call are used. The cached option is much faster due to very large overhead for comunication between native and react layers.                                                                                                                                                                                                                                                           |
| `configureStreaming` | <code>(overlapSeconds?: number, windowSize?: number, streamingConfig?: 'fast' &#124; 'balanced' &#124; 'quality') => void</code>                                                                                                                                           | Configures options for the streaming algorithm: <ul><li>`overlapSeconds` determines how much adjecent audio chunks (increasing it slows down transcription, decreases probability of weird wording at the chunks intersection, setting it larger than 3 seconds generally is discouraged), </li><li>`windowSize` describes size of the audio chunks (increasing it speeds up the end to end transcription time, but increases latency for the first token to be returned),</li><li> `streamingConfig` predifened configs for `windowSize` and `overlapSeconds` values.</li></ul> Keep `windowSize + 2 * overlapSeconds <= 30`. |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number;
```

</details>

## Loading the model

To load the model, use the `load` method. The required argument is `modelName`, which serves as an identifier for which model to use. It also accepts accepts optional arguments such as `encoderSource`, `decoderSource`, `tokenizerSource` which are strings that specify the location of the binaries for the model. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `transcribe` method. It accepts one argument, which is an array of numbers representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

## Obtaining the input

You need to parse audio to waveform in 16kHz, you can do that in any way most suitable to you. In the snippet at the top of the page we provide an example using `react-native-audio-api`. Once you have the waveform simply pass it as the only argument to `transcribe` method.
