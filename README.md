<div align="right">
  <h1 align="left" style="display:inline-block">React Native ExecuTorch 
    <!-- Discord Badge -->
    <a href="https://discord.gg/ZGqqY55qkP">
      <img src="https://img.shields.io/badge/Discord-Join%20Us-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community">
    </a>
  </h1>
</div>

![Software Mansion banner](https://github.com/user-attachments/assets/fa2c4735-e75c-4cc1-970d-88905d95e3a4)

**React Native ExecuTorch** is a declarative way to run AI models in React Native on device, powered by **ExecuTorch** :rocket:. It offers out-of-the-box support for many LLMs, computer vision models, and many many more. Feel free to check them out on our [HuggingFace page](https://huggingface.co/software-mansion).

**ExecuTorch** is a novel framework created by Meta that enables running AI models on devices such as mobile phones or microcontrollers. 

React Native ExecuTorch bridges the gap between React Native and native platform capabilities, allowing developers to run AI models locally on mobile devices with state-of-the-art performance, without requiring deep knowledge of native code or machine learning internals.

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

**Table of contents:**

- [:yin_yang: Supported versions](#yin_yang-supported-versions)
- [:robot: Ready-made models](#robot-ready-made-models)
- [:books: Documentation](#books-documentation)
- [:llama: Quickstart - Running Llama](#llama-quickstart---running-llama)
- [:calling: Examples](#calling-examples)
- [:balance_scale: License](#balance_scale-license)
- [:soon: What's next?](#soon-whats-next)

## :yin_yang: Supported versions

The minimal supported version are: 
* iOS 17.0
* Android 13
* React Native 76

> :warning: **Warning:** React Native Executorch supports only the [New React Native architecture](https://reactnative.dev/architecture/landing-page).

## :robot: Ready-made models

To run any AI model in ExecuTorch, you need to export it to a `.pte` format. If you're interested in experimenting with your own models, we highly encourage you to check out the [Python API](https://pypi.org/project/executorch/). If you prefer focusing on developing your React Native app, we will cover several common use cases. For more details, please refer to the documentation.

## :books: Documentation

Take a look at how our library can help build you your React Native AI features in our docs:  
https://docs.swmansion.com/react-native-executorch

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
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
} from 'react-native-executorch';

function MyComponent() {
  // Initialize the model 🚀
  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: LLAMA3_2_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });
  // ... rest of your component
}
```

### :three: **Run the model!**

```tsx
const handleGenerate = async () => {
  const chat = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the meaning of life?' }
  ];

  // Chat completion
  await llm.generate(chat);
  console.log('Llama says:', llm.response);
};
```

## :calling: Examples

We currently host a few example [apps](https://github.com/software-mansion/react-native-executorch/tree/main/apps) demonstrating use cases of our library:

- `llm` - Chat application showcasing use of LLMs
- `speech-to-text` - Whisper and Moonshine models ready for transcription tasks
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

> :warning: **Warning:** Running LLMs requires a significant amount of RAM. If you are encountering unexpected app crashes, try to increase the amount of RAM allocated to the emulator.

## :balance_scale: License

This library is licensed under [The MIT License](./LICENSE).

## :soon: What's next?

To learn about our upcoming plans and developments, please visit our [discussion page](https://github.com/software-mansion/react-native-executorch/discussions).

## React Native ExecuTorch is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
