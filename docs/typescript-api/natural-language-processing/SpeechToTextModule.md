# SpeechToTextModule

The `SpeechToTextModule` class provides a direct interface to the library's speech-to-text (STT) capabilities. While [`useSpeechToText`](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useSpeechToText.md) is the preferred way for React components, this module offers full control over the model's lifecycle and is suitable for non-React contexts or advanced use cases.

## API Reference[​](#api-reference "Direct link to API Reference")

* [`SpeechToTextModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule)
* [STT Models List](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text)

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

You can transcribe audio in two ways: **one-shot** (for files/short clips) and **streaming** (for live microphone input).

```typescript
import { SpeechToTextModule, models } from 'react-native-executorch';

// Initialize the model with VAD submodule
const model = await SpeechToTextModule.fromModelName(
  models.speech_to_text.whisper_tiny_en(),
  models.vad.fsmn_vad(), // Optional VAD submodule
  (progress) => {
    console.log(`Loading: ${progress * 100}%`);
  }
);

// 1. One-shot transcription (returns TranscriptionResult)
const result = await model.transcribe(waveform);
console.log(result.text);

// 2. Live streaming (yields partial/stable results)
model.streamInsert(audioChunk);
const stream = model.stream({ useVAD: true }); // Enable VAD logic
for await (const { committed, nonCommitted } of stream) {
  // Update UI live with stable and partial text
}

```

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#frommodelname) factory method. It accepts a configuration object with the following fields:

* [`isMultilingual`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#ismultilingual) - Flag indicating if model is multilingual.
* [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#modelsource) - The location of the used model (bundled encoder + decoder functionality).
* [`tokenizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SpeechToTextModelConfig#tokenizersource) - The location of the used tokenizer.

And an optional second argument:

* `onDownloadProgress` - Callback to track download progress (returns a value between 0 and 1).

For more information on resource management, see [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md).

## Transcription (Files & Short Clips)[​](#transcription-files--short-clips "Direct link to Transcription (Files & Short Clips)")

To run transcription on a complete audio clip, use the [`transcribe`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SpeechToTextModule#transcribe) method. It accepts a `Float32Array` representing a waveform at **16kHz sampling rate**.

### Transcribe Options[​](#transcribe-options "Direct link to Transcribe Options")

The `transcribe()` function accepts an optional configuration object:

* `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
* `verbose`: If `true`, the method returns a detailed `TranscriptionResult` object following the OpenAI Whisper `verbose_json` format (including segments and word-level timestamps).

## Live Streaming Transcription[​](#live-streaming-transcription "Direct link to Live Streaming Transcription")

The **Streaming API** is optimized for live microphone input or real-time audio feeds. It handles audio inputs of arbitrary length by automatically managing context windows to bypass the standard 30-second limit.

### Streaming Options[​](#streaming-options "Direct link to Streaming Options")

The `stream()` function accepts several optional parameters:

* `language`: The language code (e.g., `'es'`, `'fr'`). Required for multilingual models.
* `verbose`: If `true`, includes word-level timestamps and segment metadata in the result objects.
* `timeout`: (Advanced) The interval (in milliseconds) between processing consecutive audio chunks. Lower values provide more frequent updates, while higher values reduce CPU consumption. Defaults to `100`.
* `useVAD`: Enable the Voice Activity Detection submodule (if configured during load) to improve performance by skipping silence.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

* **`committed`**: Finalized transcription that is stable and will not change. Useful for building a persistent transcript record.
* **`nonCommitted`**: Partial transcription that is still being processed and may update as more context arrives. Useful for live UI updates.

### Live Example[​](#live-example "Direct link to Live Example")

In this example, we use [`react-native-audio-api`](https://docs.swmansion.com/react-native-audio-api/) to feed live audio into the model.

```tsx
import { SpeechToTextModule, models } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

const model = await SpeechToTextModule.fromModelName(
  models.speech_to_text.whisper_tiny_en(),
  models.vad.fsmn_vad()
);

// 1. Configure audio session & permissions
AudioManager.setAudioSessionOptions({
  iosCategory: 'playAndRecord',
  iosMode: 'spokenAudio',
  iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
});
await AudioManager.requestRecordingPermissions();

// 2. Setup Audio Recorder
const recorder = new AudioRecorder();

recorder.onAudioReady(
  { sampleRate: 16000, bufferLength: 1600, channelCount: 1 },
  (chunk) => {
    // Feed chunks directly into the model's buffer
    model.streamInsert(chunk.buffer.getChannelData(0));
  }
);

await recorder.start();

// 3. Process the Stream
try {
  let stableTranscript = '';
  const streamIter = model.stream({ useVAD: true });

  for await (const { committed, nonCommitted } of streamIter) {
    if (committed.text) stableTranscript += committed.text;

    // UI should display: stableTranscript + nonCommitted.text
    console.log('Live Transcript:', stableTranscript + nonCommitted.text);
  }
} catch (error) {
  console.error('Streaming error:', error);
}

// 4. Cleanup
model.streamStop();
recorder.stop();

```

## Advanced Features[​](#advanced-features "Direct link to Advanced Features")

### VAD Integration (Recommended for Live)[​](#vad-integration-recommended-for-live "Direct link to VAD Integration (Recommended for Live)")

Integrating **Voice Activity Detection (VAD)** as a submodule improves streaming performance by automatically removing silence. This reduces CPU usage, saves battery, and prevents hallucinations during silent periods.

To use it, provide the VAD model configuration when loading the module and enable `useVAD` in the stream options:

```typescript
const model = await SpeechToTextModule.fromModelName(
  models.speech_to_text.whisper_tiny_en(),
  models.vad.fsmn_vad()
);

// Enable VAD logic in the stream context
const stream = model.stream({ useVAD: true });

```

### Multilingual Transcription[​](#multilingual-transcription "Direct link to Multilingual Transcription")

If you aim to obtain a transcription in languages other than English, use a multilingual Whisper model. To get the output in your desired language, pass the [`DecodingOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions) object with the [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DecodingOptions#language) field set to the target language code.

```typescript
const transcription = await model.transcribe(spanishAudio, { language: 'es' });

```

### Timestamps & Detailed Results[​](#timestamps--detailed-results "Direct link to Timestamps & Detailed Results")

Set `verbose: true` in the options to obtain word-level timestamps and other parameters. The result mimics the *verbose\_json* format from OpenAI Whisper API.

```typescript
const result = await model.transcribe(audioBuffer, { verbose: true });

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
