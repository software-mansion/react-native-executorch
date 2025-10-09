<div align="right">
  <h1 align="left" style="display:inline-block">React Native ExecuTorch 
    <!-- Discord Badge -->
    <a href="https://discord.gg/ZGqqY55qkP">
      <img src="https://img.shields.io/badge/Discord-Join%20Us-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community">
    </a>
  </h1>
</div>

![Software Mansion banner](https://github.com/user-attachments/assets/fa2c4735-e75c-4cc1-970d-88905d95e3a4)

<p align="center">
  <a href="https://github.com/software-mansion/react-native-executorch/blob/release/0.5/README.md">English</a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/release/0.5/readmes/README_es.md">Español</a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/release/0.5/readmes/README_fr.md">Français</a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/release/0.5/readmes/README_cn.md">简体中文</a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/release/0.5/readmes/README_pt.md">Português</a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/release/0.5/readmes/README_in.md">हिंदी</a>
</p>

**React Native ExecuTorch** provides a declarative way to run AI models on-device using React Native, powered by **ExecuTorch** :rocket:. It offers out-of-the-box support for a wide range of LLMs, computer vision models, and more. Visit our [HuggingFace](https://huggingface.co/software-mansion) page to explore these models.

**ExecuTorch**, developed by Meta, is a novel framework allowing AI model execution on devices like mobile phones or microcontrollers.

React Native ExecuTorch bridges the gap between React Native and native platform capabilities, enabling developers to efficiently run local AI models on mobile devices. This can be achieved without the need for extensive expertise in native programming or machine learning.

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

**Table of contents:**

- [:yin_yang: Supported versions](#yin_yang-supported-versions)
- [:books: Documentation](#books-documentation)
- [:earth_africa: Real-World Example](#earth_africa-real-world-example)
- [:llama: Quickstart - Running Llama](#llama-quickstart---running-llama)
- [:calling: Demo apps](#calling-demo-apps)
- [:robot: Ready-made models](#robot-ready-made-models)
- [:balance_scale: License](#balance_scale-license)
- [:soon: What's next?](#soon-whats-next)

## :yin_yang: Supported versions

The minimal supported version are: 
* iOS 17.0
* Android 13
* React Native 0.76

> [!IMPORTANT]  
> React Native Executorch supports only the [New React Native architecture](https://reactnative.dev/architecture/landing-page).

## :books: Documentation

Check out how our library can help you build your React Native AI features by visiting our docs:  
https://docs.swmansion.com/react-native-executorch

## :earth_africa: Real-World Example

React Native ExecuTorch is powering [Private Mind](https://github.com/software-mansion-labs/private-mind), a privacy-first mobile AI app available on [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) and [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind).

<img width="2720" height="1085" alt="Private Mind promo" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## :llama: **Quickstart - Running Llama**

**Get started with AI-powered text generation in 3 easy steps!**

### :one: **Installation**

```bash
# Install the package
yarn add react-native-executorch
# Depending on the platform, choose either iOS or Android
yarn expo run:< ios | android >
```

### :two: **Setup & Initialization**

Add this to your component file:

```tsx
import {
  useLLM,
  LLAMA3_2_1B,
  Message
} from 'react-native-executorch';

function MyComponent() {
  // Initialize the model 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... rest of your component
}
```

### :three: **Run the model!**

```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the meaning of life?' }
  ];

  // Chat completion
  await llm.generate(chat);
  console.log('Llama says:', llm.response);
};
```

## :calling: Demo apps

We currently host a few example [apps](https://github.com/software-mansion/react-native-executorch/tree/main/apps) demonstrating use cases of our library:

- `llm` - Chat application showcasing use of LLMs
- `speech-to-text` - Whisper model ready for transcription tasks
- `computer-vision` - Computer vision related tasks
- `text-embeddings` - Computing text representations for semantic search

If you would like to run demo app, navigate to its project directory and install dependencies with:

```bash
yarn
```

Then, depending on the platform, choose either iOS or Android:

```bash
yarn expo run:< ios | android >
```

> [!WARNING]  
> Running LLMs requires a significant amount of RAM. If you are encountering unexpected app crashes, try to increase the amount of RAM allocated to the emulator.

## :robot: Ready-made models

Our library has a number of ready-to-use AI models; a complete list is available in the documentation. If you're interested in running your own AI model, you need to first export it to the `.pte` format. Instructions on how to do this are available in the [Python API](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) and [optimum-executorch README](https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately).

## :balance_scale: License

This library is licensed under [The MIT License](./LICENSE).

## :soon: What's next?

To learn about our upcoming plans and developments, please visit our [milestones](https://github.com/software-mansion/react-native-executorch/milestones).

## React Native ExecuTorch is created by Software Mansion

Since 2012, [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
