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

## API Reference

- For detailed API Reference for `useSpeechToText` see: [`useSpeechToText` API Reference](../../06-api-reference/functions/useSpeechToText.md).
- For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](../../06-api-reference/index.md#models---speech-to-text).

## High Level Overview

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

### Streaming

Since speech-to-text models can only process audio segments up to 30 seconds long, we need to split longer inputs into chunks. However, simple chunking may cut speech mid-sentence, making it harder for the model to understand. To address this, we use the [whisper-streaming](https://aclanthology.org/2023.ijcnlp-demo.3.pdf) algorithm. While this introduces some overhead, it enables accurate processing of audio inputs of arbitrary length.

### Arguments

`useSpeechToText` takes [`SpeechToTextProps`](../../06-api-reference/interfaces/SpeechToTextProps.md) that consists of:

- `model` of type [`SpeechToTextConfig`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md), containing the [`isMultilingual` flag](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#ismultilingual), [tokenizer source](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#tokenizersource), [encoder source](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#encodersource), and [decoder source](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#decodersource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/SpeechToTextProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useSpeechToText` arguments check this section: [`useSpeechToText` arguments](../../06-api-reference/functions/useSpeechToText.md#parameters)
- For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](../../06-api-reference/index.md#models---speech-to-text).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useSpeechToText` returns an object called `SpeechToTextType` containing bunch of functions to interact with STT.

Please note, that both [`transcribe`](../../06-api-reference/interfaces/SpeechToTextType.md#transcribe) and [`stream`](../../06-api-reference/interfaces/SpeechToTextType.md#stream) functions accept [`DecodingOptions`](../../06-api-reference/interfaces/DecodingOptions.md) type as an argument. It accepts language abbreviation, you can check them out in [`language`](../../06-api-reference/interfaces/DecodingOptions.md#language) property of this config of type [`SpeechToTextLanguage`](../../06-api-reference/type-aliases/SpeechToTextLanguage.md).

To get more details please read: [`SpeechToTextType` API Reference](../../06-api-reference/interfaces/SpeechToTextType.md).

## Running the model

Before running the model's [`transcribe`](../../06-api-reference/interfaces/SpeechToTextType.md#transcribe) method, make sure to extract the audio waveform you want to transcribe. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the transcribe method. The method returns a promise that resolves to the generated transcription on success, or an error if inference fails.

### Multilingual transcription

If you want to transcribe speech in languages other than English, use the multilingual version of Whisper. To generate the output in your desired language, pass the [`language`](../../06-api-reference/interfaces/DecodingOptions.md#language) option to the [`transcribe`](../../06-api-reference/interfaces/SpeechToTextType.md#transcribe) method.

```typescript
import { useSpeechToText, WHISPER_TINY } from 'react-native-executorch';

const model = useSpeechToText({
  model: WHISPER_TINY,
});

const transcription = await model.transcribe(spanishAudio, { language: 'es' });
```

### Timestamps & Transcription Stat Data

You can obtain word-level timestamps and other useful parameters from transcription ([`transcribe`](../../06-api-reference/interfaces/SpeechToTextType.md#transcribe) and [`stream`](../../06-api-reference/interfaces/SpeechToTextType.md#stream) methods) by setting `verbose: true` in the options. The result mimics the _verbose_json_ format from OpenAI Whisper API. For more information please read [`transcribe`](../../06-api-reference/interfaces/SpeechToTextType.md#transcribe), [`stream`](../../06-api-reference/interfaces/SpeechToTextType.md#stream), and [`TranscriptionResult`](../../06-api-reference/interfaces/TranscriptionResult.md) API References.

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

### Streaming transcription

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

## Supported models

| Model                                                              |   Language   |
| ------------------------------------------------------------------ | :----------: |
| [whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en)   |   English    |
| [whisper-tiny](https://huggingface.co/openai/whisper-tiny)         | Multilingual |
| [whisper-base.en](https://huggingface.co/openai/whisper-base.en)   |   English    |
| [whisper-base](https://huggingface.co/openai/whisper-base)         | Multilingual |
| [whisper-small.en](https://huggingface.co/openai/whisper-small.en) |   English    |
| [whisper-small](https://huggingface.co/openai/whisper-small)       | Multilingual |
