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

React Native ExecuTorch is our way of bringing ExecuTorch into the React Native world. Our API is built to be simple, declarative, and efficient. Additionally, we provide a set of pre-exported models for common use cases, so you don't have to worry about handling exports yourself. With just a few lines of JavaScript, you can run AI models (even LLMs 👀) right on your device—keeping user data private and saving on cloud costs.

## Compatibility

React Native Executorch supports only the [New React Native architecture](https://reactnative.dev/architecture/landing-page).

If your app still runs on the old architecture, please consider upgrading to the New Architecture.

For supported React Native and Expo versions, see the [Compatibility table](https://docs.swmansion.com/react-native-executorch/docs/other/compatibility).

## Installation

Installation takes two steps: install the core package, then install a resource fetcher adapter that matches your project type. If you want to implement your own model fetching logic instead, see [this document](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/custom-adapter).

### 1. Install the core package

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm install react-native-executorch
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm add react-native-executorch
    ```

  </TabItem>
  <TabItem value="yarn" label="yarn">

    ```bash
    yarn add react-native-executorch
    ```

  </TabItem>
</Tabs>

At the end of installation a `postinstall` step downloads the native binaries your app needs (see [Selecting native libraries](#selecting-native-libraries) below). With no extra configuration it downloads everything, so you can start immediately.

### 2. Install a resource fetcher

Pick the adapter that matches your project. We recommend the Expo adapter when your app uses Expo; use the bare adapter for projects without Expo.

#### Expo projects

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm install react-native-executorch-expo-resource-fetcher expo-file-system expo-asset
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm add react-native-executorch-expo-resource-fetcher expo-file-system expo-asset
    ```

  </TabItem>
  <TabItem value="yarn" label="yarn">

    ```bash
    yarn add react-native-executorch-expo-resource-fetcher expo-file-system expo-asset
    ```

  </TabItem>
</Tabs>

#### Bare React Native projects

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm install react-native-executorch-bare-resource-fetcher @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm add react-native-executorch-bare-resource-fetcher @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
    ```

  </TabItem>
  <TabItem value="yarn" label="yarn">

    ```bash
    yarn add react-native-executorch-bare-resource-fetcher @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
    ```

  </TabItem>
</Tabs>

:::warning
Before using any other API, you must call `initExecutorch` with a resource fetcher adapter at the entry point of your app:

```js
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
// or BareResourceFetcher for bare react-native projects

initExecutorch({ resourceFetcher: ExpoResourceFetcher });
```

Calling any library API without initializing first will throw a `ResourceFetcherAdapterNotInitialized` error.
:::

Our library offers support for both bare React Native and Expo projects. Please follow the instructions from [Loading models section](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models) to make sure you setup your project correctly. We encourage you to use Expo project if possible. If you are planning to migrate from bare React Native to Expo project, the link (https://docs.expo.dev/bare/installing-expo-modules/) offers a guidance on setting up Expo Modules in a bare React Native environment.

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

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm run <ios|android> -- -d
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm <ios|android> -d
    ```

  </TabItem>
  <TabItem value="yarn" label="yarn">

    ```bash
    yarn <ios|android> -d
    ```

  </TabItem>
</Tabs>

## Selecting native libraries

The native binaries React Native ExecuTorch relies on — the ExecuTorch runtime, the hardware backends (XNNPACK, Core ML, MLX, Vulkan), and OpenCV — are **downloaded on demand at install time** rather than bundled into the npm package. A `postinstall` script reads an optional `react-native-executorch` block from your app's `package.json`, fetches only the binaries your app needs, and the native build then links only those.

If you omit the block, **every backend and library is downloaded and enabled** — no configuration is required to get started. Trimming the set keeps your app smaller and your builds faster.

### Opting into a subset

Declare what you use with any combination of `features`, `backends`, and `libs`:

```json
// package.json
{
  "react-native-executorch": {
    "features": ["classification", "styleTransfer"]
  }
}
```

- **`features`** — high-level model tasks. Each one expands to the backends and libraries it needs (see the table below). This is the recommended way to configure.
- **`backends`** — request hardware backends directly: `xnnpack`, `coreml` (iOS), `mlx` (iOS), `vulkan` (Android).
- **`libs`** — request extra native libraries directly: `opencv`, `phonemis`.

The three lists are merged, so you can pair a `features` set with an extra `backends` / `libs` entry. After editing the block, re-run your package manager's install to re-provision (`yarn install`).

### Feature → backend / lib mapping

These tasks are available today:

| Feature | Backends | Extra libs |
| --- | --- | --- |
| `classification` | xnnpack, coreml | opencv |
| `semanticSegmentation` | xnnpack | opencv |
| `styleTransfer` | xnnpack, coreml | opencv |
| `keypointDetection` | xnnpack, coreml, mlx | opencv |
| `tokenizer` | — | — |

The map also contains forward-looking entries (`llm`, `multimodalLLM`, `speechToText`, `objectDetection`, `ocr`, …) for tasks that are not yet exposed in the JS API; requesting one provisions the right binaries but has no hook to call yet.

### Platform notes

- **Core ML** is iOS-only. **MLX** is iOS-only and ships the **device slice only** — the iOS simulator cannot drive MLX-on-Metal, so test MLX-backed models on a physical device.
- **Vulkan** is Android-only.
- **OpenCV** is provided on iOS through the `opencv-rne` CocoaPod and on Android as static libraries; any vision feature pulls it in automatically.
- On CI, set `RNET_SKIP_DOWNLOAD=1` to skip the network download. The `rne-build-config.json` file is still written so the native build can resolve its feature flags.

For how these artifacts are produced, shipped, and stitched into a build, see [Native libraries & backend splitting](./02-native-libraries.md).

## Building from source

To build the library from source instead, clone the repository and initialize submodules:

```bash
git clone -b release/0.9 https://github.com/software-mansion/react-native-executorch.git
cd react-native-executorch

git submodule update --init --recursive packages/react-native-executorch/third-party/common

yarn
```

## Supporting new models in React Native ExecuTorch

Adding new functionality to the library follows a consistent three-step integration pipeline:

1. **Model Serialization:** Export PyTorch model for a specific task (e.g. object detection) into the `*.pte` format, which is optimized for the ExecuTorch runtime.

2. **Native Implementation:** Develop a C++ execution layer that interfaces with the ExecuTorch runtime to handle inference. This layer also manages model-dependent logic, such as data pre-processing and post-processing.

3. **TS Bindings:** Finally, implement a TypeScript API that bridges the JavaScript environment to the native C++ logic, providing a clean, typed interface for the end user.

## Good reads

If you want to dive deeper into ExecuTorch or our previous work with the framework, we highly encourage you to check out the following resources:

- [ExecuTorch docs](https://pytorch.org/executorch/stable/index.html)
- [React Native RAG](https://blog.swmansion.com/introducing-react-native-rag-fbb62efa4991)
- [Offline Text Recognition on Mobile: How We Brought EasyOCR to React Native ExecuTorch](https://blog.swmansion.com/bringing-easyocr-to-react-native-executorch-2401c09c2d0c)
