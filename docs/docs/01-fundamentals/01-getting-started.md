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

For supported React Native and Expo versions, see the [Compatibility table](../07-other/01-compatibility.mdx).

## Installation

Installation is pretty straightforward, use your package manager of choice to install the package and some peer dependencies required to streamline model downloads. If you want to implement your custom model fetching logic, see [this document](../08-resource-fetcher/02-custom-adapter.md).

<Tabs>
  <TabItem value="npm" label="NPM">

    ```bash
    npm install react-native-executorch
    # For Expo projects
    npm install react-native-executorch-expo-resource-fetcher
    # For bare React Native projects
    npm install react-native-executorch-bare-resource-fetcher
    ```

  </TabItem>
  <TabItem value="pnpm" label="PNPM">

    ```bash
    pnpm install react-native-executorch
    # For Expo projects
    pnpm install react-native-executorch-expo-resource-fetcher
    # For bare React Native projects
    pnpm install react-native-executorch-bare-resource-fetcher
    ```

  </TabItem>
  <TabItem value="yarn" label="YARN">

    ```bash
    yarn add react-native-executorch
    # For Expo projects
    yarn add react-native-executorch-expo-resource-fetcher
    # For bare React Native projects
    yarn add react-native-executorch-bare-resource-fetcher
    ```

  </TabItem>
</Tabs>

### Configuring backends and extras

On install, `react-native-executorch` runs a `postinstall` script that downloads prebuilt native libraries from the matching GitHub Release and unpacks them under `third-party/`. By default every optional feature is included — which keeps the app binary large. You can opt out of anything you don't need by adding an `extras` array to your app's `package.json`:

```json
{
  "react-native-executorch": {
    "extras": ["xnnpack", "coreml", "vulkan", "opencv", "phonemizer"]
  }
}
```

If the `extras` key is omitted, all five features are enabled. To disable a feature, drop its name from the array.

| Extra        | iOS                                                                         | Android                                                                                       | What it enables                                               |
| ------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `opencv`     | ✅ (via the `opencv-rne` CocoaPod)                                          | ✅                                                                                            | Computer-vision models (classification, detection, OCR, etc.) |
| `phonemizer` | ✅                                                                          | ✅                                                                                            | Text-to-speech models                                         |
| `xnnpack`    | ✅ — `XnnpackBackend.xcframework` force-loaded into the app                 | always on — XNNPACK is baked into `libexecutorch.so`; the flag has no effect on Android       | XNNPACK CPU backend (required for most quantized models)      |
| `coreml`     | ✅ — `CoreMLBackend.xcframework` force-loaded into the app                  | n/a (CoreML is iOS-only)                                                                      | Core ML backend (Apple Neural Engine / GPU acceleration)      |
| `vulkan`     | n/a (Vulkan is Android-only)                                                | ✅ — separately-loaded `libvulkan_executorch_backend.so`                                      | Vulkan GPU backend                                            |

Source files and native libraries are excluded from compilation when an extra is disabled, so builds that only need LLMs can skip OpenCV and cut tens of megabytes off the final binary.

The postinstall step honors a few environment variables:

| Variable               | Purpose                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| `RNET_SKIP_DOWNLOAD=1` | Skip the download entirely (for CI with pre-cached libraries).            |
| `RNET_LIBS_CACHE_DIR`  | Custom cache directory (default: `~/.cache/react-native-executorch/<v>`). |
| `RNET_TARGET`          | Force a specific target, e.g. `android-arm64-v8a` or `ios`.               |
| `RNET_NO_X86_64=1`     | Skip the Android x86_64 tarball (handy when only building for a device).  |
| `GITHUB_TOKEN`         | Required to access draft releases while iterating on a new version.       |

After changing `extras`, re-run `yarn install` (or the equivalent) so the postinstall script regenerates `rne-build-config.json` and re-extracts the right tarballs, then rebuild the native project.

:::warning
Before using any other API, you must call `initExecutorch` with a resource fetcher adapter at the entry point of your app:

```js
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
// or BareResourceFetcher for Expo projects

initExecutorch({ resourceFetcher: ExpoResourceFetcher });
```

Calling any library API without initializing first will throw a `ResourceFetcherAdapterNotInitialized` error.
:::

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
yarn <ios | android> -d
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
