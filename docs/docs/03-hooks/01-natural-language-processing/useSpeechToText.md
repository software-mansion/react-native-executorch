---
title: useSpeechToText
keywords:
  [
    speech to text,
    stt,
    voice recognition,
    transcription,
    whisper,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Learn how to use speech-to-text models in your React Native applications with React Native ExecuTorch's useSpeechToText hook."
---

Speech to text is a task that allows to transform spoken language to written text. It is commonly used to implement features such as transcription or voice assistants.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/speech-to-text-68d0ec99ed794250491b8bbe). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

You can obtain waveform from audio in any way most suitable to you, however in the snippet below we utilize `react-native-audio-api` library to process a `.mp3` file.

```typescript
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const model = useSpeechToText({
  model: WHISPER_TINY_EN,
});

const { uri } = await FileSystem.downloadAsync(
  'https://some-audio-url.com/file.mp3',
  FileSystem.cacheDirectory + 'audio_file'
);

const audioContext = new AudioContext({ sampleRate: 16000 });
const decodedAudioData = await audioContext.decodeAudioDataSource(uri);
const audioBuffer = decodedAudioData.getChannelData(0);

try {
  const transcription = await model.transcribe(audioBuffer);
  console.log(transcription);
} catch (error) {
  console.error('Error during audio transcription', error);
}
```

### Streaming

Since speech-to-text models can only process audio segments up to 30 seconds long, we need to split longer inputs into chunks. However, simple chunking may cut speech mid-sentence, making it harder for the model to understand. To address this, we use the [whisper-streaming](https://aclanthology.org/2023.ijcnlp-demo.3.pdf) algorithm. While this introduces some overhead, it enables accurate processing of audio inputs of arbitrary length.

### Arguments

**`model`** - Object containing:

- **`isMultilingual`** - A boolean flag indicating whether the model supports multiple languages.

- **`encoderSource`** - A string that specifies the location of a `.pte` file for the encoder.

- **`decoderSource`** - A string that specifies the location of a `.pte` file for the decoder.

- **`tokenizerSource`** - A string that specifies the location to the tokenizer for the model.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field                       | Type                                                                                                 | Description                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transcribe`                | `(waveform: Float32Array \| number[], options?: DecodingOptions \| undefined) => Promise<string>`    | Starts a transcription process for a given input array, which should be a waveform at 16kHz. The second argument is an options object, e.g. `{ language: 'es' }` for multilingual models. Resolves a promise with the output transcription when the model is finished. Passing `number[]` is deprecated.                      |
| `stream`                    | `(options?: DecodingOptions \| undefined) => Promise<string>`                                        | Starts a streaming transcription process. Use in combination with `streamInsert` to feed audio chunks and `streamStop` to end the stream. The argument is an options object, e.g. `{ language: 'es' }` for multilingual models. Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses. |
| `streamInsert`              | `(waveform: Float32Array \| number[]) => void`                                                       | Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription. Call this repeatedly as new audio data becomes available. Passing `number[]` is deprecated.                                                                                                                                        |
| `streamStop`                | `() => void`                                                                                         | Stops the ongoing streaming transcription process.                                                                                                                                                                                                                                                                            |
| `encode`                    | `(waveform: Float32Array \| number[]) => Promise<Float32Array>`                                      | Runs the encoding part of the model on the provided waveform. Passing `number[]` is deprecated.                                                                                                                                                                                                                               |
| `decode`                    | `(tokens: number[] \| Int32Array, encoderOutput: Float32Array \| number[]) => Promise<Float32Array>` | Runs the decoder of the model. Passing `number[]` is deprecated.                                                                                                                                                                                                                                                              |
| `committedTranscription`    | `string`                                                                                             | Contains the part of the transcription that is finalized and will not change. Useful for displaying stable results during streaming.                                                                                                                                                                                          |
| `nonCommittedTranscription` | `string`                                                                                             | Contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.                                                                                                                                                                            |
| `error`                     | `string \| null`                                                                                     | Contains the error message if the model failed to load.                                                                                                                                                                                                                                                                       |
| `isGenerating`              | `boolean`                                                                                            | Indicates whether the model is currently processing an inference.                                                                                                                                                                                                                                                             |
| `isReady`                   | `boolean`                                                                                            | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                                                                                                               |
| `downloadProgress`          | `number`                                                                                             | Tracks the progress of the model download process.                                                                                                                                                                                                                                                                            |

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

## Running the model

Before running the model's `transcribe` method, make sure to extract the audio waveform you want to transcribe. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the transcribe method. The method returns a promise that resolves to the generated transcription on success, or an error if inference fails.

### Multilingual transcription

If you want to transcribe speech in languages other than English, use the multilingual version of Whisper. To generate the output in your desired language, pass the `language` option to the `transcribe` method.

```typescript
import { useSpeechToText, WHISPER_TINY } from 'react-native-executorch';

const model = useSpeechToText({
  model: WHISPER_TINY,
});

const transcription = await model.transcribe(spanishAudio, { language: 'es' });
```

## Example

```tsx
import React, { useState } from 'react';
import { Button, Text } from 'react-native';
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

function App() {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [transcription, setTranscription] = useState('');

  const loadAudio = async () => {
    const { uri } = await FileSystem.downloadAsync(
      'https://some-audio-url.com/file.mp3',
      FileSystem.cacheDirectory + 'audio_file'
    );

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const decodedAudioData = await audioContext.decodeAudioDataSource(uri);
    const audioBuffer = decodedAudioData.getChannelData(0);

    return audioBuffer;
  };

  const handleTranscribe = async () => {
    const audio = await loadAudio();
    await model.transcribe(audio);
  };

  return (
    <>
      <Text>{transcription}</Text>
      <Button onPress={handleTranscribe} title="Transcribe" />
    </>
  );
}
```

### Streaming transcription

```tsx
import React, { useEffect, useState } from 'react';
import { Text, Button } from 'react-native';
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

function App() {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [recorder] = useState(
    () =>
      new AudioRecorder({
        sampleRate: 16000,
        bufferLengthInSamples: 1600,
      })
  );

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  const handleStartStreamingTranscribe = async () => {
    recorder.onAudioReady(({ buffer }) => {
      model.streamInsert(buffer.getChannelData(0));
    });
    recorder.start();

    try {
      await model.stream();
    } catch (error) {
      console.error('Error during streaming transcription:', error);
    }
  };

  const handleStopStreamingTranscribe = () => {
    recorder.stop();
    model.streamStop();
  };

  return (
    <>
      <Text>
        {model.committedTranscription}
        {model.nonCommittedTranscription}
      </Text>
      <Button
        onPress={handleStartStreamingTranscribe}
        title="Start Streaming"
      />
      <Button onPress={handleStopStreamingTranscribe} title="Stop Streaming" />
    </>
  );
}
```

## Supported models

| Model                                                              |   Language   |
| ------------------------------------------------------------------ | :----------: |
| [whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en)   |   English    |
| [whisper-tiny](https://huggingface.co/openai/whisper-tiny)         | Multilingual |
| [whisper-base.en](https://huggingface.co/openai/whisper-base.en)   |   English    |
| [whisper-base](https://huggingface.co/openai/whisper-base)         | Multilingual |
| [whisper-small.en](https://huggingface.co/openai/whisper-small.en) |   English    |
| [whisper-small](https://huggingface.co/openai/whisper-small)       | Multilingual |
