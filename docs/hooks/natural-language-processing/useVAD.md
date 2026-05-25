# useVAD

Voice Activity Detection (VAD) is the task of analyzing an audio signal to identify time segments containing human speech, separating them from non-speech sections like silence and background noise.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useVAD` see: [`useVAD` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVAD).
* For all VAD models available out-of-the-box in React Native ExecuTorch see: [VAD Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---voice-activity-detection).

## Static Audio (Batch) processing[​](#static-audio-batch-processing "Direct link to Static Audio (Batch) processing")

This mode is best suited for processing pre-recorded audio files or existing buffers. You provide a full waveform to the `forward` method, which returns an array of detected speech segments.

```typescript
import { useVAD, models } from 'react-native-executorch';

const model = useVAD({ model: models.vad.fsmn_vad() });

// ... obtain audioBuffer (Float32Array) at 16kHz ...

try {
  const speechSegments = await model.forward(audioBuffer);
  console.log('Speech detected at:', speechSegments);
} catch (error) {
  console.error('VAD Error:', error);
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Timestamps in `Segment[]` correspond to the indices of the input array. Divide them by your sampling rate (usually 16000) to get results in seconds.

## Live Streaming (Real-time detection)[​](#live-streaming-real-time-detection "Direct link to Live Streaming (Real-time detection)")

Live streaming allows you to process audio in real-time as it arrives from a microphone or network stream. It uses an internal state to track speech transitions across chunks.

### How it works[​](#how-it-works "Direct link to How it works")

1. **Start the session**: Call `model.stream()` with callbacks for speech events. This returns a promise that stays active until the stream is stopped.
2. **Feed audio**: Periodically push audio chunks using `model.streamInsert()`.
3. **Handle events**: Use `onSpeechBegin` and `onSpeechEnd` callbacks to trigger UI updates or toggle recording for other tasks (like STT).
4. **End the session**: Call `model.streamStop()` to clean up.

### Configuration Options[​](#configuration-options "Direct link to Configuration Options")

You can fine-tune the streaming behavior via the `options` object:

* **`timeout`** (default: `100`ms): Specifies the interval between consecutive VAD inferences. A lower value makes the detection more responsive but increases CPU usage.
* **`detectionMargin`** (default: `100`ms): Specifies the maximum allowed gap between the last detected speech segment and the current time to still consider the speech as "ongoing." This value determines how much silence is tolerated before `onSpeechEnd` is triggered.

```tsx
import { useVAD, models } from 'react-native-executorch';
import { AudioRecorder } from 'react-native-audio-api';

const model = useVAD({ model: models.vad.fsmn_vad() });
const recorder = new AudioRecorder();

const startLiveVAD = async () => {
  // Start the continuous streaming listener
  model.stream({
    onSpeechBegin: () => console.log('User started speaking'),
    onSpeechEnd: () => console.log('User stopped speaking'),
    options: {
      timeout: 100, // Checks every 100ms
      detectionMargin: 500, // 500ms of silence before ending speech
    },
  });

  // Capture microphone input at 16kHz
  recorder.onAudioReady(
    { sampleRate: 16000, bufferLength: 1600, channelCount: 1 },
    (chunk) => model.streamInsert(chunk.buffer.getChannelData(0))
  );

  await recorder.start();
};

const stopLiveVAD = () => {
  recorder.stop();
  model.streamStop();
};

```

### Arguments & Returns[​](#arguments--returns "Direct link to Arguments & Returns")

* **Arguments**: `useVAD` takes a [`VADProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/VADProps) object containing the `model` and an optional `preventLoad` flag.
* **Returns**: A [`VADType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/VADType) object providing `forward`, `stream`, `streamInsert`, and `streamStop` methods, along with `error`, `isReady`, `isGenerating`, and `downloadProgress` states.

## Supported models[​](#supported-models "Direct link to Supported models")

* [fsmn-vad](https://huggingface.co/collections/software-mansion/voice-activity-detection)
