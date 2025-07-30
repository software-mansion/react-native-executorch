---
title: SpeechToTextModule
---

TypeScript API implementation of the [useSpeechToText](../../02-hooks/01-natural-language-processing/useSpeechToText.md) hook.

## Reference

```typescript
import { SpeechToTextModule } from 'react-native-executorch';
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

const audioUrl = 'https://some-audio-url.com/file.mp3'; // URL with audio to transcribe

// Creating an instance
const stt = new SpeechToTextModule({
  transcribeCallback: (sequence) => {
    console.log(sequence);
  },
});

// Loading the model
await stt.load({
  modelName: 'moonshine',
  onDownloadProgressCallback: (progress) => console.log(progress),
});

// Loading the audio and running the model
const waveform = await loadAudio(audioUrl);
const transcribedText = await stt.transcribe(waveform);
```

### Methods

| Method                | Type                                                                                                                                                                                                                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constructor`         | `({transcribeCallback?: (sequence: string) => void, overlapSeconds?: number, windowSize?: number, streamingConfig?: 'fast' \| 'balanced' \| 'quality'})`                                                                                               | Creates a new instance of SpeechToTextModule with optional transcription callback and streaming configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `load`                | `({modelName: 'whisper' \| 'moonshine' \| 'whisperMultilingual', encoderSource?: ResourceSource, decoderSource?: ResourceSource, tokenizerSource?: ResourceSource, onDownloadProgressCallback?: (downloadProgress: number) => void}) => Promise<void>` | Loads the model specified with `modelName`, where `encoderSource`, `decoderSource`, `tokenizerSource` are strings specifying the location of the binaries for the models. `onDownloadProgressCallback` allows you to monitor the current progress of the model download                                                                                                                                                                                                                                                                                                                                                                                                      |
| `transcribe`          | `(waveform: number[], audioLanguage?: SpeechToTextLanguage): Promise<string>`                                                                                                                                                                          | Starts a transcription process for a given input array, which should be a waveform at 16kHz. Resolves a promise with the output transcription when the model is finished. For multilingual models, you have to specify the audioLanguage flag, which is the language of the spoken language in the audio.                                                                                                                                                                                                                                                                                                                                                                    |
| `streamingTranscribe` | `(streamingAction: STREAMING_ACTION, waveform?: number[], audioLanguage?: SpeechToTextLanguage) => Promise<string>`                                                                                                                                    | This allows for running transcription process on-line, which means where the whole audio is not known beforehand i.e. when transcribing from a live microphone feed. `streamingAction` defines the type of package sent to the model: <li>`START` - initializes the process, allows for optional `waveform` data</li><li>`DATA` - this package should contain consecutive audio data chunks sampled in 16k Hz</li><li>`STOP` - the last data chunk for this transcription, ends the transcription process and flushes internal buffers</li> Each call returns most recent transcription. Returns error when called when module is in use (i.e. processing `transcribe` call) |
| `encode`              | `(waveform: number[]) => Promise<null>`                                                                                                                                                                                                                | Runs the encoding part of the model. It doesn't return the encodings. Instead, it stores the result internally, reducing data transfer overhead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `decode`              | `(tokens: number[]) => Promise<number>`                                                                                                                                                                                                                | Runs the decoder of the model. Returns a single token representing a next token in the output. It uses internal cached encodings from the most recent `encode` call, meaning that you have to call `encode` prior to decoding.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `configureStreaming`  | `(overlapSeconds?: number, windowSize?: number, streamingConfig?: 'fast' \| 'balanced' \| 'quality') => void`                                                                                                                                          | Configures options for the streaming algorithm: <ul><li>`overlapSeconds` determines how much adjacent audio chunks overlap (increasing it slows down transcription, decreases probability of weird wording at the chunks intersection, setting it larger than 3 seconds generally is discouraged), </li><li>`windowSize` describes size of the audio chunks (increasing it speeds up the end to end transcription time, but increases latency for the first token to be returned),</li><li> `streamingConfig` predefined configs for `windowSize` and `overlapSeconds` values.</li></ul> Keep `windowSize + 2 * overlapSeconds <= 30`.                                       |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;

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

## Loading the model

To create a new instance of SpeechToTextModule, use the constructor with optional parameters:

**`transcribeCallback`** - (Optional) Function that will be called with transcription results.

**`overlapSeconds`** - (Optional) Determines how much adjacent audio chunks overlap.

**`windowSize`** - (Optional) Describes size of the audio chunks.

**`streamingConfig`** - (Optional) Predefined configs for streaming ('fast', 'balanced', or 'quality').

Then, to load the model, use the `load` method. It accepts an object with the following fields:

**`modelName`** - Identifier for which model to use ('whisper', 'moonshine', or 'whisperMultilingual').

**`encoderSource`** - (Optional) String that specifies the location of the encoder binary.

**`decoderSource`** - (Optional) String that specifies the location of the decoder binary.

**`tokenizerSource`** - (Optional) String that specifies the location of the tokenizer.

**`onDownloadProgressCallback`** - (Optional) Function that will be called on download progress.

For more information, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `transcribe` method. It accepts one argument, which is an array of numbers representing a waveform at 16kHz sampling rate. The method returns a promise, which can resolve either to an error or a string containing the output text.

### Multilingual transcription

If you aim to obtain a transcription in other languages than English, in v0.4.0 we introduced a new model - `whisperMultilingual`, a multilingual version of Whisper. To obtain the output text in your desired language, make sure pass `audioLanguage` to `transcribe`. You should not pass this flag if you're using a non-multilingual model. For example:

```typescript
import { SpeechToTextLanguage } from 'react-native-executorch';

// Rest of your code...
const mySpanishAudio = 'https://some-audio-url.com/spanish-file.mp3';
await stt.transcribe(mySpanishAudio, SpeechToTextLanguage.Spanish);
// Rest of your code...
```

## Obtaining the input

You need to parse audio to waveform in 16kHz, you can do that in any way most suitable to you. In the snippet at the top of the page we provide an example using `react-native-audio-api`. Once you have the waveform simply pass it as the only argument to `transcribe` method.
