---
title: Text-to-Speech (TTS)
slug: /extensions/text-to-speech
description: 'Synthesize natural, streaming speech waveforms directly on-device in React Native using multi-stage neural pipelines (Supertonic, Kokoro and Reverb, with voice cloning).'
keywords:
  [
    react native,
    text to speech,
    tts,
    speech synthesis,
    voice cloning,
    supertonic,
    kokoro,
    reverb,
    phonemizer,
    vocoder,
    audio streaming,
    mobile ml,
    on-device ai,
  ]
---

import TaskShowcase from '@site/src/components/TaskShowcase';

# Text-to-Speech (TTS)

The Text-to-Speech extension synthesizes natural, expressive spoken audio waveforms directly on-device from input text.

Speech synthesis operates through multi-stage neural pipelines that combine phonetic transcription or character indexing, duration prediction, acoustic modeling, and neural vocoder audio decompression. Because different model families use fundamentally distinct multi-stage architectures, the library provides dedicated pipelines for each:

- **Supertonic ([`createSupertonicTextToSpeech`](../../06-api-reference/functions/createSupertonicTextToSpeech.md))**: A 4-stage multilingual flow-matching model (44.1 kHz) that coordinates a text encoder, duration predictor, vector estimator, and vocoder with multi-speaker voice style conditioning.
- **Kokoro ([`createKokoroTextToSpeech`](../../06-api-reference/functions/createKokoroTextToSpeech.md))**: A 2-stage phoneme-driven model (24 kHz) that pairs language-specific grapheme-to-phoneme (G2P) transcription with a duration predictor, acoustic synthesizer, and voice embedding matrices.
- **Reverb ([`createReverbTextToSpeech`](../../06-api-reference/functions/createReverbTextToSpeech.md))**: A multilingual codec language model (24 kHz) that speaks in the voice of any short recording. A backbone fills in the audio codec tokens of the speech in a few parallel passes, conditioned on the text and a reference voice, and the codec decoder turns them into a waveform. The codec encoder makes new voices on-device — see [Voice Cloning](#voice-cloning-reverb).

All three pipelines are wrapped uniformly by the [`useTextToSpeech`](../../06-api-reference/functions/useTextToSpeech.md) React hook.

<TaskShowcase task="text-to-speech" />

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
  // tts.downloadProgress — 0 to 100 download progress across all files
  // tts.error            — Error instance if download or load failed
  // tts.resource         — resolved config with all URLs replaced by local file paths

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
See [`src/app/(screens)/text-to-speech.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/text-to-speech.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen featuring streamed playback and synchronized word highlighting.
:::

## Output Format

[`synthesize()`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesize) returns an [`AsyncGenerator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) yielding audio chunks ([`KokoroTtsChunk`](../../06-api-reference/type-aliases/KokoroTtsChunk.md), [`SupertonicTtsChunk`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md) or [`ReverbTtsChunk`](../../06-api-reference/type-aliases/ReverbTtsChunk.md)) sequentially as each sentence finishes synthesis:

```typescript
type TtsChunk = {
  /** Float32 PCM audio samples normalized in [-1.0, 1.0] */
  readonly audio: Float32Array;
  /** Audio sampling rate in Hz (44100 for Supertonic, 24000 for Kokoro and Reverb) */
  readonly sampleRate: number;
  /** Duration of this synthesized chunk in seconds */
  readonly duration: number;
  /** Zero-based index of this chunk */
  readonly chunkIndex: number;
  /** Total number of chunks partitioned from the input text */
  readonly totalChunks: number;
};
```

Kokoro chunks also carry [`words`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#words): the input words spoken in the chunk, each with its `offset` in the input text and `start`/`end` times in seconds from the beginning of the first chunk, e.g. to highlight the word being read.

## How Streaming Works

On-device text-to-speech is built for instant audio feedback:

- **Sentence-by-Sentence Streaming**: Long text is automatically split into natural phrases. Instead of waiting for an entire paragraph to finish generating, audio chunks are yielded one by one as each sentence is synthesized.
- **Immediate Playback**: Your app can start playing the first sentence right away while subsequent sentences are generated seamlessly in the background.
- **Smooth UI**: Audio generation runs in the background so your app's user interface and animations stay completely smooth.
- **Cancellation**: Calling [`synthesizeStop()`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesizestop) signals the generator to stop, halting synthesis before subsequent chunks are computed.

## Voice Cloning (Reverb)

Reverb speaks in the voice of a reference recording. It ships three preset voices ([`REVERB_DEFAULT_VOICE_NAMES`](../../06-api-reference/variables/REVERB_DEFAULT_VOICE_NAMES.md)), and [`encodeVoice()`](../../06-api-reference/type-aliases/ReverbTextToSpeech.md#encodevoice) turns any recording and its transcript into a new one. A voice carries more than the timbre: Reverb also copies the pace, the mood and the recording conditions of the reference.

```tsx
import { models, useTextToSpeech } from 'react-native-executorch';

const tts = useTextToSpeech(models.textToSpeech.REVERB.DEFAULT);

// A preset voice; `language` is the language of the text to speak
const preset = tts.synthesize('Hello from Reverb!', { voice: 'standard_male', language: 'en' });

// A cloned voice: 24 kHz mono audio, 1-20 s, and what it says, word for word
const voice = await tts.encodeVoice(recording, 'What the recording says.', 'en');
const cloned = tts.synthesize('Any text, now in the recorded voice.', { voice, language: 'en' });
```

- **Reference audio**: [`encodeVoice()`](../../06-api-reference/type-aliases/ReverbTextToSpeech.md#encodevoice) takes 24 kHz ([`REVERB_SAMPLE_RATE`](../../06-api-reference/variables/REVERB_SAMPLE_RATE.md)) mono PCM of 1 to 20 seconds and does not resample; 5 to 15 seconds of clear speech, without long silences at the edges, work best. With [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api), request 24 kHz from the `AudioRecorder`, or decode files with `decodeAudioData(uri, REVERB_SAMPLE_RATE)`.
- **Transcript**: it has to match the recording word for word. To transcribe on-device, run [Speech-to-Text](./03-speech-to-text.md) on the same audio resampled to 16 kHz.
- **Languages**: the text can be in any of the 7 languages ([`REVERB_LANGUAGES`](../../06-api-reference/variables/REVERB_LANGUAGES.md)); a voice sounds most natural in the language of its recording. Numbers, symbols and abbreviations in the text are written out as words before synthesis.
- **Reuse**: a [`ReverbVoice`](../../06-api-reference/type-aliases/ReverbVoice.md) is plain data — the reference's codec `codes`, its `transcript` and `language` — so it can be stored and passed to later sessions without encoding the recording again. Preset voices use the same fields, as JSON files listed in the model config's `voices`.
- **Downloads**: the codec encoder (135-176 MB) loads on the first `encodeVoice()` call. An app that only uses preset voices can drop it from the config so it is not downloaded:

```typescript
const { codecEncoder, ...modelPaths } = models.textToSpeech.REVERB.DEFAULT.modelPaths;
const tts = useTextToSpeech({ ...models.textToSpeech.REVERB.DEFAULT, modelPaths });
```

[`ReverbTtsOptions`](../../06-api-reference/type-aliases/ReverbTtsOptions.md) also set the `speed` (0.5 to 2.0), the `sampling` (`steps`, `remaskRatio` and a `seed` for reproducible takes), whether to `postprocess` (trim silent edges) and `maxChunkDuration`. Reverb packs whole sentences into chunks of up to `maxChunkDuration` seconds (20 by default), so the first audio arrives once the first chunk is synthesized.

## Imperative Pipelines

For background services, audio workers, or non-React component logic, you can instantiate the pipelines imperatively using [`createSupertonicTextToSpeech`](../../06-api-reference/functions/createSupertonicTextToSpeech.md), [`createKokoroTextToSpeech`](../../06-api-reference/functions/createKokoroTextToSpeech.md) or [`createReverbTextToSpeech`](../../06-api-reference/functions/createReverbTextToSpeech.md):

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

| Model                          | Variants                                                                 | Sub-Models & Assets                                                          | Sample Rate | Size Range  | Supported Backends                           | Supported Languages                                                                                                                                                       | Notes                                                                                                                                                                                                        |
| :----------------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :---------- | :---------- | :------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supertonic 3**               | [See](../../06-api-reference/variables/models.md#texttospeechsupertonic) | Text Encoder, Duration Predictor, Vector Estimator, Vocoder, Voice Styles    | 44.1 kHz    | 398 MB      | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | [English, Spanish, French, German, Korean, Japanese & more](../../06-api-reference/react-native-executorch/namespaces/speech/variables/SUPERTONIC_SUPPORTED_LANGUAGES.md) | Faster generation and broad multilingual coverage across 10 bundled [speaker styles](../../06-api-reference/variables/SUPERTONIC_DEFAULT_VOICE_NAMES.md), with slightly lower voice naturalness than Kokoro. |
| **Kokoro (Language Packages)** | [See](../../06-api-reference/variables/models.md#texttospeechkokoro)     | Duration Predictor, Synthesizer, G2P Lexicon / Neural Model, Language Voices | 24.0 kHz    | 332 MB each | XNNPACK (CPU), Core ML (Apple)               | English (US/GB), Spanish, French, Italian, Portuguese, Hindi, Polish, German, Chinese                                                                                     | Exceptional voice naturalness and intonation per language package, but heavier compute per synthesized chunk.                                                                                                |
| **Reverb**                     | [See](../../06-api-reference/variables/models.md#texttospeechreverb)     | Backbone, Codec Decoder, Codec Encoder, Tokenizer, Preset Voices             | 24.0 kHz    | 413–833 MB  | MLX + Core ML (Apple), Vulkan (Android)      | [English, German, Spanish, French, Italian, Polish, Portuguese](../../06-api-reference/variables/REVERB_LANGUAGES.md)                                                     | Clones any voice from a 1–20 s recording and its transcript, with 3 bundled [preset voices](../../06-api-reference/variables/REVERB_DEFAULT_VOICE_NAMES.md). No CPU (XNNPACK) build.                         |

:::note Model-Specific Pipelines
Because Text-to-Speech architectures require distinct multi-model orchestration in TypeScript (coordinating phonemizers, duration predictors, flow-matching loops, and neural vocoders), TTS pipelines are model-specific. To use custom voices or fine-tuned weights, provide your modified `.pte` models or custom voice JSON/BIN files matching the [`SupertonicTtsModel`](../../06-api-reference/type-aliases/SupertonicTtsModel.md), [`KokoroTtsModel`](../../06-api-reference/type-aliases/KokoroTtsModel.md) or [`ReverbTtsModel`](../../06-api-reference/type-aliases/ReverbTtsModel.md) specifications.
:::

## API Reference

### Hooks & Pipelines

- [`useTextToSpeech()`](../../06-api-reference/functions/useTextToSpeech.md) — Unified React hook for the Supertonic, Kokoro and Reverb Text-to-Speech pipelines.
- [`createSupertonicTextToSpeech()`](../../06-api-reference/functions/createSupertonicTextToSpeech.md) — Imperative factory for the Supertonic 3 TTS pipeline.
- [`createKokoroTextToSpeech()`](../../06-api-reference/functions/createKokoroTextToSpeech.md) — Imperative factory for the Kokoro TTS pipeline.
- [`createReverbTextToSpeech()`](../../06-api-reference/functions/createReverbTextToSpeech.md) — Imperative factory for the Reverb TTS pipeline.

### Types & Options

- [`SupertonicTextToSpeech`](../../06-api-reference/type-aliases/SupertonicTextToSpeech.md) — Supertonic pipeline runner interface ([`synthesize`](../../06-api-reference/type-aliases/SupertonicTextToSpeech.md#synthesize), [`synthesizeStop`](../../06-api-reference/type-aliases/SupertonicTextToSpeech.md#synthesizestop), `dispose`).
- [`KokoroTextToSpeech`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md) — Kokoro pipeline runner interface ([`synthesize`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesize), [`synthesizeStop`](../../06-api-reference/type-aliases/KokoroTextToSpeech.md#synthesizestop), `dispose`).
- [`SupertonicTtsChunk`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md) — Audio buffer chunk yielded by Supertonic ([`audio`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#audio), [`sampleRate`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#samplerate), [`duration`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#duration), [`chunkIndex`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#chunkindex), [`totalChunks`](../../06-api-reference/type-aliases/SupertonicTtsChunk.md#totalchunks)).
- [`KokoroTtsChunk`](../../06-api-reference/type-aliases/KokoroTtsChunk.md) — Audio buffer chunk yielded by Kokoro ([`audio`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#audio), [`sampleRate`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#samplerate), [`duration`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#duration), [`chunkIndex`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#chunkindex), [`totalChunks`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#totalchunks), [`words`](../../06-api-reference/type-aliases/KokoroTtsChunk.md#words)).
- [`SupertonicTtsModel`](../../06-api-reference/type-aliases/SupertonicTtsModel.md) — Supertonic model and asset configuration spec.
- [`KokoroTtsModel`](../../06-api-reference/type-aliases/KokoroTtsModel.md) — Kokoro model and asset configuration spec.
- [`SupertonicTtsOptions`](../../06-api-reference/type-aliases/SupertonicTtsOptions.md) — Execution options for Supertonic synthesis (`voice`, `speed`, `totalSteps`).
- [`KokoroTtsOptions`](../../06-api-reference/type-aliases/KokoroTtsOptions.md) — Execution options for Kokoro synthesis (`voice`, `speed`, `phonemize`).
- [`ReverbTextToSpeech`](../../06-api-reference/type-aliases/ReverbTextToSpeech.md) — Reverb pipeline runner interface ([`encodeVoice`](../../06-api-reference/type-aliases/ReverbTextToSpeech.md#encodevoice), [`synthesize`](../../06-api-reference/type-aliases/ReverbTextToSpeech.md#synthesize), [`synthesizeStop`](../../06-api-reference/type-aliases/ReverbTextToSpeech.md#synthesizestop), `dispose`).
- [`ReverbTtsChunk`](../../06-api-reference/type-aliases/ReverbTtsChunk.md) — Audio buffer chunk yielded by Reverb.
- [`ReverbTtsModel`](../../06-api-reference/type-aliases/ReverbTtsModel.md) — Reverb model and asset configuration spec.
- [`ReverbTtsOptions`](../../06-api-reference/type-aliases/ReverbTtsOptions.md) — Execution options for Reverb synthesis (`voice`, `language`, `speed`, `sampling`, `postprocess`, `maxChunkDuration`).
- [`ReverbVoice`](../../06-api-reference/type-aliases/ReverbVoice.md) — A voice to speak in: a reference recording's codec codes, transcript and language.
- [`ReverbSamplingOptions`](../../06-api-reference/type-aliases/ReverbSamplingOptions.md) and [`ReverbPostprocessOptions`](../../06-api-reference/type-aliases/ReverbPostprocessOptions.md) — Reverb's sampler and post-processing settings.
- [`speech.PhonemizerLanguage`](../../06-api-reference/react-native-executorch/namespaces/speech/type-aliases/PhonemizerLanguage.md) — Supported language codes for G2P phonemization.
- [`speech.PhonemizerConfig`](../../06-api-reference/react-native-executorch/namespaces/speech/type-aliases/PhonemizerConfig.md) — Neural G2P phonemizer and pronunciation lexicon config.

### Constants & Model Presets

- [`KOKORO_SAMPLE_RATE`](../../06-api-reference/variables/KOKORO_SAMPLE_RATE.md) — Kokoro output sample rate constant (24000 Hz).
- [`SUPERTONIC_SAMPLE_RATE`](../../06-api-reference/variables/SUPERTONIC_SAMPLE_RATE.md) — Supertonic output sample rate constant (44100 Hz).
- [`SUPERTONIC_DEFAULT_VOICE_NAMES`](../../06-api-reference/variables/SUPERTONIC_DEFAULT_VOICE_NAMES.md) — Default bundled voice style names for Supertonic.
- [`speech.SUPERTONIC_SUPPORTED_LANGUAGES`](../../06-api-reference/react-native-executorch/namespaces/speech/variables/SUPERTONIC_SUPPORTED_LANGUAGES.md) — Supported language codes for Supertonic.
- [`speech.KOKORO_PAUSE_MS`](../../06-api-reference/react-native-executorch/namespaces/speech/variables/KOKORO_PAUSE_MS.md) — Pause duration in milliseconds inserted between clauses.
- [`REVERB_SAMPLE_RATE`](../../06-api-reference/variables/REVERB_SAMPLE_RATE.md) — Reverb output and reference sample rate constant (24000 Hz).
- [`REVERB_LANGUAGES`](../../06-api-reference/variables/REVERB_LANGUAGES.md) — Supported language codes for Reverb.
- [`REVERB_DEFAULT_VOICE_NAMES`](../../06-api-reference/variables/REVERB_DEFAULT_VOICE_NAMES.md) — Preset voice names for Reverb.
- [`speech.partitionReverbText`](../../06-api-reference/react-native-executorch/namespaces/speech/functions/partitionReverbText.md) and [`speech.estimateTargetFrames`](../../06-api-reference/react-native-executorch/namespaces/speech/functions/estimateTargetFrames.md) — Reverb's text chunking and speech length estimate.
- [`models.textToSpeech`](../../06-api-reference/variables/models.md#texttospeech) — Pre-configured TTS models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/speech/tasks/kokoroTextToSpeech.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts)
- [`src/extensions/speech/tasks/supertonicTextToSpeech.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts)
- [`src/extensions/speech/tasks/reverbTextToSpeech.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/speech/tasks/reverbTextToSpeech.ts)
  :::
