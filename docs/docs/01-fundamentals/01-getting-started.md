---
title: Getting Started
slug: /fundamentals/getting-started
keywords:
  [
    react native,
    react native ai,
    react native llm,
    react native qwen,
    react native llama,
    react native executorch,
    executorch,
    on-device ai,
    pytorch,
    mobile ai,
  ]
description: 'Get started with React Native ExecuTorch - a framework for running AI models on-device in your React Native applications.'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## What is ExecuTorch?

[ExecuTorch](https://executorch.ai) is a novel AI framework developed by Meta, designed to streamline deploying PyTorch models on a variety of devices, including mobile phones and microcontrollers. This framework enables exporting models into standalone binaries, allowing them to run locally without requiring API calls. ExecuTorch achieves state-of-the-art performance through optimizations and delegates such as Core ML and XNNPACK. It provides a seamless export process with robust debugging options, making it easier to resolve issues if they arise.

## React Native ExecuTorch

React Native ExecuTorch is our way of bringing ExecuTorch into the React Native world. Our API is built to be simple, declarative, and efficient. Plus, we’ll provide a set of pre-exported models for common use cases, so you won’t have to worry about handling exports yourself. With just a few lines of JavaScript, you’ll be able to run AI models (even LLMs 👀) right on your device—keeping user data private and saving on cloud costs.

## Compatibility

React Native Executorch supports only the [New React Native architecture](https://reactnative.dev/architecture/landing-page).

If your app still runs on the old architecture, please consider upgrading to the New Architecture.

## Installation

Installation is pretty straightforward, just use your favorite package manager.

<Tabs>
  <TabItem value="npm" label="NPM">

    ```
    npm install react-native-executorch
    ```

  </TabItem>
  <TabItem value="pnpm" label="PNPM">

    ```
    pnpm install react-native-executorch
    ```

  </TabItem>
  <TabItem value="yarn" label="YARN">

    ```
    yarn add react-native-executorch
    ```

  </TabItem>
</Tabs>

Our library offers support for both bare React Native and Expo projects. Please follow the instructions from [Loading models section](./02-loading-models.md) to make sure you setup your project correctly. We encourage you to use Expo project if possible. If you are planning to migrate from bare React Native to Expo project, the link (https://docs.expo.dev/bare/installing-expo-modules/) offers a guidance on setting up Expo Modules in a bare React Native environment.

If you plan on using your models via require() instead of fetching them from a url, you also need to add following lines to your `metro.config.js`:

```json
// metro.config.js
...
    defaultConfig.resolver.assetExts.push('pte')
    defaultConfig.resolver.assetExts.push('bin')
...
```

This allows us to use binaries, such as exported models or tokenizers for LLMs.

:::warning
When using Expo, please note that you need to use a custom development build of your app, not the standard Expo Go app. This is because we rely on native modules, which Expo Go doesn’t support.
:::

:::info
Because we are using ExecuTorch under the hood, you won't be able to build iOS app for release with simulator selected as the target device. Make sure to test release builds on real devices.
:::

Running the app with the library:

```bash
yarn run expo:<ios | android> -d
```

## Supporting new models in React Native ExecuTorch

Adding new functionality to the library follows a consistent three-step integration pipeline:

1. **Model Serialization:** We export PyTorch models for specific tasks (e.g., object detection) into the \*.pte format, which is optimized for the ExecuTorch runtime.

2. **Native Implementation:** We develop a C++ execution layer that interfaces with the ExecuTorch runtime to handle inference. This layer also manages model-dependent logic, such as data pre-processing and post-processing.

3. **TS Bindings:** Finally, we implement a TypeScript API that bridges the JavaScript environment to the native C++ logic, providing a clean, typed interface for the end user."

## Good reads

If you want to dive deeper into ExecuTorch or our previous work with the framework, we highly encourage you to check out the following resources:

- [ExecuTorch docs](https://pytorch.org/executorch/stable/index.html)
- [React Native RAG](https://blog.swmansion.com/introducing-react-native-rag-fbb62efa4991)
- [Offline Text Recognition on Mobile: How We Brought EasyOCR to React Native ExecuTorch](https://blog.swmansion.com/bringing-easyocr-to-react-native-executorch-2401c09c2d0c)
