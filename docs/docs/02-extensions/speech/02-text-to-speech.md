---
title: Text-to-Speech (TTS)
slug: /extensions/text-to-speech
description: 'Synthesize natural, streaming speech waveforms directly on-device in React Native using multi-stage neural pipelines (Supertonic and Kokoro).'
keywords:
  [
    react native,
    text to speech,
    tts,
    speech synthesis,
    supertonic,
    kokoro,
    phonemizer,
    vocoder,
    audio streaming,
    mobile ml,
    on-device ai,
  ]
---

# Text-to-Speech (TTS)

The Text-to-Speech extension synthesizes natural, expressive spoken audio waveforms directly on-device from input text.

Speech synthesis operates through multi-stage neural pipelines that combine phonetic transcription or character indexing, duration prediction, acoustic modeling, and neural vocoder audio decompression. Because different model families use fundamentally distinct multi-stage architectures, the library provides dedicated pipelines for each:

- **Supertonic ([`createSupertonicTextToSpeech`](../../06-api-reference/functions/createSupertonicTextToSpeech.md))**: A 4-stage multilingual flow-matching model (44.1 kHz) that coordinates a text encoder, duration predictor, vector estimator, and vocoder with multi-speaker voice style conditioning.
- **Kokoro ([`createKokoroTextToSpeech`](../../06-api-reference/functions/createKokoroTextToSpeech.md))**: A 2-stage phoneme-driven model (24 kHz) that pairs language-specific grapheme-to-phoneme (G2P) transcription with a duration predictor, acoustic synthesizer, and voice embedding matrices.

Both pipelines are wrapped uniformly by the [`useTextToSpeech`](../../06-api-reference/functions/useTextToSpeech.md) React hook.

<!-- GIF DEMO PLACEHOLDER: Place TTS demo gif here, e.g. ![Text to Speech Demo](./media/tts.gif) -->

## Quick Start

The [`useTextToSpeech`](../../06-api-reference/functions/useTextToSpeech.md) hook manages downloading all sub-model weights, phonemizers, and voice files. To achieve low Time-to-First-Audio (TTFA) and seamless gapless playback, pipe the generated chunks directly to an audio buffer queue such as [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api):

```tsx
import { useState } from 'react';
import { models, useTextToSpeech, KOKORO_SAMPLE_RATE } from 'react-native-executorch';
import { useAudioPlayer } from './hooks/useAudioPlayer'; // Custom helper hook built with react-native-audio-api

function SpeechComponent() {
  const [prompt, setPrompt] = useState('');
  const tts = useTextToSpeech(models.textToSpeech.KOKORO.EN_US.DEFAULT);
  const player = useAudioPlayer(KOKORO_SAMPLE_RATE); // 24000 Hz

  // Hook state:
  // tts.isReady          — true once all sub-models and voice assets are loaded
  // tts.downloadProgress — 0.0 to 1.0 download progress across all files
  // tts.error            — Error instance if download or load failed

  const handleSpeak = async () => {
    if (!tts.isReady || !tts.synthesize || !prompt.trim()) return;

    // Start synthesis stream (yielding sentence-by-sentence chunks)
    const chunksStream = tts.synthesize(prompt, { voice: 'af_heart' });

    // Stream chunks directly into the audio buffer queue for instant playback
    await player.playStream(chunksStream);
  };

  const handleStop = () => {
    tts.synthesizeStop?.(); // Abort background generation
    player.stop(); // Clear audio buffers and stop playback
  };
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/text-to-speech.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/text-to-speech.tsx>) and [`src/hooks/useAudioPlayer.ts`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/hooks/useAudioPlayer.ts) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete example featuring voice selection, `react-native-audio-api` buffer queue streaming, Time-to-First-Audio (TTFA) benchmarking, and live waveform visualization.
:::

## Output Format

[`synthesize()`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesize) returns an [`AsyncGenerator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) yielding audio chunks ([`KokoroTtsChunk`](../../06-api-reference/type-aliases/KokoroTtsChunk.md) or [`SupertonicTtsChunk`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md)) sequentially as each sentence finishes synthesis:

```typescript
type TtsChunk = {
  /** Float32 PCM audio samples normalized in [-1.0, 1.0] */
  readonly audio: Float32Array;
  /** Audio sampling rate in Hz (44100 for Supertonic, 24000 for Kokoro) */
  readonly sampleRate: number;
  /** Duration of this synthesized chunk in seconds */
  readonly duration: number;
  /** Zero-based index of this chunk */
  readonly chunkIndex: number;
  /** Total number of chunks partitioned from the input text */
  readonly totalChunks: number;
};
```

## How Streaming Works

On-device text-to-speech is built for instant audio feedback:

- **Sentence-by-Sentence Streaming**: Long text is automatically split into natural phrases. Instead of waiting for an entire paragraph to finish generating, audio chunks are yielded one by one as each sentence is synthesized.
- **Immediate Playback**: Your app can start playing the first sentence right away while subsequent sentences are generated seamlessly in the background.
- **Smooth UI**: Audio generation runs in the background so your app's user interface and animations stay completely smooth.
- **Cancellation**: Calling [`synthesizeStop()`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesizestop) signals the generator to stop, halting synthesis before subsequent chunks are computed.

## Imperative Pipelines

For background services, audio workers, or non-React component logic, you can instantiate the pipelines imperatively using [`createSupertonicTextToSpeech`](../../06-api-reference/functions/createSupertonicTextToSpeech.md) or [`createKokoroTextToSpeech`](../../06-api-reference/functions/createKokoroTextToSpeech.md):

```typescript
import { createKokoroTextToSpeech, download, models } from 'react-native-executorch';

// Download and cache remote model weights, phonemizers, and voice files
const model = await download(models.textToSpeech.KOKORO.EN_US.DEFAULT);
const tts = await createKokoroTextToSpeech(model);

try {
  const chunksStream = tts.synthesize('Hello from offline text-to-speech!', {
    voice: 'af_heart',
    speed: 1.0,
  });

  for await (const chunk of chunksStream) {
    console.log(`Chunk generated: ${chunk.duration.toFixed(2)}s`);
  }
} finally {
  // Always release native model memory and buffers when done
  tts.dispose();
}
```

## Available Models

The library provides ready-to-use Text-to-Speech models from the [Software Mansion HuggingFace Text to Speech Collection](https://huggingface.co/collections/software-mansion/text-to-speech), pre-packaged with neural G2P phonemizers and voice presets in [`models.textToSpeech`](../../06-api-reference/variables/models.md#texttospeech):

| Model                          | Variants                                                                 | Sub-Models & Assets                                                          | Sample Rate | Size Range  | Supported Backends                           | Supported Languages                                                                                                                                                                | Notes                                                                                                                                                                                                        |
| :----------------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :---------- | :---------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supertonic 3**               | [See](../../06-api-reference/variables/models.md#texttospeechsupertonic) | Text Encoder, Duration Predictor, Vector Estimator, Vocoder, Voice Styles    | 44.1 kHz    | 398 MB      | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | [English, Spanish, French, German, Korean, Japanese, Chinese & more](../../06-api-reference/react-native-executorch/namespaces/speech/variables/SUPERTONIC_SUPPORTED_LANGUAGES.md) | Faster generation and broad multilingual coverage across 10 bundled [speaker styles](../../06-api-reference/variables/SUPERTONIC_DEFAULT_VOICE_NAMES.md), with slightly lower voice naturalness than Kokoro. |
| **Kokoro (Language Packages)** | [See](../../06-api-reference/variables/models.md#texttospeechkokoro)     | Duration Predictor, Synthesizer, G2P Lexicon / Neural Model, Language Voices | 24.0 kHz    | 332 MB each | XNNPACK (CPU), Core ML (Apple)               | English (US/GB), Spanish, French, Italian, Portuguese, Hindi, Polish, German                                                                                                       | Exceptional voice naturalness and intonation per language package, but heavier compute per synthesized chunk.                                                                                                |

:::note Model-Specific Pipelines
Because Text-to-Speech architectures require distinct multi-model orchestration in TypeScript (coordinating phonemizers, duration predictors, flow-matching loops, and neural vocoders), TTS pipelines are model-specific. To use custom voices or fine-tuned weights, provide your modified `.pte` models or custom voice JSON/BIN files matching the [`SupertonicTtsModel`](../../06-api-reference/type-aliases/SupertonicTtsModel.md) or [`KokoroTtsModel`](../../06-api-reference/type-aliases/KokoroTtsModel.md) specifications.
:::

## API Reference

### Hooks & Pipelines

- [`useTextToSpeech()`](../../06-api-reference/functions/useTextToSpeech.md) — Unified React hook for Supertonic and Kokoro Text-to-Speech pipelines.
- [`createSupertonicTextToSpeech()`](../../06-api-reference/functions/createSupertonicTextToSpeech.md) — Imperative factory for the Supertonic 3 TTS pipeline.
- [`createKokoroTextToSpeech()`](../../06-api-reference/functions/createKokoroTextToSpeech.md) — Imperative factory for the Kokoro TTS pipeline.

### Types & Options

- [`SupertonicTextToSpeech`](../../06-api-reference/type-aliases/SupertonicTextToSpeech.md) — Supertonic pipeline runner interface ([`synthesize`](../../06-api-reference/type-aliases/SupertonicTextToSpeech.md#synthesize), [`synthesizeStop`](../../06-api-reference/type-aliases/SupertonicTextToSpeech.md#synthesizestop), `dispose`).
- [`KokoroTextToSpeech`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md) — Kokoro pipeline runner interface ([`synthesize`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesize), [`synthesizeStop`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesizestop), `dispose`).
- [`SupertonicTtsChunk`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md) — Audio buffer chunk yielded by Supertonic ([`audio`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#audio), [`sampleRate`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#samplerate), [`duration`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#duration), [`chunkIndex`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#chunkindex), [`totalChunks`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#totalchunks)).
- [`KokoroTtsChunk`](../../06-api-reference/type-aliases/KokoroTtsChunk.md) — Audio buffer chunk yielded by Kokoro ([`audio`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#audio), [`sampleRate`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#samplerate), [`duration`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#duration), [`chunkIndex`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#chunkindex), [`totalChunks`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#totalchunks)).
- [`SupertonicTtsModel`](../../06-api-reference/type-aliases/SupertonicTtsModel.md) — Supertonic model and asset configuration spec.
- [`KokoroTtsModel`](../../06-api-reference/type-aliases/KokoroTtsModel.md) — Kokoro model and asset configuration spec.
- [`SupertonicTtsOptions`](../../06-api-reference/type-aliases/SupertonicTtsOptions.md) — Execution options for Supertonic synthesis (`voice`, `speed`, `totalSteps`).
- [`KokoroTtsOptions`](../../06-api-reference/type-aliases/KokoroTtsOptions.md) — Execution options for Kokoro synthesis (`voice`, `speed`, `phonemize`).
- [`speech.PhonemizerLanguage`](../../06-api-reference/react-native-executorch/namespaces/speech/type-aliases/PhonemizerLanguage.md) — Supported language codes for G2P phonemization.
- [`speech.PhonemizerConfig`](../../06-api-reference/react-native-executorch/namespaces/speech/type-aliases/PhonemizerConfig.md) — Neural G2P phonemizer and pronunciation lexicon config.

### Constants & Model Presets

- [`KOKORO_SAMPLE_RATE`](../../06-api-reference/variables/KOKORO_SAMPLE_RATE.md) — Kokoro output sample rate constant (24000 Hz).
- [`SUPERTONIC_SAMPLE_RATE`](../../06-api-reference/variables/SUPERTONIC_SAMPLE_RATE.md) — Supertonic output sample rate constant (44100 Hz).
- [`SUPERTONIC_DEFAULT_VOICE_NAMES`](../../06-api-reference/variables/SUPERTONIC_DEFAULT_VOICE_NAMES.md) — Default bundled voice style names for Supertonic.
- [`speech.SUPERTONIC_SUPPORTED_LANGUAGES`](../../06-api-reference/react-native-executorch/namespaces/speech/variables/SUPERTONIC_SUPPORTED_LANGUAGES.md) — Supported language codes for Supertonic.
- [`speech.KOKORO_PAUSE_MS`](../../06-api-reference/react-native-executorch/namespaces/speech/variables/KOKORO_PAUSE_MS.md) — Pause duration in milliseconds inserted between clauses.
- [`models.textToSpeech`](../../06-api-reference/variables/models.md#texttospeech) — Pre-configured TTS models registry.
