---
title: useSpeechToText
keywords:
  [
    speech to text,
    stt,
    voice recognition,
    transcription,
    whisper,
    moonshine,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Learn how to use speech-to-text models in your React Native applications with React Native ExecuTorch's useSpeechToText hook."
---

Speech to text is a task that allows to transform spoken language to written text. It is commonly used to implement features such as transcription or voice assistants. As of now, [all supported STT models](#supported-models) run on the XNNPACK backend.

:::info
Currently, we do not support direct microphone input streaming to the model. Instead, in v0.3.0, we provide a way to transcribe an audio file.
:::

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

You can obtain waveform from audio in any way most suitable to you, however in the snippet below we utilize `react-native-audio-api` library to process a mp3 file.

```typescript
import { useSpeechToText, MOONSHINE_TINY } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const { transcribe, error } = useSpeechToText(MOONSHINE_TINY);

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

const audioUrl = 'https://some-audio-url.com/file.mp3'; // URL with audio to transcribe
const waveform = await loadAudio(audioUrl);
const transcription = await transcribe(waveform);
if (error) {
  console.log(error);
} else {
  console.log(transcription);
}
```

### Streaming

Given that STT models can process audio no longer than 30 seconds, there is a need to chunk the input audio. Chunking audio may result in cutting speech mid-sentence, which might be hard to understand for the model. To make it work, we employed an algorithm (adapted for mobile devices from [whisper-streaming](https://aclanthology.org/2023.ijcnlp-demo.3.pdf)) that uses overlapping audio chunks. This might introduce some overhead, but allows for processing audio inputs of arbitrary length.

### Arguments

**`modelName`**
A literal of `"moonshine" | "whisper" | "whisperMultilingual` which serves as an identifier for which model should be used.

**`encoderSource?`**
A string that specifies the location of a .pte file for the encoder. For further information on passing model sources, check out [Loading Models](../../01-fundamentals/02-loading-models.md). Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) for given model.

**`decoderSource?`**
Analogous to the encoderSource, this takes in a string which is a source for the decoder part of the model. Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) for given model.

**`tokenizerSource?`**
A string that specifies the location to the tokenizer for the model. This works just as the encoder and decoder do. Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) for given model.

**`overlapSeconds?`**
Specifies the length of overlap between consecutive audio chunks (expressed in seconds). Overrides `streamingConfig` argument.

**`windowSize?`**
Specifies the size of each audio chunk (expressed in seconds). Overrides `streamingConfig` argument.

**`streamingConfig?`**
Specifies config for both `overlapSeconds` and `windowSize` values. Three options are available: `fast`, `balanced` and `quality`. We discourage using `fast` config with `Whisper` model which while has the lowest latency to first token has the slowest overall speed.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

### Returns

| Field                 | Type                                                                                                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transcribe`          | `(waveform: number[], audioLanguage?: SpeechToTextLanguage) => Promise<string>`                                          | Starts a transcription process for a given input array, which should be a waveform at 16kHz. Resolves a promise with the output transcription when the model is finished. For multilingual models, you have to specify the audioLanguage flag, which is the language of the spoken language in the audio. Returns error when called when module is in use (i.e. in process of `streamingTranscribe` action)                                                                                                                                                                                                                                                                  |
| `streamingTranscribe` | `(streamingAction: STREAMING_ACTION, waveform?: number[], audioLanguage?: SpeechToTextLanguage) => Promise<string>`      | This allows for running transcription process on-line, which means where the whole audio is not known beforehand i.e. when transcribing from a live microphone feed. `streamingAction` defines the type of package sent to the model: <li>`START` - initializes the process, allows for optional `waveform` data</li><li>`DATA` - this package should contain consecutive audio data chunks sampled in 16k Hz</li><li>`STOP` - the last data chunk for this transcription, ends the transcription process and flushes internal buffers</li> Each call returns most recent transcription. Returns error when called when module is in use (i.e. processing `transcribe` call) |
| `error`               | <code>Error &#124; undefined</code>                                                                                      | Contains the error message if the model failed to load.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `sequence`            | <code>string</code>                                                                                                      | This property is updated with each generated token. If you're looking to obtain tokens as they're generated, you should use this property.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `isGenerating`        | `boolean`                                                                                                                | Indicates whether the model is currently processing an inference.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `isReady`             | `boolean`                                                                                                                | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `configureStreaming`  | <code>(overlapSeconds?: number, windowSize?: number, streamingConfig?: 'fast' &#124; 'balanced' &#124; 'quality')</code> | Configures options for the streaming algorithm: <ul><li>`overlapSeconds` determines how much adjacent audio chunks overlap (increasing it slows down transcription, decreases probability of weird wording at the chunks intersection, setting it larger than 3 seconds generally is discouraged), </li><li>`windowSize` describes size of the audio chunks (increasing it speeds up the end to end transcription time, but increases latency for the first token to be returned),</li><li> `streamingConfig` predefined configs for `windowSize` and `overlapSeconds` values.</li></ul> Keep `windowSize + 2 * overlapSeconds <= 30`.                                       |
| `downloadProgress`    | `number`                                                                                                                 | Tracks the progress of the model download process.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

<details>
<summary>Type definitions</summary>

```typescript
enum STREAMING_ACTION {
  START,
  DATA,
  STOP,
}

enum SpeechToTextLanguage {
  Afrikaans = 'af',
  Albanian = 'sq',
  Arabic = 'ar',
  Armenian = 'hy',
  Azerbaijani = 'az',
  Basque = 'eu',
  Belarusian = 'be',
  Bengali = 'bn',
  Bosnian = 'bs',
  Bulgarian = 'bg',
  Burmese = 'my',
  Catalan = 'ca',
  Chinese = 'zh',
  Croatian = 'hr',
  Czech = 'cs',
  Danish = 'da',
  Dutch = 'nl',
  Estonian = 'et',
  English = 'en',
  Finnish = 'fi',
  French = 'fr',
  Galician = 'gl',
  Georgian = 'ka',
  German = 'de',
  Greek = 'el',
  Gujarati = 'gu',
  HaitianCreole = 'ht',
  Hebrew = 'he',
  Hindi = 'hi',
  Hungarian = 'hu',
  Icelandic = 'is',
  Indonesian = 'id',
  Italian = 'it',
  Japanese = 'ja',
  Kannada = 'kn',
  Kazakh = 'kk',
  Khmer = 'km',
  Korean = 'ko',
  Lao = 'lo',
  Latvian = 'lv',
  Lithuanian = 'lt',
  Macedonian = 'mk',
  Malagasy = 'mg',
  Malay = 'ms',
  Malayalam = 'ml',
  Maltese = 'mt',
  Marathi = 'mr',
  Nepali = 'ne',
  Norwegian = 'no',
  Persian = 'fa',
  Polish = 'pl',
  Portuguese = 'pt',
  Punjabi = 'pa',
  Romanian = 'ro',
  Russian = 'ru',
  Serbian = 'sr',
  Sinhala = 'si',
  Slovak = 'sk',
  Slovenian = 'sl',
  Spanish = 'es',
  Sundanese = 'su',
  Swahili = 'sw',
  Swedish = 'sv',
  Tagalog = 'tl',
  Tajik = 'tg',
  Tamil = 'ta',
  Telugu = 'te',
  Thai = 'th',
  Turkish = 'tr',
  Ukrainian = 'uk',
  Urdu = 'ur',
  Uzbek = 'uz',
  Vietnamese = 'vi',
  Welsh = 'cy',
  Yiddish = 'yi',
}
```

</details>

## Running the model

Before running the model's `transcribe` method be sure to obtain waveform of the audio You wish to transcribe. You need to obtain the waveform from audio on your own (remember to use sampling rate of 16kHz!), in the snippet above we provide an example how you can do that. In the latter case just pass the obtained waveform as argument to the `transcribe` method which returns a promise resolving to the generated tokens when successful. If the model fails during inference the `error` property contains details of the error. If you want to obtain tokens in a streaming fashion, you can also use the sequence property, which is updated with each generated token, similar to the [useLLM](../../02-hooks/01-natural-language-processing/useLLM.md) hook.

#### Multilingual transcription

If you aim to obtain a transcription in other languages than English, in v0.4.0 we introduced a new model - `whisperMultilingual`, a multilingual version of Whisper. To obtain the output text in your desired language, make sure pass `audioLanguage` to `transcribe`. You should not pass this flag if you're using a non-multilingual model. For example:

```typescript
import { SpeechToTextLanguage } from 'react-native-executorch';

// Rest of your code...
const mySpanishAudio = 'https://some-audio-url.com/spanish-file.mp3';
await model.transcribe(mySpanishAudio, SpeechToTextLanguage.Spanish);
// Rest of your code...
```

## Example

```tsx
import { Button, Text, View } from 'react-native';
import { useSpeechToText, WHISPER_TINY } from 'react-native-executorch';
import * as FileSystem from 'expo-file-system';
import { AudioContext } from 'react-native-audio-api';

function App() {
  const { transcribe, sequence, error } = useSpeechToText(WHISPER_TINY);

  const loadAudio = async (url: string) => {
    const audioContext = new AudioContext({ sampleRate: 16e3 });
    const audioBuffer = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + '_tmp_transcribe_audio.mp3'
    ).then(({ uri }) => {
      return audioContext.decodeAudioDataSource(uri);
    });
    return Array.from(audioBuffer?.getChannelData(0));
  };

  const audioUrl = 'https://some-audio-url.com/file.mp3'; // URL with audio to transcribe

  return (
    <View>
      <Button
        onPress={async () => {
          await transcribe(await loadAudio(audioUrl));
        }}
        title="Transcribe"
      />
      <Text>{error ? error.message : sequence}</Text>
    </View>
  );
}
```

### Live data (microphone) transcription

```tsx
import {
  STREAMING_ACTION,
  useSpeechToText,
  MOONSHINE_TINY,
} from 'react-native-executorch';
import LiveAudioStream from 'react-native-live-audio-stream';
import { useState } from 'react';
import { Buffer } from 'buffer';

const audioStreamOptions = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 1,
  bufferSize: 16000,
};

const startStreamingAudio = (options: any, onChunk: (data: string) => void) => {
  LiveAudioStream.init(options);
  LiveAudioStream.on('data', onChunk);
  LiveAudioStream.start();
};

const float32ArrayFromPCMBinaryBuffer = (b64EncodedBuffer: string) => {
  const b64DecodedChunk = Buffer.from(b64EncodedBuffer, 'base64');
  const int16Array = new Int16Array(b64DecodedChunk.buffer);

  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = Math.max(
      -1,
      Math.min(1, (int16Array[i] / audioStreamOptions.bufferSize) * 8)
    );
  }
  return float32Array;
};

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const speechToText = useSpeechToText({
    ...MOONSHINE_TINY,
    windowSize: 3,
    overlapSeconds: 1.2,
  });

  const onChunk = (data: string) => {
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    speechToText.streamingTranscribe(
      STREAMING_ACTION.DATA,
      Array.from(float32Chunk)
    );
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      LiveAudioStream.stop();
      messageRecorded.current = true;
      await speechToText.streamingTranscribe(STREAMING_ACTION.STOP);
    } else {
      setIsRecording(true);
      startStreamingAudio(audioStreamOptions, onChunk);
      await speechToText.streamingTranscribe(STREAMING_ACTION.START);
    }
  };

  return (
    <View>
      <Text>{speechToText.sequence}</Text>
      <TouchableOpacity
        style={!isRecording ? styles.recordTouchable : styles.recordingInfo}
        onPress={handleRecordPress}
      >
        {isRecording ? <Text>Stop</Text> : <Text>Record</Text>}
      </TouchableOpacity>
    </View>
  );
}
```

## Supported models

| Model                                                                 |   Language   |
| --------------------------------------------------------------------- | :----------: |
| [Whisper tiny.en](https://huggingface.co/openai/whisper-tiny.en)      |   English    |
| [Whisper tiny](https://huggingface.co/openai/whisper-tiny)            | Multilingual |
| [Moonshine tiny](https://huggingface.co/UsefulSensors/moonshine-tiny) |   English    |

## Benchmarks

### Model size

| Model          | XNNPACK [MB] |
| -------------- | :----------: |
| WHISPER_TINY   |    231.0     |
| MOONSHINE_TINY |    148.9     |

### Memory usage

| Model          | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------- | :--------------------: | :----------------: |
| WHISPER_TINY   |          900           |        600         |
| MOONSHINE_TINY |          650           |        560         |
