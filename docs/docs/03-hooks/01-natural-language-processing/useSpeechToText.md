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

Speech to text (STT) converts spoken audio into written text. This hook allows you to implement features like voice assistants, real-time transcription, and audio file processing directly on-device.

:::info
We recommend using our optimized models available on [Hugging Face](https://huggingface.co/collections/software-mansion/speech-to-text-68d0ec99ed794250491b8bbe). You can also use pre-defined [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) included in the library.
:::

## API Reference

- [`useSpeechToText` API Reference](../../06-api-reference/functions/useSpeechToText.md)
- [STT Models List](../../06-api-reference/index.md#models---speech-to-text)

## Basic Usage (File Transcription)

Use `transcribe` for processing pre-recorded audio or short clips. The input should be a `Float32Array` of audio samples at **16 kHz**.

### Transcribe Options

The `transcribe()` function accepts an optional configuration object:

- `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
- `verbose`: If `true`, the method returns a detailed `TranscriptionResult` object following the OpenAI Whisper `verbose_json` format (including segments and word-level timestamps).

In this example, we use [`react-native-audio-api`](https://docs.swmansion.com/react-native-audio-api/) to decode an audio file into the required format.

### Example

```typescript
import { models, useSpeechToText } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const model = useSpeechToText({
  model: models.speech_to_text.whisper_tiny_en(),
});

// 1. Get audio file
const { uri } = await FileSystem.downloadAsync(
  'https://some-audio-url.com/file.mp3',
  `${FileSystem.cacheDirectory}audio_file`
);

// 2. Decode to 16kHz PCM Float32Array
const audioContext = new AudioContext({ sampleRate: 16000 });
const decodedAudioData = await audioContext.decodeAudioData(uri);
const audioBuffer = decodedAudioData.getChannelData(0);

// 3. Transcribe
try {
  const result = await model.transcribe(audioBuffer);
  console.log('Transcription:', result.text);
} catch (error) {
  console.error('Transcription failed:', error);
}
```

## Live Streaming Transcription

For real-time applications or audio streams of arbitrary length, use the **Streaming API**. This is optimized for live input, handling the 30-second window limitation of Whisper models automatically to ensure context isn't lost between chunks.

### How it works:

1.  **Feed audio**: Use `streamInsert` to push small chunks of audio (e.g., 100ms) as they arrive from the microphone.
2.  **Get results**: The `stream` generator yields two types of text:
    - `committed`: Finalized text that won't change.
    - `nonCommitted`: Temporary text that might update as the model gets more context from the audio.

### Streaming Options

The `stream()` function accepts several optional parameters:

- `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
- `verbose`: If `true`, includes word-level timestamps and segment metadata in the result objects.
- `timeout`: (Advanced) The interval (in milliseconds) between processing consecutive audio chunks in streaming mode. Lower values provide more frequent updates and lower latency, while higher values reduce CPU consumption. Defaults to `100`.

### Example

```tsx
import React, { useEffect, useState, useRef } from 'react';
import { Text, Button, View, SafeAreaView } from 'react-native';
import { models, useSpeechToText } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

export default function LiveTranscriber() {
  const model = useSpeechToText({
    model: models.speech_to_text.whisper_tiny_en(),
  });
  const [text, setText] = useState('');
  const isRecordingRef = useRef(false);
  const [recorder] = useState(() => new AudioRecorder());

  const startLiveStreaming = async () => {
    isRecordingRef.current = true;
    setText('');

    // 1. Capture microphone input
    recorder.onAudioReady(
      { sampleRate: 16000, bufferLength: 1600, channelCount: 1 },
      (chunk) => model.streamInsert(chunk.buffer.getChannelData(0))
    );

    await recorder.start();

    // 2. Process the stream
    try {
      let finalizedText = '';
      const streamIter = model.stream({ verbose: false });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;

        if (committed.text) finalizedText += committed.text;
        setText(finalizedText + nonCommitted.text);
      }
    } catch (error) {
      console.error('Streaming error:', error);
    }
  };

  const stopLiveStreaming = () => {
    isRecordingRef.current = false;
    recorder.stop();
    model.streamStop();
  };

  return (
    <SafeAreaView>
      <Text>{text || 'Press start and speak...'}</Text>
      <Button
        onPress={startLiveStreaming}
        title="Start Live"
        disabled={model.isGenerating}
      />
      <Button onPress={stopLiveStreaming} title="Stop" color="red" />
    </SafeAreaView>
  );
}
```

## Advanced Features

### Multilingual Transcription

To transcribe languages other than English, use a multilingual model (e.g., `models.speech_to_text.whisper_tiny()`) and specify the corresponding language code:

```typescript
// Transcribe in Spanish
const result = await model.transcribe(spanishAudio, { language: 'es' });
```

### Timestamps & Metadata

Set `verbose: true` to receive word-level timestamps and confidence scores. The output follows the OpenAI Whisper `verbose_json` format.

```typescript
const result = await model.transcribe(audioBuffer, { verbose: true });
// result.segments[0].words -> [{ word: "Hello", start: 0.5, end: 1.0 }, ...]
```

## Configuration

### Arguments

`useSpeechToText` accepts a configuration object:

- `model`: Model source and tokenizer settings (see [ModelConfig](../../06-api-reference/interfaces/SpeechToTextModelConfig.md)).
- `preventLoad`: (Optional) If `true`, the model won't load until you call `load()`.

### Returns

The hook returns an object with:

- `transcribe(audio, options)`: One-shot transcription.
- `stream(options)`: Async generator for streaming results.
- `streamInsert(audio)`: Push audio to the stream buffer.
- `streamStop()`: Finish the current stream.
- `isGenerating`: Boolean indicating if the model is busy.
- `loading`: Boolean indicating if the model is being loaded.

## Supported models

| Model                                                              |   Language   |
| ------------------------------------------------------------------ | :----------: |
| [whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en)   |   English    |
| [whisper-tiny](https://huggingface.co/openai/whisper-tiny)         | Multilingual |
| [whisper-base.en](https://huggingface.co/openai/whisper-base.en)   |   English    |
| [whisper-base](https://huggingface.co/openai/whisper-base)         | Multilingual |
| [whisper-small.en](https://huggingface.co/openai/whisper-small.en) |   English    |
| [whisper-small](https://huggingface.co/openai/whisper-small)       | Multilingual |
