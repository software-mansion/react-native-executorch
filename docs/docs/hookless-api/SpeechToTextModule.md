---
title: SpeechToTextModule
sidebar_position: 6
---

Hookless implementation of the [useSpeechToText](../speech-to-text/) hook.

## Reference

```typescript
import { SpeechToTextModule } from 'react-native-executorch';

const audioUrl = 'https://www.your-url.com/cool-music.mp3';

// Loading the model
const onSequenceUpdate = (sequence) => {
    console.log(sequence);
};
await SpeechToTextModule.load('moonshine', onSequenceUpdate);

// Loading the audio and running the model
await SpeechToTextModule.loadAudio(audioUrl);
const transcribedText = await SpeechToTextModule.transcribe();
```

### Methods

| Method       | Type                                                                                                                                                                                                                                                                       | Description                                                                                                                                                                                                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`       | <code>(modelName: 'whisper' &#124 'moonshine, transcribeCallback?: (sequence: string) => void, modelDownloadProgressCalback?: (downloadProgress: number) => void, encoderSource?: ResourceSource, decoderSource?: ResourceSource, tokenizerSource?: ResourceSource)</code> | Loads the model specified with `modelName`, where `encoderSource`, `decoderSource`, `tokenizerSource` are strings specifying the location of the binaries for the models. `modelDownloadProgressCallback` allows you to monitor the current progress of the model download, while `transcribeCallback` is invoked with each generated token |
| `transcribe` | `(waveform: number[]): Promise<string>`                                                                                                                                                                                                                                    | Starts a transcription process for a given input array, which should be a waveform at 16kHz. When no input is provided, it uses an internal state which is set by calling `loadAudio`. Resolves a promise with the output transcription when the model is finished.                                                                       |
| `loadAudio`  | `(url: string) => void`                                                                                                                                                                                                                                                    | Loads audio file from given url. It sets an internal state which serves as an input to `transcribe()`.                                                                                                                                                                                                                                    |

## Loading the model

To load the model, use the `load` method. It accepts the `encoderSource`, `decoderSource`, `tokenizerSource` which are strings that specify the location of the binaries for the model. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `transcribe` method. It accepts one argument, which is an array of numbers representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

## Obtaining the input

To get the input, you can use the `loadAudio` method, which sets the internal input state of the model. Then you can just call `transcribe` without passing any args. It is also possible to pass inputs from other sources, as long as it is a float array containing the aforementioned waveform.
