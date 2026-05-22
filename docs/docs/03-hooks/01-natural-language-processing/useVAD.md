---
title: useVAD
---

Voice Activity Detection (VAD) is the task of analyzing an audio signal to identify time segments containing human speech, separating them from non-speech sections like silence and background noise.

:::info
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useVAD` see: [`useVAD` API Reference](../../06-api-reference/functions/useVAD.md).
- For all VAD models available out-of-the-box in React Native ExecuTorch see: [VAD Models](../../06-api-reference/index.md#models---voice-activity-detection).

## Static Audio (Batch) processing

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

:::note
Timestamps in `Segment[]` correspond to the indices of the input array. Divide them by your sampling rate (usually 16000) to get results in seconds.
:::

## Live Streaming (Real-time detection)

Live streaming allows you to process audio in real-time as it arrives from a microphone or network stream. It uses an internal state to track speech transitions across chunks.

### How it works

1.  **Start the session**: Call `model.stream()` with callbacks for speech events. This returns a promise that stays active until the stream is stopped.
2.  **Feed audio**: Periodically push audio chunks using `model.streamInsert()`.
3.  **Handle events**: Use `onSpeechBegin` and `onSpeechEnd` callbacks to trigger UI updates or toggle recording for other tasks (like STT).
4.  **End the session**: Call `model.streamStop()` to clean up.

### Configuration Options

You can fine-tune the streaming behavior via the `options` object:

- **`timeout`** (default: `100`ms): Specifies the interval between consecutive VAD inferences. A lower value makes the detection more responsive but increases CPU usage.
- **`detectionMargin`** (default: `100`ms): Specifies the maximum allowed gap between the last detected speech segment and the current time to still consider the speech as "ongoing." This value determines how much silence is tolerated before `onSpeechEnd` is triggered.

```tsx
import { useVAD, models } from 'react-native-executorch';

const model = useVAD({ model: models.vad.fsmn_vad() });

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

  // Example: Hook into your audio recorder's data event
  audioRecorder.on('data', (chunk: Float32Array) => {
    model.streamInsert(chunk);
  });
};

const stopLiveVAD = () => {
  model.streamStop();
};
```

### Arguments & Returns

- **Arguments**: `useVAD` takes a [`VADProps`](../../06-api-reference/interfaces/VADProps.md) object containing the `model` and an optional `preventLoad` flag.
- **Returns**: A [`VADType`](../../06-api-reference/interfaces/VADType.md) object providing `forward`, `stream`, `streamInsert`, and `streamStop` methods, along with `isReady` and `error` states.

## Supported models

- [fsmn-vad](https://huggingface.co/collections/software-mansion/voice-activity-detection)
