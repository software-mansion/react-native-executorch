# useSpeechToText

Speech to text (STT) converts spoken audio into written text. This hook allows you to implement features like voice assistants, real-time transcription, and audio file processing directly on-device.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

We recommend using our optimized models available on [Hugging Face](https://huggingface.co/collections/software-mansion/speech-to-text-68d0ec99ed794250491b8bbe). You can also use pre-defined [constants](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts) included in the library.

## API Reference[​](#api-reference "Direct link to API Reference")

* [`useSpeechToText` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText)
* [STT Models List](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text)

## Basic Usage (File Transcription)[​](#basic-usage-file-transcription "Direct link to Basic Usage (File Transcription)")

Use `transcribe` for processing pre-recorded audio or short clips. The input should be a `Float32Array` of audio samples at **16 kHz**.

### Transcribe Options[​](#transcribe-options "Direct link to Transcribe Options")

The `transcribe()` function accepts an optional configuration object:

* `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
* `verbose`: If `true`, the method returns a detailed `TranscriptionResult` object following the OpenAI Whisper `verbose_json` format (including segments and word-level timestamps).

In this example, we use [`react-native-audio-api`](https://docs.swmansion.com/react-native-audio-api/) to decode an audio file into the required format.

### Example[​](#example "Direct link to Example")

```typescript
import { models, useSpeechToText } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const model = useSpeechToText({
  model: models.speech_to_text.whisper_tiny_en(), // Use whisper_tiny_en for English or whisper_tiny for multilingual support
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

## Live Streaming Transcription[​](#live-streaming-transcription "Direct link to Live Streaming Transcription")

For real-time applications or audio streams of arbitrary length, use the **Streaming API**. This is optimized for live input, handling the 30-second window limitation of Whisper models automatically to ensure context isn't lost between chunks.

### How it works:[​](#how-it-works "Direct link to How it works:")

1. **Feed audio**: Use `streamInsert` to push small chunks of audio (e.g., 100ms) as they arrive from the microphone.

2. **Get results**: The `stream` generator yields two types of text:

   <!-- -->

   * `committed`: Finalized text that won't change.
   * `nonCommitted`: Temporary text that might update as the model gets more context from the audio.

### Streaming Options[​](#streaming-options "Direct link to Streaming Options")

The `stream()` function accepts several optional parameters:

* `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
* `verbose`: If `true`, includes word-level timestamps and segment metadata in the result objects.
* `useVAD`: Enable the Voice Activity Detection submodule (if configured in `useSpeechToText` props) to optimize performance by filtering silence. Defaults to `false`.
* `timeout`: (Advanced) The interval (in milliseconds) between processing consecutive audio chunks in streaming mode. Lower values provide more frequent updates and lower latency, while higher values reduce CPU consumption. Defaults to `100`.
* `vadDetectionMargin`: (Advanced) The duration of silence (in milliseconds) required after speech is detected before "committing" a segment. Defaults to `500`. Only active when VAD module is used.

### Voice Activity Detection (VAD)[​](#voice-activity-detection-vad "Direct link to Voice Activity Detection (VAD)")

Integrating a VAD submodule is highly recommended for streaming. It improves performance by automatically removing silence, which reduces CPU usage, saves battery, and prevents the model from "hallucinating" text during silent periods.

### Example[​](#example-1 "Direct link to Example")

```tsx
import React, { useEffect, useState, useRef } from 'react';
import { Text, Button, View, SafeAreaView } from 'react-native';
import { models, useSpeechToText } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

export default function LiveTranscriber() {
  const model = useSpeechToText({
    model: models.speech_to_text.whisper_tiny_en(),
    vad: models.vad.fsmn_vad(),
  });
  const [text, setText] = useState('');
  const isRecordingRef = useRef(false);
  const [recorder] = useState(() => new AudioRecorder());

  const startLiveStreaming = async () => {
    isRecordingRef.current = true;
    setText('');

    // 2. Capture microphone input
    recorder.onAudioReady(
      { sampleRate: 16000, bufferLength: 1600, channelCount: 1 },
      (chunk) => model.streamInsert(chunk.buffer.getChannelData(0))
    );

    await recorder.start();

    // 3. Process the stream with VAD enabled
    try {
      let finalizedText = '';
      const streamIter = model.stream({
        verbose: false,
        useVAD: true, // Enable VAD filter
        vadDetectionMargin: 500, // Wait for 500ms of silence before committing
      });

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

## Advanced Features[​](#advanced-features "Direct link to Advanced Features")

### Multilingual Transcription[​](#multilingual-transcription "Direct link to Multilingual Transcription")

To transcribe languages other than English, use a multilingual model (e.g., `models.speech_to_text.whisper_tiny()`) and specify the corresponding language code:

```typescript
// Transcribe in Spanish
const model = useSpeechToText({
  model: models.speech_to_text.whisper_tiny(),
});
const result = await model.transcribe(spanishAudio, { language: 'es' });

```

### Timestamps & Metadata[​](#timestamps--metadata "Direct link to Timestamps & Metadata")

Set `verbose: true` to receive word-level timestamps and confidence scores. The output follows the OpenAI Whisper `verbose_json` format.

```typescript
const result = await model.transcribe(audioBuffer, { verbose: true });
// result.segments[0].words -> [{ word: "Hello", start: 0.5, end: 1.0 }, ...]

```

## Configuration[​](#configuration "Direct link to Configuration")

### Arguments[​](#arguments "Direct link to Arguments")

`useSpeechToText` accepts a configuration object:

* `model`: Model source and tokenizer settings (see [ModelConfig](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig)).
* `preventLoad`: (Optional) If `true`, the model won't load until you call `load()`.

### Returns[​](#returns "Direct link to Returns")

The hook returns a [`SpeechToTextType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextType) object containing:

* `error`: `null | RnExecutorchError` - Contains the error message if the model failed to load.
* `isReady`: `boolean` - Indicates whether the model has successfully loaded and is ready for inference.
* `isGenerating`: `boolean` - Indicates whether the model is currently processing an inference.
* `downloadProgress`: `number` - Tracks the progress of the model download process as a value between `0` and `1`.
* `transcribe(audio, options)`: Starts a transcription process for a given input array, which should be a waveform at 16kHz. Returns a promise resolving to a [`TranscriptionResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TranscriptionResult).
* `stream(options)`: Starts a streaming transcription process. Asynchronous generator that yields objects containing `committed` and `nonCommitted` transcriptions, both of type [`TranscriptionResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TranscriptionResult).
* `streamInsert(audio)`: Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription.
* `streamStop()`: Stops the ongoing streaming transcription process.
* `encode(audio)`: Runs the encoding part of the model on the provided waveform. Returns a promise resolving to the encoded `Float32Array`.
* `decode(tokens, encoderOutput)`: Runs the decoder of the model with the given tokens (`Int32Array`) and encoder output (`Float32Array`). Returns a promise resolving to the decoded `Float32Array`.

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                              | Language     |
| ------------------------------------------------------------------ | ------------ |
| [whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en)   | English      |
| [whisper-tiny](https://huggingface.co/openai/whisper-tiny)         | Multilingual |
| [whisper-base.en](https://huggingface.co/openai/whisper-base.en)   | English      |
| [whisper-base](https://huggingface.co/openai/whisper-base)         | Multilingual |
| [whisper-small.en](https://huggingface.co/openai/whisper-small.en) | English      |
| [whisper-small](https://huggingface.co/openai/whisper-small)       | Multilingual |
