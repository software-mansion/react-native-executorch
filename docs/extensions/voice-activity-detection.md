# Voice Activity Detection (VAD)

The Voice Activity Detection extension detects speech presence and segments audio into spoken and silent intervals directly on-device using a lightweight Feedforward Sequential Memory Network (FSMN-VAD) model.

The pipeline supports two primary workflows:

* [**Live Microphone Event Stream**](#live-microphone-streaming): Processes incoming audio chunks from a microphone recorder in real time, firing `'speechStart'` and `'speechEnd'` transitions.
* [**Batch Audio Segmentation**](#batch-audio-segmentation): Analyzes an entire recorded audio buffer and returns an array of timestamped speech segments in seconds.

| iOS                                                                 | Android                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [](/react-native-executorch/media/voice-activity-detection-ios.mp4) | [](/react-native-executorch/media/voice-activity-detection-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useVoiceActivityDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVoiceActivityDetector) hook manages downloading the model weights and provides live streaming methods. To capture live audio, stream PCM chunks from a microphone recorder such as [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api) directly into [`detectVoiceOnStream()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoiceonstream):

```tsx
import { useState } from 'react';
import { FSMN_VAD_SAMPLE_RATE_HZ, models, useVoiceActivityDetector } from 'react-native-executorch';
import { useAudioRecorder } from './hooks/useAudioRecorder'; // Custom helper built with react-native-audio-api

function VadComponent() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const vad = useVoiceActivityDetector(models.voiceActivityDetection.FSMN_VAD.DEFAULT);
  const recorder = useAudioRecorder();

  // Hook state:
  // vad.isReady          — true once FSMN-VAD model is loaded in memory
  // vad.downloadProgress — 0 to 100 download progress
  // vad.error            — Error instance if download or load failed
  // vad.resource         — resolved config with all URLs replaced by local file paths

  const handleToggleStreaming = async () => {
    if (recorder.isRecording) {
      await recorder.stopRecording();
      vad.resetStream?.();
      setIsSpeaking(false);
      return;
    }

    if (!vad.isReady || !vad.detectVoiceOnStream || !vad.resetStream) return;

    vad.resetStream(); // Clear internal rolling buffer
    setIsSpeaking(false);

    // Stream live microphone PCM chunks (16 kHz mono Float32)
    await recorder.startRecording(
      FSMN_VAD_SAMPLE_RATE_HZ,
      (samples) => {
        const event = vad.detectVoiceOnStream!(samples, { detectionMargin: 300 });
        if (event === 'speechStart') {
          setIsSpeaking(true);
        } else if (event === 'speechEnd') {
          setIsSpeaking(false);
        }
      },
      1600 // ~100 ms chunk size
    );
  };
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/voice-activity-detection.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/src/app/\(screens\)/voice-activity-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen featuring microphone controls, real-time speech indicators, and live audio streaming.

## Live Microphone Streaming[​](#live-microphone-streaming "Direct link to Live Microphone Streaming")

[`detectVoiceOnStream()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoiceonstream) appends incoming audio samples to an internal 2.5-second bounded rolling window and runs fast inference (taking \~2–5 ms).

### Output Event Type[​](#output-event-type "Direct link to Output Event Type")

[`detectVoiceOnStream()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoiceonstream) returns a [`VadEvent`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadEvent) on transition states, or `undefined` when the voice activity state hasn't changed:

```typescript
type VadEvent = 'speechStart' | 'speechEnd' | undefined;

```

* **`'speechStart'`**: Fired when speech probability stays above [`speechThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadOptions#speechthreshold) for at least [`minSpeechDurationMs`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadOptions#minspeechdurationms) (default: 250 ms).
* **`'speechEnd'`**: Fired when speech ceases and remains silent for at least [`minSilenceDurationMs`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadOptions#minsilencedurationms) (default: 220 ms).
* **`undefined`**: Fired on regular frames when no transition boundary has occurred.

Before starting a new recording stream, call [`resetStream()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#resetstream) to clear past audio history from the rolling buffer.

## Batch Audio Segmentation[​](#batch-audio-segmentation "Direct link to Batch Audio Segmentation")

To process a pre-recorded audio buffer all at once, call [`detectVoice()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoice):

```typescript
// audioData: Float32Array PCM samples at 16000 Hz
const segments = await vad.detectVoice(audioData);

for (const segment of segments) {
  console.log(`Speech detected from ${segment.start.toFixed(2)}s to ${segment.end.toFixed(2)}s`);
}

```

Each [`VadSegment`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadSegment) contains timestamps in seconds:

```typescript
type VadSegment = {
  /** Start time of the speech segment in seconds */
  readonly start: number;
  /** End time of the speech segment in seconds */
  readonly end: number;
};

```

## Detection Tuning & Options[​](#detection-tuning--options "Direct link to Detection Tuning & Options")

You can customize threshold parameters per call by passing [`VadOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadOptions):

```typescript
const customSegments = await vad.detectVoice(audioData, {
  speechThreshold: 0.5, // Minimum probability threshold (0.0 to 1.0, default: 0.5)
  minSpeechDurationMs: 250, // Min continuous speech duration to open a segment (default: 250 ms)
  minSilenceDurationMs: 220, // Min silence duration to close a segment (default: 220 ms)
  speechPadMs: 300, // Padding added before/after detected speech (default: 300 ms)
  mergeGapMs: 400, // Gap below which adjacent segments are merged (default: 400 ms)
});

```

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background tasks, offline audio preprocessing, or non-React component logic, instantiate the pipeline imperatively using [`createFsmnVoiceActivityDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createFsmnVoiceActivityDetector):

```typescript
import { createFsmnVoiceActivityDetector, download, models } from 'react-native-executorch';

// Download and cache FSMN-VAD weights
const model = await download(models.voiceActivityDetection.FSMN_VAD.DEFAULT);
const detector = await createFsmnVoiceActivityDetector(model);

try {
  const segments = await detector.detectVoice(audioData);
  console.log('Detected segments:', segments);
} finally {
  // Always release native model memory when done
  detector.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For synchronous worklet execution contexts or frame-by-frame audio processors, [`createFsmnVoiceActivityDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createFsmnVoiceActivityDetector) exposes a synchronous [`detectVoiceWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoiceworklet) function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const segments = detector.detectVoiceWorklet(audioData);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides the optimized FSMN-VAD model from the [Software Mansion HuggingFace Voice Activity Detection Collection](https://huggingface.co/collections/software-mansion/voice-activity-detection), available in [`models.voiceActivityDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#voiceactivitydetection):

| Model        | Variants                                                                                                                     | Size Range | Sample Rate | Supported Backends | Notes                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------- |
| **FSMN-VAD** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#voiceactivitydetectionfsmn_vad) | 1.8 MB     | 16000 Hz    | XNNPACK (CPU)      | Compact, low-latency Feedforward Sequential Memory Network for continuous speech detection. |

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useVoiceActivityDetector()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVoiceActivityDetector) — React hook for FSMN-VAD downloading, state, and live streaming.
* [`createFsmnVoiceActivityDetector()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createFsmnVoiceActivityDetector) — Imperative factory for FSMN-VAD task pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`FsmnVoiceActivityDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector) — VAD runner interface ([`detectVoice`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoice), [`detectVoiceWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoiceworklet), [`detectVoiceOnStream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#detectvoiceonstream), [`resetStream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVoiceActivityDetector#resetstream), `dispose`).
* [`VadSegment`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadSegment) — Speech interval with start and end times in seconds.
* [`VadEvent`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadEvent) — Stream transition event union (`'speechStart'`, `'speechEnd'`).
* [`VadOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadOptions) — Tunable threshold parameters (`speechThreshold`, `minSpeechDurationMs`, `minSilenceDurationMs`, `speechPadMs`, `mergeGapMs`).
* [`VadStreamOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/VadStreamOptions) — Stream execution options extending `VadOptions` with `detectionMargin`.
* [`FsmnVadModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/FsmnVadModel) — Model configuration spec.

### Constants & Model Presets[​](#constants--model-presets "Direct link to Constants & Model Presets")

* [`FSMN_VAD_SAMPLE_RATE_HZ`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/FSMN_VAD_SAMPLE_RATE_HZ) — Expected audio input sample rate constant (16000 Hz).
* [`models.voiceActivityDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#voiceactivitydetection) — Pre-configured VAD models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts)
