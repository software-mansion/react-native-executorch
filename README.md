# React Native ExecuTorch

![Software Mansion banner](https://github.com/user-attachments/assets/fa2c4735-e75c-4cc1-970d-88905d95e3a4)

**React Native ExecuTorch** is a declarative way to run AI models in React Native on device, powered by **ExecuTorch** 🚀.

**ExecuTorch** is a novel framework created by Meta that enables running AI models on devices such as mobile phones or microcontrollers. React Native ExecuTorch bridges the gap between React Native and native platform capabilities, allowing developers to run AI models locally on mobile devices with state-of-the-art performance, without requiring deep knowledge of native code or machine learning internals.

## Readymade models 🤖

To run any AI model in ExecuTorch, you need to export it to a `.pte` format. If you're interested in experimenting with your own models, we highly encourage you to check out the [Python API](https://pypi.org/project/executorch/). If you prefer focusing on developing your React Native app, we will cover several common use cases. For more details, please refer to the documentation.

## Documentation 📚

Take a look at how our library can help build you your React Native AI features in our docs:  
https://docs.swmansion.com/react-native-executorch

## Minimal supported versions
The minimal supported version is 17.0 for iOS and Android 13.

## Examples 📲

We currently host two example apps demonstrating use cases of our library:
- examples/computer-vision - computer vision related tasks
- examples/llama - chat applications showcasing use of LLMs

If you would like to run it, navigate to it's project directory, for example `examples/llama` from the repository root and install dependencies with:

```bash
yarn
```

then run:

```bash
cd ios
pod install
cd ..
```

And finally, if you want to run on Android:

```bash
yarn expo run:android
```

or iOS:

```bash
yarn expo run:ios
```

### Warning
Running LLMs requires a significant amount of RAM. If you are encountering unexpected app crashes, try to increase the amount of RAM allocated to the emulator.


## License  

This library is licensed under [The MIT License](./LICENSE).

## What's next?

To learn about our upcoming plans and developments, please visit our [discussion page](https://github.com/software-mansion/react-native-executorch/discussions/2).

## React Native ExecuTorch is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
