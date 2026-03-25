# useSpeechToText

Speech to text is a task that allows to transform spoken language to written text. It is commonly used to implement features such as transcription or voice assistants.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/speech-to-text-68d0ec99ed794250491b8bbe). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useSpeechToText` see: [`useSpeechToText` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText).
* For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

You can obtain waveform from audio in any way most suitable to you, however in the snippet below we utilize [`react-native-audio-api`](https://docs.swmansion.com/react-native-audio-api/) library to process a `.mp3` file.

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
const decodedAudioData = await audioContext.decodeAudioData(uri);
const audioBuffer = decodedAudioData.getChannelData(0);

try {
  const transcription = await model.transcribe(audioBuffer);
  console.log(transcription.text);
} catch (error) {
  console.error('Error during audio transcription', error);
}

```

### Streaming[​](#streaming "Direct link to Streaming")

Since speech-to-text models can only process audio segments up to 30 seconds long, we need to split longer inputs into chunks. However, simple chunking may cut speech mid-sentence, making it harder for the model to understand. To address this, we use the [whisper-streaming](https://aclanthology.org/2023.ijcnlp-demo.3.pdf) algorithm. While this introduces some overhead, it enables accurate processing of audio inputs of arbitrary length.

### Arguments[​](#arguments "Direct link to Arguments")

`useSpeechToText` takes [`SpeechToTextProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextProps) that consists of:

* `model` of type [`SpeechToTextConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig), containing the [`isMultilingual` flag](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#ismultilingual), [tokenizer source](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#tokenizersource) and [model source](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#modelsource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useSpeechToText` arguments check this section: [`useSpeechToText` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText#parameters)
* For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useSpeechToText` returns an object called `SpeechToTextType` containing bunch of functions to interact with STT.

Please note, that both [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#transcribe) and [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#stream) functions accept [`DecodingOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions) type as an argument. It accepts language abbreviation, you can check them out in [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions#language) property of this config of type [`SpeechToTextLanguage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SpeechToTextLanguage).

To get more details please read: [`SpeechToTextType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType).

## Running the model[​](#running-the-model "Direct link to Running the model")

Before running the model's [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#transcribe) method, make sure to extract the audio waveform you want to transcribe. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the transcribe method. The method returns a promise that resolves to the generated transcription on success, or an error if inference fails.

### Multilingual transcription[​](#multilingual-transcription "Direct link to Multilingual transcription")

If you want to transcribe speech in languages other than English, use the multilingual version of Whisper. To generate the output in your desired language, pass the [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions#language) option to the [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#transcribe) method.

```typescript
import { useSpeechToText, WHISPER_TINY } from 'react-native-executorch';

const model = useSpeechToText({
  model: WHISPER_TINY,
});

const transcription = await model.transcribe(spanishAudio, { language: 'es' });

```

### Timestamps & Transcription Stat Data[​](#timestamps--transcription-stat-data "Direct link to Timestamps & Transcription Stat Data")

You can obtain word-level timestamps and other useful parameters from transcription ([`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#transcribe) and [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#stream) methods) by setting `verbose: true` in the options. The result mimics the *verbose\_json* format from OpenAI Whisper API. For more information please read [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#transcribe), [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType#stream), and [`TranscriptionResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TranscriptionResult) API References.

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

```tsx
import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import {
  useSpeechToText,
  WHISPER_TINY_EN,
  TranscriptionResult,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

function App() {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [transcription, setTranscription] = useState<TranscriptionResult>(null);

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
    // Default text transcription
    const result = await model.transcribe(audio);
    setTranscription(result);
  };

  const handleTranscribeWithTimestamps = async () => {
    const audio = await loadAudio();
    // Transcription with timestamps
    const result = await model.transcribe(audio, { verbose: true });
    setTranscription(result);
  };

  // Custom logic for printing transcription
  // e.g.

  const renderContent = () => {
    if (!transcription) return <Text>Press a button to transcribe</Text>;

    if (transcription.segments && transcription.segments.length > 0) {
      return (
        <Text>
          {transcription.text +
            '\n\nNum segments: ' +
            transcription.segments.length.toString()}
        </Text>
      );
    }
    return <Text>{transcription.text}</Text>;
  };

  return (
    <View>
      {renderContent()}
      <Button onPress={handleTranscribe} title="Transcribe (Text)" />
      <Button
        onPress={handleTranscribeWithTimestamps}
        title="Transcribe (Timestamps)"
      />
    </View>
  );
}

```

### Streaming transcription[​](#streaming-transcription "Direct link to Streaming transcription")

```tsx
import React, { useEffect, useState, useRef } from 'react';
import { Text, Button, View, SafeAreaView } from 'react-native';
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

export default function App() {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [transcribedText, setTranscribedText] = useState('');

  const isRecordingRef = useRef(false);

  const [recorder] = useState(() => new AudioRecorder());

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  const handleStartStreamingTranscribe = async () => {
    isRecordingRef.current = true;
    setTranscribedText('');

    const sampleRate = 16000;

    recorder.onAudioReady(
      {
        sampleRate,
        bufferLength: 0.1 * sampleRate,
        channelCount: 1,
      },
      (chunk) => {
        model.streamInsert(chunk.buffer.getChannelData(0));
      }
    );

    try {
      await recorder.start();
    } catch (e) {
      console.error('Recorder failed:', e);
      return;
    }

    try {
      let accumulatedCommitted = '';

      const streamIter = model.stream({ verbose: false });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;

        if (committed.text) {
          accumulatedCommitted += committed.text;
        }

        setTranscribedText(accumulatedCommitted + nonCommitted.text);
      }
    } catch (error) {
      console.error('Error during streaming transcription:', error);
    }
  };

  const handleStopStreamingTranscribe = () => {
    isRecordingRef.current = false;
    recorder.stop();
    model.streamStop();
  };

  return (
    <SafeAreaView>
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 20, fontSize: 18 }}>
          {transcribedText || 'Press start to speak...'}
        </Text>

        <Button
          onPress={handleStartStreamingTranscribe}
          title="Start Streaming"
          disabled={model.isGenerating}
        />
        <View style={{ height: 10 }} />
        <Button
          onPress={handleStopStreamingTranscribe}
          title="Stop Streaming"
          color="red"
        />
      </View>
    </SafeAreaView>
  );
}

```

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                              | Language     |
| ------------------------------------------------------------------ | ------------ |
| [whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en)   | English      |
| [whisper-tiny](https://huggingface.co/openai/whisper-tiny)         | Multilingual |
| [whisper-base.en](https://huggingface.co/openai/whisper-base.en)   | English      |
| [whisper-base](https://huggingface.co/openai/whisper-base)         | Multilingual |
| [whisper-small.en](https://huggingface.co/openai/whisper-small.en) | English      |
| [whisper-small](https://huggingface.co/openai/whisper-small)       | Multilingual |
