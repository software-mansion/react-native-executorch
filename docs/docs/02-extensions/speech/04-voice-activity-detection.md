---
title: Voice Activity Detection (VAD)
slug: /extensions/voice-activity-detection
description: 'Detect speech vs silence intervals in real time on-device in React Native using lightweight neural FSMN-VAD.'
keywords:
  [
    react native,
    voice activity detection,
    vad,
    speech detection,
    fsmn vad,
    audio streaming,
    silence detection,
    mobile ml,
    on-device ai,
  ]
---

# Voice Activity Detection (VAD)

The Voice Activity Detection extension detects speech presence and segments audio into spoken and silent intervals directly on-device using a lightweight Feedforward Sequential Memory Network (FSMN-VAD) model.

The pipeline supports two primary workflows:

- [**Live Microphone Event Stream**](#live-microphone-streaming): Processes incoming audio chunks from a microphone recorder in real time, firing `'speechStart'` and `'speechEnd'` transitions.
- [**Batch Audio Segmentation**](#batch-audio-segmentation): Analyzes an entire recorded audio buffer and returns an array of timestamped speech segments in seconds.

<!-- GIF DEMO PLACEHOLDER: Place VAD demo gif here, e.g. ![Voice Activity Detection Demo](./media/vad.gif) -->

## Quick Start

The [`useVoiceActivityDetector`](../../06-api-reference/functions/useVoiceActivityDetector.md) hook manages downloading the model weights and provides live streaming methods. To capture live audio, stream PCM chunks from a microphone recorder such as [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api) directly into [`detectVoiceOnStream()`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoiceonstream):

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
  // vad.downloadProgress — 0.0 to 1.0 download progress
  // vad.error            — Error instance if download or load failed

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

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/voice-activity-detection.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/voice-activity-detection.tsx>) and [`src/hooks/useAudioRecorder.ts`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/hooks/useAudioRecorder.ts) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete example featuring microphone controls, real-time speech indicators, and live audio streaming.
:::

## Live Microphone Streaming

[`detectVoiceOnStream()`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoiceonstream) appends incoming audio samples to an internal 2.5-second bounded rolling window and runs fast inference (taking ~2–5 ms).

### Output Event Type

[`detectVoiceOnStream()`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoiceonstream) returns a [`VadEvent`](../../06-api-reference/type-aliases/VadEvent.md) on transition states, or `undefined` when the voice activity state hasn't changed:

```typescript
type VadEvent = 'speechStart' | 'speechEnd' | undefined;
```

- **`'speechStart'`**: Fired when speech probability stays above [`speechThreshold`](../../06-api-reference/type-aliases/VadOptions.md#speechthreshold) for at least [`minSpeechDurationMs`](../../06-api-reference/type-aliases/VadOptions.md#minspeechdurationms) (default: 250 ms).
- **`'speechEnd'`**: Fired when speech ceases and remains silent for at least [`minSilenceDurationMs`](../../06-api-reference/type-aliases/VadOptions.md#minsilencedurationms) (default: 220 ms).
- **`undefined`**: Fired on regular frames when no transition boundary has occurred.

Before starting a new recording stream, call [`resetStream()`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#resetstream) to clear past audio history from the rolling buffer.

## Batch Audio Segmentation

To process a pre-recorded audio buffer all at once, call [`detectVoice()`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoice):

```typescript
// audioData: Float32Array PCM samples at 16000 Hz
const segments = await vad.detectVoice(audioData);

for (const segment of segments) {
  console.log(`Speech detected from ${segment.start.toFixed(2)}s to ${segment.end.toFixed(2)}s`);
}
```

Each [`VadSegment`](../../06-api-reference/type-aliases/VadSegment.md) contains timestamps in seconds:

```typescript
type VadSegment = {
  /** Start time of the speech segment in seconds */
  readonly start: number;
  /** End time of the speech segment in seconds */
  readonly end: number;
};
```

## Detection Tuning & Options

You can customize threshold parameters per call by passing [`VadOptions`](../../06-api-reference/type-aliases/VadOptions.md):

```typescript
const customSegments = await vad.detectVoice(audioData, {
  speechThreshold: 0.5, // Minimum probability threshold (0.0 to 1.0, default: 0.5)
  minSpeechDurationMs: 250, // Min continuous speech duration to open a segment (default: 250 ms)
  minSilenceDurationMs: 220, // Min silence duration to close a segment (default: 220 ms)
  speechPadMs: 300, // Padding added before/after detected speech (default: 300 ms)
  mergeGapMs: 400, // Gap below which adjacent segments are merged (default: 400 ms)
});
```

## Imperative API

For background tasks, offline audio preprocessing, or non-React component logic, instantiate the pipeline imperatively using [`createFsmnVoiceActivityDetector`](../../06-api-reference/functions/createFsmnVoiceActivityDetector.md):

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

## Synchronous Execution

For synchronous worklet execution contexts or frame-by-frame audio processors, [`createFsmnVoiceActivityDetector`](../../06-api-reference/functions/createFsmnVoiceActivityDetector.md) exposes a synchronous [`detectVoiceWorklet`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoiceworklet) function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const segments = detector.detectVoiceWorklet(audioData);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides the optimized FSMN-VAD model from the [Software Mansion HuggingFace Voice Activity Detection Collection](https://huggingface.co/collections/software-mansion/voice-activity-detection), available in [`models.voiceActivityDetection`](../../06-api-reference/variables/models.md#voiceactivitydetection):

| Model        | Variants                                                                         | Size Range | Sample Rate | Supported Backends | Notes                                                                                       |
| :----------- | :------------------------------------------------------------------------------- | :--------- | :---------- | :----------------- | :------------------------------------------------------------------------------------------ |
| **FSMN-VAD** | [See](../../06-api-reference/variables/models.md#voiceactivitydetectionfsmn_vad) | 1.8 MB     | 16000 Hz    | XNNPACK (CPU)      | Compact, low-latency Feedforward Sequential Memory Network for continuous speech detection. |

## API Reference

### Hooks & Pipelines

- [`useVoiceActivityDetector()`](../../06-api-reference/functions/useVoiceActivityDetector.md) — React hook for FSMN-VAD downloading, state, and live streaming.
- [`createFsmnVoiceActivityDetector()`](../../06-api-reference/functions/createFsmnVoiceActivityDetector.md) — Imperative factory for FSMN-VAD task pipelines.

### Types & Options

- [`FsmnVoiceActivityDetector`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md) — VAD runner interface ([`detectVoice`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoice), [`detectVoiceWorklet`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoiceworklet), [`detectVoiceOnStream`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#detectvoiceonstream), [`resetStream`](../../06-api-reference/type-aliases/FsmnVoiceActivityDetector.md#resetstream), `dispose`).
- [`VadSegment`](../../06-api-reference/type-aliases/VadSegment.md) — Speech interval with start and end times in seconds.
- [`VadEvent`](../../06-api-reference/type-aliases/VadEvent.md) — Stream transition event union (`'speechStart'`, `'speechEnd'`).
- [`VadOptions`](../../06-api-reference/type-aliases/VadOptions.md) — Tunable threshold parameters (`speechThreshold`, `minSpeechDurationMs`, `minSilenceDurationMs`, `speechPadMs`, `mergeGapMs`).
- [`VadStreamOptions`](../../06-api-reference/type-aliases/VadStreamOptions.md) — Stream execution options extending `VadOptions` with `detectionMargin`.
- [`FsmnVadModel`](../../06-api-reference/type-aliases/FsmnVadModel.md) — Model configuration spec.

### Constants & Model Presets

- [`FSMN_VAD_SAMPLE_RATE_HZ`](../../06-api-reference/variables/FSMN_VAD_SAMPLE_RATE_HZ.md) — Expected audio input sample rate constant (16000 Hz).
- [`models.voiceActivityDetection`](../../06-api-reference/variables/models.md#voiceactivitydetection) — Pre-configured VAD models registry.
