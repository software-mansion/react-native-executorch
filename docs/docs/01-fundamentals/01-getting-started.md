---
title: Getting Started
slug: /
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

ExecuTorch is a novel AI framework developed by Meta, designed to streamline deploying PyTorch models on a variety of devices, including mobile phones and microcontrollers. This framework enables exporting models into standalone binaries, allowing them to run locally without requiring API calls. ExecuTorch achieves state-of-the-art performance through optimizations and delegates such as Core ML and XNNPACK. It provides a seamless export process with robust debugging options, making it easier to resolve issues if they arise.

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

If you're using bare React Native (instead of a managed Expo project), you also need to install Expo Modules because the underlying implementation relies on expo-file-system. Since expo-file-system is an Expo package, bare React Native projects need **Expo Modules** to properly integrate and use it. The link provided (https://docs.expo.dev/bare/installing-expo-modules/) offers guidance on setting up Expo Modules in a bare React Native environment.

If you plan on using your models via require() instead of fetching them from a url, you also need to add following lines to your `metro.config.js`:

```json
// metro.config.js
...
    defaultConfig.resolver.assetExts.push('pte')
    defaultConfig.resolver.assetExts.push('bin')
...
```

This allows us to use binaries, such as exported models or tokenizers for LLMs.

:::caution
When using Expo, please note that you need to use a custom development build of your app, not the standard Expo Go app. This is because we rely on native modules, which Expo Go doesn’t support.
:::

:::info
Because we are using ExecuTorch under the hood, you won't be able to build iOS app for release with simulator selected as the target device. Make sure to test release builds on real devices.
:::

Running the app with the library:

```bash
yarn run expo:<ios | android> -d
```

## Good reads

If you want to dive deeper into ExecuTorch or our previous work with the framework, we highly encourage you to check out the following resources:

- [ExecuTorch docs](https://pytorch.org/executorch/stable/index.html)
- [Native code for iOS](https://medium.com/swmansion/bringing-native-ai-to-your-mobile-apps-with-executorch-part-i-ios-f1562a4556e8?source=user_profile_page---------0-------------250189c98ccf---------------)
- [Native code for Android](https://medium.com/swmansion/bringing-native-ai-to-your-mobile-apps-with-executorch-part-ii-android-29431b6b9f7f?source=user_profile_page---------2-------------b8e3a5cb1c63---------------)
- [Exporting to Android with XNNPACK](https://medium.com/swmansion/exporting-ai-models-on-android-with-xnnpack-and-executorch-3e70cff51c59?source=user_profile_page---------1-------------b8e3a5cb1c63---------------)
