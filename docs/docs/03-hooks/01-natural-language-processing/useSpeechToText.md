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

* For detailed API Reference for `useSpeechToText` see: [`useSpeechToText` API Reference](../../06-api-reference/functions/useSpeechToText.md)
* For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](../../06-api-reference/index.md#models---speech-to-text)

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

`useSpeechToText` takes [`SpeechToTextProps`](../../06-api-reference/interfaces/SpeechToTextProps.md) that consists of:
* `model` of type [`SpeechToTextConfig`](../../06-api-reference/interfaces/SpeechToTextModelConfig.md), containing the [`isMultilingual` flag](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#ismultilingual), [tokenizer source](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#tokenizersource), [encoder source](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#encodersource), and [decoder source](../../06-api-reference/interfaces/SpeechToTextModelConfig.md#decodersource).
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/SpeechToTextProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useSpeechToText` arguments check this section: [`useSpeechToText` arguments](../../06-api-reference/functions/useSpeechToText.md#parameters)
* For all speech to text models available out-of-the-box in React Native ExecuTorch see: [STT Models](../../06-api-reference/index.md#models---speech-to-text)
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useSpeechToText` returns an object called `SpeechToTextType` containing bunch of functions to interact with STT. To get more details please read: [`SpeechToTextType` API Reference](../../06-api-reference/interfaces/SpeechToTextType.md).

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
