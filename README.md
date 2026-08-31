<div align="center">
  <img src="https://github.com/software-mansion/react-native-executorch/blob/main/docs/static/img/logo-hero.svg" alt="React Native ExecuTorch Logo" width="25%">
</div>

<div align="center">
  <h1 align="center" style="display:inline-block">React Native ExecuTorch</h1>
</div>

<div align="center">
  <a href="https://swm-delivery.com/www/delivery/ck-slug.php?zoneid=zone-gh-react-native-executorch-1&n=1"><img src="https://swm-delivery.com/www/images/zone-gh-react-native-executorch-1?n=1" /></a>
  <a href="https://swm-delivery.com/www/delivery/ck-slug.php?zoneid=zone-gh-react-native-executorch-2&n=1"><img src="https://swm-delivery.com/www/images/zone-gh-react-native-executorch-2?n=1" /></a>
  <a href="https://swm-delivery.com/www/delivery/ck-slug.php?zoneid=zone-gh-react-native-executorch-3&n=1"><img src="https://swm-delivery.com/www/images/zone-gh-react-native-executorch-3?n=1" /></a>
  <a href="https://github.com/software-mansion/react-native-executorch/graphs/contributors"><img src="https://img.shields.io/github/contributors/software-mansion/react-native-executorch?style=for-the-badge&color=00008B" alt="GitHub - Contributors"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/stargazers"><img src="https://img.shields.io/github/stars/software-mansion/react-native-executorch?style=for-the-badge&color=00008B" alt="GitHub - Stars"></a>
  <a href="https://discord.gg/ZGqqY55qkP"><img src="https://img.shields.io/badge/Discord-Join%20Us-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community"></a>
  <a href="https://docs.swmansion.com/react-native-executorch/"><img src="https://img.shields.io/badge/Documentation-00008B?logo=googledocs&logoColor=white&style=for-the-badge" alt="Documentation"></a>
  <a href="https://swmansion.com/contact">
    <img src="https://img.shields.io/badge/Hire%20Us-00008B?logo=react&logoColor=white&color=darkgreen&style=for-the-badge" alt="Hire Us">
  </a>
</div>

<br/>

**React Native ExecuTorch** is an on-device AI inference library for React Native, powered by [ExecuTorch](https://executorch.ai) — Meta's on-device inference runtime. It lets you run machine learning models directly on the user's phone with zero network calls, full offline capability, and guaranteed privacy. No data ever leaves the device.

The library ships with a curated set of pre-exported models covering object detection, language models, text-to-speech, transcription, and more — all available in our [Hugging Face collection](https://huggingface.co/software-mansion/collections) and ready to use out of the box. You can also bring your own `.pte` models and plug them into existing pipelines or build entirely custom ones from scratch.

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![npm nightly](https://img.shields.io/npm/v/react-native-executorch/executorch-nightly?label=nightly&color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

<details>
<summary><strong>Table of Contents</strong></summary>

- [Key Features](#key-features)
- [Supported Capabilities](#supported-capabilities)
- [Quickstart](#quickstart)
  - [1. Installation](#1-installation)
  - [2. Run an LLM Chat Session](#2-run-an-llm-chat-session)
- [Interactive Gallery App](#interactive-gallery-app)
- [Documentation](#documentation)
- [Powered by React Native ExecuTorch](#powered-by-react-native-executorch)
- [License](#license)
- [Created by Software Mansion](#created-by-software-mansion)

</details>

---

## Key Features

- **Native Hardware Acceleration**: Optimized execution delegates across backends: **XNNPACK** (CPU), **Core ML** & **MLX** (Apple Silicon), and **Vulkan** (Android GPU).
- **100% Offline & Private**: Zero cloud inference costs and zero network dependency after model download. No user data ever leaves the device.
- **Two-Layer Architecture**:
  - **Ready-to-use Task Hooks (`use<Task>`)**: Out-of-the-box support for LLMs, computer vision, speech, and embeddings with automatic caching and lifecycle management.
  - **Lower-level Runtime & Custom Orchestration**: Build custom pipelines entirely in TypeScript using low-level tensor operations, fast native operators, schema validation, and worklet threading.
- **Pre-Exported Model Catalog**: Access verified models directly via the `models` registry and the [Software Mansion Hugging Face Collections](https://huggingface.co/software-mansion/collections).

---

## Supported Capabilities

| Domain | Task Pipelines | Featured Models |
| :--- | :--- | :--- |
| **Natural Language** | [LLM Chat & Generation](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation), [Text Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-embeddings), [Privacy Filter (PII)](https://docs.swmansion.com/react-native-executorch/docs/extensions/privacy-filter), [Tokenizers](https://docs.swmansion.com/react-native-executorch/docs/extensions/tokenizers) | LFM 2.5, Gemma 4, Qwen 3, MiniLM, Nemotron PII |
| **Speech & Audio** | [Text-to-Speech](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-to-speech), [Speech-to-Text](https://docs.swmansion.com/react-native-executorch/docs/extensions/speech-to-text), [Voice Activity Detection](https://docs.swmansion.com/react-native-executorch/docs/extensions/voice-activity-detection) | Supertonic 3, Kokoro, Whisper, FSMN-VAD |
| **Computer Vision** | [Image Classification](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-classification), [Object Detection](https://docs.swmansion.com/react-native-executorch/docs/extensions/object-detection), [Pose & Keypoints](https://docs.swmansion.com/react-native-executorch/docs/extensions/pose-and-keypoints), [OCR](https://docs.swmansion.com/react-native-executorch/docs/extensions/optical-character-recognition), [Segmentation](https://docs.swmansion.com/react-native-executorch/docs/extensions/semantic-segmentation), [Style Transfer](https://docs.swmansion.com/react-native-executorch/docs/extensions/style-transfer), [Image Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-embeddings), [Text-to-Image](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-to-image) | YOLO26, RF-DETR, SSDLite, FastSAM, PP-OCRv6, CLIP, SDXS DreamShaper |

---

## Quickstart

### 1. Installation

Install `react-native-executorch` alongside its required peer dependencies:

```bash
npm install react-native-executorch react-native-worklets react-native-blob-util
# or
yarn add react-native-executorch react-native-worklets react-native-blob-util
# or
pnpm add react-native-executorch react-native-worklets react-native-blob-util
```

> [!IMPORTANT]
> React Native ExecuTorch requires the **New React Native Architecture**, **React Native 0.81+**, **iOS 17.0+**, and **Android 13+ (API 33)**.

### 2. Run the Model

```tsx
import { Button, View } from 'react-native';
import { models, useLLMChatSession } from 'react-native-executorch';

export function App() {
  const session = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT);

  const handleGenerate = async () => {
    if (!session.isReady || !session.sendMessage) return;

    const turn = await session.sendMessage(
      'Explain on-device AI in one sentence.',
      (token) => console.log(token)
    );

    console.log('Result messages:', turn.messages);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title={session.isReady ? 'Generate' : `Loading (${(session.downloadProgress * 100).toFixed(0)}%)`}
        onPress={handleGenerate}
        disabled={!session.isReady}
      />
    </View>
  );
}
```

---

## Interactive Gallery App

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->
Explore interactive task examples in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery):

- **Large Language Models (LLMs)**: Streaming on-device chat with interactive prompt suggestions.
- **Speech & Audio**: Streaming TTS with audio playback (`react-native-audio-api`), live Whisper microphone transcription, and real-time VAD.
- **Computer Vision**: Object detection, pose estimation, OCR, semantic & instance segmentation, style transfer, and text-to-image.

<!-- GALLERY DEMOS PLACEHOLDER: Insert gallery task GIFs/video showcase here -->

---

## Documentation

Full documentation, guides, architecture deep dives, and API references are available at:
**[docs.swmansion.com/react-native-executorch](https://docs.swmansion.com/react-native-executorch/)**

- [Getting Started Guide](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started)
- [Downloading & Caching Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/downloading-models)
- [Task Extensions & Pipelines](https://docs.swmansion.com/react-native-executorch/docs/category/extensions)
- [Core Primitives & Custom Pipelines](https://docs.swmansion.com/react-native-executorch/docs/category/core--advanced)
- [Exporting Custom `.pte` Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models)

---

## Powered by React Native ExecuTorch

React Native ExecuTorch powers [Private Mind](https://privatemind.swmansion.com/), a privacy-first mobile AI application available on [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) and [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind).

<img width="2720" height="1085" alt="Private Mind promo" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

---

## License

React Native ExecuTorch is licensed under the [MIT License](./LICENSE). It includes components from Meta's ExecuTorch library, which is licensed under the [BSD 3-Clause License](./LICENSE).

---

## Created by Software Mansion

Since 2012, [Software Mansion](https://swmansion.com) has been building mobile and web apps, contributing to open-source software, and dealing with all kinds of React Native challenges. We are Core React Native Contributors. We can help you build your next AI product – [Hire us](https://swmansion.com/contact?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)

