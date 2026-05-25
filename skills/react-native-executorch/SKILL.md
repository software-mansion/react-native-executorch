---
name: react-native-executorch
description: Build on-device AI features in React Native and Expo apps with React Native ExecuTorch. Use when adding AI to a mobile app without cloud dependencies — chatbots and assistants, image classification, object detection, OCR, semantic or instance segmentation, style transfer, image generation, pose estimation, speech-to-text, text-to-speech, voice activity detection, semantic search with embeddings, tokenization, privacy filtering / PII redaction, or vision-language image understanding. Also use when the user mentions offline AI, on-device ML, privacy-preserving AI, reducing cloud API cost or latency, running models locally on mobile, or downloading and managing ML models. Covers initExecutorch, every public hook (useLLM, useClassification, useObjectDetection, useOCR, useVerticalOCR, useSemanticSegmentation, useInstanceSegmentation, useStyleTransfer, useTextToImage, useImageEmbeddings, usePoseEstimation, useSpeechToText, useTextToSpeech, useVAD, useTextEmbeddings, useTokenizer, usePrivacyFilter, useExecutorchModule), tool calling, structured output, VLMs, model loading via Expo or bare resource-fetcher adapters, and error handling.
---

# React Native ExecuTorch

Software Mansion's production patterns for on-device AI in React Native and Expo using [React Native ExecuTorch](https://github.com/software-mansion/react-native-executorch).

Targets the current published API (v0.10.x). Load at most one reference file per question. For hook signatures, model constants, or config options not covered here, webfetch the matching page from [docs.swmansion.com/react-native-executorch](https://docs.swmansion.com/react-native-executorch/docs/).

## Decision Tree

```
What does the feature need?
│
├── Generate / chat with text?
│   └── useLLM                                          → see llm.md
│       ├── Plain chat → standard useLLM
│       ├── Image + text input → useLLM with a VLM model (LFM2_VL_*)
│       ├── Tool / function calling → configure with toolsConfig
│       └── Structured JSON output → getStructuredOutputPrompt
│
├── Understand or transform images?
│   ├── What is in this image? → useClassification      → see vision.md
│   ├── Where are the objects? → useObjectDetection     → see vision.md
│   ├── Per-pixel class → useSemanticSegmentation       → see vision.md
│   ├── Per-instance segmentation → useInstanceSegmentation → see vision.md
│   ├── Human pose keypoints → usePoseEstimation        → see vision.md
│   ├── Read text from image → useOCR / useVerticalOCR  → see vision.md
│   ├── Apply artistic style → useStyleTransfer         → see vision.md
│   ├── Generate image from prompt → useTextToImage     → see vision.md
│   └── Embed image as vector → useImageEmbeddings      → see vision.md
│
├── Speech / audio?
│   ├── Transcribe speech → useSpeechToText             → see speech.md
│   ├── Synthesize speech → useTextToSpeech             → see speech.md
│   └── Detect speech segments → useVAD                 → see speech.md
│
├── Text utilities?
│   ├── Embed text as vector → useTextEmbeddings        → see vision.md
│   ├── Count or inspect tokens → useTokenizer          → see setup.md
│   └── Redact PII from text → usePrivacyFilter         → see setup.md
│
├── Full RAG pipeline (retrieval + generation + vector store)?
│   └── react-native-rag (sibling library)              → see setup.md
│
└── Custom `.pte` model not covered by a dedicated hook?
    └── useExecutorchModule                             → see setup.md
```

## Critical Rules

- **Call `initExecutorch()` at app entry, before any other API.** The library does not bundle a network/file layer — you must register a resource-fetcher adapter (`ExpoResourceFetcher` for Expo, `BareResourceFetcher` for bare RN). Any hook called before initialization throws `ResourceFetcherAdapterNotInitialized`.

- **Check `isReady` before calling `forward` / `generate` / `transcribe`.** All hooks load asynchronously. Inference before the model is ready throws `ModuleNotLoaded`.

- **Interrupt LLM generation before unmounting.** Unmounting while `isGenerating` is `true` crashes. Call `llm.interrupt()` and wait for `isGenerating === false` before navigating away.

- **Use quantized model variants on mobile.** Full-precision variants exceed device memory on most phones. Every supported model ships a `_QUANTIZED` variant — prefer it unless you've measured otherwise.

- **Audio for speech-to-text and VAD must be 16 kHz mono.** Mismatched sample rates produce silently garbled transcriptions. Decode with `new AudioContext({ sampleRate: 16000 })`.

- **Audio from text-to-speech is 24 kHz.** Create the playback context with `new AudioContext({ sampleRate: 24000 })`.

- **The New Architecture (Fabric) is required.** Old architecture is unsupported. Expo Go is unsupported — use a custom dev build (`npx expo prebuild`). iOS release builds need a real device (the simulator lacks the Metal APIs ExecuTorch relies on).

## Minimal Setup

```tsx
// App.tsx (Expo)
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });
```

```tsx
// App.tsx (bare React Native)
import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from 'react-native-executorch-bare-resource-fetcher';

initExecutorch({ resourceFetcher: BareResourceFetcher });
```

Full setup, Metro config for bundled `.pte` files, custom adapters, model-loading strategies, and error handling: see [setup.md](./references/setup.md).

## Hook Quick Reference

| Hook | Purpose | Reference |
|---|---|---|
| `useLLM` | Text generation, chat, tool calling, VLM | [llm.md](./references/llm.md) |
| `useClassification` | Image categorisation | [vision.md](./references/vision.md) |
| `useObjectDetection` | Bounding-box detection (YOLO26, RF-DETR, SSDLite) | [vision.md](./references/vision.md) |
| `useSemanticSegmentation` | Per-pixel class segmentation | [vision.md](./references/vision.md) |
| `useInstanceSegmentation` | Per-instance segmentation | [vision.md](./references/vision.md) |
| `usePoseEstimation` | COCO 17-keypoint human pose | [vision.md](./references/vision.md) |
| `useStyleTransfer` | Artistic image filters | [vision.md](./references/vision.md) |
| `useTextToImage` | Stable Diffusion image generation | [vision.md](./references/vision.md) |
| `useImageEmbeddings` | CLIP image embeddings | [vision.md](./references/vision.md) |
| `useOCR` | Horizontal text OCR | [vision.md](./references/vision.md) |
| `useVerticalOCR` | Vertical text OCR (experimental, CJK) | [vision.md](./references/vision.md) |
| `useTextEmbeddings` | Sentence embeddings for similarity / RAG | [vision.md](./references/vision.md) |
| `useSpeechToText` | Whisper transcription (batch + streaming) | [speech.md](./references/speech.md) |
| `useTextToSpeech` | Kokoro TTS (batch + streaming, phoneme input) | [speech.md](./references/speech.md) |
| `useVAD` | FSMN voice activity detection | [speech.md](./references/speech.md) |
| `useTokenizer` | HuggingFace-compatible tokenization | [setup.md](./references/setup.md) |
| `usePrivacyFilter` | On-device PII / privacy redaction | [setup.md](./references/setup.md) |
| `useExecutorchModule` | Custom `.pte` model inference | [setup.md](./references/setup.md) |

Every hook also has a non-React `Module` counterpart (e.g. `LLMModule.fromModelName(...)`, `ClassificationModule.fromModelName(...)`) for use outside React components.

## Common Pitfalls

| Symptom | Likely cause | Fix |
|---|---|---|
| `ResourceFetcherAdapterNotInitialized` | `initExecutorch` not called | Call it at app entry with an adapter |
| `ModuleNotLoaded` | Inference before model finished loading | Gate calls on `isReady` |
| `MemoryAllocationFailed` on launch | Model too large for device | Switch to `_QUANTIZED` variant or smaller parameter count |
| App crashes on screen navigation | Unmount during active generation | `llm.interrupt()` and await `isGenerating === false` |
| Whisper produces garbled text | Wrong sample rate | Decode audio at 16 kHz mono |
| TTS output sounds chipmunked | Playback context at wrong rate | Create `AudioContext({ sampleRate: 24000 })` |
| Build fails on iOS simulator (release) | Simulator lacks Metal APIs | Build release on real device |

Full error code list and recovery patterns: [setup.md](./references/setup.md).

## References

| File | When to read |
|---|---|
| [llm.md](./references/llm.md) | `useLLM` functional + managed modes, tool calling, structured output (JSON Schema / Zod), interrupting, vision-language models, generation config |
| [vision.md](./references/vision.md) | Image classification, object detection, semantic + instance segmentation, pose estimation, OCR (horizontal + vertical), style transfer, text-to-image, image + text embeddings |
| [speech.md](./references/speech.md) | Speech-to-text (Whisper batch + streaming with timestamps), text-to-speech (Kokoro batch + streaming, phoneme input, voice catalogue), voice activity detection, audio sample-rate requirements |
| [setup.md](./references/setup.md) | `initExecutorch`, Expo / bare resource-fetcher adapters, model loading strategies, Metro config, error codes and recovery, `useExecutorchModule` for custom `.pte` models, `useTokenizer`, `usePrivacyFilter`, full model catalogue |

## External Resources

- Official docs: https://docs.swmansion.com/react-native-executorch
- API reference: https://docs.swmansion.com/react-native-executorch/docs/api-reference
- Source: https://github.com/software-mansion/react-native-executorch
- Pre-exported models: https://huggingface.co/software-mansion
