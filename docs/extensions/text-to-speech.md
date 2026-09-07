# Text-to-Speech (TTS)

The Text-to-Speech extension synthesizes natural, expressive spoken audio waveforms directly on-device from input text.

Speech synthesis operates through multi-stage neural pipelines that combine phonetic transcription or character indexing, duration prediction, acoustic modeling, and neural vocoder audio decompression. Because different model families use fundamentally distinct multi-stage architectures, the library provides dedicated pipelines for each:

* **Supertonic ([`createSupertonicTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSupertonicTextToSpeech))**: A 4-stage multilingual flow-matching model (44.1 kHz) that coordinates a text encoder, duration predictor, vector estimator, and vocoder with multi-speaker voice style conditioning.
* **Kokoro ([`createKokoroTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKokoroTextToSpeech))**: A 2-stage phoneme-driven model (24 kHz) that pairs language-specific grapheme-to-phoneme (G2P) transcription with a duration predictor, acoustic synthesizer, and voice embedding matrices.

Both pipelines are wrapped uniformly by the [`useTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech) React hook.

| iOS                                                       | Android                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| [](/react-native-executorch/media/text-to-speech-ios.mp4) | [](/react-native-executorch/media/text-to-speech-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech) hook manages downloading all sub-model weights, phonemizers, and voice files. To achieve low Time-to-First-Audio (TTFA) and seamless gapless playback, pipe the generated chunks directly to an audio buffer queue such as [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api):

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/text-to-speech.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/text-to-speech.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen featuring voice selection, buffer queue streaming, Time-to-First-Audio (TTFA) benchmarking, and live waveform visualization.

## Output Format[​](#output-format "Direct link to Output Format")

[`synthesize()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTextToSpeech#synthesize) returns an [`AsyncGenerator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) yielding audio chunks ([`KokoroTtsChunk`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk) or [`SupertonicTtsChunk`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk)) sequentially as each sentence finishes synthesis:

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

## How Streaming Works[​](#how-streaming-works "Direct link to How Streaming Works")

On-device text-to-speech is built for instant audio feedback:

* **Sentence-by-Sentence Streaming**: Long text is automatically split into natural phrases. Instead of waiting for an entire paragraph to finish generating, audio chunks are yielded one by one as each sentence is synthesized.
* **Immediate Playback**: Your app can start playing the first sentence right away while subsequent sentences are generated seamlessly in the background.
* **Smooth UI**: Audio generation runs in the background so your app's user interface and animations stay completely smooth.
* **Cancellation**: Calling [`synthesizeStop()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTextToSpeech#synthesizestop) signals the generator to stop, halting synthesis before subsequent chunks are computed.

## Imperative Pipelines[​](#imperative-pipelines "Direct link to Imperative Pipelines")

For background services, audio workers, or non-React component logic, you can instantiate the pipelines imperatively using [`createSupertonicTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSupertonicTextToSpeech) or [`createKokoroTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKokoroTextToSpeech):

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

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use Text-to-Speech models from the [Software Mansion HuggingFace Text to Speech Collection](https://huggingface.co/collections/software-mansion/text-to-speech), pre-packaged with neural G2P phonemizers and voice presets in [`models.textToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttospeech):

| Model                          | Variants                                                                                                             | Sub-Models & Assets                                                          | Sample Rate | Size Range  | Supported Backends                           | Supported Languages                                                                                                                                                                                                            | Notes                                                                                                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------- | ----------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supertonic 3**               | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttospeechsupertonic) | Text Encoder, Duration Predictor, Vector Estimator, Vocoder, Voice Styles    | 44.1 kHz    | 398 MB      | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | [English, Spanish, French, German, Korean, Japanese, Chinese & more](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/variables/SUPERTONIC_SUPPORTED_LANGUAGES) | Faster generation and broad multilingual coverage across 10 bundled [speaker styles](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/SUPERTONIC_DEFAULT_VOICE_NAMES), with slightly lower voice naturalness than Kokoro. |
| **Kokoro (Language Packages)** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttospeechkokoro)     | Duration Predictor, Synthesizer, G2P Lexicon / Neural Model, Language Voices | 24.0 kHz    | 332 MB each | XNNPACK (CPU), Core ML (Apple)               | English (US/GB), Spanish, French, Italian, Portuguese, Hindi, Polish, German                                                                                                                                                   | Exceptional voice naturalness and intonation per language package, but heavier compute per synthesized chunk.                                                                                                                                            |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Model-Specific Pipelines

Because Text-to-Speech architectures require distinct multi-model orchestration in TypeScript (coordinating phonemizers, duration predictors, flow-matching loops, and neural vocoders), TTS pipelines are model-specific. To use custom voices or fine-tuned weights, provide your modified `.pte` models or custom voice JSON/BIN files matching the [`SupertonicTtsModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsModel) or [`KokoroTtsModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsModel) specifications.

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useTextToSpeech()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech) — Unified React hook for Supertonic and Kokoro Text-to-Speech pipelines.
* [`createSupertonicTextToSpeech()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSupertonicTextToSpeech) — Imperative factory for the Supertonic 3 TTS pipeline.
* [`createKokoroTextToSpeech()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKokoroTextToSpeech) — Imperative factory for the Kokoro TTS pipeline.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`SupertonicTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTextToSpeech) — Supertonic pipeline runner interface ([`synthesize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTextToSpeech#synthesize), [`synthesizeStop`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTextToSpeech#synthesizestop), `dispose`).
* [`KokoroTextToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTextToSpeech) — Kokoro pipeline runner interface ([`synthesize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTextToSpeech#synthesize), [`synthesizeStop`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTextToSpeech#synthesizestop), `dispose`).
* [`SupertonicTtsChunk`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk) — Audio buffer chunk yielded by Supertonic ([`audio`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk#audio), [`sampleRate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk#samplerate), [`duration`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk#duration), [`chunkIndex`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk#chunkindex), [`totalChunks`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsChunk#totalchunks)).
* [`KokoroTtsChunk`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk) — Audio buffer chunk yielded by Kokoro ([`audio`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk#audio), [`sampleRate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk#samplerate), [`duration`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk#duration), [`chunkIndex`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk#chunkindex), [`totalChunks`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsChunk#totalchunks)).
* [`SupertonicTtsModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsModel) — Supertonic model and asset configuration spec.
* [`KokoroTtsModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsModel) — Kokoro model and asset configuration spec.
* [`SupertonicTtsOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SupertonicTtsOptions) — Execution options for Supertonic synthesis (`voice`, `speed`, `totalSteps`).
* [`KokoroTtsOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KokoroTtsOptions) — Execution options for Kokoro synthesis (`voice`, `speed`, `phonemize`).
* [`speech.PhonemizerLanguage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/type-aliases/PhonemizerLanguage) — Supported language codes for G2P phonemization.
* [`speech.PhonemizerConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/type-aliases/PhonemizerConfig) — Neural G2P phonemizer and pronunciation lexicon config.

### Constants & Model Presets[​](#constants--model-presets "Direct link to Constants & Model Presets")

* [`KOKORO_SAMPLE_RATE`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/KOKORO_SAMPLE_RATE) — Kokoro output sample rate constant (24000 Hz).
* [`SUPERTONIC_SAMPLE_RATE`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/SUPERTONIC_SAMPLE_RATE) — Supertonic output sample rate constant (44100 Hz).
* [`SUPERTONIC_DEFAULT_VOICE_NAMES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/SUPERTONIC_DEFAULT_VOICE_NAMES) — Default bundled voice style names for Supertonic.
* [`speech.SUPERTONIC_SUPPORTED_LANGUAGES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/variables/SUPERTONIC_SUPPORTED_LANGUAGES) — Supported language codes for Supertonic.
* [`speech.KOKORO_PAUSE_MS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/variables/KOKORO_PAUSE_MS) — Pause duration in milliseconds inserted between clauses.
* [`models.textToSpeech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttospeech) — Pre-configured TTS models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/speech/tasks/kokoroTextToSpeech.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts)
* [`src/extensions/speech/tasks/supertonicTextToSpeech.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts)
