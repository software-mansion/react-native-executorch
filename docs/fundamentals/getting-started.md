# Getting Started

## What is ExecuTorch?[​](#what-is-executorch "Direct link to What is ExecuTorch?")

[ExecuTorch](https://executorch.ai) is a novel AI framework developed by Meta, designed to streamline deploying PyTorch models on a variety of devices, including mobile phones and microcontrollers. This framework enables exporting models into standalone binaries, allowing them to run locally without requiring API calls. ExecuTorch achieves state-of-the-art performance through optimizations and delegates such as Core ML and XNNPACK. It provides a seamless export process with robust debugging options, making it easier to resolve issues if they arise.

## React Native ExecuTorch[​](#react-native-executorch "Direct link to React Native ExecuTorch")

React Native ExecuTorch is our way of bringing ExecuTorch into the React Native world. Our API is built to be simple, declarative, and efficient. Plus, we’ll provide a set of pre-exported models for common use cases, so you won’t have to worry about handling exports yourself. With just a few lines of JavaScript, you’ll be able to run AI models (even LLMs 👀) right on your device—keeping user data private and saving on cloud costs.

## Compatibility[​](#compatibility "Direct link to Compatibility")

React Native Executorch supports only the [New React Native architecture](https://reactnative.dev/architecture/landing-page).

If your app still runs on the old architecture, please consider upgrading to the New Architecture.

For supported React Native and Expo versions, see the [Compatibility table](https://docs.swmansion.com/react-native-executorch/docs/other/compatibility.md).

## Installation[​](#installation "Direct link to Installation")

Installation is pretty straightforward, use your package manager of choice to install the package and some peer dependencies required to streamline model downloads. If you want to implement your custom model fetching logic, see [this document](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/custom-adapter.md).

* NPM
* PNPM
* YARN

```text
npm install react-native-executorch
# For Expo projects
npm install react-native-executorch-expo-resource-fetcher
# For bare React Native projects
npm install react-native-executorch-bare-resource-fetcher

```

```text
pnpm install react-native-executorch
# For Expo projects
pnpm install react-native-executorch-expo-resource-fetcher
# For bare React Native projects
pnpm install react-native-executorch-bare-resource-fetcher


```

```text
yarn add react-native-executorch
# For Expo projects
yarn install react-native-executorch-expo-resource-fetcher
# For bare React Native projects
yarn install react-native-executorch-bare-resource-fetcher

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Before using any other API, you must call `initExecutorch` with a resource fetcher adapter at the entry point of your app:

```js
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
// or BareResourceFetcher for Expo projects

initExecutorch({ resourceFetcher: ExpoResourceFetcher });

```

Calling any library API without initializing first will throw a `ResourceFetcherAdapterNotInitialized` error.

Our library offers support for both bare React Native and Expo projects. Please follow the instructions from [Loading models section](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) to make sure you setup your project correctly. We encourage you to use Expo project if possible. If you are planning to migrate from bare React Native to Expo project, the link (<https://docs.expo.dev/bare/installing-expo-modules/>) offers a guidance on setting up Expo Modules in a bare React Native environment.

If you plan on using your models via require() instead of fetching them from a url, you also need to add following lines to your `metro.config.js`:

```json
// metro.config.js
...
    defaultConfig.resolver.assetExts.push('pte')
    defaultConfig.resolver.assetExts.push('bin')
...

```

This allows us to use binaries, such as exported models or tokenizers for LLMs.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

When using Expo, please note that you need to use a custom development build of your app, not the standard Expo Go app. This is because we rely on native modules, which Expo Go doesn’t support.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Because we are using ExecuTorch under the hood, you won't be able to build iOS app for release with simulator selected as the target device. Make sure to test release builds on real devices.

Running the app with the library:

```bash
yarn <ios | android> -d

```

## Supporting new models in React Native ExecuTorch[​](#supporting-new-models-in-react-native-executorch "Direct link to Supporting new models in React Native ExecuTorch")

Adding new functionality to the library follows a consistent three-step integration pipeline:

1. **Model Serialization:** We export PyTorch models for specific tasks (e.g., object detection) into the \*.pte format, which is optimized for the ExecuTorch runtime.

2. **Native Implementation:** We develop a C++ execution layer that interfaces with the ExecuTorch runtime to handle inference. This layer also manages model-dependent logic, such as data pre-processing and post-processing.

3. **TS Bindings:** Finally, we implement a TypeScript API that bridges the JavaScript environment to the native C++ logic, providing a clean, typed interface for the end user."

## Good reads[​](#good-reads "Direct link to Good reads")

If you want to dive deeper into ExecuTorch or our previous work with the framework, we highly encourage you to check out the following resources:

* [ExecuTorch docs](https://pytorch.org/executorch/stable/index.html)
* [React Native RAG](https://blog.swmansion.com/introducing-react-native-rag-fbb62efa4991)
* [Offline Text Recognition on Mobile: How We Brought EasyOCR to React Native ExecuTorch](https://blog.swmansion.com/bringing-easyocr-to-react-native-executorch-2401c09c2d0c)
